import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SERVICES = ["bmw-mini/", "mercedes-amg/", "vw-audi-porsche/", "tires/", "fleet/", "carplay-retrofit/", "pre-purchase-inspection/"];
const PAGES = ["", "book/", "contact/", "about/", "reviews/", "warranty/", "privacy/", "blog/", "blog/misfire-vacuum-leak/", "fr/contact/", "zh-hk/blog/bc-winter-tires/", "fr/", "fr/book/", "zh-hans/", "zh-hans/book/", "zh-hk/", "zh-hk/book/", "404.html", ...SERVICES, "fr/bmw-mini/", "zh-hans/tires/", "zh-hk/pre-purchase-inspection/"];
const VIEWPORTS = { phone: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };

// Stored "en" keeps the English pages from redirecting, so each URL is tested as itself.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("feinwerk-lang", "en"));
});

for (const p of PAGES) {
  for (const theme of ["light", "dark"] as const) {
    for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
      test(`axe: /${p} ${theme} ${vpName}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(p || "./");
        const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
}
