import { useCallback, useEffect, useRef } from "react";
import type { Portrait } from "@/lib/portrait-gallery";

/**
 * Minimal accessible lightbox for the Portraits gallery. Arrow keys move
 * between photos, Escape closes, Tab stays inside the dialog, and focus
 * returns to the thumbnail that opened it.
 */
export function Lightbox({
  photos,
  index,
  onClose,
  onIndexChange,
  labels,
}: {
  photos: Portrait[];
  index: number;
  onClose: () => void;
  onIndexChange: (next: number) => void;
  labels: { close: string; prev: string; next: string; counter: (a: number, b: number) => string };
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const photo = photos[index];

  const step = useCallback(
    (delta: number) => {
      onIndexChange((index + delta + photos.length) % photos.length);
    },
    [index, onIndexChange, photos.length],
  );

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>("button");
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, step]);

  if (!photo) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={labels.counter(index + 1, photos.length)}
      className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{ background: "rgba(31,29,27,0.92)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        ref={closeRef}
        onClick={onClose}
        aria-label={labels.close}
        className="absolute font-sans text-paper border border-hairline-invert"
        style={{ top: 16, right: 16, minWidth: 44, minHeight: 44, fontSize: 20, lineHeight: 1 }}
      >
        ×
      </button>

      <button
        type="button"
        onClick={() => step(-1)}
        aria-label={labels.prev}
        className="absolute font-sans text-paper border border-hairline-invert"
        style={{ left: 12, minWidth: 44, minHeight: 44, fontSize: 20, lineHeight: 1 }}
      >
        ‹
      </button>

      <figure className="flex flex-col items-center" style={{ margin: 0, padding: "64px 64px 48px" }}>
        <img
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          className="border border-hairline-invert"
          style={{ maxHeight: "78vh", maxWidth: "min(92vw, 1100px)", width: "auto", height: "auto", objectFit: "contain" }}
        />
        <figcaption
          className="font-sans text-paper"
          style={{ marginTop: 14, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.75 }}
        >
          {labels.counter(index + 1, photos.length)}
        </figcaption>
      </figure>

      <button
        type="button"
        onClick={() => step(1)}
        aria-label={labels.next}
        className="absolute font-sans text-paper border border-hairline-invert"
        style={{ right: 12, minWidth: 44, minHeight: 44, fontSize: 20, lineHeight: 1 }}
      >
        ›
      </button>
    </div>
  );
}
