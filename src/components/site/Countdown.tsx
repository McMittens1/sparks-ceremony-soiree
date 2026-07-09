import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site";
import { useT } from "@/i18n/context";

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

/** A single digit block that pulses when its value changes. */
function Digit({ value }: { value: string }) {
  const prev = useRef(value);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (prev.current !== value && ref.current) {
      ref.current.classList.remove("count-pulse");
      void ref.current.offsetWidth;
      ref.current.classList.add("count-pulse");
    }
    prev.current = value;
  }, [value]);
  return (
    <span ref={ref} className="inline-block tabular-nums">
      {value}
    </span>
  );
}

/**
 * Editorial panoramic countdown — a horizontal 4-cell strip.
 * Numerals are Instrument Serif (via .font-serif), unit labels are mono.
 * The rightmost cell (seconds) subtly emphasises the live pulse via lavender label.
 */
export function Countdown() {
  const t = useT();
  const target = new Date(SITE.eventDate).getTime();
  const [tick, setTick] = useState<ReturnType<typeof diff> | null>(null);
  useEffect(() => {
    setTick(diff(target));
    const id = setInterval(() => setTick(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const items: { n: number | null; label: string; short: string; live?: boolean }[] = [
    { n: tick?.d ?? null, label: t.home.days, short: "Days" },
    { n: tick?.h ?? null, label: t.home.hours, short: "Hrs" },
    { n: tick?.m ?? null, label: t.home.minutes, short: "Min" },
    { n: tick?.s ?? null, label: t.home.seconds, short: "Sec", live: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 w-full">
      {items.map((it, i) => {
        const str = it.n === null ? "--" : it.n >= 100 ? String(it.n) : String(it.n).padStart(2, "0");
        return (
          <div
            key={it.short}
            className={`px-6 sm:px-8 py-6 sm:py-4 ${i === 0 ? "" : "md:border-l border-tan/40"} ${i < 2 ? "border-b md:border-b-0 border-tan/30" : ""}`}
          >
            <span
              className={`block font-mono text-[10px] uppercase tracking-[0.3em] mb-4 sm:mb-6 ${
                it.live ? "text-lavender" : "text-tan"
              }`}
            >
              <span className="hidden sm:inline">{it.short}</span>
              <span className="sm:hidden">{it.label.slice(0, 3)}</span>
            </span>
            <span className="font-serif text-6xl sm:text-7xl md:text-8xl text-foreground leading-none">
              <Digit value={str} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
