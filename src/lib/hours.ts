// Open/closed in the shop's own time zone (America/Vancouver), whatever the visitor's clock says.
// Self-contained (Intl only), so the browser bundle and node --test run the same code.

export interface DayHours {
  day: string;
  open: string | null;
  close: string | null;
}

export type Status =
  | { open: true; closes: string }
  /** `inDays` 0 = later today, 1 = tomorrow; `weekday` 0 = Sunday. */
  | { open: false; opens: string; inDays: number; weekday: number };

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Weekday (0 = Sunday) and minutes since midnight on the wall clock in `timeZone`. */
export const zonedNow = (now: Date, timeZone: string): { weekday: number; minutes: number } => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return { weekday: WEEKDAYS.indexOf(parts.weekday), minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
};

/** `hours` is indexed by weekday, Sunday first (site.json). A day with `open: null` is closed. */
export const getStatus = (now: Date, hours: DayHours[], timeZone: string): Status => {
  const { weekday, minutes } = zonedNow(now, timeZone);
  const today = hours[weekday];
  if (today.open && today.close) {
    if (minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) return { open: true, closes: today.close };
    if (minutes < toMinutes(today.open)) return { open: false, opens: today.open, inDays: 0, weekday };
  }
  for (let d = 1; d <= 7; d++) {
    const w = (weekday + d) % 7;
    const open = hours[w].open;
    if (open) return { open: false, opens: open, inDays: d, weekday: w };
  }
  throw new Error("no opening hours in site.json");
};

/** "18:00" on the page's locale clock: "6:00 p.m." (en-CA), "18 h 00" (fr-CA), "18:00" (zh-Hans). */
export const formatTime = (hhmm: string, lang: string): string => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(lang, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(Date.UTC(2026, 0, 1, h, m));
};

/** Weekday name in the page language; 1 Nov 2026 is a Sunday. */
export const weekdayName = (weekday: number, lang: string, width: "long" | "short" = "long"): string =>
  new Intl.DateTimeFormat(lang, { weekday: width, timeZone: "UTC" }).format(Date.UTC(2026, 10, 1 + weekday));

export interface StatusStrings {
  open: string;
  closed: string;
  closes: string;
  opensToday: string;
  opensTomorrow: string;
  opensDay: string;
}

/** The chip's two parts, e.g. ["Open", "closes 6:00 p.m."] or ["Closed", "opens Monday 8:00 a.m."]. */
export const describeStatus = (s: Status, strings: StatusStrings, lang: string): [string, string] => {
  const fill = (tpl: string, vars: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
  if (s.open) return [strings.open, fill(strings.closes, { time: formatTime(s.closes, lang) })];
  const time = formatTime(s.opens, lang);
  const tpl = s.inDays === 0 ? strings.opensToday : s.inDays === 1 ? strings.opensTomorrow : strings.opensDay;
  return [strings.closed, fill(tpl, { time, day: weekdayName(s.weekday, lang) })];
};
