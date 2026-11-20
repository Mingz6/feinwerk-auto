import { expect, test } from "@playwright/test";

const BASE = "/feinwerk-auto/";
const path = (url: string) => new URL(url).pathname;

test.describe("first visit picks the language from the browser", () => {
  for (const [locale, expected] of [
    ["en-CA", BASE],
    ["fr-CA", `${BASE}fr/`],
    ["zh-CN", `${BASE}zh-hans/`],
    ["zh-TW", `${BASE}zh-hk/`],
    ["de-DE", BASE],
  ] as const) {
    test.describe(locale, () => {
      test.use({ locale });
      test(`${locale} -> ${expected}`, async ({ page }) => {
        await page.goto("./");
        await expect(page).toHaveURL((u) => u.pathname === expected);
      });
    });
  }

  test.describe("deep links keep their page", () => {
    test.use({ locale: "fr-CA" });
    test("/book/ -> /fr/book/", async ({ page }) => {
      await page.goto("book/");
      await expect(page).toHaveURL((u) => u.pathname === `${BASE}fr/book/`);
      await expect(page.locator("html")).toHaveAttribute("lang", "fr-CA");
    });
  });
});

test.describe("a manual choice persists and beats the browser", () => {
  test.use({ locale: "fr-CA" });

  test("choosing English on a French browser sticks", async ({ page }) => {
    await page.goto("./");
    await expect(page).toHaveURL((u) => u.pathname === `${BASE}fr/`);
    await page.locator("[data-lang-menu] summary").click();
    await page.locator('[data-set-lang="en"]').click();
    await expect(page).toHaveURL((u) => u.pathname === BASE);
    expect(await page.evaluate(() => localStorage.getItem("feinwerk-lang"))).toBe("en");

    await page.reload();
    expect(path(page.url())).toBe(BASE);
    await page.goto("book/");
    expect(path(page.url())).toBe(`${BASE}book/`);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-CA");
  });

  test("choosing 廣東話 on a French browser sends English pages to /zh-hk/", async ({ page }) => {
    await page.goto("fr/");
    await page.locator("[data-lang-menu] summary").click();
    await page.locator('[data-set-lang="zh-hk"]').click();
    await expect(page).toHaveURL((u) => u.pathname === `${BASE}zh-hk/`);
    await page.goto("book/");
    await expect(page).toHaveURL((u) => u.pathname === `${BASE}zh-hk/book/`);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-HK");
  });
});

test.describe("explicit language URLs never redirect", () => {
  for (const locale of ["en-CA", "fr-CA", "zh-CN", "zh-HK"]) {
    test.describe(locale, () => {
      test.use({ locale });
      for (const stored of [null, "en", "fr", "zh-hans", "zh-hk"]) {
        test(`browser ${locale}, stored ${stored}`, async ({ page }) => {
          if (stored) await page.addInitScript((v) => localStorage.setItem("feinwerk-lang", v), stored);
          for (const p of ["fr/", "zh-hans/", "zh-hk/", "fr/book/", "zh-hans/book/", "zh-hk/book/"]) {
            const res = await page.goto(p);
            expect(res?.status(), p).toBe(200);
            await page.waitForLoadState("load");
            expect(path(page.url()), p).toBe(BASE + p);
          }
        });
      }
    });
  }
});

test.describe("without JavaScript the English page stays", () => {
  test.use({ locale: "fr-CA", javaScriptEnabled: false });
  test("/ stays English", async ({ page }) => {
    await page.goto("./");
    expect(path(page.url())).toBe(BASE);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-CA");
    await expect(page.locator("[data-theme-toggle]")).toBeHidden();
  });
});
