import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  currentRecord,
  normalizeSubmission,
  parseCurrentInput,
  publicSubmission,
  validLegacyAnswers,
} from "../src/questionnaire.ts";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};
const send = (res, status, value) => {
  res.writeHead(status, headers);
  res.end(JSON.stringify(value));
};
const requestId = (value) =>
  typeof value === "string" && /^Q-[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(value)
    ? value
    : undefined;

export function createSurveyServer(options = {}) {
  const root = resolve(
    options.root ||
      process.env.SURVEY_ROOT ||
      resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  );
  const dist = resolve(root, "dist");
  const dataFile = resolve(
    options.dataFile ||
      resolve(
        process.env.SURVEY_DATA_DIR || resolve(root, "data"),
        "submissions.json",
      ),
  );
  let writes = Promise.resolve();
  async function readSubmissions() {
    try {
      const rows = JSON.parse(await readFile(dataFile, "utf8"));
      if (!Array.isArray(rows)) throw Error("invalid_data_file");
      return rows;
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }
  async function store(record) {
    // Serialize read/modify/write, then atomically replace the file. Keep all
    // historical rows on disk; the public 500-row limit is only a read limit.
    const operation = writes.then(async () => {
      const rows = await readSubmissions();
      const previous = rows.find((row) => row?.id === record.id);
      if (previous) {
        const normalized = normalizeSubmission(previous);
        if (
          JSON.stringify(normalized) !==
          JSON.stringify({ ...record, createdAt: normalized?.createdAt })
        )
          throw Object.assign(Error("submission_id_conflict"), { status: 409 });
        return normalized;
      }
      await mkdir(dirname(dataFile), { recursive: true });
      await writeFile(
        `${dataFile}.tmp`,
        JSON.stringify([record, ...rows], null, 2),
      );
      await rename(`${dataFile}.tmp`, dataFile);
      return record;
    });
    writes = operation.catch(() => {});
    return operation;
  }
  async function api(req, res) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, headers);
      res.end();
      return;
    }
    if (req.method === "GET") {
      const rows = await readSubmissions();
      const records = rows.flatMap((row) => {
        const record = normalizeSubmission(row);
        const visible = record && publicSubmission(record);
        return visible ? [visible] : [];
      });
      send(
        res,
        200,
        records
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
          .slice(0, 500),
      );
      return;
    }
    if (req.method !== "POST") {
      send(res, 405, { error: "method_not_allowed" });
      return;
    }
    let input;
    try {
      let bytes = 0;
      const chunks = [];
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 65536) {
          send(res, 413, { error: "request_too_large" });
          return;
        }
        chunks.push(chunk);
      }
      input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      send(res, 400, { error: "invalid_json" });
      return;
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      send(res, 400, { error: "invalid_submission" });
      return;
    }
    let record;
    if (input.schemaVersion === 2) {
      const parsed = parseCurrentInput(input);
      if (!parsed.input) {
        send(res, 400, { error: "invalid_responses", fields: parsed.errors });
        return;
      }
      record = currentRecord(
        parsed.input,
        requestId(input.id) || `Q-${randomUUID()}`,
        new Date().toISOString(),
      );
    } else {
      if (
        (input.schemaVersion !== undefined && input.schemaVersion !== 1) ||
        !validLegacyAnswers(input.answers)
      ) {
        send(res, 400, { error: "invalid_answers" });
        return;
      }
      record = normalizeSubmission({
        ...input,
        id: `Q-${randomUUID()}`,
        createdAt: new Date().toISOString(),
        label:
          typeof input.label === "string" && input.label.trim()
            ? input.label.trim().slice(0, 24)
            : "匿名访客",
        message:
          typeof input.message === "string"
            ? input.message.trim().slice(0, 120)
            : "",
      });
    }
    send(res, 201, await store(record));
  }
  async function staticFile(req, res) {
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
    } catch {
      send(res, 400, { error: "invalid_path" });
      return;
    }
    const file = resolve(
      dist,
      pathname === "/" ? "index.html" : pathname.replace(/^[/\\]+/, ""),
    );
    if (!file.startsWith(dist + sep)) {
      send(res, 404, { error: "not_found" });
      return;
    }
    try {
      const bytes = await readFile(file);
      const noCache =
        [".html", ".js", ".json"].includes(extname(file)) &&
        !file.includes(`${sep}assets${sep}`);
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        ...(noCache
          ? { "Cache-Control": "no-cache, no-store, must-revalidate" }
          : {}),
      });
      res.end(bytes);
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "EISDIR")
        send(res, 404, { error: "not_found" });
      else throw error;
    }
  }
  return createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    void (
      pathname === "/api/survey" ? api(req, res) : staticFile(req, res)
    ).catch((error) => {
      console.error("Survey request failed:", error.message);
      if (!res.headersSent)
        send(res, error.status || 503, {
          error:
            error.status === 409
              ? "submission_id_conflict"
              : "survey_unavailable",
        });
      else res.end();
    });
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 3100);
  createSurveyServer().listen(port, "0.0.0.0", () =>
    console.log(`Questionnaire service listening on :${port}`),
  );
}
