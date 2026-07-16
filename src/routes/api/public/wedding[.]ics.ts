import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/lib/site";

// Fixed event details — Sparks' Barn, October 10, 2026, 5:00–11:30 PM CT.
const DTSTART = "20261010T170000";
const DTEND = "20261010T233000";
const TZID = "America/Chicago";
const SUMMARY = `${SITE.couple} — Wedding`;
const LOCATION = `${SITE.venue}, ${SITE.address}`;
const SITE_HOST = new URL(SITE.siteUrl).hostname;
const DESCRIPTION = `The wedding of ${SITE.partnerA} and ${SITE.partnerB}. Ceremony at 5:00 PM. See ${SITE_HOST} for the full schedule.`;
const URL_ = SITE.siteUrl;
const UID = `wedding-2026-10-10@${SITE_HOST}`;

// RFC 5545 §3.3.11 TEXT escaping: backslash, semicolon, comma, and newline.
// Backslashes must be escaped first so the other escapes aren't themselves
// re-escaped.
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// RFC 5545 §3.1 line folding: content lines over 75 octets are split by
// inserting a CRLF followed by a single leading space before continuing.
// Folds only ever happen on whole-character boundaries so a multi-byte
// UTF-8 sequence is never split across the fold.
function foldLine(line: string): string {
  const octetLength = (s: string) => new TextEncoder().encode(s).length;
  if (octetLength(line) <= 75) return line;

  const folded: string[] = [];
  let current = "";
  for (const char of line) {
    const candidate = current + char;
    if (current !== "" && octetLength(candidate) > 75) {
      folded.push(current);
      current = " " + char;
    } else {
      current = candidate;
    }
  }
  if (current) folded.push(current);
  return folded.join("\r\n");
}

function ics(): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Moreno Wedding//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    `TZID:${TZID}`,
    "BEGIN:STANDARD",
    "DTSTART:20261101T020000",
    "TZOFFSETFROM:-0500",
    "TZOFFSETTO:-0600",
    "TZNAME:CST",
    "END:STANDARD",
    "BEGIN:DAYLIGHT",
    "DTSTART:20260308T020000",
    "TZOFFSETFROM:-0600",
    "TZOFFSETTO:-0500",
    "TZNAME:CDT",
    "END:DAYLIGHT",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${UID}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${TZID}:${DTSTART}`,
    `DTEND;TZID=${TZID}:${DTEND}`,
    `SUMMARY:${escapeText(SUMMARY)}`,
    `LOCATION:${escapeText(LOCATION)}`,
    `DESCRIPTION:${escapeText(DESCRIPTION)}`,
    `URL:${URL_}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .map(foldLine)
    .join("\r\n");
}

export const Route = createFileRoute("/api/public/wedding.ics")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(ics(), {
          headers: {
            "content-type": "text/calendar; charset=utf-8",
            "content-disposition": 'inline; filename="moreno-wedding-2026.ics"',
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
