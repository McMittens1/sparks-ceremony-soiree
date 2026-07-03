import { useEffect, useRef, type ReactNode } from "react";

type Variant = "up" | "left" | "right" | "blur" | "scale" | "mask";

export function Reveal({
  children,
  delay = 0,
  variant = "up",
  as: As = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  variant?: Variant;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
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
            setTimeout(() => el.classList.add("is-in"), delay);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  // @ts-expect-error dynamic element
  return <As ref={ref} className={`reveal reveal-${variant} ${className}`}>{children}</As>;
}
