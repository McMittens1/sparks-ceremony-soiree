import { useEffect, useCallback } from "react";

interface LightboxProps {
  photos: { url: string; caption: string | null; uploader_name: string }[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Lightbox({ photos, currentIndex, onClose, onNext, onPrev }: LightboxProps) {
  const current = photos[currentIndex];

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    },
    [onClose, onNext, onPrev],
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [handleKey]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-sm flex flex-col animate-rise"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo preview"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary px-4 py-2"
        aria-label="Close"
      >
        Close ✕
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Main image */}
      <div
        className="flex-1 flex items-center justify-center p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.url}
          alt={current.caption || `Photo by ${current.uploader_name}`}
          className="max-h-full max-w-full object-contain shadow-2xl"
        />
      </div>

      {/* Caption bar */}
      {(current.caption || current.uploader_name) && (
        <div className="border-t border-accent/20 bg-background px-6 py-4 sm:py-5 text-center">
          {current.caption && (
            <p className="font-serif italic text-lg text-foreground">{current.caption}</p>
          )}
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {current.uploader_name}
          </p>
        </div>
      )}

      {/* Navigation */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 rounded-full border border-accent/30 p-3 text-foreground/60 hover:text-primary hover:border-primary transition-colors"
            aria-label="Previous photo"
          >
            ←
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 rounded-full border border-accent/30 p-3 text-foreground/60 hover:text-primary hover:border-primary transition-colors"
            aria-label="Next photo"
          >
            →
          </button>
        </>
      )}
    </div>
  );
}
