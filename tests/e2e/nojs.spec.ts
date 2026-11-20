import { expect, test } from "@playwright/test";
import { LANGS } from "./matrix";

// PLAN.md: without JavaScript every page reads and navigates, and booking falls back from the sheet to /book/.
test.use({ javaScriptEnabled: false });

for (const [lang, prefix] of Object.entries(LANGS)) {
  test(`no JavaScript, ${lang}: home reads, the menu opens, a make tile and Book lead to real pages`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(prefix || "./");
    await expect(page).toHaveURL(new RegExp(`/feinwerk-auto/${prefix}$`));
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("#visit tr[data-weekday]")).toHaveCount(7);

    await page.locator(".nav-menu > summary").click();
    await expect(page.locator(".nav-menu .menu-panel")).toBeVisible();
    await page.keyboard.press("Escape");

    const book = page.locator(".bottom-bar a.is-primary");
    await expect(book).toHaveAttribute("href", `/feinwerk-auto/${prefix}book/`);
    await page.locator("#makes .tile-make a").first().click();
    await expect(page).toHaveURL(new RegExp(`/${prefix}bmw-mini/$`));
    await expect(page.locator("main h1")).toBeVisible();

    await page.locator(".bottom-bar a.is-primary").click();
    await expect(page).toHaveURL(new RegExp(`/${prefix}book/$`));
    for (const n of [0, 1, 2, 3]) await expect(page.locator(`[data-step='${n}']`)).toBeVisible();
  });
}
