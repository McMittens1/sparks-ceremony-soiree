import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { DiamondDivider } from "@/components/site/DiamondDivider";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Eyebrow } from "@/components/site/typography";
import { useFeatureFlag } from "@/hooks/use-feature-flags";
import { uploadGuestPhotos, listApprovedPhotos, type GalleryPhoto } from "@/lib/photos.functions";

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function PhotosSection() {
  const { enabled: uploadsOpen } = useFeatureFlag("guest_photo_uploads");

  return (
    <section id="photos" className="border-t border-hairline rs-section">
      <SectionHeader
        eyebrow="VI · Photos"
        title="Photos"
        subhead={
          uploadsOpen
            ? "A shared gallery, from your eyes. Everything is reviewed before it goes live."
            : "A shared gallery, coming after the wedding. We'll open uploads closer to the day."
        }
      />
      <DiamondDivider className="mt-9" />

      <div className="grid rs-stack" style={{ marginTop: 64 }}>
        <div className="flex flex-col justify-center">
          <span
            className="flex-shrink-0 bg-lavender"
            style={{ width: 10, height: 10, transform: "rotate(45deg)" }}
          />
          <p
            className="font-serif italic text-ink"
            style={{ fontSize: 30, margin: "24px 0 0", lineHeight: 1.3 }}
          >
            A shared gallery, from your eyes.
          </p>
          <p
            className="font-sans text-ink-soft"
            style={{ fontSize: 15, lineHeight: 1.75, margin: "20px 0 0", maxWidth: 420 }}
          >
            {uploadsOpen
              ? "Upload here so guests can send in the moments we missed. Everything is reviewed before it goes live."
              : "Closer to the day, uploads open here so guests can send in the moments we missed. Everything is reviewed before it goes live."}
          </p>
        </div>
        {uploadsOpen ? <UploadFormLive /> : <UploadFormComingSoon />}
      </div>

      {uploadsOpen && <ApprovedGallery />}
    </section>
  );
}

function UploadFormComingSoon() {
  return (
    <form
      className="border border-hairline"
      style={{ padding: 40 }}
      aria-labelledby="photo-share-heading"
      onSubmit={(e) => e.preventDefault()}
    >
      <Eyebrow color="lavender-deep" style={{ marginBottom: 10 }} as="p">
        <span id="photo-share-heading">Share a photo</span>
      </Eyebrow>
      <p className="font-sans text-ink-soft" style={{ fontSize: 14, lineHeight: 1.7, margin: "0 0 26px" }}>
        Up to 5 images, JPG or PNG, 10 MB each. Nothing goes public until we approve it.
      </p>
      <div className="grid rs-stack-2" style={{ marginBottom: 20 }}>
        <div>
          <label htmlFor="photo-name" className="block">
            <Eyebrow color="tan-deep" size="sm" as="span" style={{ letterSpacing: "0.2em" }}>
              Your name
            </Eyebrow>
          </label>
          <PhotoInput id="photo-name" type="text" autoComplete="name" disabled />
        </div>
        <div>
          <label htmlFor="photo-email" className="block">
            <Eyebrow color="tan-deep" size="sm" as="span" style={{ letterSpacing: "0.2em" }}>
              Email (optional)
            </Eyebrow>
          </label>
          <PhotoInput id="photo-email" type="email" autoComplete="email" disabled />
        </div>
      </div>
      <label htmlFor="photo-caption" className="block">
        <Eyebrow color="tan-deep" size="sm" as="span" style={{ letterSpacing: "0.2em" }}>
          Caption (optional)
        </Eyebrow>
      </label>
      <PhotoInput id="photo-caption" type="text" style={{ marginBottom: 20 }} disabled />
      <div
        className="text-center"
        style={{
          border: "1px dashed #C9BB9F",
          background: "#EFE9DD",
          padding: 26,
          marginBottom: 22,
        }}
        aria-hidden="true"
      >
        <Eyebrow color="tan-deep" size="md" as="span" style={{ letterSpacing: "0.2em" }}>
          Choose photos
        </Eyebrow>
      </div>
      <button
        type="submit"
        className="block w-full text-center uppercase font-sans bg-ink text-ivory"
        style={{
          padding: "15px 0",
          fontSize: 11,
          letterSpacing: "0.24em",
          border: "none",
          cursor: "not-allowed",
          opacity: 0.7,
        }}
        aria-label="Upload photo — not yet available, opens closer to the wedding"
        disabled
      >
        Upload
      </button>
      <p
        className="font-sans text-ink-soft text-center"
        style={{ fontSize: 12, marginTop: 12 }}
      >
        Uploads open closer to the wedding.
      </p>
    </form>
  );
}

