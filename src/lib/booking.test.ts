import { test } from "node:test";
import assert from "node:assert/strict";
import { bookingConfig } from "../data/booking.ts";
import { BookingError, createProvider, reference, validate, type BookingProvider, type BookingRequest } from "./booking.ts";
import { buildIcs, escapeText, fold } from "./ics.ts";

const valid: BookingRequest = {
  make: "bmw-mini",
  model: "N20",
  service: "repair",
  notes: "",
  date: "2026-11-02",
  time: "08:30",
  name: "Alex Doe",
  phone: "604-555-0199",
  email: "alex@example.com",
  reminders: false,
  lang: "en-CA",
};

/** Each provider with spies on everything that could leave the page. */
const harness = (provider: "demo" | "tekmetric" | "form", ok = true) => {
  const calls = { fetch: [] as [string, RequestInit][], open: [] as string[] };
  const deps = {
    fetch: (async (url: string, init: RequestInit) => {
      calls.fetch.push([url, init]);
      return new Response("{}", { status: ok ? 200 : 503 });
    }) as unknown as typeof fetch,
    open: (url: string) => calls.open.push(url),
  };
  const config =
    provider === "tekmetric"
      ? { provider, url: "https://booking.example.com/shop/1" }
      : provider === "form"
        ? { provider, endpoint: "https://forms.example.com/f/1" }
        : { provider };
  return { p: createProvider(config, deps) as BookingProvider, calls };
};

test("the site ships the demo provider", () => {
  assert.deepEqual(bookingConfig, { provider: "demo" });
  assert.equal(createProvider(bookingConfig).id, "demo");
});

test("validate names every bad field and passes a good request", () => {
  assert.deepEqual(validate(valid), []);
  assert.deepEqual(validate({}), ["make", "service", "date", "time", "name", "phone", "email", "reminders"]);
  assert.deepEqual(validate({ ...valid, make: "tesla" as never, time: "24:00", email: "alex@", phone: "123" }), ["make", "time", "phone", "email"]);
  assert.deepEqual(validate({ ...valid, name: "   " }), ["name"]);
});

for (const id of ["demo", "tekmetric", "form"] as const) {
  test(`contract, ${id}: rejects an invalid request before anything leaves the page`, async () => {
    const { p, calls } = harness(id);
    await assert.rejects(p.submit({ ...valid, email: "nope" }), (e: unknown) => e instanceof BookingError && e.fields.join() === "email");
    assert.deepEqual(calls, { fetch: [], open: [] });
  });

  test(`contract, ${id}: books a valid request and says whether anything was sent`, async () => {
    const { p, calls } = harness(id);
    assert.equal(p.id, id);
    const r = await p.submit(valid);
    assert.ok(["confirmed", "sent", "handoff"].includes(r.status));
    assert.equal(r.sent, calls.fetch.length > 0, "sent is true only when a request went out");
    if (r.status !== "handoff") assert.match(r.reference, /^FW-\d{4}$/);
  });
}

test("demo: no fetch, no window, nothing sent", async () => {
  const { p, calls } = harness("demo");
  assert.equal(p.kind, "sheet");
  assert.deepEqual(await p.submit(valid), { status: "confirmed", reference: reference(valid), sent: false });
  assert.deepEqual(calls, { fetch: [], open: [] });
});

test("form: one POST with the fields, and reminders only when ticked", async () => {
  const { p, calls } = harness("form");
  await p.submit(valid);
  assert.equal(calls.fetch.length, 1);
  const [url, init] = calls.fetch[0];
  assert.equal(url, "https://forms.example.com/f/1");
  assert.equal(init.method, "POST");
  const body = init.body as URLSearchParams;
  assert.equal(body.get("email"), "alex@example.com");
  assert.equal(body.get("reminders"), "no");
  await p.submit({ ...valid, reminders: true });
  assert.equal((calls.fetch[1][1].body as URLSearchParams).get("reminders"), "yes");
});

test("form: a failing service rejects, so the visitor never sees a false confirmation", async () => {
  const { p } = harness("form", false);
  await assert.rejects(p.submit(valid), /503/);
});

test("tekmetric: hands off to the shop's page with nothing personal in the URL", async () => {
  const { p, calls } = harness("tekmetric");
  assert.equal(p.kind, "external");
  assert.deepEqual(await p.submit(valid), { status: "handoff", url: "https://booking.example.com/shop/1", sent: false });
  assert.deepEqual(calls.open, ["https://booking.example.com/shop/1"]);
  assert.doesNotMatch(calls.open[0], /alex|604|Doe/i);
});

test("reference is stable for one request and differs for another slot", () => {
  assert.equal(reference(valid), reference({ ...valid }));
  assert.notEqual(reference(valid), reference({ ...valid, time: "09:00" }));
});

test("ics: one UTC event with CRLF lines, escaped text and folded long lines", () => {
  const ics = buildIcs({
    uid: "FW-1234@feinwerk-auto.demo",
    start: new Date("2026-11-02T16:30:00Z"),
    end: new Date("2026-11-02T17:30:00Z"),
    stamp: new Date("2026-10-31T23:00:00.123Z"),
    summary: "Repair, BMW; N20",
    location: "88 Sample Way, Vancouver, BC",
    description: "This is a demo. Nothing was sent.\nCall 604-555-0148.",
  });
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"));
  assert.ok(ics.endsWith("END:VEVENT\r\nEND:VCALENDAR\r\n"));
  assert.doesNotMatch(ics.replace(/\r\n/g, ""), /[\r\n]/, "no bare newlines");
  assert.match(ics, /\r\nDTSTART:20261102T163000Z\r\nDTEND:20261102T173000Z\r\n/);
  assert.match(ics, /\r\nDTSTAMP:20261031T230000Z\r\n/);
  assert.match(ics, /\r\nSUMMARY:Repair\\, BMW\\; N20\r\n/);
  assert.match(ics.replace(/\r\n /g, ""), /DESCRIPTION:This is a demo\. Nothing was sent\.\\nCall 604-555-0148\./);
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, line);
});

test("ics: folding never splits a character and keeps every octet", () => {
  const long = "SUMMARY:" + "車".repeat(40);
  const folded = fold(long);
  assert.equal(folded.replace(/\r\n /g, ""), long);
  for (const line of folded.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75);
  assert.equal(escapeText("a\\b"), "a\\\\b");
});
