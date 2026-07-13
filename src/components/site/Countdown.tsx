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

/**
 * Countdown block for the redesign: four Cormorant number blocks separated by
 * italic lavender middots, plus Work Sans labels beneath.
 */
export function Countdown() {
  const target = new Date(SITE.eventDate).getTime();
  const [tick, setTick] = useState<ReturnType<typeof diff> | null>(null);
  useEffect(() => {
    setTick(diff(target));
    const id = setInterval(() => setTick(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

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
              className="font-serif italic self-center"
              style={{ fontSize: 44, color: "#8779A3" }}
              aria-hidden
            >
              ·
            </span>
          )}
          <div className="text-center">
            <div
              key={val}
              className="font-serif tabular-nums count-digit"
              style={{
                fontWeight: 500,
                fontSize: "clamp(52px, 9vw, 104px)",
                color: "#2A2520",
                lineHeight: 0.9,
              }}
            >
              {val}
            </div>
            <p
              className="uppercase mt-3.5"
              style={{ fontSize: 11, letterSpacing: "0.3em", color: "#6B5F49" }}
            >
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
