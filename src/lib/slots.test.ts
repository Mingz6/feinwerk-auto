import { test } from "node:test";
import assert from "node:assert/strict";
import site from "../data/site.json" with { type: "json" };
import { addDays, bookableDays, timesFor, wallClock, zonedToUtc } from "./slots.ts";

const TZ = site.timeZone;
const days = (iso: string, count = 6) => bookableDays(new Date(iso), site.hours, TZ, count);

test("a weekday runs 08:00 to 17:00 and Saturday 09:00 to 14:00, the last drop-off an hour before closing", () => {
  const mon = timesFor(site.hours[1]);
  assert.equal(mon[0], "08:00");
  assert.equal(mon.at(-1), "17:00");
  assert.equal(mon.length, 19);
  assert.deepEqual([timesFor(site.hours[6])[0], timesFor(site.hours[6]).at(-1)], ["09:00", "14:00"]);
  assert.deepEqual(timesFor(site.hours[0]), [], "Sunday is closed");
});

test("today's slots start two hours out, rounded up to the half hour", () => {
  // Thu 30 Oct 2025, 09:10 PDT (UTC-7): earliest 11:10, so 11:30
  assert.equal(days("2025-10-30T16:10:00Z")[0].date, "2025-10-30");
  assert.equal(days("2025-10-30T16:10:00Z")[0].times[0], "11:30");
});

test("closing time: at 14:59 the 17:00 slot is left; from 15:01 today is gone", () => {
  // Thu 30 Oct 2025 in PDT
  assert.deepEqual(days("2025-10-30T21:59:00Z")[0], { date: "2025-10-30", weekday: 4, times: ["17:00"] });
  const late = days("2025-10-30T22:01:00Z");
  assert.equal(late[0].date, "2025-10-31");
  assert.equal(late[0].times[0], "08:00");
});

test("across days: Sunday is skipped, Saturday has its own hours, month and year ends roll over", () => {
  // Sat 1 Nov 2025, 13:30 PDT: Saturday's last slot (14:00) is inside the lead time
  assert.deepEqual(days("2025-11-01T20:30:00Z").map((d) => d.date), ["2025-11-03", "2025-11-04", "2025-11-05", "2025-11-06", "2025-11-07", "2025-11-08"]);
  assert.equal(days("2025-11-01T20:30:00Z")[5].times[0], "09:00");
  // Wed 31 Dec 2025, 17:00 PST
  assert.deepEqual(days("2026-01-01T01:00:00Z", 3).map((d) => d.date), ["2026-01-01", "2026-01-02", "2026-01-03"]);
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
});

test("the end of daylight saving on 2 Nov 2025 moves the instant, not the wall-clock slot", () => {
  // Every tzdata version agrees on 2025: PDT (UTC-7) until 2 Nov, then PST (UTC-8)
  assert.equal(zonedToUtc("2025-10-31", "08:00", TZ).toISOString(), "2025-10-31T15:00:00.000Z");
  assert.equal(zonedToUtc("2025-11-03", "08:00", TZ).toISOString(), "2025-11-03T16:00:00.000Z");
  assert.deepEqual(days("2025-11-01T22:30:00Z", 1)[0].times.slice(0, 2), ["08:00", "08:30"]);
});

test("the end of daylight saving on 1 Nov 2026: Monday 2 Nov keeps its 08:00 to 17:00 slots and every slot maps back", () => {
  // Databases disagree about BC after 1 Nov 2026 (docs/decisions.md), so the test holds under either rule:
  // wall-clock slots never change, and each slot's instant reads back as the same date and time.
  const satAfterClose = zonedToUtc("2026-10-31", "16:00", TZ);
  assert.equal(satAfterClose.toISOString(), "2026-10-31T23:00:00.000Z", "31 Oct 2026 is still PDT everywhere");
  const week = bookableDays(satAfterClose, site.hours, TZ);
  assert.deepEqual(week.map((d) => d.date), ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07"]);
  assert.deepEqual([week[0].times[0], week[0].times.at(-1)], ["08:00", "17:00"]);
  for (const d of week)
    for (const time of d.times) {
      const w = wallClock(zonedToUtc(d.date, time, TZ), TZ);
      assert.equal(`${w.date} ${String(Math.floor(w.minutes / 60)).padStart(2, "0")}:${String(w.minutes % 60).padStart(2, "0")}`, `${d.date} ${time}`);
    }
  const mon = zonedToUtc("2026-11-02", "08:00", TZ).getUTCHours();
  assert.ok(mon === 15 || mon === 16, `08:00 on 2 Nov 2026 is 15:00Z (UTC-7) or 16:00Z (UTC-8), got ${mon}:00Z`);
});

test("during the repeated hour on Sunday 1 Nov 2026 the next day is Monday 08:00", () => {
  for (const iso of ["2026-11-01T08:30:00Z", "2026-11-01T09:30:00Z"]) {
    const [first] = days(iso, 1);
    assert.deepEqual([first.date, first.times[0]], ["2026-11-02", "08:00"], iso);
  }
});
