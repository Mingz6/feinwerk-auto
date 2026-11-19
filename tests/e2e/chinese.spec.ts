import { test, expect } from "@playwright/test";
import { zhHans } from "../../src/i18n/zh-hans.ts";
import { VIEWPORTS, layoutFaults } from "./layout.ts";

// Phase 3b: 简体中文 is shorter than English but wider per character, and it can't break at spaces,
// so every page is checked the same way as French, plus the system font stack per :lang().
const ZH_PAGES = [
  "zh-hans/", "zh-hans/book/", "zh-hans/bmw-mini/", "zh-hans/mercedes-amg/", "zh-hans/vw-audi-porsche/", "zh-hans/tires/",
  "zh-hans/fleet/", "zh-hans/carplay-retrofit/", "zh-hans/pre-purchase-inspection/", "zh-hans/contact/", "zh-hans/about/",
  "zh-hans/reviews/", "zh-hans/warranty/", "zh-hans/privacy/", "zh-hans/blog/", "zh-hans/blog/misfire-vacuum-leak/",
  "zh-hans/blog/mercedes-service-a-b/", "zh-hans/blog/bc-winter-tires/", "zh-hans/nope/",
];
const step = (n: number) => zhHans["book.step"].replace("{n}", String(n)).replace("{total}", "4");

for (const scheme of ["light", "dark"] as const) {
  for (const vp of VIEWPORTS) {
    test(`简体中文 pages at ${vp.width}x${vp.height}, ${scheme}: no sideways scroll, clipped button or wrapped phone`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize(vp);
      const faults: string[] = [];
      for (const path of ZH_PAGES) {
        await page.goto(path);
        for (const f of await layoutFaults(page)) faults.push(`${path} ${f}`);
      }
      expect(faults).toEqual([]);
    });
  }
}

test("Chinese text uses the system Chinese stack after the Latin font, in body, headings, mono labels and the language menu", async ({ page }) => {
  await page.goto("zh-hans/blog/bc-winter-tires/");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hans");
  const families = await page.evaluate(() =>
    ["body", "h1", ".eyebrow", ".post-meta", ".footer-title", ".post-body p"].map((sel) => {
      const el = document.querySelector(sel);
      return [sel, el ? getComputedStyle(el).fontFamily : "missing"];
    }),
  );
  for (const [sel, family] of families) {
    expect(family, sel).toContain("PingFang SC");
    expect(family.indexOf("PingFang SC"), sel).toBeGreaterThan(0);
    expect(family, sel).not.toContain("PingFang HK");
  }
  // The language menu on an English page names 简体中文 in its own stack, and 廣東話 in the Hong Kong one.
  await page.goto("./");
  const menu = await page.evaluate(() =>
    [...document.querySelectorAll("[lang='zh-Hans'], [lang='zh-HK']")].filter((el) => el !== document.documentElement).map((el) => [el.getAttribute("lang"), getComputedStyle(el).fontFamily]),
  );
  expect(menu.length).toBeGreaterThan(0);
  for (const [lang, family] of menu) expect(family).toContain(lang === "zh-HK" ? "PingFang HK" : "PingFang SC");
});

test("the 简体中文 booking sheet: each step fits at 390 px, times on the 24-hour clock", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("zh-hans/");
  await page.locator(".bottom-bar a.is-primary").click();
  const sheet = page.locator("dialog[data-book-sheet]");
  await expect(sheet.locator("[data-book-progress]")).toHaveText(step(1));
  expect(await layoutFaults(page)).toEqual([]);
  await sheet.getByLabel(zhHans["make.vag"], { exact: true }).check();
  await sheet.locator("[data-step='0'] [data-next]").click();
  expect(await layoutFaults(page)).toEqual([]);
  await sheet.getByLabel(zhHans["book.svc.maintenance"], { exact: true }).check();
  await sheet.locator("[data-step='1'] [data-next]").click();
  expect(await layoutFaults(page)).toEqual([]);
  await sheet.locator("[data-days] input").nth(1).check();
  const times = sheet.locator("[data-times] .choice");
  await expect(times.first()).toBeVisible();
  const labels = (await times.allTextContents()).map((s) => s.trim());
  for (const label of labels) expect(label).toMatch(/^\d{1,2}:\d{2}$/);
  await sheet.locator("[data-times] input").first().check();
  await sheet.locator("[data-step='2'] [data-next]").click();
  await expect(sheet.locator("[data-book-progress]")).toHaveText(step(4));
  expect(await layoutFaults(page)).toEqual([]);
});

test("books end to end on /zh-hans/book/ in 简体中文, with no request", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("zh-hans/book/?make=mercedes-amg&service=maintenance");
  const requests: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("data:") && !/\.(js|css|woff2|svg|png|webp|avif)(\?|$)/.test(r.url())) requests.push(r.url());
  });
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hans");
  await expect(page.locator("[data-book-progress]")).toHaveText(step(3));
  await page.locator("[data-days] input").first().check();
  await page.locator("[data-times] input").last().check();
  await page.locator("[data-step='2'] [data-next]").click();
  await page.getByLabel(zhHans["book.name"], { exact: true }).fill("王小明");
  await page.getByLabel(zhHans["book.phone"], { exact: true }).fill("604-555-0199");
  await page.getByLabel(zhHans["book.email"], { exact: true }).fill("xiaoming@example.com");
  await expect(page.locator("[data-reminders]")).not.toBeChecked();
  await page.getByRole("button", { name: zhHans["book.submit"] }).click();
  await expect(page.locator("[data-book-sent]")).toHaveText(zhHans["book.sent"]);
  await expect(page.locator("[data-out=car]")).toContainText("Mercedes-Benz");
  await expect(page.locator("[data-out=service]")).toHaveText(zhHans["book.svc.maintenance"]);
  // "11月23日星期一 · 15:30": a Chinese date and the 24-hour clock.
  await expect(page.locator("[data-out=when]")).toHaveText(/^\d{1,2}月\d{1,2}日星期[一二三四五六日]\s·\s\d{1,2}:\d{2}$/u);
  await expect(page.locator("[data-ics]")).toHaveText(zhHans["book.ics"]);
  expect(await layoutFaults(page)).toEqual([]);
  expect(requests).toEqual([]);
});
