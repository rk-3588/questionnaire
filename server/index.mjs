import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(process.env.SURVEY_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), ".."));
const dist = resolve(root, "dist");
const dataFile = resolve(process.env.SURVEY_DATA_DIR || join(root, "data"), "submissions.json");
const port = Number(process.env.PORT || 3100);
const allowedTypes = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".glb": "model/gltf-binary", ".ogg": "audio/ogg" };
const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" };
const defaultMessage = "愿你在选择中保持诚实，也保留温柔。";

const validAnswers = value => Array.isArray(value) && value.length === 20 && value.every(item => Number.isInteger(item) && item >= 1 && item <= 5);
const normalizeGender = value => value === "♂" || value === "♀" ? value : "不愿透露";
async function readSubmissions() { try { return JSON.parse(await readFile(dataFile, "utf8")); } catch { return []; } }
async function writeSubmissions(items) { await mkdir(dirname(dataFile), { recursive: true }); const temp = `${dataFile}.tmp`; await writeFile(temp, JSON.stringify(items, null, 2)); await writeFile(dataFile, await readFile(temp)); }
const send = (res, status, body) => { res.writeHead(status, headers); res.end(JSON.stringify(body)); };
async function body(req) { let text = ""; for await (const chunk of req) text += chunk; return JSON.parse(text || "{}"); }
async function api(req, res) {
  if (req.method === "OPTIONS") { res.writeHead(204, { ...headers, "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }); return res.end(); }
  if (req.method === "GET") return send(res, 200, (await readSubmissions()).filter(item => validAnswers(item.answers)).map(item => ({ ...item, message: typeof item.message === "string" && item.message.trim() ? item.message : defaultMessage, gender: normalizeGender(item.gender) })));
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  let input; try { input = await body(req); } catch { return send(res, 400, { error: "invalid_json" }); }
  if (!validAnswers(input.answers)) return send(res, 400, { error: "invalid_answers" });
  const items = await readSubmissions();
  const record = { id: `Q-${Math.floor(100 + Math.random() * 900)}`, createdAt: new Date().toISOString(), answers: input.answers, label: typeof input.label === "string" && input.label.trim() ? input.label.trim().slice(0, 24) : `访客·${Math.floor(1000 + Math.random() * 9000)}`, message: typeof input.message === "string" && input.message.trim() ? input.message.trim().slice(0, 120) : defaultMessage, gender: normalizeGender(input.gender) };
  items.unshift(record); await writeSubmissions(items.slice(0, 500)); return send(res, 201, record);
}
async function staticFile(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const relative = normalize(requestPath === "/" ? "/index.html" : requestPath).replace(/^[/\\]+/, "");
  const file = resolve(dist, relative);
  if (!file.startsWith(dist) || !existsSync(file)) return send(res, 404, { error: "not_found" });
  try { const data = await readFile(file); res.writeHead(200, { "Content-Type": allowedTypes[extname(file).toLowerCase()] || "application/octet-stream" }); res.end(data); } catch { send(res, 404, { error: "not_found" }); }
}
createServer((req, res) => req.url?.startsWith("/api/survey") ? void api(req, res) : void staticFile(req, res)).listen(port, "0.0.0.0", () => console.log(`Rhine survey server listening on :${port}`));
