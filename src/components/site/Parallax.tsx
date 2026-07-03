import { useEffect, useRef, type ReactNode } from "react";

interface ParallaxProps {
  children: ReactNode;
  speed?: number; // -1..1, negative = slower / moves opposite scroll
  className?: string;
}

/** Lightweight scroll parallax. Translates children on Y based on element position in viewport. */
export function Parallax({ children, speed = 0.15, className = "" }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress: -1 (below fold) → 0 (centered) → 1 (above fold)
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0, ${progress * speed * 100}px, 0)`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);
  return <div ref={ref} className={`will-change-transform ${className}`}>{children}</div>;
}
