import { expect, test } from "@playwright/test";
import { en } from "../../src/i18n/en.ts";

// PLAN.md: print always uses light, and keeps the hours, the address and the booking summary.
const WHITE = "rgb(255, 255, 255)";
const BLACK = "rgb(0, 0, 0)";

test("home prints light with the hours and address, without the screen-only bars", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("feinwerk-lang", "en");
    localStorage.setItem("feinwerk-theme", "dark");
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("./");
  await page.emulateMedia({ media: "print", colorScheme: "dark" });
  const body = await page.evaluate(() => {
    const s = getComputedStyle(document.body);
    return [s.backgroundColor, s.color];
  });
  expect(body).toEqual([WHITE, BLACK]);
  for (const hidden of [".skip", ".header-tools", ".header-nav", ".bottom-bar"]) await expect(page.locator(hidden).first()).toBeHidden();
  const visit = page.locator("#visit");
  await expect(visit).toBeVisible();
  await expect(visit.locator("tr[data-weekday]")).toHaveCount(7);
  await expect(visit).toContainText("88 Sample Way");
  await expect(page.locator("footer")).toBeVisible();
  // Phone numbers use non-breaking hyphens so they never wrap.
  await expect(page.locator("footer")).toContainText(/604.555.0148/);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the booking summary prints, without the form or the step buttons", async ({ page }) => {
    await page.goto("book/?make=bmw-mini&service=repair");
    await page.getByLabel("BMW · MINI", { exact: true }).check();
    await page.getByLabel("Repair", { exact: true }).check();
    await page.locator("input[name=date]").fill("2026-11-23");
    await page.locator("select[name=time]").selectOption("09:00");
    await page.getByLabel("Name", { exact: true }).fill("Alex Doe");
    await page.getByLabel("Phone", { exact: true }).fill("604-555-0199");
    await page.getByLabel("Email", { exact: true }).fill("alex@example.com");
    await page.getByRole("button", { name: en["book.submit"] }).click();
    await page.emulateMedia({ media: "print" });
    const done = page.locator("[data-book-done]");
    await expect(done).toBeVisible();
    await expect(done).toContainText("This is a demo. Nothing was sent.");
    await expect(page.locator("[data-book-form]")).toBeHidden();
    await expect(page.locator(".bottom-bar")).toBeHidden();
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(WHITE);
  });
});
