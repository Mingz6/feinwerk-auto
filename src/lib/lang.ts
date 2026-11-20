export const LOCALES = ["en", "fr", "zh-hans", "zh-hk"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Pick the site language from the browser's ordered language list (PLAN.md, Languages: detection order).
 * The first entry we recognise wins; anything unrecognised is skipped; nothing recognised means English.
 *   en*                                  -> en
 *   fr*                                  -> fr
 *   zh-Hans, zh-CN, zh-SG, plain zh      -> zh-hans (a script subtag beats a region: zh-Hans-HK is Simplified)
 *   zh-Hant, zh-HK, zh-MO, zh-TW, yue*   -> zh-hk (written Cantonese in Traditional characters)
 * Self-contained on purpose: Base.astro inlines its source into <head> so the redirect runs before first paint.
 */
export function detectLocale(languages: readonly string[]): Locale {
  for (const raw of languages) {
    const parts = String(raw).toLowerCase().replace(/_/g, "-").split("-");
    const primary = parts[0];
    if (primary === "en") return "en";
    if (primary === "fr") return "fr";
    if (primary === "yue") return "zh-hk";
    if (primary === "zh") {
      if (parts.indexOf("hans") > 0) return "zh-hans";
      if (parts.indexOf("hant") > 0) return "zh-hk";
      if (parts.indexOf("hk") > 0 || parts.indexOf("mo") > 0 || parts.indexOf("tw") > 0) return "zh-hk";
      return "zh-hans";
    }
  }
  return "en";
}

export const isLocale = (v: unknown): v is Locale => (LOCALES as readonly unknown[]).includes(v);
