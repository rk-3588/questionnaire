// Run after npm run build. All submissions go to an isolated local data file.
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { createSurveyServer } from "../server/index.mjs";
import {
  QUESTIONS,
  QUESTIONNAIRE_VERSION,
  optionResponse,
  applyRouting,
  currentRecord,
} from "../src/questionnaire.ts";

const directory = await mkdtemp(join(tmpdir(), "survey-browser-"));
const dataFile = join(directory, "submissions.json");
const responses = applyRouting(
  Object.fromEntries(
    QUESTIONS.map((question) => [
      question.id,
      question.optional
        ? { status: "skipped" }
        : optionResponse(question, [
            question.id === "B3"
              ? "single_experienced"
              : question.options[0].value,
          ]),
    ]),
  ),
);
const publicRecord = currentRecord(
  {
    schemaVersion: 2,
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    label: "公开样本",
    responses,
    publication: { profile: true },
  },
  `Q-${randomUUID()}`,
  "2026-11-01T12:00:00.000Z",
);
const old = {
  id: "Q-195",
  createdAt: "2026-09-16T08:24:46.324Z",
  label: "历史访客",
  answers: Array(20).fill(4),
};
await writeFile(dataFile, JSON.stringify([publicRecord, old]));
const server = createSurveyServer({ root: resolve("."), dataFile });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {}),
  args: ["--enable-unsafe-swiftshader"],
});
const errors = [];
const checks = [];
await mkdir(".tools/survey-browser", { recursive: true });
async function screenshot(page, name) {
  // Screenshots cover the form, not the existing 3D scene. Exclude the
  // backdrop so CPU-only CI does not wait on software GPU fences.
  await page.screenshot({
    path: `.tools/survey-browser/${name}.png`,
    animations: "disabled",
    style: ".three-scene { visibility: hidden !important; }",
    timeout: 10000,
  });
}

