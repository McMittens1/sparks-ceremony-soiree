import { useState } from "react";

const CARD_WIDTH = 232;
const CARD_HEIGHT = 388;

const DEFAULT_ATTRIBUTES: { label: string; value: string }[] = [
  { label: "Specialty", value: "Add this groomsman's specialty here." },
  { label: "Known For", value: "Add a trait or inside joke here." },
  { label: "Weakness", value: "Add a harmless flaw here." },
];

const DEFAULT_ABILITY = { name: "Signature Move", body: "Add the punchline here." };

export function GroomsmanCard({
  name,
  rarity,
  edition,
  photo,
  attributes,
  ability,
}: {
  name: string;
  rarity?: string;
  edition: string;
  photo?: string;
  attributes?: { label: string; value: string }[];
  ability?: { name: string; body: string };
}) {
  const [flipped, setFlipped] = useState(false);
  const initial = name.charAt(0);
  const attrs = attributes && attributes.length > 0 ? attributes.slice(0, 4) : DEFAULT_ATTRIBUTES;
  const move = ability ?? DEFAULT_ABILITY;

  return (
    <div className="gm-card-perspective" style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={
          flipped
            ? `Flip ${name}'s card back to the front`
            : `Flip ${name}'s card to see stats and signature move`
        }
        className={`gm-card-flip ${flipped ? "is-flipped" : ""} relative block w-full h-full text-left cursor-pointer`}
        style={{ background: "none", border: "none", padding: 0 }}
      >
        {/* Front */}
        <div
          aria-hidden={flipped}
          className="gm-card-face absolute inset-0 border border-hairline bg-ivory flex flex-col"
          style={{ padding: 8 }}
        >
          <div className="border border-gold flex-1 flex flex-col" style={{ padding: 14 }}>
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-tan" style={{ fontSize: 9, letterSpacing: "0.1em" }}>
                {edition}
              </span>
              <span
                className="font-sans uppercase text-lavender-deep"
                style={{ fontSize: 9.5, letterSpacing: "0.2em", fontWeight: 600 }}
              >
                {rarity ?? "Groomsman"}
              </span>
            </div>

            <div
              className="gm-card-photo flex-1 mt-2 flex items-center justify-center relative overflow-hidden bg-lavender-wash"
              style={{ isolation: "isolate" }}
            >
              {photo ? (
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif italic text-lavender-deep" style={{ fontSize: 52 }}>
                  {initial}
                </span>
              )}
              <div
                className="gm-card-sheen absolute inset-0"
                aria-hidden="true"
                style={{
                  pointerEvents: "none",
                  background:
                    "linear-gradient(115deg, transparent 30%, rgba(217,201,160,0.55) 48%, rgba(135,121,163,0.4) 55%, transparent 70%)",
                }}
              />
            </div>

            <p className="font-serif italic text-ink text-center" style={{ fontSize: 19, margin: "12px 0 2px" }}>
              {name}
            </p>
            <p
              className="font-sans uppercase text-tan text-center"
              style={{ fontSize: 9, letterSpacing: "0.18em", margin: 0 }}
            >
              Tap to flip →
            </p>
          </div>
        </div>

        {/* Back */}
        <div
          aria-hidden={!flipped}
          className="gm-card-face gm-card-face--back absolute inset-0 border border-hairline bg-ivory flex flex-col"
          style={{ padding: 8 }}
        >
          <div className="border border-gold flex-1 flex flex-col" style={{ padding: 14 }}>
            <p className="font-serif italic text-ink text-center" style={{ fontSize: 15, margin: "0 0 14px" }}>
              {name}
            </p>

            <div style={{ marginBottom: 12 }}>
              {attrs.map((a) => (
                <div key={a.label} style={{ marginBottom: 9 }}>
                  <p
                    className="font-sans uppercase text-tan-deep"
                    style={{ fontSize: 9, letterSpacing: "0.14em", margin: 0 }}
                  >
                    {a.label}
                  </p>
                  <p
                    className="font-serif italic text-ink-body"
                    style={{ fontSize: 12.5, margin: "2px 0 0", lineHeight: 1.4 }}
                  >
                    {a.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="border border-hairline" style={{ padding: 10, marginTop: "auto" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <span
                  className="font-sans uppercase text-ink"
                  style={{ fontSize: 10, letterSpacing: "0.12em", fontWeight: 600 }}
                >
                  {move.name}
                </span>
                <span className="flex gap-1" aria-hidden="true">
                  <span className="bg-lavender" style={{ width: 5, height: 5, transform: "rotate(45deg)" }} />
                  <span className="bg-lavender" style={{ width: 5, height: 5, transform: "rotate(45deg)" }} />
                </span>
              </div>
              <p className="font-serif italic text-ink-body" style={{ fontSize: 11.5, margin: 0, lineHeight: 1.4 }}>
                {move.body}
              </p>
            </div>

            <p
              className="font-sans uppercase text-tan text-center"
              style={{ fontSize: 9, letterSpacing: "0.18em", margin: "10px 0 0" }}
            >
              Tap to flip back →
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
