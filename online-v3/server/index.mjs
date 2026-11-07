import { createServer } from "node:http";
import {
  randomBytes,
  randomUUID,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import { readFile, writeFile, rename, mkdir, realpath } from "node:fs/promises";
import { resolve, dirname, extname, sep, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isIP } from "node:net";
import {
  validateSubmission,
  QUESTIONS,
  resolveQuestion,
  SURVEY_VERSION,
} from "../public/survey-core.mjs";
import { readAuth, createAuth, verifyPassword } from "./auth.mjs";
import {
  parseFilters,
  filterRecords,
  buildSummary,
  buildComparison,
} from "./statistics.mjs";

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COOKIE = "xindong_admin";
const TTL = 8 * 60 * 60 * 1000;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const stable = (value) =>
  value && typeof value === "object"
    ? Array.isArray(value)
      ? value.map(stable)
      : Object.fromEntries(
          Object.keys(value)
            .sort()
            .filter((k) => value[k] !== undefined)
            .map((k) => [k, stable(value[k])]),
        )
    : value;
const canonical = (value) => JSON.stringify(stable(value));
const localIP = (address) =>
  ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address);
const localHost = (hostname) =>
  ["127.0.0.1", "localhost", "[::1]", "::1"].includes(hostname);
const safeEqual = (a, b) =>
  typeof a === "string" &&
  typeof b === "string" &&
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
};

// Only an explicitly trusted local reverse proxy may supply the rate-limit key.
// This address is held in memory only; it is never written into answer records.
export function clientAddress(req, trustProxy = false) {
  const remote = req.socket.remoteAddress || "unknown";
  const supplied = req.headers["x-real-ip"];
  if (
    trustProxy &&
    localIP(remote) &&
    typeof supplied === "string" &&
    isIP(supplied)
  )
    return supplied;
  return remote;
}

export function csvCell(value) {
  let text = String(value ?? "");
  if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))
    text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

