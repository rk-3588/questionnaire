import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { get } from "node:http";
import { fixture } from "./admin-fixtures.mjs";
import {
  buildSummary,
  buildComparison,
  buildCollection,
  questionSummary,
  parseFilters,
  filterRecords,
  dayOf,
} from "../server/statistics.mjs";
import { createSurveyServer, csvCell } from "../server/index.mjs";
import { createAuth } from "../server/auth.mjs";

const row = (options) => fixture(options).row;
const option = (q, name) =>
  q.variants[0].counts.find((item) => item.value === name);
const filters = (query) => parseFilters(new URL("http://localhost/?" + query));

test("single-choice denominators retain uncertainty and exclude refusal, missing and inapplicable answers", () => {
  const rows = ["yes", "unsure", "declined", "not_applicable", undefined].map(
    (U01) => row({ answers: { U01 } }),
  );
  rows.push(row({ skipped: ["U01"] }));
  const result = questionSummary(rows, "U01");
  assert.equal(result.shown, 6);
  assert.equal(result.valid, 2);
  assert.equal(option(result, "yes").percent, 50);
  assert.equal(option(result, "unsure").percent, 50);
  assert.equal(option(result, "no").count, 0);
  assert.equal(result.statuses.declined, 1);
  assert.equal(result.statuses.skipped, 1);
  assert.ok(!result.variants[0].counts.some((o) => o.value === "declined"));
});

test("unknown marriage is separately counted; married routes do not enter future marriage statistics", () => {
  const rows = [
    row(),
    row({ answers: { D04: "declined" } }),
    row({ answers: { D04: "married" } }),
  ];
  const result = questionSummary(rows, "U01");
  assert.equal(result.valid, 1);
  assert.equal(result.scopeExcluded, 1);
  assert.equal(result.notShown, 1);
  // A G route can also have known non-married status but an undisclosed relationship.
  assert.equal(
    questionSummary([row({ answers: { D03: "declined" } })], "U01").valid,
    1,
  );
});

test("multi-choice percentages use respondents, including a substantive no-needs option", () => {
  const result = questionSummary(
    [
      row(),
      row(),
      row({ answers: { H01: "none" } }),
      row({ answers: { H01: "declined" } }),
    ],
    "H01",
  );
  assert.equal(result.valid, 3);
  assert.equal(option(result, "meet").percent, 66.7);
  assert.equal(option(result, "none").percent, 33.3);
  assert.equal(
    result.variants[0].counts.reduce((n, o) => n + o.count, 0),
    5,
  );
});

test("cash expectation, budget, and general arrangement questions keep their own wording and denominator", () => {
  const rows = ["female", "male", "other"].map((D01) =>
    row({ complete: true, answers: { D01 } }),
  );
  rows.push(row({ complete: true, neutralQuestions: ["R03"] }));
  const result = questionSummary(rows, "R03");
  assert.equal(result.variants.length, 3);
  for (const variant of result.variants) {
    assert.match(variant.title, /彩礼/);
    assert.equal(variant.counts[0].percent, 100);
    assert.equal(variant.valid, variant.variant.endsWith(":neutral") ? 2 : 1);
  }
  assert.notEqual(result.variants[0].title, result.variants[1].title);
  assert.throws(() => buildComparison(rows, "R03", "gender"), /invalid_filter/);
});

test("opposite birth disagreement directions and role wording remain separate", () => {
  const rows = ["yes", "no", "unsure"].map((R01) =>
    row({ complete: true, answers: { R01 } }),
  );
  const result = questionSummary(rows, "R02");
  assert.deepEqual(
    new Set(result.variants.map((v) => v.variant)),
    new Set([
      "birth:self_yes:female",
      "birth:self_no:female",
      "birth:unspecified:female",
    ]),
  );
  assert.equal(new Set(result.variants.map((v) => v.title)).size, 3);
});

test("date filtering uses inclusive Beijing dates and validates calendars and categorical inputs", () => {
  assert.equal(dayOf("2026-11-06T16:00:00.000Z"), "2026-11-07");
  const rows = [
    row({ createdAt: "2026-11-06T15:59:59.999Z" }),
    row({ createdAt: "2026-11-06T16:00:00.000Z" }),
    row({ createdAt: "2026-11-07T15:59:59.999Z" }),
    row({ createdAt: "2026-11-07T16:00:00.000Z" }),
  ];
  assert.equal(
    filterRecords(rows, filters("start=2026-11-07&end=2026-11-07")).length,
    2,
  );
  for (const query of [
    "start=2026-02-29",
    "end=2026-11-31",
    "start=2026-11-08&end=2026-11-07",
    "route=X",
    "study=__proto__",
    "gender=constructor",
    "eligibility=not_enrolled",
  ])
    assert.throws(() => filters(query), /invalid_filter/);
  assert.equal(filters("start=2024-02-29").start, "2024-02-29");
  assert.equal(
    filterRecords(
      [
        row(),
        row({ answers: { D02: "graduate" } }),
        row({ answers: { D02: "declined" } }),
      ],
      filters("eligibility=enrolled&gender=female&study=undergrad&route=A"),
    ).length,
    1,
  );
});

