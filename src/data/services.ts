// The seven service pages (PLAN.md, Information architecture). Copy lives in the dictionaries under
// `${key}.*`; this file holds structure, the booking contract and sample prices only.
import type { Make, Service } from "../lib/book";

export const SERVICE_SLUGS = ["bmw-mini", "mercedes-amg", "vw-audi-porsche", "tires", "fleet", "carplay-retrofit", "pre-purchase-inspection"] as const;
export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export type ArtName = "hatch" | "sedan" | "coupe" | "tire" | "fleet" | "screen" | "wrench";

export interface Block {
  /** Anchor id, booking model hint and dictionary key part: `${page.key}.${id}.spec` and so on. */
  id: string;
  /** "model" blocks are an engine, gearbox, system or make: their Book button must carry make and service. */
  kind: "model" | "service";
  /** Shown as is (engine codes are not translated); otherwise the name comes from `nameKey` or `${key}.${id}.name`. */
  name?: string;
  nameKey?: string;
  /** Models the engine is found in: model names, not translated. */
  models?: string;
  make?: Make;
  service: Service;
  /** SAMPLE prices in CAD, labelled "Sample" on screen. */
  samplePrice: [number, number];
}

export interface ServicePage {
  key: string;
  art: ArtName;
  make?: Make;
  service?: Service;
  /** Lists under each block: label key and the dictionary suffixes of its items. */
  lists: { label: string; items: string[] }[];
  blocks: Block[];
}

const fails = [
  { label: "svc.fails", items: ["f1", "f2", "f3"] },
  { label: "svc.checks", items: ["c1", "c2", "c3"] },
];
const includes = (n: number) => [{ label: "svc.includes", items: Array.from({ length: n }, (_, i) => `i${i + 1}`) }];

export const SERVICE_PAGES: Record<ServiceSlug, ServicePage> = {
  "bmw-mini": {
    key: "bmw",
    art: "hatch",
    make: "bmw-mini",
    lists: fails,
    blocks: [
      { id: "n20", kind: "model", name: "N20", models: "328i · 528i · X1 28i · X3 28i · Z4 28i", service: "repair", samplePrice: [2400, 3400] },
      { id: "n55", kind: "model", name: "N55", models: "335i · 535i · X3 35i · X5 35i · M235i", service: "repair", samplePrice: [1300, 1800] },
      { id: "b58", kind: "model", name: "B58", models: "340i · M340i · 540i · X3 M40i · X5 40i", service: "repair", samplePrice: [900, 1400] },
      { id: "s55", kind: "model", name: "S55", models: "M2 Competition · M3 · M4", service: "repair", samplePrice: [700, 1200] },
    ],
  },
  "mercedes-amg": {
    key: "mb",
    art: "sedan",
    make: "mercedes-amg",
    lists: fails,
    blocks: [
      { id: "m274", kind: "model", name: "M274", models: "C 300 · E 300 · GLC 300 · SLC 300", service: "repair", samplePrice: [600, 1000] },
      { id: "m276", kind: "model", name: "M276", models: "C 400 · E 350 · E 400 · ML 350 · GLE 400", service: "repair", samplePrice: [1400, 2200] },
      { id: "m177", kind: "model", name: "M177", models: "C 63 · E 63 · AMG GT · G 63", service: "repair", samplePrice: [1500, 2400] },
      { id: "airmatic", kind: "model", name: "Airmatic", models: "E-Class · S-Class · CLS · ML · GL", service: "suspension", samplePrice: [1600, 2600] },
    ],
  },
  "vw-audi-porsche": {
    key: "vag",
    art: "coupe",
    make: "vw-audi-porsche",
    lists: fails,
    blocks: [
      { id: "ea888", kind: "model", name: "EA888", models: "GTI · Golf R · Tiguan · A4 · Q5 · Macan 2.0", service: "repair", samplePrice: [1100, 1700] },
      { id: "dsg", kind: "model", name: "DSG · S tronic", models: "Golf · GTI · Jetta GLI · A3 · A4 · Q5", service: "transmission", samplePrice: [450, 700] },
      { id: "cayenne", kind: "model", name: "Cayenne", models: "Cayenne · S · GTS · Turbo", service: "repair", samplePrice: [1500, 2400] },
      { id: "macan", kind: "model", name: "Macan", models: "Macan · S · GTS · Turbo", service: "maintenance", samplePrice: [700, 1100] },
    ],
  },
  tires: {
    key: "tires",
    art: "tire",
    service: "tires",
    lists: includes(3),
    blocks: [
      { id: "swap", kind: "service", service: "tires", samplePrice: [80, 120] },
      { id: "mount", kind: "service", service: "tires", samplePrice: [140, 200] },
      { id: "storage", kind: "service", service: "tires", samplePrice: [90, 130] },
    ],
  },
  fleet: { key: "fleet", art: "fleet", service: "fleet", lists: [], blocks: [] },
  "carplay-retrofit": {
    key: "carplay",
    art: "screen",
    service: "carplay",
    lists: includes(2),
    blocks: [
      { id: "bmw", kind: "model", nameKey: "make.bmw", make: "bmw-mini", service: "carplay", samplePrice: [400, 900] },
      { id: "mercedes", kind: "model", nameKey: "make.mercedes", make: "mercedes-amg", service: "carplay", samplePrice: [900, 1400] },
      { id: "vag", kind: "model", nameKey: "make.vag", make: "vw-audi-porsche", service: "carplay", samplePrice: [500, 1300] },
    ],
  },
  "pre-purchase-inspection": {
    key: "ppi",
    art: "wrench",
    service: "inspection",
    lists: includes(3),
    blocks: [{ id: "inspection", kind: "service", service: "inspection", samplePrice: [220, 260] }],
  },
};

/** Services menu order (PLAN.md Navigation): by make, then Tires, Fleet, CarPlay, Inspection. */
export const SERVICE_NAV: { slug: ServiceSlug; label: string }[] = [
  { slug: "bmw-mini", label: "make.bmw" },
  { slug: "mercedes-amg", label: "make.mercedes" },
  { slug: "vw-audi-porsche", label: "make.vag" },
  { slug: "tires", label: "tile.tires" },
  { slug: "fleet", label: "tile.fleet" },
  { slug: "carplay-retrofit", label: "tile.carplay" },
  { slug: "pre-purchase-inspection", label: "nav.inspection" },
];

/** SAMPLE inspection report on the pre-purchase page. */
export const sampleReport = {
  car: "2017 BMW 340i",
  km: 98400,
  photos: 14,
  lines: ["fix", "watch", "watch", "good", "good"] as const,
  fixPrice: [500, 800] as [number, number],
};

/** The checklist groups on the pre-purchase page, four items each. */
export const checklist = ["scan", "lift", "drive", "body"] as const;
