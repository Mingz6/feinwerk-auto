import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("feinwerk-lang", "en"));
});

test("make tiles open the make page, whose blocks book with make, service and model", async ({ page }) => {
  await page.goto("./");
  await page.locator("#makes .tile-make a").first().click();
  await expect(page).toHaveURL(/\/bmw-mini\/$/);
  const books = page.locator("[data-block-kind=model] a[data-book]");
  await expect(books).toHaveCount(4);
  await expect(books.first()).toHaveAttribute("href", /\/book\/\?make=bmw-mini&service=repair&model=n20$/);
  await books.first().click();
  await expect(page).toHaveURL(/\/book\/\?make=bmw-mini&service=repair&model=n20$/);
});

test("the Services menu lists the seven pages and marks the current one", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("tires/");
  const menu = page.locator(".header-nav .svc-menu");
  await menu.locator("summary").click();
  await expect(menu.locator(".menu-panel a")).toHaveCount(7);
  await expect(menu.locator('a[aria-current="page"]')).toHaveAttribute("href", /\/tires\/$/);
});

test("jump chips scroll to each block", async ({ page }) => {
  await page.goto("mercedes-amg/");
  await page.locator('.svc-jump a[href="#airmatic"]').click();
  await expect(page).toHaveURL(/#airmatic$/);
  await expect(page.locator("#airmatic")).toBeInViewport();
});

test("the fleet form validates, then shows the demo note and sends nothing", async ({ page }) => {
  const requests: string[] = [];
  await page.goto("fleet/");
  page.on("request", (r) => requests.push(r.url()));
  const form = page.locator("[data-demo-form]");
  await form.getByRole("button").click();
  await expect(page.locator("[data-demo-sent]")).toBeHidden();
  await page.getByLabel("Company").fill("Sample Couriers Ltd.");
  await page.getByLabel("Your name").fill("Alex Doe");
  await page.getByLabel("Email").fill("alex@example.com");
  await form.getByRole("button").click();
  await expect(page.locator("[data-demo-sent]")).toBeVisible();
  await expect(page.locator("[data-demo-sent]")).toBeFocused();
  await expect(form).toBeHidden();
  expect(page.url()).toMatch(/\/fleet\/$/);
  expect(requests).toEqual([]);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("service pages read and their Book buttons go to /book/", async ({ page }) => {
    await page.goto("vw-audi-porsche/");
    await expect(page.locator("h1")).toBeVisible();
    await page.locator("#dsg a[data-book]").click();
    await expect(page).toHaveURL(/\/book\/\?make=vw-audi-porsche&service=transmission&model=dsg$/);
  });
});
