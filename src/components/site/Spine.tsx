import { useActiveSection, SPINE_SECTIONS } from "@/hooks/use-active-section";

/**
 * Persistent 52px-wide decorative rail along the left edge of the home page.
 * Top: lavender diamond. Middle: names in vertical writing-mode. Bottom: I–VIII
 * numerals — the current section's numeral is lit lavender-soft.
 */
export function Spine() {
  const active = useActiveSection();
  return (
    <aside
      aria-hidden="true"
      className="fixed left-0 top-0 bottom-0 w-[52px] bg-ink z-50 flex flex-col items-center justify-between py-6"
      style={{ background: "#2A2520" }}
    >
      <span className="diamond flex-shrink-0" style={{ width: 6, height: 6 }} />
      <div
        className="font-sans uppercase whitespace-nowrap"
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontSize: 9,
          letterSpacing: "0.3em",
          color: "#A39680",
        }}
      >
        Geovanni &amp; Addison · 10.10.26
      </div>
      <div className="flex flex-col items-center gap-[9px]">
        {SPINE_SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <span
              key={s.id}
              className="font-serif italic transition-all duration-300"
              style={{
                fontSize: isActive ? 13 : 11,
                color: isActive ? "#B7A6D4" : "#5A5148",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {s.numeral}
            </span>
          );
        })}
      </div>
    </aside>
  );
}
