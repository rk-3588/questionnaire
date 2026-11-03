import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  QUESTIONS,
  QUESTIONNAIRE_VERSION,
  applyRouting,
  automaticResponse,
  currentRecord,
  normalizeSubmission,
  optionResponse,
  parseCurrentInput,
  publicSubmission,
  responseLabel,
  validateResponses,
  visibleQuestions,
} from "../src/questionnaire.ts";
import { profileResponsesMarkup } from "../src/survey-view.ts";
import { createSurveyServer } from "../server/index.mjs";
import {
  onRequestGet,
  onRequestPost,
  onRequestOptions,
} from "../functions/api/survey.ts";

const question = (id) => QUESTIONS.find((item) => item.id === id);
const choose = (id, values, other) =>
  optionResponse(
    question(id),
    Array.isArray(values) ? values : [values],
    other,
  );
function answers(married = false) {
  const values = Object.fromEntries(
    QUESTIONS.map((item) => [
      item.id,
      item.kind === "text" || item.optional
        ? { status: "skipped" }
        : optionResponse(item, [item.options[0].value]),
    ]),
  );
  values.B2 = choose("B2", "undergrad_2");
  values.B3 = choose("B3", married ? "partnered" : "single_experienced");
  values.B4 = choose("B4", married ? "married" : "never_married");
  return applyRouting(values);
}
function input(overrides = {}) {
  return {
    schemaVersion: 2,
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    label: "测试 · 保留",
    responses: answers(),
    publication: { profile: false },
    ...overrides,
  };
}
function record(overrides = {}) {
  return currentRecord(
    input(overrides),
    `Q-${randomUUID()}`,
    new Date().toISOString(),
  );
}
const oldRecord = {
  id: "Q-195",
  createdAt: "2026-09-16T08:24:46.324Z",
  answers: Array(20).fill(4),
  label: "原有记录",
};