async function context(
  viewport = { width: 1440, height: 1000 },
  uiOnly = true,
) {
  const context = await browser.newContext({
    viewport,
    serviceWorkers: "block",
    reducedMotion: "reduce",
  });
  await context.addInitScript(() =>
    localStorage.setItem(
      "rhine-settings",
      JSON.stringify({
        sound: false,
        music: false,
        reduced: true,
        superPerformance: true,
      }),
    ),
  );
  await context.route("https://query.linxiksp.cn/api/survey", async (route) => {
    const response = await route.fetch({ url: `${base}/api/survey` });
    await route.fulfill({ response });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.setDefaultTimeout(10000);
  await page.goto(base + (uiOnly ? "/?review=1&ui-only=1&scene=archive" : "/"));
  await page.waitForFunction(
    () =>
      window.rhine?.stats().ready && window.rhine?.stats().mode === "archive",
    null,
    { timeout: 30000 },
  );
  return { context, page };
}
async function openSurvey(page) {
  if (!(await page.locator("#survey-ui").isVisible()))
    await page.locator('[data-action="survey"]').click();
  await page.locator("#survey-ui h1").waitFor();
}
async function start(page, name) {
  await openSurvey(page);
  await page.locator('[data-survey-field="nickname"]').fill(name);
  await page.locator('[data-survey-field="eligible"]').check();
  await page.locator('[data-survey-action="start"]').click();
}
async function currentQuestion(page) {
  return (await page.locator(".survey-progress").innerText()).split(" · ")[0];
}
async function choose(page, value) {
  await page.locator(`[data-response-value="${value}"]`).check();
}
async function next(page) {
  await page.locator('[data-survey-action="next"]').click();
}
async function fillUntilReview(page, married, seen = []) {
  while (!(await page.locator('[data-survey-action="submit"]').count())) {
    const id = await currentQuestion(page);
    seen.push(id);
    const question = QUESTIONS.find((item) => item.id === id);
    if (id === "S2") {
      await page
        .locator('[data-survey-field="text"]')
        .fill("开放文字不公开。".repeat(20));
    } else if (question.optional) {
      await page.locator('[data-survey-action="skip"]').click();
      continue;
    } else {
      const preferred = {
        B2: "undergrad_2",
        B3: married ? "partnered" : "single_experienced",
        B4: married ? "married" : "never_married",
      }[id];
      await choose(page, preferred || question.options[0].value);
    }
    await next(page);
  }
  return seen;
}
try {
  const desktop = await context();
  const page = desktop.page;
  await start(page, "浏览器验证·单身");
  assert.equal(await currentQuestion(page), "B1");
  await choose(page, "another");
  await next(page);
  await choose(page, "undergrad_2");
  await next(page);
  await choose(page, "single_experienced");
  await next(page);
  await choose(page, "never_married");
  await next(page);
  while ((await currentQuestion(page)) !== "Q5") {
    const id = await currentQuestion(page);
    await choose(
      page,
      QUESTIONS.find((item) => item.id === id).options[0].value,
    );
    await next(page);
  }
  await choose(page, "time");
  await choose(page, "cost");
  await choose(page, "distance");
  await page.locator('[data-response-value="family"]').click();
  assert.match(
    await page.locator(".survey-status").innerText(),
    /最多选择 3 项/,
  );
  assert.equal(await page.locator(".answer input:checked").count(), 3);
  await choose(page, "none");
  assert.equal(await page.locator(".answer input:checked").count(), 1);
  await choose(page, "other");
  await page
    .locator('[data-survey-field="other"]')
    .fill("此补充仅保留在调查数据中");
  await next(page);
  assert.equal(await currentQuestion(page), "Q6");
  await screenshot(page, "desktop-question");
  await choose(page, "income");
  await next(page);
  await choose(page, "owned_home");
  await choose(page, "rental_acceptable");
  assert.equal(
    await page.locator('[data-response-value="owned_home"]').isChecked(),
    false,
  );
  await next(page);
  const tail = await fillUntilReview(page, false);
  assert.ok(tail.includes("Q15"));
  assert.equal(
    await page.locator('[data-survey-field="publish"]').isChecked(),
    false,
  );
  await page.locator('[data-survey-action="submit"]').click();
  await page.waitForFunction(() =>
    document.querySelector(".survey-status")?.textContent.includes("提交成功"),
  );
  let own = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rhine-survey-v2-records")),
  );
  assert.equal(own.own.length, 1);
  assert.equal(own.own[0].gender, "其他性别认同");
  assert.equal(own.own[0].responses.S1.status, "skipped");
  const ownId = own.currentId;
  assert.ok(
    !(await (await fetch(base + "/api/survey")).json()).some(
      (record) => record.id === ownId,
    ),
  );
  checks.push(
    "single student: all questions, multi-select rules, private submission and separate own identity",
  );
  await page
    .locator('[data-survey-action="select"]')
    .filter({ hasText: "公开样本" })
    .click();
  assert.equal(await page.locator("#survey-ui h1").innerText(), "公开样本");
  await page.locator('.survey-header [data-survey-action="archive"]').click();
  assert.match(
    await page.locator(".identity-card").innerText(),
    /浏览器验证·单身/,
  );
  await page.locator('[data-survey-action="system"]').click();
  await page.evaluate(() => window.rhine.select(0));
  await page.locator(".read-file").click();
  await page.locator("#detail-content").waitFor();
  assert.match(
    await page.locator(".detail-title-cn").innerText(),
    /浏览器验证·单身/,
  );
  await page.locator('[data-tab="notes"]').click();
  assert.equal(await page.locator(".radar-chart").count(), 0);
  assert.match(await page.locator("#tab-panel").textContent(), /租房也可以/);
  assert.match(
    await page.locator("#tab-panel").textContent(),
    /开放文字不公开/,
  );
  await page.reload();
  await page.waitForFunction(() => window.rhine?.stats().ready);
  await openSurvey(page);
  await page.locator('.survey-header [data-survey-action="archive"]').click();
  assert.match(
    await page.locator(".identity-card").innerText(),
    /浏览器验证·单身/,
  );
  own = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("rhine-survey-v2-records")),
  );
  assert.equal(own.currentId, ownId);
  checks.push(
    "SYSTEM shows the selected submission; refresh preserves ownership and original v2 answers",
  );

  const married = await context({ width: 390, height: 844 }, false);
  await openSurvey(married.page);
  await screenshot(married.page, "mobile-intro");
  await married.page
    .locator('.survey-header [data-survey-action="archive"]')
    .click();
  assert.match(
    await married.page.locator(".identity-card").innerText(),
    /尚未提交/,
  );
  assert.doesNotMatch(
    await married.page.locator(".identity-card").innerText(),
    /公开样本/,
  );
  await married.page.locator('[data-survey-action="resume"]').click();
  // Eligibility must not be bypassed by using the archive's resume entry.
  if (await married.page.locator('[data-survey-field="eligible"]').count()) {
    await married.page.locator('[data-survey-field="eligible"]').check();
    await married.page.locator('[data-survey-action="start"]').click();
  }
  const seen = await fillUntilReview(married.page, true);
  assert.equal(seen.length, 16);
  assert.ok(seen.includes("Q3"));
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
    assert.ok(!seen.includes(id));
  assert.equal(
    await married.page.evaluate(
      () =>
        document.querySelector("#survey-ui").scrollWidth <=
        document.querySelector("#survey-ui").clientWidth + 1,
    ),
    true,
  );
  await screenshot(married.page, "mobile-review");
  await married.page.locator('[data-survey-field="publish"]').check();
  await married.page.locator('[data-survey-action="submit"]').click();
  await married.page.waitForFunction(() =>
    document.querySelector(".survey-status")?.textContent.includes("提交成功"),
  );
  const published = (await (await fetch(base + "/api/survey")).json()).find(
    (record) => record.schemaVersion === 2 && record.id !== publicRecord.id,
  );
  assert.ok(published);
  assert.equal(published.responses.Q2.reason, "currently_married");
  assert.equal(published.responses.S2.reason, "not_public");
  assert.equal(published.message, "");
  checks.push(
    "mobile married student: 16 applicable questions, no horizontal overflow, opt-in published choices with text redaction",
  );
  await married.page
    .locator('[data-survey-action="select"]')
    .filter({ hasText: "历史访客" })
    .click();
  assert.match(await married.page.locator("#survey-ui").innerText(), /旧版/);
  assert.match(
    await married.page.locator("#survey-ui").textContent(),
    /我愿意在大学期间建立一段稳定的恋爱关系/,
  );
  checks.push(
    "legacy archives retain old question meanings and do not substitute the current visitor's responses",
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        checks,
        pageErrors: errors,
        storageRows: JSON.parse(await readFile(dataFile, "utf8")).length,
        screenshots: ".tools/survey-browser/",
      },
      null,
      2,
    ),
  );
} catch (error) {
  for (const context of browser.contexts())
    for (const page of context.pages()) {
      console.error(
        await page.evaluate(() => ({
          mode: document.querySelector("#stage")?.dataset.mode,
          progress: document.querySelector(".survey-progress")?.textContent,
          root: document
            .querySelector("#survey-ui")
            ?.getBoundingClientRect()
            .toJSON(),
          inputs: [...document.querySelectorAll(".answer input")].map(
            (input) => ({
              value: input.dataset.responseValue,
              rect: input.getBoundingClientRect().toJSON(),
              visibility: getComputedStyle(input).visibility,
              display: getComputedStyle(input).display,
            }),
          ),
          errors: document.querySelector(".survey-status")?.textContent,
        })),
      );
      await page
        .screenshot({
          path: ".tools/survey-browser/failure.png",
          timeout: 5000,
        })
        .catch(() => {});
    }
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => {
    server.closeAllConnections();
    server.close(resolve);
  });
  await rm(directory, { recursive: true });
}
