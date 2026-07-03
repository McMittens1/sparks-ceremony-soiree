import { useEffect, useRef } from "react";

interface SplitTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  by?: "word" | "char";
  delay?: number;
  stagger?: number; // ms per unit
}

/** Splits text into words/chars wrapped in overlapping masks; each unit rises in with a stagger. */
export function SplitText({ text, className = "", as: As = "h2", by = "word", delay = 0, stagger = 60 }: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.classList.add("split-in"); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) {
        setTimeout(() => el.classList.add("split-in"), delay);
        io.disconnect();
      }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  const units = by === "word" ? text.split(/(\s+)/) : Array.from(text);

  const Tag = As as unknown as "div";
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={`split-text ${className}`} aria-label={text}>
      {units.map((u, i) => {
        if (/^\s+$/.test(u)) return <span key={i}>{u}</span>;
        return (
          <span key={i} className="split-mask" aria-hidden>
            <span className="split-unit" style={{ transitionDelay: `${i * stagger}ms`, animationDelay: `${i * stagger}ms` }}>
              {u}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