test("summary includes genuine missingness, positive duration median and a complete 14-day zero-filled trend", () => {
  const rows = [
    row({ durationSeconds: 100 }),
    row({ durationSeconds: 300 }),
    row({ durationSeconds: 0 }),
    row({
      answers: {
        D02: "declined",
        O01: { values: ["write"], text: "private comment" },
      },
      durationSeconds: 500,
      createdAt: "2026-11-06T16:30:00.000Z",
    }),
  ];
  const result = buildSummary(rows, {}, new Date("2026-11-07T04:00:00.000Z"));
  assert.equal(result.total, 4);
  assert.equal(result.eligible, 3);
  assert.equal(result.unknown, 1);
  assert.equal(result.today, 1);
  assert.equal(result.medianSeconds, 300);
  assert.equal(result.durationCount, 3);
  assert.equal(result.textCount, 1);
  assert.equal(result.trend.length, 14);
  assert.equal(result.trend.at(-1).count, 1);
  assert.equal(result.trend[0].count, 0);
  assert.equal(result.questionStats.length, 41);
  assert.ok(!JSON.stringify(result).includes("private comment"));
  assert.equal(buildSummary(rows.slice(0, 2)).medianSeconds, 200);
});

test("empty results preserve zero options and null proportions rather than fabricating percentages", () => {
  const result = buildSummary([]);
  assert.equal(result.total, 0);
  assert.equal(result.medianSeconds, null);
  assert.equal(result.latestAt, null);
  assert.ok(
    result.questionStats.every(
      (q) =>
        q.valid === 0 &&
        q.variants.every((v) =>
          v.counts.every((c) => c.count === 0 && c.percent === null),
        ),
    ),
  );
  assert.ok(!JSON.stringify(result).includes("NaN"));
  assert.ok(
    result.themes.every(
      (theme) =>
        theme.summary.valid === 0 &&
        theme.metrics.every((metric) => metric.percent === null),
    ),
  );
  assert.ok(
    result.collection.days.every(
      (day) => day.count === 0 && day.cumulative === 0,
    ),
  );
});

test("theme summaries preserve ties, uncertainty, per-question scope and distinct support respondents", () => {
  const rows = [
    row({ answers: { F01: "large", F03: "want", H02: "self_help" } }),
    row({
      answers: {
        U01: "unsure",
        F01: "very_large",
        F03: "want",
        H01: "none",
        H02: "none",
      },
    }),
    row({
      answers: {
        U01: "declined",
        F01: "medium",
        F03: "neutral",
        H01: "declined",
        H02: "none",
      },
    }),
    row({
      answers: {
        D04: "declined",
        F01: "declined",
        F03: "want",
        H02: "declined",
      },
    }),
  ];
  const themes = buildSummary(rows).themes;
  assert.equal(themes.length, 3);
  const [intention, reality, support] = themes;
  assert.equal(intention.summary.valid, 2);
  assert.deepEqual(
    intention.summary.choices.map((choice) => choice.value),
    ["yes", "unsure"],
  );
  assert.equal(intention.metrics[1].count, 1);
  assert.equal(intention.metrics[1].percent, 50);
  assert.match(intention.metrics[1].note, /非已婚/);
  assert.equal(reality.metrics[0].count, 2);
  assert.equal(reality.metrics[0].valid, 3);
  assert.equal(reality.metrics[0].percent, 66.7);
  assert.deepEqual(
    reality.summary.choices.map((choice) => choice.value),
    ["relationship", "practical"],
  );
  assert.equal(reality.summary.percent, 100);
  assert.equal(reality.metrics[2].count, 2);
  assert.equal(reality.metrics[2].valid, 3);
  assert.equal(support.metrics[0].count, 2);
  assert.equal(support.metrics[0].valid, 3);
  assert.equal(support.metrics[0].percent, 66.7);
  assert.equal(support.metrics[1].count, 1);
  assert.deepEqual(
    support.metrics[2].choices.map((choice) => choice.value),
    ["none"],
  );
});

test("themes do not imply missing marriage intentions or support needs for inapplicable and unanswered groups", () => {
  const result = buildSummary([
    row({ answers: { D04: "married", H01: undefined } }),
  ]);
  assert.equal(result.themes[0].summary.valid, 0);
  assert.deepEqual(result.themes[0].summary.choices, []);
  assert.equal(result.themes[0].metrics[1].percent, null);
  assert.equal(result.themes[0].metrics[0].percent, 100);
  assert.equal(result.themes[2].metrics[0].count, 0);
  assert.equal(result.themes[2].metrics[0].percent, null);
});

