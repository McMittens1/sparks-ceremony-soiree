import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { uploadGuestPhotos } from "@/lib/photos.functions";
import { useT } from "@/i18n/context";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PhotoUploadModal({ open, onClose }: Props) {
  const t = useT();
  const upload = useServerFn(uploadGuestPhotos);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [caption, setCaption] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

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
    <div className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-8 overflow-y-auto animate-rise" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-background border border-accent/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary"
        >
          {t.common.close} ✕
        </button>
        <div className="p-8 sm:p-12">
          <p className="text-[10px] uppercase tracking-[0.35em] text-accent">Guest submission</p>
          <h2 className="mt-2 editorial-heading text-4xl sm:text-5xl">{t.photos.uploadTitle}</h2>
          <p className="mt-4 text-sm text-foreground/70">{t.photos.uploadHint}</p>
          <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder={t.photos.uploaderName} className="rounded-none border-b border-border bg-transparent px-0 py-3 focus:border-primary focus:outline-none" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.photos.uploaderEmail} className="rounded-none border-b border-border bg-transparent px-0 py-3 focus:border-primary focus:outline-none" />
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={t.photos.caption} className="sm:col-span-2 rounded-none border-b border-border bg-transparent px-0 py-3 focus:border-primary focus:outline-none" />
            <label className="sm:col-span-2 block">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t.photos.files}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))} className="mt-3 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-accent/30 file:text-foreground file:uppercase file:tracking-[0.2em] file:text-[10px]" />
              {files.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{files.length} file(s) selected</p>}
            </label>
            <div aria-hidden style={{ position: "absolute", left: "-10000px", height: 0, width: 0 }}>
              <label>Website
                <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </label>
            </div>
            <div className="sm:col-span-2 flex items-center gap-4 pt-4">
              <button type="submit" disabled={status === "uploading"} className="border border-primary text-primary px-8 py-3 text-[10px] uppercase tracking-[0.3em] hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-60">
                {status === "uploading" ? t.photos.uploading : t.photos.uploadCta}
              </button>
              {status === "done" && <p className="text-sm text-primary italic">{t.photos.uploadDone}</p>}
              {status === "error" && <p className="text-sm text-destructive">{t.rsvp.errGeneric}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
