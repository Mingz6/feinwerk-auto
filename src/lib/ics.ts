// A one-event calendar file (RFC 5545). Times are written in UTC, so no VTIMEZONE block is needed
// and every calendar app shows the slot in its own zone.

export interface IcsEvent {
  uid: string;
  start: Date;
  end: Date;
  /** DTSTAMP: when the file was made. */
  stamp: Date;
  summary: string;
  location: string;
  description: string;
}

const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
/** Backslash, semicolon, comma and newlines are escaped in TEXT values (RFC 5545 3.3.11). */
export const escapeText = (s: string): string => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Lines longer than 75 octets continue on the next line after a space (RFC 5545 3.1), never inside a character. */
export const fold = (line: string): string => {
  const enc = new TextEncoder();
  const parts: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (parts.length ? 74 : 75)) {
      parts.push(cur);
      cur = "";
    }
    cur += ch;
  }
  parts.push(cur);
  return parts.join("\r\n ");
};

export const buildIcs = (e: IcsEvent): string =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Feinwerk Auto demo//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${utc(e.stamp)}`,
    `DTSTART:${utc(e.start)}`,
    `DTEND:${utc(e.end)}`,
    `SUMMARY:${escapeText(e.summary)}`,
    `LOCATION:${escapeText(e.location)}`,
    `DESCRIPTION:${escapeText(e.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n") + "\r\n";
