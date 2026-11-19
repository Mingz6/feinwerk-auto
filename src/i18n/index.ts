import type { Locale } from "../lib/lang";
import { site } from "../lib/site";
import { en, type Dict, type Key } from "./en";
import { fr } from "./fr";
import { zhHans } from "./zh-hans";
import { zhHk } from "./zh-hk";

export const dictionaries: Record<Locale, Dict> = { en, fr, "zh-hans": zhHans, "zh-hk": zhHk };

type Vars = Record<string, string | number>;

export const fill = (s: string, vars: Vars = {}): string =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

export const useI18n = (locale: Locale) => {
  const dict = dictionaries[locale];
  const t = (key: Key, vars?: Vars): string => fill(dict[key], vars);
  return { t, locale };
};

/** `lang` on <html>, and the `hreflang` tag (ISO 639-1 plus script or region; `yue` isn't accepted). */
export const htmlLang: Record<Locale, string> = { en: "en-CA", fr: "fr-CA", "zh-hans": "zh-Hans", "zh-hk": "zh-HK" };
export const hreflang: Record<Locale, string> = { en: "en", fr: "fr", "zh-hans": "zh-Hans", "zh-hk": "zh-HK" };
export const ogLocale: Record<Locale, string> = { en: "en_CA", fr: "fr_CA", "zh-hans": "zh_CN", "zh-hk": "zh_HK" };
/** Each language named in itself, so these are data, not translations. */
export const langName: Record<Locale, string> = { en: "English", fr: "Français", "zh-hans": "简体中文", "zh-hk": "廣東話" };
export const langShort: Record<Locale, string> = { en: "EN", fr: "FR", "zh-hans": "简", "zh-hk": "粵" };

/** The few strings the browser script needs, sent as JSON in the page. */
export const clientStrings = (locale: Locale) => {
  const d = dictionaries[locale];
  return {
    lang: htmlLang[locale],
    theme: { label: d["theme.label"], auto: d["theme.auto"], light: d["theme.light"], dark: d["theme.dark"] },
    status: {
      open: d["status.open"],
      closed: d["status.closed"],
      closes: d["status.closes"],
      opensToday: d["status.opensToday"],
      opensTomorrow: d["status.opensTomorrow"],
      opensDay: d["status.opensDay"],
    },
    shop: { hours: site.hours, timeZone: site.timeZone },
    book: {
      step: d["book.step"],
      ics: d["book.ics.summary"],
      sent: d["book.sent"],
      name: site.name,
      address: `${site.address.street}, ${site.address.city}, ${site.address.region}`,
    },
  };
};
export type ClientStrings = ReturnType<typeof clientStrings>;
