import { expect, test } from "@playwright/test";

const PHONE = { width: 390, height: 844 };

test.use({ locale: "en-CA" });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("feinwerk-lang", "en"));
});

test("home has PLAN.md's 8 sections in order and is about 6 phone screens", async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto("./");
  const sections = await page.locator("main [data-section]").evaluateAll((els) => els.map((e) => e.getAttribute("data-section")));
  expect(sections).toEqual(["hero", "makes", "how", "proof", "compare", "blog", "visit"]);
  await expect(page.locator("footer [data-disclaimer]")).toBeVisible();
  const screens = await page.evaluate((h) => document.documentElement.scrollHeight / h, PHONE.height);
  console.log(`home at 390x844: ${screens.toFixed(2)} phone screens`);
  expect(screens).toBeGreaterThan(4.5);
  expect(screens).toBeLessThan(7.5);
});

test("bottom bar shows on phones and hides on desktop", async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto("./");
  const bar = page.locator(".bottom-bar");
  await expect(bar).toBeVisible();
  await expect(bar.locator("a")).toHaveText(["Call", "Text", "Book"]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(bar).toBeHidden();
});

test("phone menu opens, Escape closes it, and it links to every top-level page", async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto("./");
  const menu = page.locator(".nav-menu");
  await menu.locator("summary").click();
  await expect(menu.locator("nav")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu.locator("nav")).toBeHidden();
  await menu.locator("summary").click();
  for (const name of ["Blog", "About", "Reviews", "Book"]) await expect(menu.getByRole("link", { name, exact: true })).toBeVisible();
  await menu.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
});

test.describe("open/closed chip on the Vancouver clock", () => {
  // The visitor is in Tokyo, where it is already Friday: the chip must still use Vancouver's Thursday.
  test.use({ timezoneId: "Asia/Tokyo" });

  test("Sat 14:59 PDT (Sunday morning in Tokyo): open, closes 3:00 p.m., Saturday highlighted", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-10-31T21:59:00Z") });
    await page.goto("./");
    await expect(page.locator("[data-status]")).toHaveText(/^Open\s?· closes 3:00\sp\.m\.$/);
    await expect(page.locator("[data-status]")).toHaveAttribute("data-state", "open");
    await expect(page.locator('tr[data-weekday="6"]')).toHaveAttribute("aria-current", "date");
    await expect(page.locator('tr[aria-current="date"]')).toHaveCount(1);
  });

  test("first Monday after daylight saving ends (3 Nov 2025), 07:59 PST: closed, opens 8:00 a.m.", async ({ page }) => {
    await page.clock.install({ time: new Date("2025-11-03T15:59:00Z") });
    await page.goto("./");
    await expect(page.locator("[data-status]")).toHaveText(/^Closed\s?· opens 8:00\sa\.m\.$/);
    await expect(page.locator('tr[data-weekday="1"]')).toHaveAttribute("aria-current", "date");
  });
});
