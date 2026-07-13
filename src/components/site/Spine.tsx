import { useLayoutEffect, useRef, useState } from "react";
import { useActiveSection, SPINE_SECTIONS } from "@/hooks/use-active-section";

/**
 * Persistent 52px-wide decorative rail along the left edge of the home page.
 * Includes an animated lavender bar that slides between numerals as the
 * active section changes.
 */
export function Spine() {
  const active = useActiveSection();
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [indicator, setIndicator] = useState<{ top: number; height: number; opacity: number }>({
    top: 0,
    height: 0,
    opacity: 0,
  });

  useLayoutEffect(() => {
    const list = listRef.current;
    const el = itemRefs.current[active];
    if (!list || !el) {
      setIndicator((p) => ({ ...p, opacity: 0 }));
      return;
    }
    const listRect = list.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({
      top: elRect.top - listRect.top + elRect.height / 2 - 10,
      height: 20,
      opacity: 1,
    });
  }, [active]);

  return (
    <aside
      aria-hidden="true"
      className="fixed left-0 top-0 bottom-0 w-[52px] z-50 flex flex-col items-center justify-between py-6"
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
      <div ref={listRef} className="relative flex flex-col items-center gap-[9px]">
        <span
          className="spine-indicator"
          style={{ top: indicator.top, height: indicator.height, opacity: indicator.opacity }}
        />
        {SPINE_SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <span
              key={s.id}
              ref={(el) => { itemRefs.current[s.id] = el; }}
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
