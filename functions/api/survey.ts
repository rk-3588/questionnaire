import {
  currentRecord,
  normalizeSubmission,
  parseCurrentInput,
  publicSubmission,
  validLegacyAnswers,
  type Submission,
} from "../../src/questionnaire.ts";

type Env = { SURVEY_DB?: D1Database };
const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
const idFor = (value: unknown) =>
  typeof value === "string" && /^Q-[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(value)
    ? value
    : `Q-${crypto.randomUUID()}`;

async function list(db: D1Database): Promise<Submission[]> {
  const [oldRows, newRows] = await Promise.all([
    db
      .prepare(
        "SELECT id, created_at AS createdAt, answers_json AS answers, label, message, gender FROM survey_submissions ORDER BY created_at DESC LIMIT 500",
      )
      .all<{
        id: string;
        createdAt: string;
        answers: string;
        label: string;
        message?: string;
        gender?: string;
      }>(),
    db
      .prepare(
        "SELECT payload_json FROM survey_submissions_v2 WHERE published = 1 ORDER BY created_at DESC LIMIT 500",
      )
      .all<{ payload_json: string }>(),
  ]);
  const records: Submission[] = [];
  for (const row of oldRows.results) {
    try {
      const record = normalizeSubmission({
        ...row,
        answers: JSON.parse(row.answers),
      });
      if (record) records.push(record);
    } catch {
      /* Retain malformed legacy rows in the database. */
    }
  }
  for (const row of newRows.results) {
    try {
      const record = normalizeSubmission(JSON.parse(row.payload_json));
      const published = record && publicSubmission(record);
      if (published) records.push(published);
    } catch {
      /* Never delete rows while projecting the public index. */
    }
  }
  return records
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 500);
}
export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, { status: 204, headers });
export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!context.env.SURVEY_DB) return json({ error: "survey_unavailable" }, 503);
  try {
    return json(await list(context.env.SURVEY_DB));
  } catch (error) {
    console.error("Survey GET failed", error);
    return json({ error: "survey_unavailable" }, 503);
  }
};
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.SURVEY_DB;
  if (!db) return json({ error: "survey_unavailable" }, 503);
  let body: unknown;
  try {
    const text = await context.request.text();
    if (new TextEncoder().encode(text).length > 65536)
      return json({ error: "request_too_large" }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return json({ error: "invalid_submission" }, 400);
  const input = body as Record<string, unknown>;
  try {
    if (input.schemaVersion === 2) {
      const parsed = parseCurrentInput(input);
      if (!parsed.input)
        return json({ error: "invalid_responses", fields: parsed.errors }, 400);
      const id = idFor(input.id);
      const previous = await db
        .prepare("SELECT payload_json FROM survey_submissions_v2 WHERE id = ?")
        .bind(id)
        .first<{ payload_json: string }>();
      if (previous) {
        const normalized = normalizeSubmission(
          JSON.parse(previous.payload_json),
        );
        const requested = currentRecord(
          parsed.input,
          id,
          normalized?.createdAt ?? "",
        );
        return JSON.stringify(normalized) === JSON.stringify(requested)
          ? json(requested, 200)
          : json({ error: "submission_id_conflict" }, 409);
      }
      const record = currentRecord(parsed.input, id, new Date().toISOString());
      await db
        .prepare(
          "INSERT INTO survey_submissions_v2 (id, created_at, payload_json, published) VALUES (?, ?, ?, ?)",
        )
        .bind(
          id,
          record.createdAt,
          JSON.stringify(record),
          Number(record.publication.profile),
        )
        .run();
      return json(record, 201);
    }
    if (
      (input.schemaVersion !== undefined && input.schemaVersion !== 1) ||
      !validLegacyAnswers(input.answers)
    )
      return json({ error: "invalid_answers" }, 400);
    const record = normalizeSubmission({
      ...input,
      id: `Q-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      label:
        typeof input.label === "string" && input.label.trim()
          ? input.label.trim().slice(0, 24)
          : "匿名访客",
      message:
        typeof input.message === "string"
          ? input.message.trim().slice(0, 120)
          : "",
    })!;
    if (record.schemaVersion !== 1)
      return json({ error: "invalid_answers" }, 400);
    await db
      .prepare(
        "INSERT INTO survey_submissions (id, created_at, answers_json, label, message, gender) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(
        record.id,
        record.createdAt,
        JSON.stringify(record.answers),
        record.label,
        record.message,
        record.gender,
      )
      .run();
    return json(record, 201);
  } catch (error) {
    console.error("Survey POST failed", error);
    return json({ error: "survey_unavailable" }, 503);
  }
};
