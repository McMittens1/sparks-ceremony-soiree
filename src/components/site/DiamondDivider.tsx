import { useEffect, useRef } from "react";

/** Hairline · diamond · hairline divider motif used to close section headers. */
export function DiamondDivider({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <div className="flex-1 h-px" style={{ background: "#E1D6C3" }} />
      <span
        ref={ref}
        aria-hidden
        className="flex-shrink-0 diamond-in"
        style={{ width: 6, height: 6, background: "#8779A3" }}
      />
      <div className="flex-1 h-px" style={{ background: "#E1D6C3" }} />
    </div>
  );
}
