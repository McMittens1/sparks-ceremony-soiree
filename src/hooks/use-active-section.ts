import { useEffect, useState } from "react";

const DEFAULT_IDS = [
  "hero",
  "countdown",
  "story",
  "day",
  "party",
  "travel",
  "photos",
  "registry",
  "faq",
];

export function useActiveSection(ids: string[] = DEFAULT_IDS): string {
  const [active, setActive] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observed: HTMLElement[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        observed.push(el);
      }
    }
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

export const SPINE_SECTIONS: { id: string; numeral: string }[] = [
  { id: "countdown", numeral: "I" },
  { id: "story", numeral: "II" },
  { id: "day", numeral: "III" },
  { id: "party", numeral: "IV" },
  { id: "travel", numeral: "V" },
  { id: "photos", numeral: "VI" },
  { id: "registry", numeral: "VII" },
  { id: "faq", numeral: "VIII" },
];
