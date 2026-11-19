import type { ProviderConfig } from "../lib/booking.ts";

// The one line a real shop changes. The demo never leaves the browser.
//   { provider: "tekmetric", url: "https://…the shop's Tekmetric Online Booking link…" }
//   { provider: "form", endpoint: "https://…the shop's form service endpoint…" }
export const bookingConfig: ProviderConfig = { provider: "demo" };
