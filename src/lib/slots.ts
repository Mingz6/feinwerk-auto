// Booking slots on the shop's wall clock (America/Vancouver). Days are stepped as calendar dates,
// never by adding 24 hours, so a daylight-saving change can't move a slot or skip a day.
// Only `zonedToUtc` turns a slot into an instant (for the .ics file), and it asks Intl for the offset.
import type { DayHours } from "./hours.ts";

/** Minutes between slot starts. */
export const SLOT_STEP = 30;
/** The last drop-off is an hour before closing, so the shop can look at the car the same day. */
export const LAST_BEFORE_CLOSE = 60;
/** Today's slots start at least two hours from now. */
export const LEAD = 120;

export interface Day {
  /** "2026-11-02" on the shop's calendar. */
  date: string;
  /** 0 = Sunday. */
  weekday: number;
  /** "08:00", "08:30", … */
  times: string[];
}

const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const toHhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** Date, weekday and minutes since midnight on the wall clock in `timeZone`. */
export const wallClock = (now: Date, timeZone: string): { date: string; weekday: number; minutes: number } => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  );
  const date = `${p.year}-${p.month}-${p.day}`;
  return { date, weekday: weekdayOf(date), minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) };
};

const utcOf = (date: string) => Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
export const weekdayOf = (date: string): number => new Date(utcOf(date)).getUTCDay();
export const addDays = (date: string, n: number): string => new Date(utcOf(date) + n * 86_400_000).toISOString().slice(0, 10);

/** Slot starts for one day's hours, from `from` minutes on. A closed day has none. */
export const timesFor = (day: DayHours, from = 0): string[] => {
  if (!day.open || !day.close) return [];
  const out: string[] = [];
  const first = Math.max(toMinutes(day.open), Math.ceil(from / SLOT_STEP) * SLOT_STEP);
  for (let m = first; m <= toMinutes(day.close) - LAST_BEFORE_CLOSE; m += SLOT_STEP) out.push(toHhmm(m));
  return out;
};

/** The next `count` days with a free slot, today included when it still has one. */
export const bookableDays = (now: Date, hours: DayHours[], timeZone: string, count = 6): Day[] => {
  const today = wallClock(now, timeZone);
  const days: Day[] = [];
  for (let i = 0; days.length < count && i < 60; i++) {
    const date = addDays(today.date, i);
    const weekday = weekdayOf(date);
    const times = timesFor(hours[weekday], i === 0 ? today.minutes + LEAD : 0);
    if (times.length) days.push({ date, weekday, times });
  }
  return days;
};

/** The instant when the wall clock in `timeZone` shows `date` `time`. */
export const zonedToUtc = (date: string, time: string, timeZone: string): Date => {
  const guess = utcOf(date) + toMinutes(time) * 60_000;
  const offset = (t: number) => {
    const w = wallClock(new Date(t), timeZone);
    return utcOf(w.date) + w.minutes * 60_000 - t;
  };
  const first = guess - offset(guess);
  // A second pass settles a guess that landed on the other side of an offset change.
  return new Date(guess - offset(first));
};