test("collection trend carries older records into cumulative totals and fills quiet days without counting future records", () => {
  const rows = [
    "2026-10-01T04:00:00Z",
    "2026-10-08T04:00:00Z",
    "2026-10-09T15:59:59Z",
    "2026-11-06T16:00:00Z",
    "2026-11-08T04:00:00Z",
  ].map((createdAt) => row({ createdAt }));
  const result = buildCollection(rows, {}, new Date("2026-11-07T04:00:00Z"));
  assert.equal(result.days.length, 30);
  assert.equal(result.start, "2026-10-09");
  assert.equal(result.openingTotal, 2);
  assert.equal(result.days[0].count, 1);
  assert.equal(result.days[0].cumulative, 3);
  assert.equal(result.days[1].count, 0);
  assert.equal(result.days[1].cumulative, 3);
  assert.equal(result.days.at(-1).day, "2026-11-07");
  assert.equal(result.days.at(-1).count, 1);
  assert.equal(result.totalThroughEnd, 4);
  const week = result.days.slice(-7);
  assert.equal(week[0].cumulative - week[0].count, 3);
  assert.equal(week.at(-1).cumulative, 4);
  assert.ok(
    result.days.every(
      (day, index) =>
        Number.isFinite(day.cumulative) &&
        (index === 0 || day.cumulative >= result.days[index - 1].cumulative),
    ),
  );
});

test("collection trend clips to the applied date scope, includes endpoints and handles a single day", () => {
  const rows = [
    "2026-11-04T04:00:00Z",
    "2026-11-06T16:00:00Z",
    "2026-11-07T16:00:00Z",
  ].map((createdAt) => row({ createdAt }));
  const selected = filters("start=2026-11-05&end=2026-11-07");
  const result = buildCollection(
    filterRecords(rows, selected),
    selected,
    new Date("2026-12-01T04:00:00Z"),
  );
  assert.equal(result.days.length, 3);
  assert.equal(result.days[0].day, "2026-11-05");
  assert.equal(result.openingTotal, 0);
  assert.equal(result.days.at(-1).count, 1);
  assert.equal(result.days.at(-1).cumulative, 1);
  const single = filters("start=2026-11-07&end=2026-11-07");
  assert.deepEqual(buildCollection(filterRecords(rows, single), single).days, [
    { day: "2026-11-07", count: 1, cumulative: 1 },
  ]);
});

test("group comparisons share the same per-question denominator and preserve empty groups", () => {
  const rows = [
    row(),
    row({ answers: { U01: "unsure" } }),
    row({ answers: { D02: "graduate", U01: "declined" } }),
  ];
  const result = buildComparison(rows, "U01", "study");
  const undergrad = result.groups.find((g) => g.key === "undergrad"),
    graduate = result.groups.find((g) => g.key === "graduate");
  assert.equal(undergrad.valid, 2);
  assert.equal(undergrad.counts.find((c) => c.value === "yes").percent, 50);
  assert.equal(graduate.total, 1);
  assert.equal(graduate.valid, 0);
  assert.ok(graduate.counts.every((c) => c.percent === null));
  assert.throws(() => buildComparison(rows, "O01", "study"), /invalid_filter/);
});

test("CSV cells neutralize spreadsheet formulas without altering the stored text", () => {
  for (const text of ["=SUM(A1)", "+cmd", "@data", "-10", "  =1", "\t1"])
    assert.ok(csvCell(text).startsWith("\"'"));
  assert.equal(csvCell('他说"你好"'), '"他说""你好"""');
});

