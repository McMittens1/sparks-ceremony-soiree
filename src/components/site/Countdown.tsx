import { useEffect, useState } from "react";
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
    <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-xl mx-auto">
      {items.map(([n, label]) => (
        <div key={label} className="text-center">
          <div className="font-serif text-4xl sm:text-6xl text-primary tabular-nums">
            {n === null ? "--" : String(n).padStart(2, "0")}

          </div>
          <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
