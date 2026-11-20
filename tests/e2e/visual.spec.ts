import { expect, test } from "@playwright/test";
import { COMBOS, openCombo } from "./matrix";

// 48 full-page baselines, rendered on Linux like CI (`npm run test:visual:update` makes them in Docker).
// A failing diff is a change to review: look at the diff image in the report, then update on purpose.
test.use({ timezoneId: "America/Vancouver" });

for (const c of COMBOS) {
  test(`screenshot: ${c.name}`, async ({ page }) => {
    await openCombo(page, c);
    await expect(page).toHaveScreenshot(`${c.name}.png`, { fullPage: true });
  });
}
