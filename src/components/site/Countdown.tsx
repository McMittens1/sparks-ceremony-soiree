import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";

function diff(target: number) {
  const now = Date.now();
  const ms = Math.max(0, target - now);
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms % 86_400_000) / 3_600_000),
    m: Math.floor((ms % 3_600_000) / 60_000),
    s: Math.floor((ms % 60_000) / 1000),
  };
}

const pad = (n: number | null) => (n === null ? "--" : String(n).padStart(2, "0"));

// The single breakpoint where the hero's compact countdown hands off to
// the standalone "Counting Down" section. HeroSection.tsx and
// CountdownSection.tsx both import these two classes instead of each
// hardcoding an independent breakpoint literal — that's exactly how
// this broke on 2026-07-14 (one file's breakpoint drifted to md while
// the other stayed at lg, so both showed at once on tablet widths).
// Change the handoff point in exactly one place: here.
export const COUNTDOWN_HERO_VISIBLE = "lg:hidden";
export const COUNTDOWN_SECTION_VISIBLE = "hidden lg:block";

type CountdownVariant = "hero" | "section";

/**
 * Countdown block. Two variants sharing one calculation source of truth:
 * "hero" — compact 4-column bordered grid with abbreviated labels, sized
 * for HeroSection's narrower content column. "section" (default) — the
 * full-size flex/middot layout used standalone in CountdownSection.
 */
export function Countdown({ variant = "section" }: { variant?: CountdownVariant }) {
  const target = new Date(SITE.eventDate).getTime();
  const [tick, setTick] = useState<ReturnType<typeof diff> | null>(null);
  useEffect(() => {
    setTick(diff(target));
    const id = setInterval(() => setTick(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (variant === "hero") {
    const items: [string, string][] = [
      [pad(tick?.d ?? null), "Days"],
      [pad(tick?.h ?? null), "Hrs"],
      [pad(tick?.m ?? null), "Min"],
      [pad(tick?.s ?? null), "Sec"],
    ];
    return (
      <>
        <p
          className="uppercase font-sans text-tan"
          style={{
            fontSize: 9,
            letterSpacing: "0.42em",
            margin: "0 0 14px",
          }}
        >
          Counting Down
        </p>
        <div
          className="grid grid-cols-4"
          style={{
            borderTop: "1px solid rgba(42,37,32,0.18)",
            borderBottom: "1px solid rgba(42,37,32,0.18)",
          }}
        >
          {items.map(([val, label], i) => (
            <div
              key={label}
              className="text-center"
              style={{
                padding: "14px 4px 12px",
                borderLeft: i === 0 ? undefined : "1px solid rgba(42,37,32,0.14)",
              }}
            >
              <div
                className="font-serif tabular-nums text-ink"
                style={{ fontWeight: 500, fontSize: "clamp(28px, 7vw, 40px)", lineHeight: 1 }}
              >
                {val}
              </div>
              <p
                className="uppercase text-tan-deep"
                style={{ fontSize: 9, letterSpacing: "0.24em", marginTop: 8 }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </>
    );
  }

  const items: [string, string][] = [
    [pad(tick?.d ?? null), "Days"],
    [pad(tick?.h ?? null), "Hours"],
    [pad(tick?.m ?? null), "Minutes"],
    [pad(tick?.s ?? null), "Seconds"],
  ];

  return (
    <div className="flex items-baseline justify-center flex-wrap" style={{ gap: "clamp(20px, 6vw, 64px)" }}>
      {items.map(([val, label], i) => (
        <div key={label} className="flex items-baseline" style={{ gap: "clamp(20px, 6vw, 64px)" }}>
          {i > 0 && (
            <span
              className="font-serif italic self-center text-lavender"
              style={{ fontSize: 44 }}
              aria-hidden
            >
              ·
            </span>
          )}
          <div className="text-center">
            <div
              key={val}
              className="font-serif tabular-nums count-digit text-ink"
              style={{
                fontWeight: 500,
                fontSize: "clamp(52px, 9vw, 104px)",
                lineHeight: 0.9,
              }}
            >
              {val}
            </div>
            <p
              className="uppercase mt-3.5 text-tan-deep"
              style={{ fontSize: 11, letterSpacing: "0.3em" }}
            >
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
