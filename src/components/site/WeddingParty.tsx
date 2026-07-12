import { useState } from "react";
import { PARTY, type PartyMember } from "@/lib/wedding-data";

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
        <p className="uppercase font-sans" style={{ fontSize: 11, letterSpacing: "0.3em", color: "#6B5F49" }}>
          Standing closest
        </p>
        <p
          className="uppercase font-sans italic"
          style={{ fontSize: 10, letterSpacing: "0.2em", color: "#A39680" }}
        >
          Tap anyone for their story →
        </p>
      </div>
      <div className="flex gap-14 flex-wrap">
        {featured.map((p) => (
          <Avatar key={p.name} p={p} size={128} isOpen={expanded === p.name} onToggle={() => toggle(p.name)} />
        ))}
      </div>

      <PartyRow label="Bridesmaids" people={bridesmaids} expanded={expanded} onToggle={toggle} />
      <PartyRow label="Groomsmen" people={groomsmen} expanded={expanded} onToggle={toggle} />
      <PartyRow label="Down the aisle first" people={kids} expanded={expanded} onToggle={toggle} maxWidth={280} />

      <div className="mt-14 pt-11 border-t" style={{ borderColor: "#E1D6C3" }}>
        <p className="uppercase font-sans mb-4" style={{ fontSize: 11, letterSpacing: "0.3em", color: "#6B5F49" }}>
          Ushers
        </p>
        <p
          className="font-sans"
          style={{ fontSize: 16, lineHeight: 1.9, color: "#4A4238", maxWidth: 1100 }}
        >
          {ushers.map((u, i) => (
            <span key={u.name}>
              {u.name}
              {i < ushers.length - 1 && <span style={{ color: "#A39680" }}> · </span>}
            </span>
          ))}
        </p>
      </div>
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
      <p
        className="uppercase font-sans"
        style={{ fontSize: 11, letterSpacing: "0.3em", color: "#6B5F49", margin: "56px 0 24px" }}
      >
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
  const borderColor = isFeatured ? "#4C4066" : "#A39680";
  const initialColor = isFeatured ? "#4C4066" : "#6B5F49";
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
          className="rounded-full flex items-center justify-center mx-auto"
          style={{
            width: size,
            height: size,
            borderWidth: isFeatured ? 1.5 : 1,
            borderStyle: "solid",
            borderColor,
          }}
        >
          <span className="font-serif italic" style={{ fontSize, color: initialColor }}>
            {initial}
          </span>
        </div>
        <p
          className="font-serif italic"
          style={{
            fontSize: isFeatured ? 22 : 14,
            color: "#2A2520",
            margin: isFeatured ? "18px 0 0" : "12px 0 0",
          }}
        >
          {p.name}
        </p>
        {isFeatured && (
          <p
            className="uppercase font-sans"
            style={{ fontSize: 10, letterSpacing: "0.26em", color: "#6B5F49", margin: "4px 0 0" }}
          >
            {p.role}
          </p>
        )}
      </button>
      {isOpen && (
        <p
          className="font-sans italic mx-auto"
          style={{
            fontSize: isFeatured ? 13 : 11,
            lineHeight: 1.6,
            color: "#A39680",
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
