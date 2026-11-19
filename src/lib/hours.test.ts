import { test } from "node:test";
import assert from "node:assert/strict";
import site from "../data/site.json" with { type: "json" };
import { describeStatus, formatTime, getStatus, weekdayName, zonedNow, type StatusStrings } from "./hours.ts";

const at = (iso: string) => getStatus(new Date(iso), site.hours, site.timeZone);
const strings: StatusStrings = {
  open: "Open",
  closed: "Closed",
  closes: "closes {time}",
  opensToday: "opens {time}",
  opensTomorrow: "opens tomorrow {time}",
  opensDay: "opens {day} {time}",
};

test("site.json lists the week Sunday first, as getStatus expects", () => {
  assert.deepEqual(site.hours.map((h) => h.day), ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
});

test("judged on the Vancouver clock, not the visitor's or UTC", () => {
  // 20:00 UTC on Thu 29 Oct 2026 is 13:00 PDT, but already Friday 05:00 in Tokyo
  assert.deepEqual(zonedNow(new Date("2026-10-29T20:00:00Z"), site.timeZone), { weekday: 4, minutes: 13 * 60 });
  assert.deepEqual(at("2026-10-29T20:00:00Z"), { open: true, closes: "18:00" });
});

test("weekday closing time: open at 17:59, closed at 18:00", () => {
  // Thu 29 Oct 2026, PDT (UTC-7)
  assert.deepEqual(at("2026-10-30T00:59:00Z"), { open: true, closes: "18:00" });
  assert.deepEqual(at("2026-10-30T01:00:00Z"), { open: false, opens: "08:00", inDays: 1, weekday: 5 });
});

test("before opening: closed, opens later today", () => {
  // Fri 30 Oct 2026 07:59 PDT
  assert.deepEqual(at("2026-10-30T14:59:00Z"), { open: false, opens: "08:00", inDays: 0, weekday: 5 });
  assert.deepEqual(at("2026-10-30T15:00:00Z"), { open: true, closes: "18:00" });
});

// Daylight saving cases use the 2025 switch (Sun 2 Nov 2025). Time-zone databases disagree about BC from
// Nov 2026 on (Node 26's tzdata 2026a returns to PST; Chromium 159 keeps UTC-7 all year), and getStatus
// follows whatever the runtime's database says, so the tests pin a date every version agrees on.
test("Saturday closing at 15:00 skips the closed Sunday to Monday", () => {
  // Sat 1 Nov 2025, the day before daylight saving ends
  assert.deepEqual(at("2025-11-01T21:59:00Z"), { open: true, closes: "15:00" });
  assert.deepEqual(at("2025-11-01T22:00:00Z"), { open: false, opens: "08:00", inDays: 2, weekday: 1 });
});

test("end of daylight saving (Sun 2 Nov 2025, 02:00 PDT -> 01:00 PST): the repeated hour is still Sunday", () => {
  // 08:30Z is 01:30 PDT; 09:30Z is 01:30 PST
  for (const iso of ["2025-11-02T08:30:00Z", "2025-11-02T09:30:00Z"]) {
    assert.deepEqual(zonedNow(new Date(iso), site.timeZone), { weekday: 0, minutes: 90 }, iso);
    assert.deepEqual(at(iso), { open: false, opens: "08:00", inDays: 1, weekday: 1 }, iso);
  }
});

test("first Monday after daylight saving ends uses UTC-8, not UTC-7", () => {
  // Mon 3 Nov 2025: 15:59Z is 07:59 PST (08:59 if the old offset were used)
  assert.deepEqual(at("2025-11-03T15:59:00Z"), { open: false, opens: "08:00", inDays: 0, weekday: 1 });
  assert.deepEqual(at("2025-11-03T16:00:00Z"), { open: true, closes: "18:00" });
  // 17:59 PST is 01:59Z the next day; 18:00 PST is 02:00Z
  assert.deepEqual(at("2025-11-04T01:59:00Z"), { open: true, closes: "18:00" });
  assert.deepEqual(at("2025-11-04T02:00:00Z"), { open: false, opens: "08:00", inDays: 1, weekday: 2 });
});

test("start of daylight saving (Sun 8 Mar 2026) moves Monday opening to 15:00Z", () => {
  assert.deepEqual(at("2026-03-09T14:59:00Z"), { open: false, opens: "08:00", inDays: 0, weekday: 1 });
  assert.deepEqual(at("2026-03-09T15:00:00Z"), { open: true, closes: "18:00" });
});

test("times and weekday names follow the page locale", () => {
  assert.equal(formatTime("18:00", "en-CA"), "6:00 p.m.");
  assert.equal(formatTime("08:30", "fr-CA"), "8 h 30");
  assert.equal(formatTime("18:00", "zh-Hans"), "18:00");
  assert.equal(weekdayName(1, "en-CA"), "Monday");
  assert.equal(weekdayName(0, "fr-CA"), "dimanche");
});

test("describeStatus builds the chip text", () => {
  assert.deepEqual(describeStatus(at("2026-10-29T20:00:00Z"), strings, "en-CA"), ["Open", "closes 6:00 p.m."]);
  assert.deepEqual(describeStatus(at("2026-10-30T14:59:00Z"), strings, "en-CA"), ["Closed", "opens 8:00 a.m."]);
  assert.deepEqual(describeStatus(at("2026-10-30T01:00:00Z"), strings, "en-CA"), ["Closed", "opens tomorrow 8:00 a.m."]);
  assert.deepEqual(describeStatus(at("2025-11-01T22:00:00Z"), strings, "en-CA"), ["Closed", "opens Monday 8:00 a.m."]);
});
