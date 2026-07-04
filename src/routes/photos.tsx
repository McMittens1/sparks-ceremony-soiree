import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";
import { Lightbox } from "@/components/site/Lightbox";
import { PhotoUploadModal } from "@/components/site/PhotoUploadModal";
import { listApprovedPhotos, type GalleryPhoto } from "@/lib/photos.functions";

export const Route = createFileRoute("/photos")({
  head: () => ({ meta: [
    { title: "Photos · Geovanni & Addison" },
    { name: "description", content: "Photos from our wedding day — approved by us before anything goes public." },
    { property: "og:title", content: "Photos · Geovanni & Addison" },
    { property: "og:description", content: "Photos from our wedding day." },
  ]}),
  component: PhotosPage,
});

function PhotosPage() {
  const t = useT();
  const load = useServerFn(listApprovedPhotos);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => { load().then(setPhotos).catch(() => {}); }, [load]);

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const nextPhoto = useCallback(() => {
    setLightboxIndex((i) => (i === null || photos.length === 0 ? null : (i + 1) % photos.length));
  }, [photos.length]);
  const prevPhoto = useCallback(() => {
    setLightboxIndex((i) => (i === null || photos.length === 0 ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Gallery</p>
        <h1 className="mt-2 font-serif text-5xl sm:text-6xl">{t.photos.title}</h1>
        <p className="mt-4 text-foreground/70 max-w-xl">{t.photos.lead}</p>
      </Reveal>

      {photos.length === 0 ? (
        <Reveal>
          <div className="mt-16 rounded-sm border border-dashed border-accent/40 bg-accent/5 p-10 sm:p-14 text-center">
            <p className="font-serif italic text-2xl text-primary/70">{t.photos.empty}</p>
            <p className="mt-3 text-sm text-muted-foreground">Check back after the wedding — or share your own below.</p>
          </div>
        </Reveal>
      ) : (
        <div className="mt-14 columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => openLightbox(i)}
              className="block w-full mb-3 sm:mb-4 overflow-hidden group relative rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <img
                src={p.url}
                alt={p.caption || `Photo by ${p.uploader_name}`}
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/15 transition-colors duration-500" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-24 rounded-sm border border-border/60 bg-card p-6 sm:p-8 text-center">
        <h2 className="font-serif text-3xl text-primary">{t.photos.uploadTitle}</h2>
        <p className="mt-2 text-sm text-foreground/70 max-w-md mx-auto">{t.photos.uploadHint}</p>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="mt-6 inline-flex border border-primary text-primary px-8 py-3 text-[10px] uppercase tracking-[0.3em] hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          {t.photos.uploadCta}
        </button>
      </div>

      <PhotoUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNext={nextPhoto}
          onPrev={prevPhoto}
        />
      )}
    </div>
  );
}
