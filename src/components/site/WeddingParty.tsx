import { useState } from "react";
import { PARTY, type PartyMember } from "@/lib/wedding-data";
import { GroomsmanCard } from "@/components/site/GroomsmanCard";
import { MagazineCover } from "@/components/site/MagazineCover";

export function WeddingParty() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  const moh = PARTY.find((p) => p.role === "Maid of Honor");
  const bridesmaids = PARTY.filter((p) => p.role === "Bridesmaid");
  const bestMan = PARTY.find((p) => p.role === "Best Man");
  const groomsmen = PARTY.filter((p) => p.role === "Groomsman");
  const kids = PARTY.filter((p) => p.role === "Flower Girl" || p.role === "Ring Bearer");
  const ushers = PARTY.filter((p) => p.role === "Usher");

  return (
    <div>
      <div
        className="flex items-center justify-between flex-wrap gap-2"
        style={{ margin: "0 0 20px" }}
      >
        <h3
          className="uppercase font-sans text-tan-deep"
          style={{ fontSize: 11, letterSpacing: "0.3em" }}
        >
          Bridesmaids
        </h3>
      </div>

      {moh && (
        <div className="flex justify-center" style={{ marginBottom: 40 }}>
          <MagazineCover
            name={moh.name}
            role={moh.role}
            edition="1/1"
            issueNumber="No. 01"
            photo={moh.photo}
            headline={moh.coverHeadline}
            subline={moh.coverSubline}
            scale={1.15}
            collectorsEdition
          />
        </div>
      )}

      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(232px, 232px))",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {bridesmaids.map((p, i) => (
          <MagazineCover
            key={p.name}
            name={p.name}
            role={p.role}
            edition={`${String(i + 1).padStart(2, "0")}/${String(bridesmaids.length).padStart(2, "0")}`}
            issueNumber={`No. ${String(i + 2).padStart(2, "0")}`}
            photo={p.photo}
            headline={p.coverHeadline}
            subline={p.coverSubline}
          />
        ))}
      </div>

      {groomsmen.length > 0 && (
        <>
          <div
            className="flex items-center justify-between flex-wrap gap-2"
            style={{ margin: "56px 0 20px" }}
          >
            <h3
              className="uppercase font-sans text-tan-deep"
              style={{ fontSize: 11, letterSpacing: "0.3em" }}
            >
              Groomsmen
            </h3>
            <p
              className="uppercase font-sans italic text-tan-deep"
              style={{ fontSize: 10, letterSpacing: "0.2em" }}
            >
              Tap a card to flip it →
            </p>
          </div>

          {bestMan && (
            <div className="flex justify-center" style={{ marginBottom: 40 }}>
              <GroomsmanCard
                name={bestMan.name}
                role={bestMan.role}
                rarity={bestMan.cardRarity}
                edition="1/1"
                photo={bestMan.photo}
                attributes={bestMan.cardAttributes}
                ability={bestMan.cardAbility}
                scale={1.1}
                legendary
              />
            </div>
          )}

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

      <PartyRow
        label="Down the aisle first"
        hint="Tap anyone for their story →"
        people={kids}
        expanded={expanded}
        onToggle={toggle}
        maxWidth={280}
      />

      {/* Ushers intentionally hidden for now — data preserved in wedding-data.ts. */}
      {false && ushers.length > 0 && (
        <div className="mt-14 pt-11 border-t border-hairline">
          <p
            className="uppercase font-sans mb-4 text-tan-deep"
            style={{ fontSize: 11, letterSpacing: "0.3em" }}
          >
            Ushers
          </p>
          <p
            className="font-sans text-ink-body"
            style={{ fontSize: 16, lineHeight: 1.9, maxWidth: 1100 }}
          >
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
  hint,
  people,
  expanded,
  onToggle,
  maxWidth,
}: {
  label: string;
  hint?: string;
  people: PartyMember[];
  expanded: string | null;
  onToggle: (id: string) => void;
  maxWidth?: number;
}) {
  if (people.length === 0) return null;
  return (
    <>
      <div
        className="flex items-center justify-between flex-wrap gap-2"
        style={{ margin: "56px 0 24px" }}
      >
        <p
          className="uppercase font-sans text-tan-deep"
          style={{ fontSize: 11, letterSpacing: "0.3em" }}
        >
          {label}
        </p>
        {hint && (
          <p
            className="uppercase font-sans italic text-tan-deep"
            style={{ fontSize: 10, letterSpacing: "0.2em" }}
          >
            {hint}
          </p>
        )}
      </div>
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
          <Avatar
            key={p.name}
            p={p}
            size={80}
            isOpen={expanded === p.name}
            onToggle={() => onToggle(p.name)}
          />
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
          className="rounded-full flex items-center justify-center mx-auto border border-tan-deep"
          style={{ width: size, height: size, borderWidth: 1 }}
        >
          <span className="font-serif italic text-tan-deep" style={{ fontSize }}>
            {initial}
          </span>
        </div>
        <p className="font-serif italic text-ink" style={{ fontSize: 14, margin: "12px 0 0" }}>
          {p.name}
        </p>
      </button>
      {isOpen && (
        <p
          className="font-sans italic mx-auto text-tan-deep"
          style={{ fontSize: 11, lineHeight: 1.6, marginTop: 8 }}
        >
          {p.note ?? `(Add a note about ${p.name} here.)`}
        </p>
      )}
    </div>
  );
}
