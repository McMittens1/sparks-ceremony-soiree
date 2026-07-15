import { useState } from "react";
import { PARTY, type PartyMember } from "@/lib/wedding-data";
import { GroomsmanCard } from "@/components/site/GroomsmanCard";

export function WeddingParty() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  const featured = PARTY.filter((p) => p.featured);
  const bridesmaids = PARTY.filter((p) => p.role === "Bridesmaid");
  const groomsmen = PARTY.filter((p) => p.role === "Groomsman");
  const kids = PARTY.filter((p) => p.role === "Flower Girl" || p.role === "Ring Bearer");
  const ushers = PARTY.filter((p) => p.role === "Usher");

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2" style={{ margin: "0 0 24px" }}>
        <p className="uppercase font-sans text-tan-deep" style={{ fontSize: 11, letterSpacing: "0.3em" }}>
          Standing closest
        </p>
        <p className="uppercase font-sans italic text-tan" style={{ fontSize: 10, letterSpacing: "0.2em" }}>
          Tap anyone for their story →
        </p>
      </div>
      <div className="flex gap-14 flex-wrap">
        {featured.map((p) => (
          <Avatar key={p.name} p={p} size={128} isOpen={expanded === p.name} onToggle={() => toggle(p.name)} />
        ))}
      </div>

      <PartyRow label="Bridesmaids" people={bridesmaids} expanded={expanded} onToggle={toggle} />

      {groomsmen.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2" style={{ margin: "56px 0 20px" }}>
            <p className="uppercase font-sans text-tan-deep" style={{ fontSize: 11, letterSpacing: "0.3em" }}>
              Groomsmen
            </p>
            <p className="uppercase font-sans italic text-tan" style={{ fontSize: 10, letterSpacing: "0.2em" }}>
              Tap a card to flip it →
            </p>
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(232px, 1fr))", gap: 24 }}
          >
            {groomsmen.map((p, i) => (
              <GroomsmanCard
                key={p.name}
                name={p.name}
                rarity={p.cardRarity}
                edition={`${String(i + 1).padStart(2, "0")}/${String(groomsmen.length).padStart(2, "0")}`}
                photo={p.photo}
                attributes={p.cardAttributes}
                ability={p.cardAbility}
              />
            ))}
          </div>
        </>
      )}

      <PartyRow label="Down the aisle first" people={kids} expanded={expanded} onToggle={toggle} maxWidth={280} />

      {/* Ushers intentionally hidden for now — data preserved in wedding-data.ts. */}
      {false && ushers.length > 0 && (
        <div className="mt-14 pt-11 border-t border-hairline">
          <p className="uppercase font-sans mb-4 text-tan-deep" style={{ fontSize: 11, letterSpacing: "0.3em" }}>
            Ushers
          </p>
          <p className="font-sans text-ink-body" style={{ fontSize: 16, lineHeight: 1.9, maxWidth: 1100 }}>
            {ushers.map((u, i) => (
              <span key={u.name}>
                {u.name}
                {i < ushers.length - 1 && <span className="text-tan"> · </span>}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

function PartyRow({
  label,
  people,
  expanded,
  onToggle,
  maxWidth,
}: {
  label: string;
  people: PartyMember[];
  expanded: string | null;
  onToggle: (id: string) => void;
  maxWidth?: number;
}) {
  if (people.length === 0) return null;
  return (
    <>
      <p className="uppercase font-sans text-tan-deep" style={{ fontSize: 11, letterSpacing: "0.3em", margin: "56px 0 24px" }}>
        {label}
      </p>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(96px, 112px))",
          rowGap: 28,
          columnGap: 20,
          maxWidth,
        }}
      >
        {people.map((p) => (
          <Avatar key={p.name} p={p} size={80} isOpen={expanded === p.name} onToggle={() => onToggle(p.name)} />
        ))}
      </div>
    </>
  );
}

function Avatar({
  p,
  size,
  isOpen,
  onToggle,
}: {
  p: PartyMember;
  size: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isFeatured = p.featured === true;
  const initial = p.name.charAt(0);
  const fontSize = size >= 128 ? 44 : 22;
  const label = (isOpen ? "Hide note about " : "Show note about ") + p.name;
  return (
    <div className="text-center">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={label}
        className="cursor-pointer inline-block"
      >
        <div
          className={`rounded-full flex items-center justify-center mx-auto border ${isFeatured ? "border-lavender-deep" : "border-tan"}`}
          style={{
            width: size,
            height: size,
            borderWidth: isFeatured ? 1.5 : 1,
          }}
        >
          <span className={`font-serif italic ${isFeatured ? "text-lavender-deep" : "text-tan-deep"}`} style={{ fontSize }}>
            {initial}
          </span>
        </div>
        <p
          className="font-serif italic text-ink"
          style={{
            fontSize: isFeatured ? 22 : 14,
            margin: isFeatured ? "18px 0 0" : "12px 0 0",
          }}
        >
          {p.name}
        </p>
        {isFeatured && (
          <p className="uppercase font-sans text-tan-deep" style={{ fontSize: 10, letterSpacing: "0.26em", margin: "4px 0 0" }}>
            {p.role}
          </p>
        )}
      </button>
      {isOpen && (
        <p
          className="font-sans italic mx-auto text-tan"
          style={{
            fontSize: isFeatured ? 13 : 11,
            lineHeight: 1.6,
            marginTop: isFeatured ? 14 : 8,
            maxWidth: isFeatured ? 200 : undefined,
          }}
        >
          {p.note ?? `(Add a note about ${p.name} here.)`}
        </p>
      )}
    </div>
  );
}
