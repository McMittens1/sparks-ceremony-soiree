import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";
import { Lightbox } from "@/components/site/Lightbox";
import { listApprovedPhotos, uploadGuestPhotos, type GalleryPhoto } from "@/lib/photos.functions";

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
  const upload = useServerFn(uploadGuestPhotos);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [caption, setCaption] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");

  useEffect(() => { load().then(setPhotos).catch(() => {}); }, [load]);

  async function readFile(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || files.length === 0) return;
    setStatus("uploading");
    try {
      const payload = await Promise.all(files.slice(0, 5).map(async (f) => ({
        filename: f.name, contentType: f.type, dataUrl: await readFile(f),
      })));
      await upload({ data: {
        uploaderName: name, uploaderEmail: email || null, caption: caption || null,
        honeypot: honeypot || null, files: payload,
      }});
      setStatus("done");
      setName(""); setEmail(""); setCaption(""); setFiles([]);
    } catch {
      setStatus("error");
    }
  }

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

      <div className="mt-24 rounded-sm border border-border/60 bg-card p-6 sm:p-8">
        <h2 className="font-serif text-3xl text-primary">{t.photos.uploadTitle}</h2>
        <p className="mt-2 text-sm text-foreground/70">{t.photos.uploadHint}</p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder={t.photos.uploaderName} className="rounded-sm border border-input bg-background px-3 py-2" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.photos.uploaderEmail} className="rounded-sm border border-input bg-background px-3 py-2" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={t.photos.caption} className="sm:col-span-2 rounded-sm border border-input bg-background px-3 py-2" />
          <label className="sm:col-span-2 block">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t.photos.files}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
              className="mt-2 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:bg-accent/30 file:text-foreground file:uppercase file:tracking-[0.2em] file:text-[10px]"
            />
            {files.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">{files.length} file(s) selected</p>
            )}
          </label>
          <div aria-hidden style={{ position: "absolute", left: "-10000px", height: 0, width: 0 }}>
            <label>Website
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </label>
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={status === "uploading"}
              className="rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {status === "uploading" ? t.photos.uploading : t.photos.uploadCta}
            </button>
            {status === "done" && <p className="text-sm text-primary">{t.photos.uploadDone}</p>}
            {status === "error" && <p className="text-sm text-destructive">{t.rsvp.errGeneric}</p>}
          </div>
        </form>
      </div>

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