test("independent servers protect statistics, export, origin and CSRF while preserving public submission", async (t) => {
  const dataDir = await mkdtemp(join(tmpdir(), "xindong-admin-test-"));
  const password = randomBytes(18).toString("base64url");
  const rawText = "=SUM(A1) <script>private</script>";
  const rows = [
    row(),
    row({
      answers: { D02: "graduate", O01: { values: ["write"], text: rawText } },
    }),
    row({ answers: { D04: "married" } }),
  ];
  await writeFile(join(dataDir, "submissions-v3.json"), JSON.stringify(rows));
  await createAuth(dataDir, password);
  const servers = ["public", "admin"].map((mode) =>
    createSurveyServer({
      mode,
      dataDir,
      publicOrigin: "",
      production: false,
      secureCookie: false,
    }),
  );
  t.after(async () => {
    for (const server of servers) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    await rm(dataDir, { recursive: true, force: true });
  });
  for (const server of servers) {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
  }
  const [publicUrl, adminUrl] = servers.map(
    (server) => `http://127.0.0.1:${server.address().port}`,
  );
  async function request(path, options = {}, base = adminUrl) {
    const response = await fetch(base + path, options);
    const text = await response.text();
    return {
      response,
      text,
      data: response.headers.get("content-type")?.includes("application/json")
        ? JSON.parse(text)
        : null,
    };
  }
  for (const path of [
    "/admin",
    "/admin.html",
    "/admin.js",
    "/admin.css",
    "/api/admin/session",
    "/api/admin/summary",
  ])
    assert.equal(
      (await request(path, {}, publicUrl)).response.status,
      404,
      path,
    );
  assert.equal((await request("/")).response.status, 200);
  assert.match((await request("/")).text, /问卷统计/);
  assert.equal((await request("/api/submissions")).response.status, 404);
  assert.equal((await request("/survey-core.mjs")).response.status, 404);
  assert.equal((await request("/api/admin/summary")).response.status, 401);
  assert.equal(
    (await request("/api/admin/export?format=json")).response.status,
    401,
  );
  const post = (body) => ({
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: adminUrl },
    body: JSON.stringify(body),
  });
  assert.equal(
    (
      await request("/api/admin/login", {
        ...post({ password }),
        headers: {
          "Content-Type": "application/json",
          Origin: "https://elsewhere.example",
        },
      })
    ).response.status,
    403,
  );
  assert.equal(
    (
      await request(
        "/api/admin/login",
        post({ password: "incorrect-password" }),
      )
    ).response.status,
    401,
  );
  const login = await request("/api/admin/login", post({ password }));
  assert.equal(login.response.status, 200);
  const cookie = login.response.headers.get("set-cookie").split(";")[0],
    csrf = login.data.csrfToken;
  assert.match(
    login.response.headers.get("set-cookie"),
    /HttpOnly; SameSite=Strict/,
  );
  const auth = { headers: { Cookie: cookie } };
  const summary = await request("/api/admin/summary?study=undergrad", auth);
  assert.equal(summary.data.total, 2);
  assert.equal(summary.data.themes.length, 3);
  assert.ok(Array.isArray(summary.data.collection.days));
  assert.ok(!summary.text.includes(rawText));
  assert.match(summary.response.headers.get("cache-control"), /no-store/);
  assert.equal(
    (await request("/api/admin/summary?start=2026-02-29", auth)).response
      .status,
    400,
  );
  const wrongHostStatus = await new Promise((resolve, reject) =>
    get(
      adminUrl + "/api/admin/summary",
      { headers: { Cookie: cookie, Host: "elsewhere.example" } },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      },
    ).on("error", reject),
  );
  assert.equal(wrongHostStatus, 403);
  const list = await request("/api/admin/responses?study=graduate", auth);
  assert.equal(list.data.total, 1);
  assert.ok(!JSON.stringify(list.data).includes(rawText));
  const detail = await request("/api/admin/responses/" + rows[1].receipt, auth);
  assert.ok(detail.data.responses.some((r) => r.label === rawText));
  assert.equal(detail.data.payloadHash, undefined);
  const exported = await request(
    "/api/admin/export?format=json&study=graduate",
    auth,
  );
  assert.equal(exported.data.records.length, 1);
  assert.equal(exported.data.records[0].payloadHash, undefined);
  const csv = await request(
    "/api/admin/export?format=csv&study=graduate",
    auth,
  );
  assert.match(csv.text, /"'=SUM\(A1\)/);
  assert.match(csv.response.headers.get("content-disposition"), /attachment/);
  assert.equal(
    (await request("/api/admin/comparison?question=R03&group=gender", auth))
      .response.status,
    400,
  );
  const logout = {
    ...post({}),
    headers: { ...post({}).headers, Cookie: cookie },
  };
  assert.equal(
    (await request("/api/admin/logout", logout)).response.status,
    403,
  );
  logout.headers["X-CSRF-Token"] = csrf;
  assert.equal(
    (await request("/api/admin/logout", logout)).response.status,
    200,
  );
  assert.equal(
    (await request("/api/admin/summary", auth)).response.status,
    401,
  );
  const submission = fixture().payload;
  const submitted = await request(
    "/api/submissions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: publicUrl },
      body: JSON.stringify(submission),
    },
    publicUrl,
  );
  assert.equal(submitted.response.status, 201);
  const repeated = await request(
    "/api/submissions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: publicUrl },
      body: JSON.stringify(submission),
    },
    publicUrl,
  );
  assert.equal(repeated.response.status, 200);
  assert.equal(repeated.data.duplicate, true);
  assert.equal(
    JSON.parse(await readFile(join(dataDir, "submissions-v3.json"), "utf8"))
      .length,
    4,
  );
});