test("new questionnaire has 26 stable IDs and non-ordinal choice keys", () => {
  assert.equal(QUESTIONS.length, 26);
  assert.equal(new Set(QUESTIONS.map((item) => item.id)).size, 26);
  for (const item of QUESTIONS)
    if (item.options)
      assert.equal(
        new Set(item.options.map((option) => option.value)).size,
        item.options.length,
      );
  assert.deepEqual(parseCurrentInput(input()).errors, {});
  assert.equal(visibleQuestions(answers()).length, 26);
});
test("married, partnered and recently single paths have distinct applicability", () => {
  const married = answers(true);
  assert.equal(visibleQuestions(married).length, 16);
  for (const id of [
    "Q2",
    "Q4",
    "Q6",
    "Q7",
    "Q8",
    "Q9",
    "Q10",
    "Q15",
    "Q16",
    "Q18",
  ])
    assert.equal(married[id].reason, "currently_married");
  assert.deepEqual(validateResponses(married).errors, {});
  const partnered = applyRouting({
    ...answers(),
    B3: choose("B3", "partnered"),
  });
  assert.equal(partnered.Q4.reason, "current_partner");
  const returned = applyRouting({
    ...partnered,
    B3: choose("B3", "single_experienced"),
  });
  assert.equal(returned.Q4, undefined);
  assert.equal(validateResponses(returned).errors.Q4.length > 0, true);
  for (const id of ["Q3", "Q15"])
    assert.equal(automaticResponse(id, returned), undefined);
  const unmarried = applyRouting({
    ...married,
    B4: choose("B4", "never_married"),
  });
  assert.equal(unmarried.Q2, undefined);
  assert.equal(unmarried.Q4.reason, "current_partner");
});
test("max selections, exclusive options and contradictory housing choices are rejected", () => {
  for (const value of [
    choose("Q5", ["time", "cost", "distance", "family"]),
    choose("Q5", ["none", "time"]),
    choose("Q5", ["unsure", "declined"]),
  ])
    assert.ok(validateResponses({ ...answers(), Q5: value }).errors.Q5);
  assert.ok(
    validateResponses({
      ...answers(),
      Q7: choose("Q7", ["owned_home", "rental_acceptable"]),
    }).errors.Q7,
  );
  assert.deepEqual(
    validateResponses({ ...answers(), Q7: choose("Q7", ["none"]) }).errors,
    {},
  );
});
test("missing, unsure, refusal and non-applicability retain different states", () => {
  const responses = {
    ...answers(),
    B1: { status: "skipped" },
    Q2: choose("Q2", "unsure"),
    Q3: choose("Q3", "declined"),
    Q4: choose("Q4", "current_partner"),
  };
  assert.deepEqual(validateResponses(responses).errors, {});
  assert.deepEqual(
    [
      responses.B1.status,
      responses.Q2.status,
      responses.Q3.status,
      responses.Q4.status,
    ],
    ["skipped", "unsure", "declined", "not_applicable"],
  );
  assert.equal(record({ responses }).gender, "未作答");
  assert.equal(
    record({ responses: { ...answers(), B1: choose("B1", "another") } }).gender,
    "其他性别认同",
  );
});
test("bad versions, absent required answers, non-students and malformed payloads fail safely", () => {
  assert.ok(
    parseCurrentInput({ ...input(), questionnaireVersion: "future" }).errors
      .version,
  );
  assert.ok(validateResponses({ ...answers(), Q1: undefined }).errors.Q1);
  assert.ok(
    validateResponses({ ...answers(), B2: choose("B2", "not_enrolled") }).errors
      .B2,
  );
  for (const id of ["B1", "B2", "B3", "B4", "Q1", "Q5", "S2"]) {
    for (const bad of [
      null,
      0,
      [],
      "bad",
      { status: "answered", value: 3 },
      { status: "answered", value: ["bad", 1] },
    ])
      assert.ok(
        Object.keys(validateResponses({ ...answers(), [id]: bad }).errors)
          .length,
      );
  }
  assert.ok(
    validateResponses({ ...answers(), unknown: { status: "skipped" } }).errors
      .form,
  );
  assert.ok(
    validateResponses({
      ...answers(),
      Q1: { status: "unsure", value: "willing" },
    }).errors.Q1,
  );
  assert.ok(
    validateResponses({
      ...answers(),
      Q2: { status: "not_applicable", reason: "currently_married" },
    }).errors.Q2,
  );
});
test("optional open text supports 200 characters and public projection never leaks free text", () => {
  const responses = {
    ...answers(),
    Q5: choose("Q5", ["other"], "私人补充"),
    S2: { status: "answered", value: "测".repeat(200) },
  };
  const full = record({ responses, publication: { profile: true } });
  assert.ok(normalizeSubmission(full));
  assert.equal(full.message.length, 200);
  assert.ok(
    validateResponses({
      ...responses,
      S2: { status: "answered", value: "测".repeat(201) },
    }).errors.S2,
  );
  const published = publicSubmission(full);
  assert.equal(published.message, "");
  assert.equal(published.responses.S2.reason, "not_public");
  assert.equal(published.responses.Q5.other, undefined);
  assert.ok(normalizeSubmission(published));
  assert.equal(full.responses.Q5.other, "私人补充");
  assert.equal(publicSubmission(record()), undefined);
});
test("old responses retain their old wording and optional missing metadata is accepted", () => {
  const legacy = normalizeSubmission(oldRecord);
  assert.equal(legacy.schemaVersion, 1);
  assert.deepEqual(legacy.answers, oldRecord.answers);
  assert.match(
    profileResponsesMarkup(legacy),
    /我愿意在大学期间建立一段稳定的恋爱关系/,
  );
  assert.equal(
    normalizeSubmission({ ...oldRecord, schemaVersion: 99 }),
    undefined,
  );
  const unsafe = record({
    responses: {
      ...answers(),
      S2: { status: "answered", value: '<img src=x onerror="bad">' },
    },
  });
  assert.doesNotMatch(profileResponsesMarkup(unsafe), /<img/);
  assert.match(profileResponsesMarkup(unsafe), /&lt;img/);
  assert.match(
    responseLabel(question("Q4"), automaticResponse("Q4", answers(true))),
    /已婚/,
  );
});

