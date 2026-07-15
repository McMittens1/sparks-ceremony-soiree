// Matches GroomsmanCard's BASE_WIDTH/BASE_HEIGHT exactly so the two
// "collectible" sections read as an equal-sized pair.
const BASE_WIDTH = 232;
const BASE_HEIGHT = 388;

const MASTHEAD = "SPARKS.";
const VENUE_DATELINE = "Louisville, Nebraska";
const ISSUE_DATE = "Oct '26";

// Fixed, hand-authored bar widths for the decorative barcode — must stay
// static (never Math.random()) since this page renders on the server.
const BARCODE_BARS = [16, 11, 16, 9, 16, 13, 16, 8, 16, 11];

export function MagazineCover({
  name,
  role,
  edition,
  issueNumber,
  photo,
  headline,
  subline,
  scale = 1,
  collectorsEdition = false,
}: {
  name: string;
  role: string;
  edition: string;
  issueNumber: string;
  photo?: string;
  headline?: string;
  subline?: string;
  /** Size multiplier — every font size and inset scales together, same convention as GroomsmanCard. */
  scale?: number;
  /** The Maid of Honor's treatment: the backdrop inverts to lavender-deep, a foil band, and gold corner marks. */
  collectorsEdition?: boolean;
}) {
  const initial = name.charAt(0);
  const headlineText = headline ?? `Add ${name}'s headline here.`;
  const sublineText = subline ?? `Add a personal note about ${name} here.`;
  const dateline = collectorsEdition ? `Cover Story · ${role}` : VENUE_DATELINE;

  const s = (px: number) => px * scale;
  const width = s(BASE_WIDTH);

  return (
    <div
      className={`relative overflow-hidden ${
        collectorsEdition ? "bg-lavender-deep" : "bg-linear-to-b from-ivory to-lavender-wash"
      }`}
      style={{ width, aspectRatio: `${BASE_WIDTH} / ${BASE_HEIGHT}` }}
    >
      {/* Cutout portrait — background removed, composited on the backdrop above. */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-end justify-center overflow-hidden"
        style={{ height: "80%" }}
      >
        {photo ? (
          <img
            src={photo}
            alt={`${name}, ${role}`}
            className="w-full h-full object-contain object-bottom"
          />
        ) : (
          <span
            aria-hidden="true"
            className={`font-serif italic leading-none ${collectorsEdition ? "text-gold" : "text-lavender-deep"}`}
            style={{
              fontSize: s(150),
              opacity: collectorsEdition ? 0.35 : 0.22,
              marginBottom: s(-8),
            }}
          >
            {initial}
          </span>
        )}
      </div>

      {/* Bottom scrim — guarantees the headline is legible over any cutout. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/90 via-ink/50 to-transparent"
        style={{ height: "46%" }}
      />

      {collectorsEdition && (
        <div
          className="absolute z-10 text-center bg-gold text-lavender-deep font-sans font-semibold uppercase"
          style={{
            top: s(96),
            left: s(-36),
            width: s(158),
            transform: "rotate(-38deg)",
            fontSize: s(8),
            letterSpacing: "0.14em",
            padding: `${s(3)}px 0`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          Collector&rsquo;s Ed.
        </div>
      )}

      {/* Masthead block */}
      <div className="absolute inset-x-0 top-0 text-center" style={{ padding: s(16) }}>
        <div
          className={`flex items-center justify-between font-sans uppercase ${collectorsEdition ? "text-gold" : "text-tan-deep"}`}
          style={{ fontSize: s(8), letterSpacing: "0.16em" }}
        >
          <span>
            {collectorsEdition ? "Collector's Edition" : `Wedding Special · ${issueNumber}`}
          </span>
          <span>{collectorsEdition ? issueNumber : ISSUE_DATE}</span>
        </div>
        <p
          className={`font-serif ${collectorsEdition ? "text-ivory" : "text-ink"}`}
          style={{
            fontSize: s(32),
            letterSpacing: "0.05em",
            margin: `${s(5)}px 0 0`,
            fontWeight: 400,
          }}
        >
          {MASTHEAD}
        </p>
        <p
          className={`uppercase font-sans ${collectorsEdition ? "text-gold" : "text-tan-deep"}`}
          style={{
            fontSize: s(8),
            letterSpacing: "0.22em",
            margin: `${s(3)}px 0 0`,
            opacity: collectorsEdition ? 0.85 : 1,
          }}
        >
          {dateline}
        </p>
        {collectorsEdition && (
          <div
            className="flex items-center justify-between text-gold"
            aria-hidden="true"
            style={{ fontSize: s(10), margin: `${s(6)}px 0 0` }}
          >
            <span>✦</span>
            <span>✦</span>
          </div>
        )}
      </div>

      {/* Headline block, over the scrim */}
      <div className="absolute inset-x-0 bottom-0 text-center" style={{ padding: s(16) }}>
        <p
          className="font-serif italic text-ivory"
          style={{ fontSize: s(17), lineHeight: 1.25, margin: `0 0 ${s(5)}px` }}
        >
          &ldquo;{headlineText}&rdquo;
        </p>
        <p
          className="font-sans text-ivory/80"
          style={{ fontSize: s(9.5), lineHeight: 1.42, margin: `0 0 ${s(9)}px` }}
        >
          {sublineText}
        </p>
        <div
          className="flex items-center justify-between text-gold font-sans"
          style={{
            fontSize: s(8),
            letterSpacing: "0.08em",
            paddingTop: s(7),
            borderTop: "1px solid rgba(248,244,236,0.25)",
          }}
        >
          <span>
            {role} · {edition}
          </span>
          <span className="flex items-end gap-[1.5px]" aria-hidden="true">
            {BARCODE_BARS.map((h, i) => (
              <i
                key={i}
                className="bg-gold block"
                style={{ width: 1.5, height: s(h), opacity: 0.8 }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
