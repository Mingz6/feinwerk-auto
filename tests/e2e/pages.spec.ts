import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("feinwerk-lang", "en"));
});

test("the quote form validates, then shows the demo line and sends nothing", async ({ page }) => {
  const requests: string[] = [];
  await page.goto("contact/");
  page.on("request", (r) => requests.push(r.url()));
  const form = page.locator("[data-contact-form]");
  await form.locator("#q-name").fill("Test Driver");
  await form.locator("#q-phone").fill("123");
  await form.locator("#q-symptom").fill("Shakes at idle when cold.");
  await form.getByRole("button").click();
  await expect(form).toBeVisible();
  expect(await form.locator("#q-phone").evaluate((el: HTMLInputElement) => el.validity.patternMismatch)).toBe(true);
  await form.locator("#q-phone").fill("604-555-0148");
  await form.getByRole("button").click();
  const sent = page.locator("[data-demo-sent]");
  await expect(sent).toBeVisible();
  await expect(sent).toContainText("This is a demo. Nothing was sent.");
  expect(requests.filter((u) => /^https?:/.test(u))).toEqual([]);
});

test("the 404 search filters the page index and Enter opens the first match", async ({ page }) => {
  await page.goto("no-such-page/");
  await expect(page.locator("h1")).toHaveText("Page not found");
  const input = page.getByRole("searchbox");
  await input.fill("winter");
  const shown = page.locator("[data-search-group=en] [data-search-item]:visible");
  await expect(shown).toHaveCount(1);
  await input.fill("zzzz");
  await expect(page.locator("[data-search-empty]")).toBeVisible();
  await input.fill("warranty");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/warranty\/$/);
});

test("a French missing URL lists the French pages first", async ({ page }) => {
  await page.goto("fr/nope/");
  await expect(page.locator("[data-search-group]").first()).toHaveAttribute("data-search-group", "fr");
});

test("Enter on a French missing URL opens the French match, not the English one", async ({ page }) => {
  await page.goto("fr/nope/");
  const input = page.locator("[data-search] input");
  await input.fill("BMW");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/fr\/bmw-mini\/$/);
});

test("the header links to Blog, About and Reviews and marks a post as Blog", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("blog/bc-winter-tires/");
  const nav = page.locator(".header-nav");
  await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute("href", /\/blog\/$/);
  await nav.getByRole("link", { name: "Reviews" }).click();
  await expect(page.locator("[data-sample-review]")).toHaveCount(6);
});
