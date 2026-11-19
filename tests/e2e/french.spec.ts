import { test, expect } from "@playwright/test";
import { fr } from "../../src/i18n/fr.ts";
import { VIEWPORTS, layoutFaults } from "./layout.ts";

// Phase 3a: French runs 20-30% longer than English (PLAN.md, Languages), so every French page is
// checked for sideways scroll, clipped buttons and chips, and phone numbers that wrap.
const FR_PAGES = [
  "fr/", "fr/book/", "fr/bmw-mini/", "fr/mercedes-amg/", "fr/vw-audi-porsche/", "fr/tires/", "fr/fleet/", "fr/carplay-retrofit/",
  "fr/pre-purchase-inspection/", "fr/contact/", "fr/about/", "fr/reviews/", "fr/warranty/", "fr/privacy/", "fr/blog/",
  "fr/blog/misfire-vacuum-leak/", "fr/blog/mercedes-service-a-b/", "fr/blog/bc-winter-tires/", "fr/nope/",
];
for (const scheme of ["light", "dark"] as const) {
  for (const vp of VIEWPORTS) {
    test(`French pages at ${vp.width}x${vp.height}, ${scheme}: no sideways scroll, clipped button or wrapped phone`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize(vp);
      const faults: string[] = [];
      for (const path of FR_PAGES) {
        await page.goto(path);
        for (const f of await layoutFaults(page)) faults.push(`${path} ${f}`);
      }
      expect(faults).toEqual([]);
    });
  }
}

test("the French booking sheet: each step fits at 390 px, times read like 8 h 30", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("fr/");
  await page.locator(".bottom-bar a.is-primary").click();
  const sheet = page.locator("dialog[data-book-sheet]");
  await expect(sheet.locator("[data-book-progress]")).toHaveText(fr["book.step"].replace("{n}", "1").replace("{total}", "4"));
  expect(await layoutFaults(page)).toEqual([]);
  await sheet.getByLabel(fr["make.mercedes"], { exact: true }).check();
  await sheet.locator("[data-step='0'] [data-next]").click();
  expect(await layoutFaults(page)).toEqual([]);
  await sheet.getByLabel(fr["book.svc.inspection"], { exact: true }).check();
  await sheet.locator("[data-step='1'] [data-next]").click();
  expect(await layoutFaults(page)).toEqual([]);
  await sheet.locator("[data-days] input").nth(1).check();
  const times = sheet.locator("[data-times] .choice");
  await expect(times.first()).toBeVisible();
  const labels = (await times.allTextContents()).map((s) => s.trim());
  for (const label of labels) expect(label).toMatch(/^\d{1,2}\u00a0h(\u00a0\d{2})?$/);
  expect(labels.some((s) => /\u00a0h\u00a030$/.test(s))).toBe(true);
  await sheet.locator("[data-times] input").first().check();
  await sheet.locator("[data-step='2'] [data-next]").click();
  expect(await layoutFaults(page)).toEqual([]);
});

test("books end to end on /fr/book/ in French, with no request", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("fr/book/?make=bmw-mini&service=diagnosis");
  const requests: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("data:") && !/\.(js|css|woff2|svg|png|webp|avif)(\?|$)/.test(r.url())) requests.push(r.url());
  });
  await expect(page.locator("html")).toHaveAttribute("lang", "fr-CA");
  await expect(page.locator("[data-book-progress]")).toHaveText(fr["book.step"].replace("{n}", "3").replace("{total}", "4"));
  await page.locator("[data-days] input").first().check();
  await page.locator("[data-times] input").last().check();
  await page.locator("[data-step='2'] [data-next]").click();
  await page.getByLabel(fr["book.name"], { exact: true }).fill("Camille Tremblay");
  await page.getByLabel(fr["book.phone"], { exact: true }).fill("604-555-0199");
  await page.getByLabel(fr["book.email"], { exact: true }).fill("camille@example.com");
  await expect(page.locator("[data-reminders]")).not.toBeChecked();
  await page.getByRole("button", { name: fr["book.submit"] }).click();
  await expect(page.locator("[data-book-sent]")).toHaveText(fr["book.sent"]);
  await expect(page.locator("[data-out=car]")).toContainText("BMW");
  await expect(page.locator("[data-out=service]")).toHaveText(fr["book.svc.diagnosis"]);
  // "lundi 23 novembre · 15 h 30": a French day and the 24-hour clock with "h".
  await expect(page.locator("[data-out=when]")).toHaveText(/^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) \d{1,2}\s\p{L}+\s·\s\d{1,2}\sh(\s\d{2})?$/u);
  await expect(page.locator("[data-ics]")).toHaveText(fr["book.ics"]);
  expect(await layoutFaults(page)).toEqual([]);
  expect(requests).toEqual([]);
});

test("no home page scrolls sideways at 390 px (the review row once leaked its hidden rating text)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["./", "zh-hans/", "zh-hk/"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(390);
  }
});
