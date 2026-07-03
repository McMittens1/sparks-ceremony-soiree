import { useEffect, useRef, useState } from "react";

/** Editorial cursor: a small dot + a soft trailing ring. Desktop-only, respects reduced motion. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduced) return;
    setEnabled(true);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dot.current) dot.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
    };
    const loop = () => {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    const setHover = (v: boolean) => {
      ring.current?.classList.toggle("is-hover", v);
      dot.current?.classList.toggle("is-hover", v);
    };
    const overInteractive = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      setHover(!!target?.closest("a,button,[role='button'],input,textarea,label,iframe"));
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", overInteractive);
    raf = requestAnimationFrame(loop);
    document.documentElement.classList.add("has-custom-cursor");
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", overInteractive);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  if (!enabled) return null;
  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden />
      <div ref={dot} className="cursor-dot" aria-hidden />
    </>
  );
}
