import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";
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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Gallery</p>
        <h1 className="mt-2 font-serif text-5xl sm:text-6xl">{t.photos.title}</h1>
        <p className="mt-4 text-foreground/70 max-w-xl">{t.photos.lead}</p>
      </Reveal>

      {photos.length === 0 ? (
        <p className="mt-16 text-sm text-muted-foreground italic">{t.photos.empty}</p>
      ) : (
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((p) => (
            <a key={p.id} href={p.url} target="_blank" rel="noopener" className="block group">
              <img src={p.url} alt={p.caption ?? ""} loading="lazy" className="w-full h-auto rounded-sm object-cover aspect-square" />
              {p.caption && <p className="mt-2 text-xs text-muted-foreground">{p.caption}</p>}
            </a>
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
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))} className="mt-2 block w-full text-sm" />
          </label>
          <div aria-hidden style={{ position: "absolute", left: "-10000px", height: 0, width: 0 }}>
            <label>Website
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </label>
          </div>
          <div className="sm:col-span-2 flex items-center gap-4">
            <button type="submit" disabled={status === "uploading"} className="rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {status === "uploading" ? t.photos.uploading : t.photos.uploadCta}
            </button>
            {status === "done" && <p className="text-sm text-primary">{t.photos.uploadDone}</p>}
            {status === "error" && <p className="text-sm text-destructive">{t.rsvp.errGeneric}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
