import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { en } from "../../src/i18n/en.ts";
import { fr } from "../../src/i18n/fr.ts";
import { zhHans } from "../../src/i18n/zh-hans.ts";
import { zhHk } from "../../src/i18n/zh-hk.ts";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("feinwerk-lang", "en"));
});

/** Every request the page makes from now on, except blob: and data: URLs (the .ics file). */
const network = (page: Page) => {
  const seen: string[] = [];
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) seen.push(`${r.method()} ${r.url()}`);
  });
  return seen;
};

/** Keyboard only: Tab until `target` has focus. */
const tabTo = async (page: Page, target: Locator, max = 150) => {
  for (let i = 0; i < max; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Tab never reached ${target}`);
};

test("keyboard only: a make tile, the make page's Book button, then the sheet with make and service filled in", async ({ page }) => {
  await page.goto("./");
  await tabTo(page, page.locator("#makes .tile-make a").first());
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/bmw-mini\/$/);
  await page.waitForLoadState("load");
  const requests = network(page);

  const book = page.locator("[data-block-kind=model] a[data-book]").first();
  await tabTo(page, book);
  await page.keyboard.press("Enter");
  const sheet = page.locator("dialog[data-book-sheet]");
  await expect(sheet).toBeVisible();
  expect(page.url()).toMatch(/\/bmw-mini\/$/);
  await expect(sheet.locator('input[name=make][value="bmw-mini"]')).toBeChecked();
  await expect(sheet.locator('input[name=service][value="repair"]')).toBeChecked();
  await expect(sheet.locator("input[name=model]")).toHaveValue(/N20/);
  await expect(sheet.locator("[data-book-progress]")).toHaveText("Step 3 of 4");

  const firstDay = sheet.locator("[data-days] input").first();
  await expect(firstDay).toBeFocused();
  await page.keyboard.press("Space");
  await expect(firstDay).toBeChecked();
  await page.keyboard.press("Tab");
  await expect(sheet.locator("[data-times] input").first()).toBeFocused();
  await page.keyboard.press("Space");
  await tabTo(page, sheet.locator("[data-step='2'] [data-next]"));
  await page.keyboard.press("Enter");

  await expect(sheet.locator("[data-book-progress]")).toHaveText("Step 4 of 4");
  await expect(sheet.getByLabel("Name")).toBeFocused();
  await page.keyboard.type("Alex Doe");
  await page.keyboard.press("Tab");
  await page.keyboard.type("604-555-0199");
  await page.keyboard.press("Tab");
  await page.keyboard.type("alex@example.com");
  await expect(sheet.locator("[data-reminders]")).not.toBeChecked();
  await tabTo(page, sheet.getByRole("button", { name: en["book.submit"] }));
  await page.keyboard.press("Enter");

  const done = sheet.locator("[data-book-done]");
  await expect(done).toBeVisible();
  await expect(done).toBeFocused();
  await expect(done).toContainText("This is a demo. Nothing was sent.");
  await expect(done.locator("[data-out=reference]")).toHaveText(/^FW-\d{4}$/);
  await expect(done.locator("[data-out=car]")).toContainText("BMW · MINI · N20");
  await expect(done.locator("[data-out=service]")).toHaveText("Repair");

  const download = page.waitForEvent("download");
  await tabTo(page, done.locator("[data-ics]"));
  await page.keyboard.press("Enter");
  const file = await download;
  expect(file.suggestedFilename()).toBe("feinwerk-auto-booking.ics");
  const ics = await (await file.createReadStream()).toArray().then((c) => Buffer.concat(c).toString("utf8"));
  expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
  expect(ics).toMatch(/\r\nDTSTART:\d{8}T\d{6}Z\r\n/);
  expect(ics).toContain("This is a demo. Nothing was sent.");

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  expect(requests).toEqual([]);
});

test("the sheet won't move on until a step is valid, and Back keeps the choices", async ({ page }) => {
  await page.goto("tires/");
  const requests = network(page);
  await page.locator(".header-tools a[href$='/book/'], header a[href$='/book/']").first().click();
  const sheet = page.locator("dialog[data-book-sheet]");
  await expect(sheet.locator("[data-book-progress]")).toHaveText("Step 1 of 4");
  await sheet.locator("[data-step='0'] [data-next]").click();
  await expect(sheet.locator("[data-book-progress]")).toHaveText("Step 1 of 4");
  await sheet.getByLabel("Other European").check();
  await sheet.locator("[data-step='0'] [data-next]").click();
  await expect(sheet.locator("[data-book-progress]")).toHaveText("Step 2 of 4");
  await sheet.locator("[data-step='1'] [data-back]").click();
  await expect(sheet.getByLabel("Other European")).toBeChecked();
  await sheet.locator("[data-close]").click();
  await expect(sheet).toBeHidden();
  expect(requests).toEqual([]);
});

const LOCALES = [
  ["", en],
  ["fr/", fr],
  ["zh-hans/", zhHans],
  ["zh-hk/", zhHk],
] as const;

for (const [prefix, d] of LOCALES) {
  test(`books from the bottom bar in ${prefix || "en/"}, confirmation in that language`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(prefix);
    const requests = network(page);
    await page.locator(".bottom-bar a.is-primary").click();
    const sheet = page.locator("dialog[data-book-sheet]");
    await sheet.getByLabel(d["make.vag"], { exact: true }).check();
    await sheet.getByRole("button", { name: d["book.next"] }).first().click();
    await sheet.getByLabel(d["book.svc.maintenance"], { exact: true }).check();
    await sheet.locator("[data-step='1'] [data-next]").click();
    await sheet.locator("[data-days] input").nth(1).check();
    await sheet.locator("[data-times] input").first().check();
    await sheet.locator("[data-step='2'] [data-next]").click();
    await sheet.getByLabel(d["book.name"], { exact: true }).fill("Alex Doe");
    await sheet.getByLabel(d["book.phone"], { exact: true }).fill("604-555-0199");
    await sheet.getByLabel(d["book.email"], { exact: true }).fill("alex@example.com");
    await sheet.getByRole("button", { name: d["book.submit"] }).click();
    await expect(sheet.locator("[data-book-sent]")).toHaveText(d["book.sent"]);
    await expect(sheet.locator("[data-out=service]")).toHaveText(d["book.svc.maintenance"]);
    expect(requests).toEqual([]);
  });
}

test("/book/ with JavaScript reads the query and starts at the first open step", async ({ page }) => {
  await page.goto("book/?make=mercedes-amg&service=maintenance&model=m274");
  await expect(page.locator("[data-book-sheet]")).toHaveCount(0);
  await expect(page.locator("[data-book-progress]")).toHaveText("Step 3 of 4");
  await expect(page.locator("input[name=model]")).toHaveValue("M274");
  await expect(page.locator("[data-reminders]")).not.toBeChecked();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("/book/ shows every step and books with no request at all", async ({ page }) => {
    await page.goto("book/?make=bmw-mini&service=repair");
    await page.waitForLoadState("load");
    const requests = network(page);
    for (const n of [0, 1, 2, 3]) await expect(page.locator(`[data-step='${n}']`)).toBeVisible();
    await expect(page.locator("[data-book-done]")).toBeHidden();

    const submit = page.getByRole("button", { name: en["book.submit"] });
    await submit.click();
    await expect(page.locator("[data-book-done]")).toBeHidden();

    await page.getByLabel("BMW · MINI", { exact: true }).check();
    await page.getByLabel("Repair", { exact: true }).check();
    await page.locator("input[name=date]").fill("2026-11-23");
    await page.locator("select[name=time]").selectOption("09:00");
    await page.getByLabel("Name", { exact: true }).fill("Alex Doe");
    await page.getByLabel("Phone", { exact: true }).fill("604-555-0199");
    await page.getByLabel("Email", { exact: true }).fill("alex@example.com");
    await expect(page.locator("[data-reminders]")).not.toBeChecked();
    await submit.click();

    const done = page.locator("[data-book-done]");
    await expect(done).toBeVisible();
    await expect(done).toContainText("This is a demo. Nothing was sent.");
    await expect(page.locator("[data-book-form]")).toBeHidden();
    expect(page.url()).toMatch(/\/book\/\?make=bmw-mini&service=repair$/);
    expect(requests).toEqual([]);
  });
});

test("axe: the open sheet, each step and the confirmation, in both themes", async ({ page }) => {
  for (const theme of ["light", "dark"]) {
    await page.addInitScript((t) => localStorage.setItem("feinwerk-theme", t), theme);
    await page.setViewportSize({ width: 390, height: 844 });
    // The sheet slides in over 0.25 s; a scan mid-animation reads half-faded text as low contrast.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("bmw-mini/");
    await page.locator("[data-block-kind=model] a[data-book]").first().click();
    const sheet = page.locator("dialog[data-book-sheet]");
    const scan = async () => expect((await new AxeBuilder({ page }).include("dialog[data-book-sheet]").analyze()).violations).toEqual([]);
    await sheet.locator("[data-days] input").first().check();
    await scan();
    await sheet.locator("[data-times] input").first().check();
    await sheet.locator("[data-step='2'] [data-next]").click();
    await scan();
    await sheet.getByLabel(en["book.name"], { exact: true }).fill("Alex Doe");
    await sheet.getByLabel(en["book.phone"], { exact: true }).fill("604-555-0199");
    await sheet.getByLabel(en["book.email"], { exact: true }).fill("alex@example.com");
    await sheet.getByRole("button", { name: en["book.submit"] }).click();
    await expect(sheet.locator("[data-book-done]")).toBeVisible();
    await scan();
  }
});

test("/book/ paints step 1 alone before the script runs, so nothing shifts when it does (Lighthouse saw CLS 0.5)", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("feinwerk-lang", "en"));
  // Hold back the bundled scripts: what shows now is what the first paint shows. The inline head script still adds .js.
  await page.route(/\.js$/, (route) => route.abort());
  await page.goto("book/");
  await expect(page.locator("html")).toHaveClass(/\bjs\b/);
  await expect(page.locator("[data-step='0']")).toBeVisible();
  for (const n of [1, 2, 3]) await expect(page.locator(`[data-step='${n}']`)).toBeHidden();
  await expect(page.locator("[data-book-progress]")).toHaveText("Step 1 of 4");
});

test("/book/ with JavaScript: no layout shift from load to the ready flow", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("feinwerk-lang", "en");
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("book/", { waitUntil: "networkidle" });
  await expect(page.locator("[data-book-form][data-ready]")).toHaveCount(1);
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.01);
});
