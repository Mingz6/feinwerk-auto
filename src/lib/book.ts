// The booking query contract. Every Book button carries it in its href (/book/?make=…&service=…&model=…)
// and in data-book-* attributes, so the booking flow (sheet or /book/ page) can prefill steps 1 and 2.
export const MAKES = ["bmw-mini", "mercedes-amg", "vw-audi-porsche", "other"] as const;
export type Make = (typeof MAKES)[number];

export const SERVICES = ["diagnosis", "repair", "maintenance", "transmission", "suspension", "tires", "fleet", "carplay", "inspection"] as const;
export type Service = (typeof SERVICES)[number];

export interface BookParams {
  make?: Make;
  service?: Service;
  /** An engine, gearbox or model id from a service page block (n20, dsg, cayenne): a hint for step 1. */
  model?: string;
}

const MODEL = /^[a-z0-9-]{1,24}$/;
const isMake = (v: string | null): v is Make => MAKES.includes(v as Make);
const isService = (v: string | null): v is Service => SERVICES.includes(v as Service);

/** "?make=bmw-mini&service=repair&model=n20", or "" when there is nothing to carry. */
export const bookQuery = (p: BookParams): string => {
  const q = new URLSearchParams();
  if (p.make) q.set("make", p.make);
  if (p.service) q.set("service", p.service);
  if (p.model) q.set("model", p.model);
  const s = q.toString();
  return s ? `?${s}` : "";
};

/** Reads a query string back; unknown or malformed values are dropped, never trusted. */
export const parseBookQuery = (search: string): BookParams => {
  const q = new URLSearchParams(search);
  const make = q.get("make");
  const service = q.get("service");
  const model = q.get("model");
  return {
    ...(isMake(make) && { make }),
    ...(isService(service) && { service }),
    ...(model && MODEL.test(model) && { model }),
  };
};
