// English (Canada) is written first; every other dictionary must have exactly these keys and {placeholders}.
export const en = {
  "skip": "Skip to content",
  "strip.label": "Design concept",
  "strip.text": "Fictional business. Sample copy, prices, reviews and contact details.",
  "nav.primary": "Main",
  "nav.home": "Home",
  "nav.book": "Book",
  "nav.call": "Call",
  "lang.label": "Language",
  "theme.label": "Theme",
  "theme.auto": "Auto",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "brand.descriptor": "European car specialists",
  "footer.contact": "Sample contact details",
  "footer.address": "Address",
  "footer.phone": "Phone",
  "footer.disclaimer":
    "Feinwerk Auto is a fictional business made for a design concept. It is not affiliated with any company or vehicle manufacturer. Make names only describe the cars serviced. Reviews, the rating and prices are samples.",
  "home.title": "{name} | European car repair in Vancouver",
  "home.desc": "BMW, MINI, Mercedes-Benz, VW, Audi and Porsche service and repair in Vancouver. A design concept for a fictional shop.",
  "home.h1": "European car specialists in Vancouver",
  "home.lead": "Book online in under a minute. We inspect, send you photos, and you approve each line from your phone.",
  "home.status": "This site is being built. The full design is on its way.",
  "cta.book": "Book online",
  "cta.call": "Call {phone}",
  "book.title": "Book | {name}",
  "book.desc": "Book a visit at {name} in Vancouver. A demo: nothing is sent.",
  "book.h1": "Book a visit",
  "book.lead": "Online booking is coming to this demo. Until then, call {phone}.",
  "book.demo": "This is a demo. Nothing is sent.",
  "404.title": "Page not found",
  "404.text": "This page doesn't exist.",
  "404.home": "Go to the homepage",
};

export type Key = keyof typeof en;
export type Dict = Record<Key, string>;
