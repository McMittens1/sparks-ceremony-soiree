export const SITE = {
  couple: "Geovanni & Addison",
  coupleShort: "G & A",
  // Absolute production URL, used to build canonical links and og:url/twitter:image values.
  siteUrl: "https://morenowedding2026.com",
  partnerA: "Geovanni Moreno",
  partnerB: "Addison Hillman",
  venue: "Sparks' Barn",
  city: "Louisville, Nebraska",
  address: "13817 108th St, Louisville, NE 68037",
  eventDate: "2026-10-10T17:00:00-05:00",
  eventDatePretty: { en: "October 10, 2026", es: "10 de octubre de 2026" },
  mapEmbed:
    "https://www.google.com/maps?q=13817+108th+St,+Louisville,+NE+68037&output=embed",
  mapLink: "https://www.google.com/maps/search/?api=1&query=13817+108th+St%2C+Louisville%2C+NE+68037",
  // RSVP is handled on-site at /rsvp.
  rsvpUrl: "/rsvp",
  // Deadline for the RSVP soft cutoff (still accepts after, but shows a late notice).
  rsvpDeadline: "2026-09-15T23:59:59-05:00",
  // Shown when a guest can't find their name in the lookup. Update to your preferred contact.
  rsvpFallbackContact: "Text Addi or Geo directly — we'll get you sorted.",
} as const;
