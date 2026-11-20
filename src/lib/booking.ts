// The booking flow talks to one BookingProvider. The UI never knows which one: a real shop swaps
// the config in src/data/booking.ts and nothing else changes.
//   demo       in the browser, no network. The one this site ships.
//   tekmetric  hands off to the shop's Tekmetric Online Booking page (link or iframe overlay).
//   form       posts the request to a form service the shop already uses.
import { MAKES, SERVICES, type Make, type Service } from "./book.ts";

export interface BookingRequest {
  make: Make;
  /** Free text: "2019 330i", or the engine block the visitor came from. */
  model: string;
  service: Service;
  notes: string;
  /** Shop wall clock: "2026-11-02" and "08:30". */
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  /** CASL express consent: true only when the visitor ticked the box. */
  reminders: boolean;
  lang: string;
}

export type BookingResult =
  | { status: "confirmed"; reference: string; sent: false }
  | { status: "sent"; reference: string; sent: true }
  | { status: "handoff"; url: string; sent: false };

export interface BookingProvider {
  readonly id: "demo" | "tekmetric" | "form";
  /** "sheet": our four steps collect the details. "external": the provider's own page does. */
  readonly kind: "sheet" | "external";
  /** Rejects with BookingError before any side effect when the request is invalid. */
  submit(req: BookingRequest): Promise<BookingResult>;
}

export type ProviderConfig = { provider: "demo" } | { provider: "tekmetric"; url: string } | { provider: "form"; endpoint: string };

export interface Deps {
  fetch?: typeof fetch;
  open?: (url: string) => void;
}

export class BookingError extends Error {
  readonly fields: string[];
  constructor(fields: string[]) {
    super(`invalid booking request: ${fields.join(", ")}`);
    this.fields = fields;
  }
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Names of the fields that fail; [] when the request can be booked. */
export const validate = (r: Partial<BookingRequest>): string[] => {
  const bad: string[] = [];
  if (!MAKES.includes(r.make as Make)) bad.push("make");
  if (!SERVICES.includes(r.service as Service)) bad.push("service");
  if (!DATE.test(r.date ?? "")) bad.push("date");
  if (!TIME.test(r.time ?? "")) bad.push("time");
  if (!r.name?.trim()) bad.push("name");
  if ((r.phone ?? "").replace(/\D/g, "").length < 7) bad.push("phone");
  if (!EMAIL.test(r.email ?? "")) bad.push("email");
  if (typeof r.reminders !== "boolean") bad.push("reminders");
  return bad;
};

const check = (r: BookingRequest) => {
  const bad = validate(r);
  if (bad.length) throw new BookingError(bad);
};

/** "FW-4821": a short work-order style number, stable for the same request. */
export const reference = (r: BookingRequest): string => {
  let h = 2166136261;
  for (const c of `${r.date}T${r.time}|${r.email}|${r.service}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return `FW-${String((h >>> 0) % 9000 + 1000)}`;
};

export const demoProvider = (): BookingProvider => ({
  id: "demo",
  kind: "sheet",
  submit: async (r) => {
    check(r);
    return { status: "confirmed", reference: reference(r), sent: false };
  },
});

export const tekmetricProvider = (url: string, deps: Deps = {}): BookingProvider => ({
  id: "tekmetric",
  kind: "external",
  submit: async (r) => {
    check(r);
    // Nothing personal goes in the URL: the visitor enters it on the shop's own booking page.
    (deps.open ?? ((u) => window.open(u, "_blank", "noopener")))(url);
    return { status: "handoff", url, sent: false };
  },
});

export const formProvider = (endpoint: string, deps: Deps = {}): BookingProvider => ({
  id: "form",
  kind: "sheet",
  submit: async (r) => {
    check(r);
    const body = new URLSearchParams({ ...r, reminders: r.reminders ? "yes" : "no", reference: reference(r) });
    const res = await (deps.fetch ?? fetch)(endpoint, { method: "POST", body, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`form service answered ${res.status}`);
    return { status: "sent", reference: reference(r), sent: true };
  },
});

export const createProvider = (c: ProviderConfig, deps: Deps = {}): BookingProvider =>
  c.provider === "tekmetric" ? tekmetricProvider(c.url, deps) : c.provider === "form" ? formProvider(c.endpoint, deps) : demoProvider();
