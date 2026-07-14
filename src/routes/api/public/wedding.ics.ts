import { createFileRoute } from "@tanstack/react-router";

// Fixed event details — Sparks' Barn, October 10, 2026, 5:00–11:30 PM CT.
const DTSTART = "20261010T170000";
const DTEND = "20261010T233000";
const TZID = "America/Chicago";
const SUMMARY = "Geovanni & Addison — Wedding";
const LOCATION = "Sparks' Barn, 13817 108th St, Louisville, NE 68037";
const DESCRIPTION =
  "The wedding of Geovanni Moreno and Addison Hillman. Ceremony at 5:00 PM. See morenowedding2026.com for the full schedule.";
const URL_ = "https://morenowedding2026.com";
const UID = "wedding-2026-10-10@morenowedding2026.com";

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
    `SUMMARY:${SUMMARY}`,
    `LOCATION:${LOCATION.replace(/,/g, "\\,")}`,
    `DESCRIPTION:${DESCRIPTION.replace(/,/g, "\\,")}`,
    `URL:${URL_}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export const Route = createFileRoute("/api/public/wedding/ics")({
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
