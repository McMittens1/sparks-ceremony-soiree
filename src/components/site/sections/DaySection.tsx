import { useState } from "react";
import { DATE_CARDS, DAY_SCHEDULE } from "@/lib/wedding-data";
import { DisplayHeading, Eyebrow } from "@/components/site/typography";
import barnAerial from "@/assets/venue/sparks-barn-aerial.jpg.asset.json";
import { SITE } from "@/lib/site";

const SITE_HOST = new URL(SITE.siteUrl).hostname;

// Google Calendar wants UTC "YYYYMMDDTHHMMSSZ" — Date.toISOString() is
// always UTC regardless of the ambient runtime timezone, so this is safe
// to derive directly from SITE.eventDate/eventEndDate (unlike local
// getters, which read the ambient timezone rather than the ISO string's
// own offset).
const toGCalUtc = (iso: string) =>
  new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
const GCAL_DATES = `${toGCalUtc(SITE.eventDate)}/${toGCalUtc(SITE.eventEndDate)}`;

const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SITE.address)}`;
// Split "13817 108th St, Louisville, NE 68037" into a street line and a
// city/state/zip line so the display matches SITE.address exactly instead
// of re-typing it — mirrors the same pattern used in TravelSection.tsx.
const [addressLine1, ...addressRest] = SITE.address.split(", ");

export function DaySection() {
  const [copied, setCopied] = useState(false);
  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(SITE.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }
  return (
    <section id="day" className="border-t border-hairline rs-section-bleed bg-lavender-deep">
      <div className="mx-auto" style={{ maxWidth: 1400 }}>
        <Eyebrow color="gold" size="lg" style={{ marginBottom: 18 }}>
          III · The Day
        </Eyebrow>
        <DisplayHeading color="ivory">The Day</DisplayHeading>
        <p
          className="font-serif italic"
          style={{ fontSize: 22, color: "rgba(248,244,236,0.75)", margin: "18px 0 0" }}
        >
          Everything happens at Sparks&rsquo; Barn: ceremony, dinner, dancing.
        </p>

        <div
          className="flex items-end flex-wrap"
          style={{
            marginTop: 56,
            gap: "clamp(20px, 5vw, 56px)",
            borderTop: "1px solid rgba(248,244,236,0.18)",
            paddingTop: 44,
          }}
        >
          {DATE_CARDS.map((d, i) => (
            <div key={i} className="flex items-end" style={{ gap: "clamp(20px, 5vw, 56px)" }}>
              {i > 0 && (
                <span
                  className="font-serif"
                  style={{ fontSize: 64, color: "rgba(248,244,236,0.35)", paddingBottom: 16 }}
                >
                  ·
                </span>
              )}
              <div className="text-center">
                <div
                  className="font-serif text-ivory"
                  style={{
                    fontWeight: 500,
                    fontSize: "clamp(60px, 9vw, 120px)",
                    lineHeight: 0.8,
                  }}
                >
                  {d.n}
                </div>
                <Eyebrow color="gold" size="lg" style={{ marginTop: 10 }}>
                  {d.cap}
                </Eyebrow>
              </div>
            </div>
          ))}
        </div>

        <div className="grid rs-stack" style={{ marginTop: 70 }}>
          <div>
            <Eyebrow color="gold" size="md" style={{ marginBottom: 20 }}>
              Day-of schedule
            </Eyebrow>
            {DAY_SCHEDULE.map((s, i, arr) => (
              <div
                key={i}
                className="grid items-baseline"
                style={{
                  gridTemplateColumns: "104px 1fr",
                  gap: 20,
                  padding: "16px 0",
                  borderTop: "1px solid rgba(248,244,236,0.15)",
                  borderBottom:
                    i === arr.length - 1 ? "1px solid rgba(248,244,236,0.15)" : undefined,
                }}
              >
                <span
                  className="font-serif italic text-gold"
                  style={{ fontSize: 22, whiteSpace: "nowrap" }}
                >
                  {s.time}
                </span>
                <span
                  className="font-sans"
                  style={{ fontSize: 16, color: "rgba(248,244,236,0.92)" }}
                >
                  {s.label}
                </span>
              </div>
            ))}
            <div className="flex flex-wrap gap-3" style={{ marginTop: 24 }}>
              <a
                href="/api/public/wedding.ics"
                className="uppercase font-sans inline-block"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  color: "var(--color-ivory)",
                  border: "1px solid rgba(248,244,236,0.5)",
                  padding: "10px 16px",
                }}
              >
                Add to calendar (.ics)
              </a>
              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                  `${SITE.couple} — Wedding`,
                )}&dates=${GCAL_DATES}&location=${encodeURIComponent(
                  `${SITE.venue}, ${SITE.address}`,
                )}&details=${encodeURIComponent(`The wedding of Geo & Addi. See ${SITE_HOST}.`)}`}
                target="_blank"
                rel="noopener"
                className="uppercase font-sans inline-block"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  color: "var(--color-ivory)",
                  border: "1px solid rgba(248,244,236,0.5)",
                  padding: "10px 16px",
                }}
              >
                Google Calendar
              </a>
            </div>
          </div>
          <div className="grid content-start" style={{ gap: 36 }}>
            <figure style={{ margin: 0 }}>
              <div style={{ aspectRatio: "16 / 10", overflow: "hidden" }}>
                <img
                  src={barnAerial.url}
                  alt="Sparks' Barn at sunset — aerial view of the red barn, patio, and Nebraska farmland."
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption
                className="uppercase font-sans"
                style={{
                  marginTop: 12,
                  fontSize: 10,
                  letterSpacing: "0.24em",
                  color: "rgba(248,244,236,0.6)",
                }}
              >
                Sparks&rsquo; Barn · Photo: Olsen Photography
              </figcaption>
            </figure>
            <div>
              <Eyebrow color="gold" size="md" style={{ marginBottom: 10 }}>
                Arrival &amp; Parking
              </Eyebrow>
              <p
                className="font-sans"
                style={{
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "rgba(248,244,236,0.88)",
                  margin: "0 0 14px",
                }}
              >
                {addressLine1}
                <br />
                {addressRest.join(", ")}
              </p>
              <div className="flex flex-wrap items-center gap-3" style={{ marginBottom: 14 }}>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener"
                  className="uppercase font-sans inline-block"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    color: "var(--color-ivory)",
                    border: "1px solid rgba(248,244,236,0.5)",
                    padding: "10px 16px",
                  }}
                >
                  Get directions →
                </a>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="uppercase font-sans inline-block"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    color: "var(--color-ivory)",
                    border: "1px solid rgba(248,244,236,0.5)",
                    background: "transparent",
                    padding: "10px 16px",
                  }}
                  aria-live="polite"
                >
                  {copied ? "Copied ✓" : "Copy address"}
                </button>
                <a
                  href={SITE.mapLink}
                  target="_blank"
                  rel="noopener"
                  className="uppercase font-sans inline-block"
                  style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(248,244,236,0.65)" }}
                >
                  Open in maps →
                </a>
              </div>
              <div style={{ aspectRatio: "16 / 7", overflow: "hidden", marginBottom: 14 }}>
                <iframe
                  src={SITE.mapEmbed}
                  title="Sparks' Barn on the map"
                  className="w-full h-full"
                  style={{ border: 0, filter: "grayscale(0.3) sepia(0.15) brightness(0.9)" }}
                  loading="lazy"
                />
              </div>
              <p
                className="font-sans"
                style={{
                  fontSize: 16,
                  lineHeight: 1.75,
                  color: "rgba(248,244,236,0.88)",
                  margin: 0,
                }}
              >
                Free on-site parking. You can leave a car overnight if you&rsquo;re getting a ride
                home.
              </p>
            </div>
            <div>
              <Eyebrow color="gold" size="md" style={{ marginBottom: 10 }}>
                Dress code
              </Eyebrow>
              <p
                className="font-sans"
                style={{
                  fontSize: 16,
                  lineHeight: 1.75,
                  color: "rgba(248,244,236,0.88)",
                  margin: 0,
                }}
              >
                Cocktail attire in warm neutrals, lavender, or plum. Skip the stilettos, the barn
                floor is uneven and the lawn is grass.
              </p>
            </div>
            <div>
              <Eyebrow color="gold" size="md" style={{ marginBottom: 10 }}>
                The venue
              </Eyebrow>
              <p
                className="font-sans"
                style={{
                  fontSize: 16,
                  lineHeight: 1.75,
                  color: "rgba(248,244,236,0.88)",
                  margin: 0,
                }}
              >
                Sparks&rsquo; Barn is an open-air barn on farmland outside Louisville, Nebraska. The
                ceremony happens outdoors on the lawn, then dinner and dancing move inside the barn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
