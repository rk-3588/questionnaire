import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { mkdtemp, writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { browserFixtures } from "./admin-fixtures.mjs";
import { createSurveyServer } from "../server/index.mjs";
import { createAuth } from "../server/auth.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "..", ".tools", "admin-browser");
const dataDir = await mkdtemp(join(tmpdir(), "xindong-admin-browser-"));
const rows = browserFixtures(),
  password = randomBytes(18).toString("base64url");
await mkdir(output, { recursive: true });
await writeFile(join(dataDir, "submissions-v3.json"), JSON.stringify(rows));
await createAuth(dataDir, password);
const server = createSurveyServer({
  mode: "admin",
  dataDir,
  publicOrigin: "",
  production: false,
  secureCookie: false,
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/content security policy/i.test(message.text()))
      errors.push(message.text());
  });
  await page.goto(origin);
  await page.locator("#password").waitFor({ state: "visible" });
  await page.screenshot({ path: join(output, "login-desktop.png") });
  assert.equal(await page.locator("#dashboard").isVisible(), false);
  await page.locator("#password").fill("incorrect-password");
  await page.locator("#auth-submit").click();
  await page.waitForFunction(() =>
    document.querySelector("#auth-error").textContent.includes("密码不正确"),
  );
  await page.locator("#password").fill(password);
  await page.locator("#auth-submit").click();
  await page.waitForFunction(
    () => document.querySelector("#stats strong")?.textContent === "31",
  );
  assert.equal(await page.locator("#overview-charts .chart-card").count(), 11);
  assert.equal(await page.locator("#question-select option").count(), 41);
  assert.equal(await page.locator("#records tr").count(), 25);
  assert.equal(await page.locator("#password").inputValue(), "");
  await page.screenshot({
    path: join(output, "overview-desktop.png"),
    fullPage: true,
  });

  await page.locator("#tab-records").click();
  await page.locator("#next").click();
  await page.waitForFunction(
    () => document.querySelector("#page-label").textContent === "2 / 2",
  );
  assert.equal(await page.locator("#records tr").count(), 6);
  await page.locator("#eligibility").selectOption("");
  await page.locator("#filters button[type=submit]").click();
  await page.waitForFunction(
    () => document.querySelector("#stats strong")?.textContent === "32",
  );
  assert.equal(await page.locator("#page-label").innerText(), "1 / 2");

  // An unapplied form edit must not silently change the export scope.
  await page.locator("#route").selectOption("M");
  const downloadEvent = page.waitForEvent("download");
  await page.locator("#export-json").click();
  const download = await downloadEvent;
  assert.equal(
    JSON.parse(await readFile(await download.path(), "utf8")).records.length,
    32,
  );
  await page.locator("#filters button[type=submit]").click();
  await page.waitForFunction(
    () => document.querySelector("#stats strong")?.textContent === "4",
  );
  assert.equal(await page.locator("#records tr").count(), 4);
  await page.locator("#reset").click();
  await page.waitForFunction(
    () => document.querySelector("#stats strong")?.textContent === "31",
  );

  await page.locator("#tab-analysis").click();
  await page.locator("#question-select").selectOption("R03");
  await page.waitForFunction(
    () => document.querySelector("#variant-select").options.length === 3,
  );
  assert.equal(await page.locator("#group-select").isDisabled(), true);
  for (const variant of ["R03:female", "R03:male", "R03:neutral"]) {
    await page.locator("#variant-select").selectOption(variant);
    assert.match(
      await page.locator("#question-chart .chart-subtitle").innerText(),
      /彩礼/,
    );
    assert.ok(
      !(await page.locator("#question-chart").innerText()).includes("NaN"),
    );
  }
  await page.locator("#question-select").selectOption("U01");
  await page.locator("#group-select").selectOption("gender");
  await page.waitForFunction(
    () => document.querySelectorAll("#comparison-table tbody tr").length === 4,
  );
  assert.match(await page.locator("#comparison-table").innerText(), /n =/);
  await page.screenshot({
    path: join(output, "analysis-desktop.png"),
    fullPage: true,
  });

  // Date filters that match no submissions produce an honest empty state.
  await page.locator("#more-filters").evaluate((element) => {
    element.open = true;
  });
  await page.locator("#start").fill("2025-01-01");
  await page.locator("#end").fill("2025-01-01");
  await page.locator("#filters button[type=submit]").click();
  await page.waitForFunction(
    () => document.querySelector("#stats strong")?.textContent === "0",
  );
  assert.match(
    await page.locator("#question-chart").innerText(),
    /暂无有效选择/,
  );
  assert.ok(
    !(await page.locator("#question-chart").innerText()).includes("NaN"),
  );
  await page.locator("#tab-overview").click();
  assert.equal(await page.locator("#empty-overview").isVisible(), true);
  await page.screenshot({ path: join(output, "empty-desktop.png") });
  await page.locator("#reset").click();
  await page.waitForFunction(
    () => document.querySelector("#stats strong")?.textContent === "31",
  );

  // A read failure preserves the last successful scope and reports that explicitly.
  await page.route("**/api/admin/summary?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"service_unavailable"}',
    }),
  );
  await page.locator("#refresh").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#dashboard-error")
      .textContent.includes("上次成功读取"),
  );
  assert.equal(await page.locator("#stats strong").first().innerText(), "31");
  await page.unroute("**/api/admin/summary?**");
  await page.locator("#refresh").click();
  await page.waitForFunction(
    () => !document.querySelector("#refresh").disabled,
  );

  // Open-text content remains plain text in the private record dialog.
  await page.locator("#eligibility").selectOption("");
  await page.locator("#filters button[type=submit]").click();
  await page.waitForFunction(
    () => document.querySelector("#stats strong")?.textContent === "32",
  );
  const listing = await (
    await context.request.get(origin + "/api/admin/responses")
  ).json();
  const receipt = rows.find((row) =>
    row.responses.some((r) => r.text?.includes("window.__xss")),
  ).receipt;
  const index = listing.items.findIndex((record) => record.receipt === receipt);
  assert.ok(index >= 0);
  await page.locator("#tab-records").click();
  const trigger = page.locator("#records tr").nth(index).getByRole("button");
  await trigger.click();
  await page.locator("#detail").waitFor({ state: "visible" });
  await page
    .locator("#detail .detail-section")
    .last()
    .evaluate((element) => {
      element.open = true;
    });
  assert.match(
    await page.locator("#detail-body").innerText(),
    /<img src=x onerror=/,
  );
  assert.equal(await page.locator("#detail-body img").count(), 0);
  assert.equal(await page.evaluate(() => window.__xss), undefined);
  await page.screenshot({ path: join(output, "record-desktop.png") });
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#detail").isVisible(), false);
  assert.equal(
    await trigger.evaluate((element) => element === document.activeElement),
    true,
  );

  const widths = [320, 390, 768, 1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const tab of ["overview", "analysis", "records"]) {
      await page.locator("#tab-" + tab).click();
      const layout = await page.evaluate(() => ({
        viewport: innerWidth,
        page: document.documentElement.scrollWidth,
      }));
      assert.ok(
        layout.page <= layout.viewport + 1,
        `${tab} overflows at ${width}: ${JSON.stringify(layout)}`,
      );
    }
    if (width === 390) {
      await page.locator("#tab-overview").click();
      await page.screenshot({
        path: join(output, "overview-mobile.png"),
        fullPage: true,
      });
      await page.locator("#tab-analysis").click();
      await page.screenshot({
        path: join(output, "analysis-mobile.png"),
        fullPage: true,
      });
    }
  }
  await page.locator("#tab-overview").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page.locator("#tab-analysis").getAttribute("aria-selected"),
    "true",
  );
  await page.locator("#logout").click();
  await page.locator("#auth").waitFor({ state: "visible" });
  assert.equal(await page.locator("#records tr").count(), 0);
  assert.equal(await page.locator("#stats").innerText(), "");
  assert.equal(
    (await context.request.get(origin + "/api/admin/summary")).status(),
    401,
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      fixtureRows: rows.length,
      defaultEnrolled: 31,
      questionCount: 41,
      viewports: widths,
      screenshots: output,
    }),
  );
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await rm(dataDir, { recursive: true, force: true });
}
