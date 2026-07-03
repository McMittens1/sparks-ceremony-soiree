import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "home",     n: "01", label: "Intro" },
  { id: "story",    n: "02", label: "Story" },
  { id: "details",  n: "03", label: "The Day" },
  { id: "party",    n: "04", label: "Party" },
  { id: "travel",   n: "05", label: "Travel" },
  { id: "photos",   n: "06", label: "Photos" },
  { id: "registry", n: "07", label: "Registry" },
  { id: "faq",      n: "08", label: "FAQ" },
];

/** Fixed right-side spine: animated section indicator that tracks scroll. Desktop only. */
export function SectionRail() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id));
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.35;
      let idx = 0;
      els.forEach((el, i) => { if (el && el.offsetTop <= y) idx = i; });
      setActive(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Section progress"
      className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-4 pointer-events-auto"
    >
      {/* vertical hairline */}
      <div className="absolute right-[6px] top-0 bottom-0 w-px bg-foreground/10" aria-hidden />
      {/* traveling accent */}
      <div
        className="absolute right-[5px] w-[3px] bg-primary transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          top: `${(active / Math.max(SECTIONS.length - 1, 1)) * 100}%`,
          height: `${100 / SECTIONS.length}%`,
          transform: "translateY(-10%)",
        }}
        aria-hidden
      />
      {SECTIONS.map((s, i) => {
        const isActive = i === active;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="group relative flex items-center gap-4 pr-4"
          >
            <span
              className={`text-[9px] tracking-[0.35em] uppercase font-semibold transition-all duration-500
                ${isActive ? "text-primary opacity-100 translate-x-0" : "text-foreground/40 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`}
            >
              {s.label}
            </span>
            <span
              className={`tabular-nums text-[10px] tracking-[0.2em] transition-colors duration-500
                ${isActive ? "text-primary" : "text-foreground/40 group-hover:text-primary"}`}
            >
              {s.n}
            </span>
            <span
              className={`block w-2 h-2 rounded-full border transition-all duration-500
                ${isActive ? "bg-primary border-primary scale-125" : "bg-transparent border-foreground/30 group-hover:border-primary"}`}
              aria-hidden
            />
          </a>
        );
      })}
    </nav>
  );
}