function UploadFormLive() {
  const runUpload = useServerFn(uploadGuestPhotos);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [caption, setCaption] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<{ uploaded: number; total: number } | null>(null);

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length > MAX_FILES) {
      setError(`Choose up to ${MAX_FILES} photos.`);
      setFiles([]);
      e.target.value = "";
      return;
    }
    const oversize = picked.find((f) => f.size > MAX_FILE_BYTES);
    if (oversize) {
      setError(`${oversize.name} is over 10 MB.`);
      setFiles([]);
      e.target.value = "";
      return;
    }
    setError(null);
    setFiles(picked);
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Your name is required.");
      return;
    }
    if (files.length === 0) {
      setError("Choose at least one photo.");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      const encoded = await Promise.all(
        files.map(async (f) => ({
          filename: f.name,
          contentType: f.type,
          dataUrl: await fileToDataUrl(f),
        })),
      );
      const result = await runUpload({
        data: {
          uploaderName: name.trim(),
          uploaderEmail: email.trim() || undefined,
          caption: caption.trim() || undefined,
          honeypot: honeypot || undefined,
          files: encoded,
        },
      });
      setUploadSummary({ uploaded: result.uploaded, total: encoded.length });
      setStatus("done");
      setName("");
      setEmail("");
      setCaption("");
      setFiles([]);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="border border-hairline text-center" style={{ padding: 40 }}>
        <p className="font-serif italic text-ink" style={{ fontSize: 22 }}>
          Thank you!
        </p>
        <p className="font-sans text-ink-soft" style={{ fontSize: 14, marginTop: 10 }}>
          Your photos are in — we&rsquo;ll take a look before they go live.
        </p>
        {uploadSummary && uploadSummary.uploaded < uploadSummary.total && (
          <p className="font-sans" style={{ fontSize: 12, color: "#7a2f26", marginTop: 10 }}>
            {uploadSummary.uploaded} of {uploadSummary.total} photos made it through — the rest may
            have failed. Feel free to try those again.
          </p>
        )}
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="uppercase font-sans text-lavender-deep"
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            marginTop: 20,
            borderBottom: "1px solid var(--color-lavender-deep)",
            paddingBottom: 3,
          }}
        >
          Share more
        </button>
      </div>
    );
  }

  return (
    <form
      className="border border-hairline"
      style={{ padding: 40 }}
      aria-labelledby="photo-share-heading"
      onSubmit={onSubmit}
    >
      <Eyebrow color="lavender-deep" style={{ marginBottom: 10 }} as="p">
        <span id="photo-share-heading">Share a photo</span>
      </Eyebrow>
      <p className="font-sans text-ink-soft" style={{ fontSize: 14, lineHeight: 1.7, margin: "0 0 26px" }}>
        Up to 5 images, JPG or PNG, 10 MB each. Nothing goes public until we approve it.
      </p>
      <div className="grid rs-stack-2" style={{ marginBottom: 20 }}>
        <div>
          <label htmlFor="photo-name" className="block">
            <Eyebrow color="tan-deep" size="sm" as="span" style={{ letterSpacing: "0.2em" }}>
              Your name
            </Eyebrow>
          </label>
          <PhotoInput
            id="photo-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="photo-email" className="block">
            <Eyebrow color="tan-deep" size="sm" as="span" style={{ letterSpacing: "0.2em" }}>
              Email (optional)
            </Eyebrow>
          </label>
          <PhotoInput
            id="photo-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <label htmlFor="photo-caption" className="block">
        <Eyebrow color="tan-deep" size="sm" as="span" style={{ letterSpacing: "0.2em" }}>
          Caption (optional)
        </Eyebrow>
      </label>
      <PhotoInput
        id="photo-caption"
        type="text"
        style={{ marginBottom: 20 }}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      {/* Honeypot: hidden from sighted/keyboard users, some bots fill it anyway. */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
      />

      <label
        htmlFor="photo-files"
        className="block text-center"
        style={{
          border: "1px dashed #C9BB9F",
          background: "#EFE9DD",
          padding: 26,
          marginBottom: 22,
          cursor: "pointer",
          position: "relative",
        }}
      >
        <Eyebrow color="tan-deep" size="md" as="span" style={{ letterSpacing: "0.2em" }}>
          {files.length > 0 ? `${files.length} photo${files.length > 1 ? "s" : ""} selected` : "Choose photos"}
        </Eyebrow>
        <input
          id="photo-files"
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={onFilesChange}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
        />
      </label>

      {error && (
        <p className="font-sans" style={{ fontSize: 12, color: "#7a2f26", marginBottom: 14 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="block w-full text-center uppercase font-sans bg-ink text-ivory"
        style={{
          padding: "15px 0",
          fontSize: 11,
          letterSpacing: "0.24em",
          border: "none",
          opacity: status === "submitting" ? 0.7 : 1,
        }}
      >
        {status === "submitting" ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}

function ApprovedGallery() {
  const loadPhotos = useServerFn(listApprovedPhotos);
  const [photos, setPhotos] = useState<GalleryPhoto[] | null>(null);

  useEffect(() => {
    loadPhotos({}).then(setPhotos).catch(() => setPhotos([]));
  }, [loadPhotos]);

  if (!photos || photos.length === 0) return null;

  return (
    <div style={{ marginTop: 56 }}>
      <Eyebrow color="tan-deep" size="sm" as="p" style={{ letterSpacing: "0.2em", marginBottom: 18 }}>
        From our guests
      </Eyebrow>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
        {photos.map((p) => (
          <div key={p.id} className="aspect-square photo-zoom">
            <img
              src={p.url}
              alt={p.caption ?? `Photo from ${p.uploader_name}`}
              loading="lazy"
              className="w-full h-full object-cover border border-hairline"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoInput({
  id,
  type,
  autoComplete,
  style,
  disabled,
  required,
  value,
  onChange,
}: {
  id: string;
  type: string;
  autoComplete?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      id={id}
      type={type}
      disabled={disabled}
      required={required}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      className="font-serif text-ink border-b border-tan-deep"
      style={{
        width: "100%",
        height: 30,
        border: "none",
        borderBottom: "1px solid var(--color-tan-deep)",
        background: "transparent",
        fontSize: 17,
        marginTop: 8,
        ...style,
      }}
    />
  );
}
