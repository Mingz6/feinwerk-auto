import { expect, test } from "@playwright/test";
import { COMBOS, openCombo } from "./matrix";

// 48 full-page baselines, rendered by CI on ubuntu (`npm run test:visual:update -- <run-id>` takes them from a run).
// A failing diff is a change to review: look at the diff image in the report, then update on purpose.
test.use({ timezoneId: "America/Vancouver" });

for (const c of COMBOS) {
  test(`screenshot: ${c.name}`, async ({ page }) => {
    await openCombo(page, c);
    await expect(page).toHaveScreenshot(`${c.name}.png`, { fullPage: true });
  });
}
