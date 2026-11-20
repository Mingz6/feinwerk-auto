// The README's screenshots: one per language, both themes, phone and desktop, on the fixed Wednesday 10:00
// Vancouver clock the baselines use. Usage: start `npx astro preview --port N`, then
// node scripts/readme-shots.mjs http://localhost:N/feinwerk-auto/ [outDir]. Defaults to the live site.
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "https://mingz6.github.io/feinwerk-auto/";
const OUT = process.argv[3] ?? "docs/screenshots";
const FIXED_NOW = new Date("2026-11-18T18:00:00Z");
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };

const SHOTS = [
  { file: "home-desktop-dark-en.jpg", path: "", theme: "dark", device: desktop },
  { file: "home-phone-light-zh-hans.jpg", path: "zh-hans/", theme: "light", device: phone },
  { file: "home-phone-dark-zh-hk.jpg", path: "zh-hk/", theme: "dark", device: phone },
  // A make page's engine block opens the booking sheet at step 3, day and time; Thursday is picked.
  { file: "booking-phone-light-fr.jpg", path: "fr/bmw-mini/", theme: "light", device: phone, book: true },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const s of SHOTS) {
  const context = await browser.newContext({ ...s.device, timezoneId: "America/Vancouver", colorScheme: s.theme, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.clock.setFixedTime(FIXED_NOW);
  await page.addInitScript(() => localStorage.setItem("feinwerk-lang", "en"));
  await page.goto(new URL(s.path, BASE).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (s.book) {
    await page.locator("main [data-book-service]").first().click();
    await page.locator("dialog[open]").waitFor();
    // Pick Thursday so the time chips show, as a visitor would.
    await page.locator("dialog[open] [data-days] label").nth(1).click();
    await page.locator("dialog[open] [data-times] label").first().waitFor();
  }
  await page.screenshot({ path: `${OUT}/${s.file}`, type: "jpeg", quality: 80 });
  console.log(`${OUT}/${s.file}`);
  await context.close();
}
await browser.close();
