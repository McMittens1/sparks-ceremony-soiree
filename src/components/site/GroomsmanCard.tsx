import { useState } from "react";

const BASE_WIDTH = 232;
const BASE_HEIGHT = 388;

const DEFAULT_ATTRIBUTES: { label: string; value: string }[] = [
  { label: "Specialty", value: "Add this groomsman's specialty here." },
  { label: "Known For", value: "Add a trait or inside joke here." },
  { label: "Weakness", value: "Add a harmless flaw here." },
];

const DEFAULT_ABILITY = { name: "Signature Move", body: "Add the punchline here." };

export function GroomsmanCard({
  name,
  role,
  rarity,
  edition,
  photo,
  attributes,
  ability,
  scale = 1,
  legendary = false,
}: {
  name: string;
  /** Shown under the name when the rarity slot is no longer doing double duty as a role label (e.g. "Best Man" once rarity says "Legendary"). */
  role?: string;
  rarity?: string;
  edition: string;
  photo?: string;
  attributes?: { label: string; value: string }[];
  ability?: { name: string; body: string };
  /** Size multiplier — every dimension, padding, and font size scales together. */
  scale?: number;
  /** Inverts the card to an ink ground with gold-on-gold detailing — a different finish, not just a bigger card. */
  legendary?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const initial = name.charAt(0);
  const attrs = attributes && attributes.length > 0 ? attributes.slice(0, 4) : DEFAULT_ATTRIBUTES;
  const move = ability ?? DEFAULT_ABILITY;

  // Every pixel value on the card derives from this one multiplier, so a
  // "legendary" size is never a hand-duplicated variant that can drift from
  // the standard card.
  const s = (px: number) => px * scale;
  const width = s(BASE_WIDTH);
  const height = s(BASE_HEIGHT);
  const outerPad = s(8);
  const innerPad = s(14);
  const goldBorder = legendary ? Math.max(2, Math.round(s(1.5))) : 1;

  // The legendary treatment is a different finish (ink ground, gold-on-gold),
  // not a bigger version of the standard ivory card — reusing the same
  // rgba-approximation-of-gold this file already leans on for gradients
  // Tailwind utilities can't express (see the sheen overlay below).
  const goldGlow = legendary
    ? { boxShadow: "inset 0 0 0 1px rgba(217,201,160,0.35), inset 0 0 26px rgba(217,201,160,0.14)" }
    : undefined;

  return (
    <div className="gm-card-perspective" style={{ width, height }}>
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
          className={`gm-card-face absolute inset-0 border border-hairline flex flex-col ${legendary ? "bg-ink" : "bg-ivory"}`}
          style={{ padding: outerPad }}
        >
          <div
            className="border-gold flex-1 flex flex-col"
            style={{
              padding: innerPad,
              borderWidth: goldBorder,
              borderStyle: "solid",
              ...goldGlow,
            }}
          >
            <div className="flex items-baseline justify-between">
              <span
                className={`font-sans ${legendary ? "text-gold" : "text-tan"}`}
                style={{ fontSize: s(9), letterSpacing: "0.1em" }}
              >
                {edition}
              </span>
              <span
                className={`font-sans uppercase ${legendary ? "text-gold" : "text-lavender-deep"}`}
                style={{ fontSize: s(9.5), letterSpacing: "0.2em", fontWeight: 600 }}
              >
                {rarity ?? "Groomsman"}
              </span>
            </div>

            <div
              className={`gm-card-photo flex-1 flex items-center justify-center relative overflow-hidden ${legendary ? "bg-ink" : "bg-lavender-wash"}`}
              style={{ isolation: "isolate", marginTop: s(8), ...goldGlow }}
            >
              {photo ? (
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span
                  className={`font-serif italic ${legendary ? "text-gold" : "text-lavender-deep"}`}
                  style={{ fontSize: s(52) }}
                >
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

            <p
              className={`font-serif italic text-center ${legendary ? "text-ivory" : "text-ink"}`}
              style={{ fontSize: s(19), margin: `${s(12)}px 0 ${s(2)}px` }}
            >
              {name}
            </p>
            {role && (
              <p
                className={`font-sans uppercase text-center ${legendary ? "text-gold" : "text-tan-deep"}`}
                style={{ fontSize: s(9.5), letterSpacing: "0.2em", margin: `0 0 ${s(4)}px` }}
              >
                {role}
              </p>
            )}
            <p
              className={`font-sans uppercase text-center ${legendary ? "text-gold" : "text-tan"}`}
              style={{ fontSize: s(9), letterSpacing: "0.18em", margin: 0 }}
            >
              Tap to flip →
            </p>
          </div>
        </div>

        {/* Back */}
        <div
          aria-hidden={!flipped}
          className={`gm-card-face gm-card-face--back absolute inset-0 border border-hairline flex flex-col ${legendary ? "bg-ink" : "bg-ivory"}`}
          style={{ padding: outerPad }}
        >
          <div
            className="border-gold flex-1 flex flex-col"
            style={{
              padding: innerPad,
              borderWidth: goldBorder,
              borderStyle: "solid",
              ...goldGlow,
            }}
          >
            <p
              className={`font-serif italic text-center ${legendary ? "text-ivory" : "text-ink"}`}
              style={{ fontSize: s(15), margin: `0 0 ${s(14)}px` }}
            >
              {name}
            </p>

            <div style={{ marginBottom: s(12) }}>
              {attrs.map((a) => (
                <div key={a.label} style={{ marginBottom: s(9) }}>
                  <p
                    className={`font-sans uppercase ${legendary ? "text-gold" : "text-tan-deep"}`}
                    style={{ fontSize: s(9), letterSpacing: "0.14em", margin: 0 }}
                  >
                    {a.label}
                  </p>
                  <p
                    className={`font-serif italic ${legendary ? "text-ivory" : "text-ink-body"}`}
                    style={{ fontSize: s(12.5), margin: `${s(2)}px 0 0`, lineHeight: 1.4 }}
                  >
                    {a.value}
                  </p>
                </div>
              ))}
            </div>

            <div
              className={`border ${legendary ? "border-gold/40" : "border-hairline"}`}
              style={{ padding: s(10), marginTop: "auto" }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: s(4) }}>
                <span
                  className={`font-sans uppercase ${legendary ? "text-ivory" : "text-ink"}`}
                  style={{ fontSize: s(10), letterSpacing: "0.12em", fontWeight: 600 }}
                >
                  {move.name}
                </span>
                <span className="flex gap-1" aria-hidden="true">
                  <span
                    className={legendary ? "bg-gold" : "bg-lavender"}
                    style={{ width: s(5), height: s(5), transform: "rotate(45deg)" }}
                  />
                  <span
                    className={legendary ? "bg-gold" : "bg-lavender"}
                    style={{ width: s(5), height: s(5), transform: "rotate(45deg)" }}
                  />
                </span>
              </div>
              <p
                className={`font-serif italic ${legendary ? "text-ivory" : "text-ink-body"}`}
                style={{ fontSize: s(11.5), margin: 0, lineHeight: 1.4 }}
              >
                {move.body}
              </p>
            </div>

            <p
              className={`font-sans uppercase text-center ${legendary ? "text-gold" : "text-tan"}`}
              style={{ fontSize: s(9), letterSpacing: "0.18em", margin: `${s(10)}px 0 0` }}
            >
              Tap to flip back →
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
