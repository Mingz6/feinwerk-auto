import { test, expect } from "@playwright/test";
import { zhHans } from "../../src/i18n/zh-hans.ts";
import { zhHk } from "../../src/i18n/zh-hk.ts";
import { VIEWPORTS, layoutFaults } from "./layout.ts";

// Phases 3b and 3c: Chinese is shorter than English but wider per character, and it can't break at spaces,
// so every page is checked the same way as French, plus the system font stack per :lang().
const ROUTES = [
  "", "book/", "bmw-mini/", "mercedes-amg/", "vw-audi-porsche/", "tires/", "fleet/", "carplay-retrofit/",
  "pre-purchase-inspection/", "contact/", "about/", "reviews/", "warranty/", "privacy/", "blog/",
  "blog/misfire-vacuum-leak/", "blog/mercedes-service-a-b/", "blog/bc-winter-tires/", "nope/",
];

const CHINESE = [
  {
    prefix: "zh-hans/", name: "简体中文", dict: zhHans, lang: "zh-Hans", font: "PingFang SC", notFont: "PingFang HK",
    person: { name: "王小明", email: "xiaoming@example.com" },
    // "11月23日星期一 · 15:30": a Chinese date and the 24-hour clock, as in mainland usage.
    time: /^\d{1,2}:\d{2}$/,
    when: /^\d{1,2}月\d{1,2}日星期[一二三四五六日]\s·\s\d{1,2}:\d{2}$/u,
  },
  {
    prefix: "zh-hk/", name: "廣東話", dict: zhHk, lang: "zh-HK", font: "PingFang HK", notFont: "PingFang SC",
    person: { name: "陳大文", email: "taiman@example.com" },
    // "11月23日星期一 · 下午3:30": Hong Kong's own Intl format, 上午/下午 on a 12-hour clock.
    time: /^[上下]午\d{1,2}:\d{2}$/u,
    when: /^\d{1,2}月\d{1,2}日星期[一二三四五六日]\s·\s[上下]午\d{1,2}:\d{2}$/u,
  },
] as const;

for (const zh of CHINESE) {
  const step = (n: number) => zh.dict["book.step"].replace("{n}", String(n)).replace("{total}", "4");

  for (const scheme of ["light", "dark"] as const) {
    for (const vp of VIEWPORTS) {
      test(`${zh.name} pages at ${vp.width}x${vp.height}, ${scheme}: no sideways scroll, clipped button or link, or wrapped phone`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize(vp);
        const faults: string[] = [];
        for (const route of ROUTES) {
          await page.goto(zh.prefix + route);
          for (const f of await layoutFaults(page)) faults.push(`${zh.prefix}${route} ${f}`);
        }
        expect(faults).toEqual([]);
      });
    }
  }

  test(`${zh.name} text uses ${zh.font} after the Latin font, in body, headings, mono labels and post text`, async ({ page }) => {
    await page.goto(`${zh.prefix}blog/bc-winter-tires/`);
    await expect(page.locator("html")).toHaveAttribute("lang", zh.lang);
    const families = await page.evaluate(() =>
      ["body", "h1", ".eyebrow", ".post-meta", ".footer-title", ".post-body p"].map((sel) => {
        const el = document.querySelector(sel);
        return [sel, el ? getComputedStyle(el).fontFamily : "missing"];
      }),
    );
    for (const [sel, family] of families) {
      expect(family, sel).toContain(zh.font);
      expect(family.indexOf(zh.font), sel).toBeGreaterThan(0);
      expect(family, sel).not.toContain(zh.notFont);
    }
  });

  test(`the ${zh.name} booking sheet: each step fits at 390 px, times in the local clock`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(zh.prefix);
    await page.locator(".bottom-bar a.is-primary").click();
    const sheet = page.locator("dialog[data-book-sheet]");
    await expect(sheet.locator("[data-book-progress]")).toHaveText(step(1));
    expect(await layoutFaults(page)).toEqual([]);
    await sheet.getByLabel(zh.dict["make.vag"], { exact: true }).check();
    await sheet.locator("[data-step='0'] [data-next]").click();
    expect(await layoutFaults(page)).toEqual([]);
    await sheet.getByLabel(zh.dict["book.svc.maintenance"], { exact: true }).check();
    await sheet.locator("[data-step='1'] [data-next]").click();
    expect(await layoutFaults(page)).toEqual([]);
    await sheet.locator("[data-days] input").nth(1).check();
    const times = sheet.locator("[data-times] .choice");
    await expect(times.first()).toBeVisible();
    for (const label of await times.allTextContents()) expect(label.trim().replace(/\s/g, "")).toMatch(zh.time);
    expect(await layoutFaults(page)).toEqual([]);
    await sheet.locator("[data-times] input").first().check();
    await sheet.locator("[data-step='2'] [data-next]").click();
    await expect(sheet.locator("[data-book-progress]")).toHaveText(step(4));
    expect(await layoutFaults(page)).toEqual([]);
  });

  test(`books end to end on /${zh.prefix}book/ in ${zh.name}, with no request`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${zh.prefix}book/?make=mercedes-amg&service=maintenance`);
    const requests: string[] = [];
    page.on("request", (r) => {
      if (!r.url().startsWith("data:") && !/\.(js|css|woff2|svg|png|webp|avif)(\?|$)/.test(r.url())) requests.push(r.url());
    });
    await expect(page.locator("html")).toHaveAttribute("lang", zh.lang);
    await expect(page.locator("[data-book-progress]")).toHaveText(step(3));
    await page.locator("[data-days] input").first().check();
    await page.locator("[data-times] input").last().check();
    await page.locator("[data-step='2'] [data-next]").click();
    await page.getByLabel(zh.dict["book.name"], { exact: true }).fill(zh.person.name);
    await page.getByLabel(zh.dict["book.phone"], { exact: true }).fill("604-555-0199");
    await page.getByLabel(zh.dict["book.email"], { exact: true }).fill(zh.person.email);
    await expect(page.locator("[data-reminders]")).not.toBeChecked();
    await page.getByRole("button", { name: zh.dict["book.submit"] }).click();
    await expect(page.locator("[data-book-sent]")).toHaveText(zh.dict["book.sent"]);
    await expect(page.locator("[data-out=car]")).toContainText("Mercedes-Benz");
    await expect(page.locator("[data-out=service]")).toHaveText(zh.dict["book.svc.maintenance"]);
    expect((await page.locator("[data-out=when]").textContent())!.replace(/ /g, "")).toMatch(zh.when);
    await expect(page.locator("[data-ics]")).toHaveText(zh.dict["book.ics"]);
    expect(await layoutFaults(page)).toEqual([]);
    expect(requests).toEqual([]);
  });
}

test("the language menu names 简体中文 in the Simplified stack and 廣東話 in the Hong Kong one", async ({ page }) => {
  await page.goto("./");
  const menu = await page.evaluate(() =>
    [...document.querySelectorAll("[lang='zh-Hans'], [lang='zh-HK']")].filter((el) => el !== document.documentElement).map((el) => [el.getAttribute("lang"), getComputedStyle(el).fontFamily]),
  );
  expect(menu.map(([lang]) => lang)).toEqual(expect.arrayContaining(["zh-Hans", "zh-HK"]));
  for (const [lang, family] of menu) expect(family).toContain(lang === "zh-HK" ? "PingFang HK" : "PingFang SC");
});

test("the layout check catches an inline link that runs off a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent(`<p style="margin:0;width:600px"><a href="#">${"長".repeat(5)}https://example.com/${"x".repeat(80)}</a></p>`);
  expect((await layoutFaults(page)).join("\n")).toMatch(/link cut off/);
});
