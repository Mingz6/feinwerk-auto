import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { COMBOS, openCombo } from "./matrix";

const SERVICES = ["bmw-mini/", "mercedes-amg/", "vw-audi-porsche/", "tires/", "fleet/", "carplay-retrofit/", "pre-purchase-inspection/"];
const PAGES = ["", "book/", "contact/", "about/", "reviews/", "warranty/", "privacy/", "blog/", "blog/misfire-vacuum-leak/", "fr/contact/", "zh-hk/blog/bc-winter-tires/", "fr/", "fr/book/", "zh-hans/", "zh-hans/book/", "zh-hk/", "zh-hk/book/", "404.html", ...SERVICES, "fr/bmw-mini/", "zh-hans/tires/", "zh-hk/pre-purchase-inspection/"];
const VIEWPORTS = { phone: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const violations = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
};

// The Quality bar's 48: the same combinations as the screenshot baselines (matrix.ts).
test.describe("the 48", () => {
  test.use({ timezoneId: "America/Vancouver" });
  for (const c of COMBOS) {
    test(`axe 48: ${c.name}`, async ({ page }) => {
      await openCombo(page, c);
      expect(await violations(page)).toEqual([]);
    });
  }
});

// Every other page type, once per theme and viewport. Paths already in the 48 are skipped.
const IN_48 = new Set(COMBOS.map((c) => c.path));

// Stored "en" keeps the English pages from redirecting, so each URL is tested as itself.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("feinwerk-lang", "en"));
});

for (const p of PAGES.filter((p) => !IN_48.has(p))) {
  for (const theme of ["light", "dark"] as const) {
    for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
      test(`axe: /${p} ${theme} ${vpName}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(p || "./");
        expect(await violations(page)).toEqual([]);
      });
    }
  }
}
