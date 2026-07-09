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

/** A single flip-style digit that pulses when its value changes. */
function Digit({ value }: { value: string }) {
  const prev = useRef(value);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (prev.current !== value && ref.current) {
      ref.current.classList.remove("count-pulse");
      // reflow so animation restarts
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

export function Countdown() {
  const t = useT();
  const target = new Date(SITE.eventDate).getTime();
  const [tick, setTick] = useState<ReturnType<typeof diff> | null>(null);
  useEffect(() => {
    setTick(diff(target));
    const id = setInterval(() => setTick(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  const items: [number | null, string][] = [
    [tick?.d ?? null, t.home.days],
    [tick?.h ?? null, t.home.hours],
    [tick?.m ?? null, t.home.minutes],
    [tick?.s ?? null, t.home.seconds],
  ];

  return (
    <div className="mx-auto max-w-5xl grid grid-cols-4 gap-2 sm:gap-6 lg:gap-10 items-end">
      {items.map(([n, label], i) => {
        const str = n === null ? "--" : String(n).padStart(2, "0");
        return (
          <div key={label} className="min-w-0 text-center relative">
            {i > 0 && (
              <span
                aria-hidden
                className="absolute -left-1 sm:-left-3 lg:-left-5 top-1/2 -translate-y-[65%] font-serif italic text-primary-soft/40 text-3xl sm:text-5xl lg:text-6xl select-none"
              >
                ·
              </span>
            )}
            <div className="editorial-heading text-primary text-[16vw] sm:text-[13vw] md:text-[11vw] lg:text-[9rem] xl:text-[11rem] leading-[0.85]">
              <Digit value={str} />
            </div>
            <div className="mt-3 sm:mt-5 text-[9px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-muted-foreground">
              <span className="sm:hidden">{label.slice(0, 3)}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
