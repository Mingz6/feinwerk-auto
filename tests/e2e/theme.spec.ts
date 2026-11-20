import { expect, test, type Page } from "@playwright/test";

// Computed --bg from src/styles/tokens.css (#F9FAFC / #0C1015).
const BG = { light: "oklch(0.985 0.003 260)", dark: "oklch(0.17 0.012 260)" };
const bg = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const theme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme ?? "auto");
const stored = (page: Page) => page.evaluate(() => localStorage.getItem("feinwerk-theme"));
// Records data-theme at the moment <body> is created: set by then means set before first paint.
const watchFirstPaint = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __themeAtBody?: string };
    new MutationObserver((_, obs) => {
      if (document.body) {
        w.__themeAtBody = document.documentElement.dataset.theme ?? "auto";
        obs.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });
const themeAtBody = (page: Page) => page.evaluate(() => (window as unknown as { __themeAtBody?: string }).__themeAtBody);

test.use({ locale: "en-CA" });

test("the button cycles Auto, Light, Dark and back to Auto", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("./");
  const btn = page.locator("[data-theme-toggle]");
  await expect(btn).toHaveAttribute("aria-label", "Theme: Auto");
  expect(await theme(page)).toBe("auto");

  await btn.click();
  await expect(btn).toHaveAttribute("aria-label", "Theme: Light");
  expect([await theme(page), await stored(page), await bg(page)]).toEqual(["light", "light", BG.light]);

  await btn.click();
  await expect(btn).toHaveAttribute("aria-label", "Theme: Dark");
  expect([await theme(page), await stored(page), await bg(page)]).toEqual(["dark", "dark", BG.dark]);
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", "#0C1015");

  await btn.click();
  await expect(btn).toHaveAttribute("aria-label", "Theme: Auto");
  expect([await theme(page), await stored(page)]).toEqual(["auto", null]);
});

test("Auto follows the system setting", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("./");
  expect(await bg(page)).toBe(BG.dark);
  await page.emulateMedia({ colorScheme: "light" });
  expect(await bg(page)).toBe(BG.light);
});

for (const mode of ["dark", "light"] as const) {
  test(`a ${mode} choice persists across reloads and pages with no flash`, async ({ page }) => {
    // The system asks for the opposite, so a late script would show the wrong theme first.
    await page.emulateMedia({ colorScheme: mode === "dark" ? "light" : "dark" });
    await watchFirstPaint(page);
    await page.goto("./");
    const btn = page.locator("[data-theme-toggle]");
    await btn.click();
    if (mode === "dark") await btn.click();
    expect(await theme(page)).toBe(mode);

    for (const path of ["./", "book/", "fr/", "zh-hk/book/"]) {
      await page.goto(path);
      expect(await themeAtBody(page), `${path} before first paint`).toBe(mode);
      expect(await bg(page), path).toBe(BG[mode]);
    }
    await page.goto("./");
    await page.reload();
    expect(await themeAtBody(page)).toBe(mode);
    await expect(btn).toHaveAttribute("aria-label", `Theme: ${mode === "dark" ? "Dark" : "Light"}`);
  });
}
