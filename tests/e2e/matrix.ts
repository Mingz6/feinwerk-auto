import { expect, type Page } from "@playwright/test";

// The Quality bar's 48 combinations: Home, a make page and Book
// × 4 languages × 2 themes × 2 viewports. Screenshots and axe both run on exactly this list.
export const LANGS = { en: "", fr: "fr/", "zh-hans": "zh-hans/", "zh-hk": "zh-hk/" } as const;
export const PAGES = { home: "", make: "bmw-mini/", book: "book/" } as const;
export const THEMES = ["light", "dark"] as const;
export const VIEWPORTS = { "390x844": { width: 390, height: 844 }, "1440x900": { width: 1440, height: 900 } } as const;

// A fixed Wednesday morning on the Vancouver clock: the open/closed chip and the booking days stay the same on every run.
export const FIXED_NOW = new Date("2026-11-18T18:00:00Z");

export interface Combo {
  name: string;
  path: string;
  theme: (typeof THEMES)[number];
  viewport: { width: number; height: number };
}

export const COMBOS: Combo[] = Object.entries(LANGS).flatMap(([lang, prefix]) =>
  Object.entries(PAGES).flatMap(([pageName, path]) =>
    THEMES.flatMap((theme) =>
      Object.entries(VIEWPORTS).map(([vp, viewport]) => ({ name: `${lang}-${pageName}-${theme}-${vp}`, path: prefix + path, theme, viewport })),
    ),
  ),
);

/** Opens one combination as a visitor whose language choice is already stored, so no page redirects. */
export async function openCombo(page: Page, c: Combo) {
  await page.clock.setFixedTime(FIXED_NOW);
  await page.addInitScript(() => localStorage.setItem("feinwerk-lang", "en"));
  await page.setViewportSize(c.viewport);
  await page.emulateMedia({ colorScheme: c.theme, reducedMotion: "reduce" });
  await page.goto(c.path || "./", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // Guards the baselines against an error page (a blocked host, a 404) being recorded as the truth.
  await expect(page.locator("main h1").first()).toBeVisible();
}
