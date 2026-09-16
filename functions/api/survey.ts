type Env = { SURVEY_DB?: D1Database };
type Gender = "♂" | "♀" | "不愿透露";
type Submission = { id: string; createdAt: string; answers: number[]; label: string; message: string; gender: Gender };

const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const validAnswers = (value: unknown): value is number[] => Array.isArray(value) && value.length === 20 && value.every(item => Number.isInteger(item) && item >= 1 && item <= 5);
const normalizeGender = (value: unknown): Gender => value === "♂" || value === "♀" ? value : "不愿透露";

async function list(db: D1Database): Promise<Submission[]> {
  const result = await db.prepare("SELECT id, created_at AS createdAt, answers_json AS answers, label, message, gender FROM survey_submissions ORDER BY created_at DESC LIMIT 500").all<{ id: string; createdAt: string; answers: string; label: string; message: string; gender?: string }>();
  return result.results.flatMap(row => {
    try {
      const answers = JSON.parse(row.answers) as unknown;
      return validAnswers(answers) ? [{ id: row.id, createdAt: row.createdAt, answers, label: row.label, message: row.message, gender: normalizeGender(row.gender) }] : [];
    } catch { return []; }
  });
}

export const onRequestGet: PagesFunction<Env> = async context => {
  if (!context.env.SURVEY_DB) return json({ error: "survey_unavailable" }, 503);
  try { return json(await list(context.env.SURVEY_DB)); }
  catch (error) { console.error("survey GET failed", error); return json({ error: "survey_unavailable" }, 503); }
};

export const onRequestPost: PagesFunction<Env> = async context => {
  if (!context.env.SURVEY_DB) return json({ error: "survey_unavailable" }, 503);
  let body: unknown;
  try { body = await context.request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  if (!body || typeof body !== "object" || !validAnswers((body as { answers?: unknown }).answers)) return json({ error: "invalid_answers" }, 400);
  const input = body as { answers: number[]; label?: unknown; message?: unknown; gender?: unknown };
  const id = `Q-${Math.floor(100 + Math.random() * 900)}`;
  const createdAt = new Date().toISOString();
  const label = typeof input.label === "string" && input.label.trim() ? input.label.trim().slice(0, 24) : `访客·${Math.floor(1000 + Math.random() * 9000)}`;
  const message = typeof input.message === "string" && input.message.trim() ? input.message.trim().slice(0, 120) : "愿你在选择中保持诚实，也保留温柔。";
  const gender = normalizeGender(input.gender);
  try {
    await context.env.SURVEY_DB.prepare("INSERT INTO survey_submissions (id, created_at, answers_json, label, message, gender) VALUES (?, ?, ?, ?, ?, ?)").bind(id, createdAt, JSON.stringify(input.answers), label, message, gender).run();
    return json({ id, createdAt, answers: input.answers, label, message, gender });
  } catch (error) { console.error("survey POST failed", error); return json({ error: "survey_unavailable" }, 503); }
};
