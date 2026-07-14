import { DiamondDivider } from "@/components/site/DiamondDivider";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Eyebrow } from "@/components/site/typography";

export function PhotosSection() {
  return (
    <section id="photos" className="border-t border-hairline rs-section">
      <SectionHeader
        eyebrow="VI · Photos"
        title="Photos"
        subhead="A shared gallery, coming after the wedding. We'll open uploads closer to the day."
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
            Closer to the day, uploads open here so guests can send in the moments we
            missed. Everything is reviewed before it goes live.
          </p>
        </div>
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
          <div className="grid rs-stack-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div>
              <label htmlFor="photo-name" className="block">
                <Eyebrow color="tan-deep" size="sm" as="span" style={{ letterSpacing: "0.2em" }}>
                  Your name
                </Eyebrow>
              </label>
              <PhotoInput id="photo-name" type="text" autoComplete="name" />
            </div>
            <div>
              <label htmlFor="photo-email" className="block">
                <Eyebrow color="tan-deep" size="sm" as="span" style={{ letterSpacing: "0.2em" }}>
                  Email (optional)
                </Eyebrow>
              </label>
              <PhotoInput id="photo-email" type="email" autoComplete="email" />
            </div>
          </div>
          <label htmlFor="photo-caption" className="block">
            <Eyebrow color="tan-deep" size="sm" as="span" style={{ letterSpacing: "0.2em" }}>
              Caption (optional)
            </Eyebrow>
          </label>
          <PhotoInput id="photo-caption" type="text" style={{ marginBottom: 20 }} />
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
      </div>
    </section>
  );
}

function PhotoInput({
  id,
  type,
  autoComplete,
  style,
}: {
  id: string;
  type: string;
  autoComplete?: string;
  style?: React.CSSProperties;
}) {
  return (
    <input
      id={id}
      type={type}
      disabled
      autoComplete={autoComplete}
      className="font-serif text-ink border-b border-tan"
      style={{
        width: "100%",
        height: 30,
        border: "none",
        borderBottom: "1px solid var(--color-tan)",
        background: "transparent",
        fontSize: 17,
        marginTop: 8,
        ...style,
      }}
    />
  );
}