async function withServer(callback, initial = [oldRecord]) {
  const directory = await mkdtemp(join(tmpdir(), "questionnaire-check-"));
  const dataFile = join(directory, "submissions.json");
  await writeFile(dataFile, JSON.stringify(initial));
  const server = createSurveyServer({ root: directory, dataFile });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/survey`;
  try {
    await callback({ url, dataFile });
  } finally {
    await new Promise((resolve) => {
      server.closeAllConnections();
      server.close(resolve);
    });
    await rm(directory, { recursive: true });
  }
}
const post = (url, body) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
test("Node round trip keeps private data private, preserves old rows and makes retries idempotent", async () => {
  await withServer(async ({ url, dataFile }) => {
    const privateRow = record({
      responses: {
        ...answers(),
        S2: { status: "answered", value: "仅本人可见" },
      },
    });
    const publicRow = record({ publication: { profile: true } });
    const results = await Promise.all([
      post(url, privateRow),
      post(url, publicRow),
    ]);
    assert.deepEqual(
      results.map((result) => result.status),
      [201, 201],
    );
    const savedPrivate = await results[0].json();
    assert.equal(savedPrivate.message, "仅本人可见");
    const publicRows = await (await fetch(url)).json();
    assert.equal(publicRows.length, 2);
    assert.ok(publicRows.some((row) => row.id === oldRecord.id));
    assert.ok(!publicRows.some((row) => row.id === privateRow.id));
    assert.equal((await post(url, privateRow)).status, 201);
    assert.equal(
      (await post(url, { ...privateRow, label: "不允许覆盖" })).status,
      409,
    );
    const all = JSON.parse(await readFile(dataFile, "utf8"));
    assert.equal(all.length, 3);
    assert.deepEqual(
      all.find((row) => row.id === oldRecord.id),
      oldRecord,
    );
    const before = await readFile(dataFile, "utf8");
    assert.equal((await post(url, { ...input(), responses: {} })).status, 400);
    assert.equal(await readFile(dataFile, "utf8"), before);
    const preflight = await fetch(url, {
      method: "OPTIONS",
      headers: {
        Origin: "https://query.linxiksp.cn",
        "Access-Control-Request-Method": "POST",
      },
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), "*");
    assert.equal((await fetch(url + "/other")).status, 404);
  });
});
test("public read limit never truncates stored history and corrupted storage is not overwritten", async () => {
  await withServer(
    async ({ url, dataFile }) => {
      assert.equal(
        (await post(url, record({ publication: { profile: true } }))).status,
        201,
      );
      assert.equal((await (await fetch(url)).json()).length, 500);
      assert.equal(JSON.parse(await readFile(dataFile, "utf8")).length, 502);
      await writeFile(dataFile, "malformed original");
      assert.equal((await post(url, record())).status, 503);
      assert.equal(await readFile(dataFile, "utf8"), "malformed original");
    },
    Array.from({ length: 501 }, (_, index) => ({
      ...oldRecord,
      id: `old-${index}`,
    })),
  );
});
test("Node endpoint continues accepting the old twenty-answer contract", async () => {
  await withServer(async ({ url }) => {
    const response = await post(url, {
      answers: Array(20).fill(3),
      label: "旧版浏览器",
      gender: "♀",
    });
    assert.equal(response.status, 201);
    const saved = await response.json();
    assert.equal(saved.schemaVersion, 1);
    assert.equal(saved.gender, "女");
    assert.equal((await post(url, { answers: Array(20).fill(7) })).status, 400);
  });
});

class D1Adapter {
  constructor(sqlite) {
    this.sqlite = sqlite;
  }
  prepare(sql) {
    const statement = this.sqlite.prepare(sql);
    let params = [];
    return {
      bind(...values) {
        params = values;
        return this;
      },
      async all() {
        return { results: statement.all(...params) };
      },
      async first() {
        return statement.get(...params) ?? null;
      },
      async run() {
        return statement.run(...params);
      },
    };
  }
}
test("D1 migration and Pages handlers preserve legacy rows and use the same v2 rules", async () => {
  const sqlite = new DatabaseSync(":memory:");
  try {
    sqlite.exec(
      await readFile(
        new URL("../functions/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    sqlite.exec(
      await readFile(
        new URL(
          "../functions/migrations/0003_questionnaire_v2.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    sqlite
      .prepare(
        "INSERT INTO survey_submissions (id, created_at, answers_json, label) VALUES (?, ?, ?, ?)",
      )
      .run(
        oldRecord.id,
        oldRecord.createdAt,
        JSON.stringify(oldRecord.answers),
        oldRecord.label,
      );
    const db = new D1Adapter(sqlite);
    const context = (body) => ({
      env: { SURVEY_DB: db },
      request: new Request("https://survey.test/api/survey", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    });
    const privateRow = record();
    const publicRow = record({
      publication: { profile: true },
      responses: {
        ...answers(),
        S2: { status: "answered", value: "不得出现在公开 GET 中" },
      },
    });
    assert.equal((await onRequestPost(context(privateRow))).status, 201);
    assert.equal((await onRequestPost(context(publicRow))).status, 201);
    assert.equal((await onRequestPost(context(publicRow))).status, 200);
    assert.equal(
      (await onRequestPost(context({ ...input(), responses: {} }))).status,
      400,
    );
    const rows = await (await onRequestGet({ env: { SURVEY_DB: db } })).json();
    assert.equal(rows.length, 2);
    assert.ok(rows.some((row) => row.id === oldRecord.id));
    assert.ok(!JSON.stringify(rows).includes("不得出现在公开 GET 中"));
    assert.equal(
      sqlite.prepare("SELECT count(*) AS n FROM survey_submissions_v2").get().n,
      2,
    );
    assert.equal((await onRequestGet({ env: {} })).status, 503);
    assert.equal(onRequestOptions({}).status, 204);
  } finally {
    sqlite.close();
  }
});
