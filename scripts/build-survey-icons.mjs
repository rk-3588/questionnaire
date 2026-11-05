// Reproduce the survey's code-native document mark at home-screen sizes.
import { chromium } from "playwright-core";
import { readFile, mkdir } from "node:fs/promises";
const svg = await readFile("public/survey-mark.svg", "utf8");
await mkdir("public/icons/survey", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {}),
});
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [name, size] of [
    ["apple-touch-icon", 180],
    ["icon-192", 192],
    ["icon-512", 512],
    ["icon-maskable-512", 512],
  ]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body{margin:0;background:#243b4b}svg{display:block;width:100vw;height:100vh}</style>${svg}`,
    );
    await page.screenshot({ path: `public/icons/survey/${name}.png` });
  }
} finally {
  await browser.close();
}
console.log("Survey mark exported to four home-screen icons.");