export function createSurveyServer(options = {}) {
  const root = resolve(options.root || APP_ROOT);
  const mode = options.mode || "public";
  if (!["public", "admin"].includes(mode)) throw Error("Unknown server mode");
  const publicDir = resolve(root, mode === "admin" ? "admin" : "public");
  const dataDir = resolve(
    options.dataDir || process.env.SURVEY_DATA_DIR || resolve(root, "data"),
  );
  const dataFile = join(dataDir, "submissions-v3.json");
  const host = options.host || process.env.HOST || "127.0.0.1";
  const publicOrigin =
    options.publicOrigin ??
    (mode === "admin"
      ? process.env.SURVEY_ADMIN_ORIGIN
      : process.env.SURVEY_PUBLIC_ORIGIN) ??
    "";
  const trustProxy =
    (options.trustProxy ?? process.env.SURVEY_TRUST_PROXY) === "loopback";
  if (publicOrigin && new URL(publicOrigin).origin !== publicOrigin)
    throw Error(
      "SURVEY_PUBLIC_ORIGIN must be an origin without a path or trailing slash",
    );
  const production =
    options.production ?? process.env.NODE_ENV === "production";
  const secureCookie =
    options.secureCookie ??
    (process.env.SURVEY_SECURE_COOKIE === "true" ||
      production ||
      publicOrigin.startsWith("https://"));
  const allowSetup =
    (options.allowSetup ?? true) &&
    localHost(host) &&
    !production &&
    !publicOrigin;
  const sessions = new Map();
  const loginLimits = new Map();
  const submissionLimits = new Map();
  let writes = Promise.resolve();

  const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
  const apiCacheHeaders = {
    "X-Accel-Expires": "0",
    "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Cookie, Origin",
  };
  function send(res, status, value, extra = {}) {
    res.writeHead(status, {
      ...securityHeaders,
      ...apiCacheHeaders,
      "Content-Type": "application/json; charset=utf-8",
      ...extra,
    });
    res.end(JSON.stringify(value));
  }
  function requestOrigin(req) {
    try {
      const url = new URL(`http://${req.headers.host}`);
      if (publicOrigin)
        return url.host === new URL(publicOrigin).host ? publicOrigin : null;
      return localHost(url.hostname) ? url.origin : null;
    } catch {
      return null;
    }
  }
  function sameOrigin(req) {
    const expected = requestOrigin(req);
    return (
      !!expected &&
      req.headers.origin === expected &&
      !["cross-site", "same-site"].includes(req.headers["sec-fetch-site"])
    );
  }
  function canSetup(req) {
    if (!allowSetup || !localIP(req.socket.remoteAddress)) return false;
    try {
      return localHost(new URL(`http://${req.headers.host}`).hostname);
    } catch {
      return false;
    }
  }
  function limit(map, key, max, windowMs) {
    const now = Date.now();
    for (const [k, v] of map) if (v.until < now) map.delete(k);
    if (map.size > 2048) map.delete(map.keys().next().value);
    const value = map.get(key) || { count: 0, until: now + windowMs };
    value.count++;
    map.set(key, value);
    return value.count > max;
  }
  function getSession(req) {
    const raw = (req.headers.cookie || "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(COOKIE + "="))
      ?.slice(COOKIE.length + 1);
    if (!raw || !/^[A-Za-z0-9_-]{43}$/.test(raw)) return null;
    const key = hash(raw),
      session = sessions.get(key);
    if (!session || session.expires < Date.now()) {
      sessions.delete(key);
      return null;
    }
    return { ...session, key };
  }
  function cookie(token, maxAge = TTL / 1000) {
    return `${COOKIE}=${token}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secureCookie ? "; Secure" : ""}`;
  }
  function newSession() {
    for (const [k, v] of sessions)
      if (v.expires < Date.now()) sessions.delete(k);
    if (sessions.size >= 20) sessions.delete(sessions.keys().next().value);
    const token = randomBytes(32).toString("base64url"),
      csrfToken = randomBytes(32).toString("hex");
    sessions.set(hash(token), { csrfToken, expires: Date.now() + TTL });
    return { token, csrfToken };
  }
  async function body(req) {
    if (!/^application\/json(?:;|$)/i.test(req.headers["content-type"] || ""))
      throw Object.assign(Error("json_required"), { status: 415 });
    let bytes = 0;
    const chunks = [];
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 65536)
        throw Object.assign(Error("request_too_large"), { status: 413 });
      chunks.push(chunk);
    }
    try {
      const result = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!result || typeof result !== "object" || Array.isArray(result))
        throw Error();
      return result;
    } catch {
      throw Object.assign(Error("invalid_json"), { status: 400 });
    }
  }
  async function records() {
    try {
      const values = JSON.parse(await readFile(dataFile, "utf8"));
      if (!Array.isArray(values)) throw Error("invalid_data_file");
      return values;
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }
  async function store(data) {
    const operation = writes.then(async () => {
      const rows = await records(),
        payloadHash = hash(canonical(data));
      const existing = rows.find((r) => r.submissionId === data.submissionId);
      if (existing) {
        if (existing.payloadHash !== payloadHash)
          throw Object.assign(Error("submission_conflict"), { status: 409 });
        return { receipt: existing.receipt, duplicate: true };
      }
      const record = {
        ...data,
        receipt: "S-" + randomUUID(),
        createdAt: new Date().toISOString(),
        payloadHash,
      };
      await mkdir(dataDir, { recursive: true, mode: 0o700 });
      const temp = join(dataDir, `.submissions-${randomUUID()}.tmp`);
      await writeFile(temp, JSON.stringify([...rows, record]), { mode: 0o600 });
      await rename(temp, dataFile);
      return { receipt: record.receipt, duplicate: false };
    });
    writes = operation.catch(() => {});
    return operation;
  }
  const adminRecord = (r) => {
    const { payloadHash, ...safe } = r;
    return safe;
  };
  function answerLabel(record, response) {
    const q = resolveQuestion(
      response.id,
      record.answers,
      record.neutralQuestions,
    );
    if (response.text) return response.text;
    return (response.values || [])
      .map((v) => q.options?.find((o) => o.value === v)?.label || v)
      .join("；");
  }
  async function api(req, res, url) {
    const path = url.pathname;
    if (mode === "public" && path.startsWith("/api/admin"))
      return send(res, 404, { error: "not_found" });
    if (
      mode === "admin" &&
      !path.startsWith("/api/admin/") &&
      path !== "/api/health"
    )
      return send(res, 404, { error: "not_found" });
    if (!requestOrigin(req)) return send(res, 403, { error: "invalid_host" });
    if (req.headers["sec-fetch-site"] === "cross-site")
      return send(res, 403, { error: "same_origin_required" });
    if (
      ["POST", "PUT", "DELETE", "PATCH"].includes(req.method) &&
      !sameOrigin(req)
    )
      return send(res, 403, { error: "same_origin_required" });
    if (path === "/api/health" && req.method === "GET")
      return send(res, 200, { ok: true, version: SURVEY_VERSION });
    if (path === "/api/submissions" && req.method === "POST") {
      if (
        limit(
          submissionLimits,
          clientAddress(req, trustProxy),
          60,
          10 * 60 * 1000,
        )
      )
        return send(res, 429, { error: "too_many_requests" });
      const input = await body(req),
        result = validateSubmission(input);
      if (!result.ok)
        return send(res, 400, {
          error: "invalid_submission",
          fields: result.errors,
        });
      const saved = await store(result.data);
      return send(res, saved.duplicate ? 200 : 201, saved);
    }
    if (path === "/api/submissions")
      return send(res, 405, { error: "method_not_allowed" });
    if (path === "/api/admin/session" && req.method === "GET") {
      const session = getSession(req);
      if (session)
        return send(res, 200, {
          authenticated: true,
          csrfToken: session.csrfToken,
        });
      const configured = !!(await readAuth(dataDir));
      return send(res, 200, {
        authenticated: false,
        setupRequired: !configured,
        setupAllowed: !configured && canSetup(req),
      });
    }
    if (path === "/api/admin/setup" && req.method === "POST") {
      if (!canSetup(req)) return send(res, 403, { error: "setup_local_only" });
      if (
        limit(
          loginLimits,
          "setup:" + req.socket.remoteAddress,
          5,
          15 * 60 * 1000,
        )
      )
        return send(res, 429, { error: "too_many_attempts" });
      const input = await body(req);
      if (Object.keys(input).some((k) => !["password"].includes(k)))
        return send(res, 400, { error: "invalid_input" });
      await createAuth(dataDir, input.password);
      return send(res, 201, { ok: true });
    }
    if (path === "/api/admin/login" && req.method === "POST") {
      if (
        limit(
          loginLimits,
          "login:" + clientAddress(req, trustProxy),
          10,
          15 * 60 * 1000,
        )
      )
        return send(res, 429, { error: "too_many_attempts" });
      const input = await body(req),
        auth = await readAuth(dataDir);
      if (!auth) return send(res, 503, { error: "admin_not_configured" });
      if (!(await verifyPassword(input.password, auth)))
        return send(res, 401, { error: "invalid_credentials" });
      const session = newSession();
      return send(
        res,
        200,
        { authenticated: true, csrfToken: session.csrfToken },
        { "Set-Cookie": cookie(session.token) },
      );
    }
    if (!path.startsWith("/api/admin/"))
      return send(res, 404, { error: "not_found" });
    const session = getSession(req);
    if (!session) return send(res, 401, { error: "authentication_required" });
    if (
      req.method !== "GET" &&
      !safeEqual(req.headers["x-csrf-token"], session.csrfToken)
    )
      return send(res, 403, { error: "csrf_required" });
    if (path === "/api/admin/logout" && req.method === "POST") {
      sessions.delete(session.key);
      return send(res, 200, { ok: true }, { "Set-Cookie": cookie("", 0) });
    }
    if (req.method !== "GET")
      return send(res, 405, { error: "method_not_allowed" });
    const selection = parseFilters(url),
      selected = filterRecords(await records(), selection);
    if (path === "/api/admin/summary")
      return send(res, 200, buildSummary(selected, selection));
    if (path === "/api/admin/comparison")
      return send(
        res,
        200,
        buildComparison(
          selected,
          url.searchParams.get("question") || "U01",
          url.searchParams.get("group") || "study",
        ),
      );
    if (path === "/api/admin/responses") {
      const page = Number(url.searchParams.get("page") || 1),
        limitValue = Number(url.searchParams.get("limit") || 25);
      if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(limitValue) ||
        limitValue < 1 ||
        limitValue > 100
      )
        return send(res, 400, { error: "invalid_pagination" });
      const ordered = [...selected].reverse(),
        total = ordered.length;
      const items = ordered
        .slice((page - 1) * limitValue, page * limitValue)
        .map((r) => ({
          receipt: r.receipt,
          createdAt: r.createdAt,
          route: r.route,
          eligibility: r.eligibility,
          durationSeconds: r.durationSeconds,
          answered: r.responses.filter((x) => x.status === "answered").length,
          declined: r.responses.filter((x) => x.status === "declined").length,
        }));
      return send(res, 200, {
        page,
        limit: limitValue,
        total,
        pages: Math.max(1, Math.ceil(total / limitValue)),
        items,
      });
    }
    if (path.startsWith("/api/admin/responses/")) {
      const receipt = path.slice("/api/admin/responses/".length),
        record = selected.find((r) => r.receipt === receipt);
      if (!record) return send(res, 404, { error: "not_found" });
      return send(res, 200, {
        ...adminRecord(record),
        responses: record.responses.map((r) => ({
          ...r,
          label: answerLabel(record, r),
        })),
      });
    }
    if (path === "/api/admin/export") {
      const format = url.searchParams.get("format") || "csv";
      if (!["csv", "json"].includes(format))
        return send(res, 400, { error: "invalid_format" });
      const date = new Date().toISOString().slice(0, 10);
      if (format === "json") {
        res.writeHead(200, {
          ...securityHeaders,
          ...apiCacheHeaders,
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="xindong-v3-${date}.json"`,
        });
        return res.end(
          JSON.stringify(
            {
              surveyVersion: SURVEY_VERSION,
              exportedAt: new Date().toISOString(),
              records: selected.map(adminRecord),
            },
            null,
            2,
          ),
        );
      }
      const ids = Object.keys(QUESTIONS),
        head = [
          "receipt",
          "createdAt",
          "route",
          "eligibility",
          "durationSeconds",
          ...ids.flatMap((id) => [
            id + "_status",
            id + "_variant",
            id + "_answer",
          ]),
        ];
      const lines = [head.map(csvCell).join(",")];
      for (const row of selected)
        lines.push(
          [
            row.receipt,
            row.createdAt,
            row.route,
            row.eligibility,
            row.durationSeconds ?? "",
            ...ids.flatMap((id) => {
              const r = row.responses.find((v) => v.id === id);
              return r
                ? [r.status, r.variant, answerLabel(row, r)]
                : ["unanswered", "", ""];
            }),
          ]
            .map(csvCell)
            .join(","),
        );
      res.writeHead(200, {
        ...securityHeaders,
        ...apiCacheHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="xindong-v3-${date}.csv"`,
      });
      return res.end("\uFEFF" + lines.join("\r\n"));
    }
    return send(res, 404, { error: "not_found" });
  }
  async function staticFile(req, res, url) {
    if (req.method !== "GET" && req.method !== "HEAD")
      return send(res, 405, { error: "method_not_allowed" });
    if (!requestOrigin(req)) return send(res, 403, { error: "invalid_host" });
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return send(res, 400, { error: "invalid_path" });
    }
    if (
      pathname.includes("\\") ||
      pathname.includes("\0") ||
      pathname.split("/").some((s) => s.startsWith("."))
    )
      return send(res, 404, { error: "not_found" });
    if (mode === "public" && /^\/admin(?:[./-]|$)/.test(pathname))
      return send(res, 404, { error: "not_found" });
    const mapped =
      pathname === "/"
        ? "index.html"
        : ["/admin", "/admin/"].includes(pathname)
          ? "admin.html"
          : pathname.replace(/^\/+/, "");
    const target = resolve(publicDir, mapped);
    if (!target.startsWith(publicDir + sep))
      return send(res, 404, { error: "not_found" });
    try {
      const actual = await realpath(target),
        publicActual = await realpath(publicDir);
      if (!actual.startsWith(publicActual + sep))
        return send(res, 404, { error: "not_found" });
      const bytes = await readFile(actual);
      res.writeHead(200, {
        ...securityHeaders,
        "Content-Type": types[extname(actual)] || "application/octet-stream",
        "Cache-Control": [".html", ".js", ".mjs", ".json"].includes(
          extname(actual),
        )
          ? "no-cache"
          : "public, max-age=3600",
      });
      res.end(req.method === "HEAD" ? undefined : bytes);
    } catch (error) {
      if (["ENOENT", "EISDIR", "ENOTDIR"].includes(error.code))
        return send(res, 404, { error: "not_found" });
      throw error;
    }
  }
  return createServer((req, res) => {
    let url;
    try {
      url = new URL(req.url, "http://localhost");
    } catch {
      return send(res, 400, { error: "invalid_url" });
    }
    Promise.resolve(
      url.pathname.startsWith("/api/")
        ? api(req, res, url)
        : staticFile(req, res, url),
    ).catch((error) => {
      if (!res.headersSent)
        send(res, error.status || 503, {
          error: error.status ? error.message : "service_unavailable",
        });
      else res.end();
    });
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const host = process.env.HOST || "127.0.0.1",
    port = Number(process.env.PORT || 8765);
  if (!localHost(host) && !process.env.SURVEY_PUBLIC_ORIGIN)
    throw Error("非本机绑定必须配置 SURVEY_PUBLIC_ORIGIN。");
  createSurveyServer({ host }).listen(port, host, () =>
    console.log(
      `Survey ready: http://${host}:${port}/ ; administrator runs separately with npm run start:admin`,
    ),
  );
}
