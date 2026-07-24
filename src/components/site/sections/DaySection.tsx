import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DATE_CARDS, DAY_SCHEDULE } from "@/lib/wedding-data";
import { DisplayHeading, Eyebrow } from "@/components/site/typography";
import { Reveal } from "@/components/site/Reveal";
import barnAerial from "@/assets/venue/sparks-barn-aerial.jpg.asset.json";
import { SITE } from "@/lib/site";
import { useAnalytics } from "@/lib/analytics";

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

const IVORY_LINE = "rgba(248,244,236,0.16)";
const IVORY_LINE_SOFT = "rgba(248,244,236,0.22)";
const IVORY_BODY = "rgba(248,244,236,0.88)";

const pillStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.22em",
  color: "var(--color-ivory)",
  border: "1px solid rgba(248,244,236,0.5)",
  padding: "10px 16px",
};

export function DaySection() {
  const track = useAnalytics();
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

  // Single IntersectionObserver for the whole schedule rail (line + every
  // dot) — one continuous timeline draw-in, not a per-row observer.
  const railRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="day" className="border-t border-hairline rs-section-bleed bg-lavender-deep">
      <div className="mx-auto" style={{ maxWidth: 1400 }}>
        <Reveal variant="blur">
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
        </Reveal>

        <div className="grid rs-stack" style={{ marginTop: 72 }}>
          {/* LEFT — bordered itinerary card: date badge + schedule rail + calendar actions.
              self-start stops this column from stretching to match the taller right
              column (CSS Grid's default align-items:stretch), which was leaving a band
              of empty background below the card's border. */}
          <Reveal variant="left" className="self-start">
            <div
              style={{
                borderTop: "2px solid var(--color-gold)",
                borderRight: `1px solid ${IVORY_LINE_SOFT}`,
                borderBottom: `1px solid ${IVORY_LINE_SOFT}`,
                borderLeft: `1px solid ${IVORY_LINE_SOFT}`,
                padding: "clamp(22px, 4vw, 40px)",
              }}
            >
              <div
                className="flex items-end flex-wrap"
                style={{
                  gap: "clamp(10px, 3vw, 20px)",
                  paddingBottom: 22,
                  marginBottom: 26,
                  borderBottom: `1px solid ${IVORY_LINE}`,
                }}
              >
                {DATE_CARDS.map((d, i) => (
                  <div key={i} className="flex items-end" style={{ gap: "clamp(10px, 3vw, 20px)" }}>
                    {i > 0 && (
                      <span
                        className="font-serif"
                        style={{ fontSize: 32, color: "rgba(248,244,236,0.35)", paddingBottom: 4 }}
                      >
                        ·
                      </span>
                    )}
                    <div>
                      <div
                        className="font-serif text-ivory"
                        style={{
                          fontWeight: 500,
                          fontSize: "clamp(36px, 8vw, 68px)",
                          lineHeight: 0.85,
                        }}
                      >
                        {d.n}
                      </div>
                      <Eyebrow color="gold" size="sm" style={{ marginTop: 6 }}>
                        {d.cap}
                      </Eyebrow>
                    </div>
                  </div>
                ))}
              </div>

              <Eyebrow color="gold" size="md" style={{ marginBottom: 20 }}>
                Day-of schedule
              </Eyebrow>

              <div ref={railRef} className="day-rail relative">
                <div
                  aria-hidden
                  className="day-rail-line absolute"
                  style={{
                    left: 8,
                    top: 4,
                    bottom: 4,
                    width: 1,
                    background: "rgba(248,244,236,0.28)",
                  }}
                />
                <ol
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    borderTop: `1px solid ${IVORY_LINE}`,
                  }}
                >
                  {DAY_SCHEDULE.map((s, i, arr) => (
                    <li
                      key={i}
                      className="relative grid items-baseline"
                      style={{
                        gridTemplateColumns: "104px 1fr",
                        gap: 20,
                        padding: "16px 0 16px 24px",
                        borderBottom: i === arr.length - 1 ? `1px solid ${IVORY_LINE}` : undefined,
                      }}
                    >
                      <span
                        aria-hidden
                        className="day-rail-dot absolute bg-gold"
                        style={{
                          left: 8,
                          top: "50%",
                          width: 6,
                          height: 6,
                          transitionDelay: `${i * 55}ms`,
                        }}
                      />
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
                    </li>
                  ))}
                </ol>
              </div>

              <p
                className="font-sans"
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "rgba(248,244,236,0.65)",
                  marginTop: 18,
                }}
              >
                Please arrive 15–30 minutes before the 3:00 PM ceremony to park and find your seat.
              </p>

              <div className="flex flex-wrap gap-3" style={{ marginTop: 20 }}>
                <a
                  href="/api/public/wedding.ics"
                  className="uppercase font-sans inline-block"
                  style={pillStyle}
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
                  style={pillStyle}
                >
                  Google Calendar
                </a>
              </div>
            </div>
          </Reveal>

          {/* RIGHT — venue photo + arrival/parking only (dress code & venue moved below) */}
          <Reveal variant="right" delay={120}>
            <div className="grid content-start" style={{ gap: 36 }}>
              <figure style={{ margin: 0 }}>
                <div style={{ aspectRatio: "16 / 9", overflow: "hidden" }}>
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
                  style={{ fontSize: 16, lineHeight: 1.7, color: IVORY_BODY, margin: "0 0 14px" }}
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
                    style={pillStyle}
                  >
                    Get directions →
                  </a>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="uppercase font-sans inline-block"
                    style={{ ...pillStyle, background: "transparent" }}
                    aria-live="polite"
                  >
                    {copied ? "Copied ✓" : "Copy address"}
                  </button>
                  <a
                    href={SITE.mapLink}
                    target="_blank"
                    rel="noopener"
                    className="uppercase font-sans inline-block"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.22em",
                      color: "rgba(248,244,236,0.65)",
                    }}
                  >
                    Open in maps →
                  </a>
                </div>
                <div style={{ aspectRatio: "16 / 6.5", overflow: "hidden", marginBottom: 14 }}>
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
                  style={{ fontSize: 16, lineHeight: 1.75, color: IVORY_BODY, margin: 0 }}
                >
                  Free on-site parking. You can leave a car overnight if you&rsquo;re getting a ride
                  home.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Divider — dark-bg hand-rolled equivalent of DiamondDivider (that component
            hardcodes bg-hairline/bg-lavender, wrong for this section's dark background) */}
        <div className="flex items-center gap-3.5" style={{ marginTop: 60 }}>
          <div style={{ flex: 1, height: 1, background: IVORY_LINE }} />
          <span
            aria-hidden
            className="diamond"
            style={{ width: 6, height: 6, background: "var(--color-gold)" }}
          />
          <div style={{ flex: 1, height: 1, background: IVORY_LINE }} />
        </div>

        {/* Footnote band — dress code + venue, promoted out of the right column stack
            into their own full-width two-up row via the shared .rs-stack-2 grid */}
        <Reveal variant="up">
          {/* rs-stack (not rs-stack-2) so these columns share the exact same grid
              math as the card/photo row above — same edges, same breakpoint. */}
          <div className="grid rs-stack" style={{ marginTop: 44 }}>
            <div>
              <Eyebrow color="gold" size="md" style={{ marginBottom: 10 }}>
                Dress code
              </Eyebrow>
              <p
                className="font-sans"
                style={{ fontSize: 16, lineHeight: 1.75, color: IVORY_BODY, margin: 0 }}
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
                style={{ fontSize: 16, lineHeight: 1.75, color: IVORY_BODY, margin: 0 }}
              >
                Sparks&rsquo; Barn is an open-air barn on farmland outside Louisville, Nebraska. The
                ceremony happens outdoors on the lawn, then dinner and dancing move inside the barn.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
