import siteData from "../data/site.json";
import type { Locale } from "./lang";

// Optional, gitignored file with real contact details, for showing someone in person (HYK pattern).
// It is absent on CI, so the published site always carries the placeholders in site.json.
const privateFiles = import.meta.glob<{ default: Partial<typeof siteData> }>("../data/site.private.json", { eager: true });
const override = Object.values(privateFiles)[0]?.default;

export const site = { ...siteData, ...override, address: { ...siteData.address, ...override?.address } };
export const tel = site.phone.replace(/[^\d+]/g, "");

/** BASE_URL without its trailing slash: "/feinwerk-auto" on Pages. */
export const siteBase = import.meta.env.BASE_URL.replace(/\/$/, "");

/** English lives at the root; the other languages under their prefix. */
export const pathPrefix: Record<Locale, string> = { en: "", fr: "fr/", "zh-hans": "zh-hans/", "zh-hk": "zh-hk/" };

/** Every page that exists in all four languages. Phase 2 adds the rest of PLAN.md's 19. */
export const ROUTES = ["", "book"] as const;
export type Route = (typeof ROUTES)[number];

export const routeUrl = (locale: Locale, route: Route = ""): string =>
  `${siteBase}/${pathPrefix[locale]}${route ? `${route}/` : ""}`;

export const assetUrl = (path: string): string => `${siteBase}/${path.replace(/^\//, "")}`;

/** Text inside a tel: link never wraps: non-breaking hyphens and spaces (html-validate tel-non-breaking). */
export const nb = (s: string): string => s.replace(/-/g, "‑").replace(/ /g, " ");
