// Exercise offline use and the existing opt-in update protocol on a disposable
// copy of the release. No production requests or data writes are made.
import assert from "node:assert/strict";
import { mkdtemp, cp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { createSurveyServer } from "../server/index.mjs";
import {
  QUESTIONS,
  QUESTIONNAIRE_VERSION,
  applyRouting,
  currentRecord,
  optionResponse,
} from "../src/questionnaire.ts";

const directory = await mkdtemp(join(tmpdir(), "survey-pwa-"));
const dist = join(directory, "dist");
await cp("dist", dist, { recursive: true });
const metadata = JSON.parse(
  await readFile(join(dist, "pwa-build.json"), "utf8"),
);
assert.ok(metadata.files.includes("survey-mark.svg"));
assert.ok(!metadata.files.some((path) => /\.(glb|ogg|woff2)$/.test(path)));
const worker = await readFile(join(dist, "sw.js"), "utf8");
const previous = metadata.version + "-previous";
await writeFile(
  join(dist, "sw.js"),
  worker.replace(JSON.stringify(metadata.version), JSON.stringify(previous)),
);
const server = createSurveyServer({
  root: directory,
  dataFile: join(directory, "submissions.json"),
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {}),
});
const errors = [];
try {
  const context = await browser.newContext({
    serviceWorkers: "allow",
    reducedMotion: "reduce",
  });
  let offline = false;
  await context.route("https://query.linxiksp.cn/api/survey", async (route) => {
    if (offline) await route.abort("internetdisconnected");
    else
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: "[]",
      });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await page.waitForFunction(
    () => document.documentElement.dataset.offlineReady === "true",
  );
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  const responses = applyRouting(
    Object.fromEntries(
      QUESTIONS.map((q) => [
        q.id,
        q.optional
          ? { status: "skipped" }
          : optionResponse(q, [
              q.id === "B3" ? "single_experienced" : q.options[0].value,
            ]),
      ]),
    ),
  );
  const own = currentRecord(
    {
      schemaVersion: 2,
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      label: "更新保留的本人副本",
      responses,
      publication: { profile: false },
    },
    "Q-11111111-2222-4333-8444-555555555555",
    "2026-11-05T00:00:00.000Z",
  );
  const draft = {
    version: QUESTIONNAIRE_VERSION,
    eligible: true,
    index: 1,
    nickname: "更新保留的草稿",
    responses: {
      B1: optionResponse(QUESTIONS[0], [QUESTIONS[0].options[0].value]),
    },
    publish: false,
  };
  await page.evaluate(
    ({ own, draft }) => {
      localStorage.setItem(
        "rhine-survey-v2-records",
        JSON.stringify({
          own: [own],
          public: [],
          currentId: own.id,
          unsynced: [],
        }),
      );
      localStorage.setItem("rhine-survey-v2-draft", JSON.stringify(draft));
    },
    { own, draft },
  );

  offline = true;
  await context.setOffline(true);
  await page.reload();
  await page.locator("#hero-title").waitFor();
  await page.locator('.site-nav [href="#questionnaire"]').click();
  await page.locator(".survey-progress").waitFor();
  assert.match(await page.locator(".survey-progress").innerText(), /^B2/);
  await page.locator('.site-nav [href="#submissions"]').click();
  assert.match(
    await page.locator(".identity-card").innerText(),
    /更新保留的本人副本/,
  );

  offline = false;
  await context.setOffline(false);
  await writeFile(join(dist, "sw.js"), worker);
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration.update();
  });
  await page.locator("#pwa-update-notice").waitFor({ timeout: 20000 });
  // A prepared version must wait for the user's explicit action.
  assert.ok(
    (await page.evaluate(() => caches.keys())).some((key) =>
      key.endsWith("-previous"),
    ),
  );
  await Promise.all([
    page.waitForEvent("domcontentloaded"),
    page.locator("#pwa-update-notice").click(),
  ]);
  await page.locator(".identity-card").waitFor();
  assert.match(
    await page.locator(".identity-card").innerText(),
    /更新保留的本人副本/,
  );
  const stored = await page.evaluate(() => ({
    own: JSON.parse(localStorage.getItem("rhine-survey-v2-records")),
    draft: JSON.parse(localStorage.getItem("rhine-survey-v2-draft")),
  }));
  assert.equal(stored.own.currentId, own.id);
  assert.equal(stored.draft.nickname, draft.nickname);
  const keys = await page.evaluate(() => caches.keys());
  assert.equal(keys.length, 1);
  assert.ok(keys[0].endsWith(metadata.version));
  await page.goto(base + "/update.html");
  await Promise.all([
    page.waitForURL(base + "/"),
    page.locator("#update").click(),
  ]);
  await page.locator("#hero-title").waitFor();
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("rhine-survey-v2-records")).currentId,
    ),
    own.id,
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        checks: [
          "offline homepage, draft and own submission",
          "explicit update keeps draft and own identity",
          "previous cache removed after activation",
          "network-only recovery keeps local answers",
        ],
        version: metadata.version,
        offlineFiles: metadata.files.length,
        offlineBytes: metadata.bytes,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  await new Promise((resolve) => {
    server.closeAllConnections();
    server.close(resolve);
  });
  await rm(directory, { recursive: true });
}
