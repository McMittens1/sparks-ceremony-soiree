import { ResponsiveImg } from "@/components/site/ResponsiveImg";
import { useState } from "react";
import { DiamondDivider } from "@/components/site/DiamondDivider";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Reveal } from "@/components/site/Reveal";
import { Lightbox } from "@/components/site/Lightbox";
import { PORTRAITS } from "@/lib/portrait-gallery";
import { useT } from "@/i18n/context";

/**
 * Standalone gallery of the professional engagement-portrait session. Separate
 * from Our Story (whose photos are temporary placeholders) and from the
 * Section 05 proposal photos.
 */
export function PortraitsSection({ numeral = "III" }: { numeral?: string }) {
  const t = useT();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="portraits" className="border-t border-hairline rs-section">
      <SectionHeader
        eyebrow={`${numeral} · ${t.nav.portraits}`}
        title={t.portraits.title}
        subhead={t.portraits.subhead}
      />
      <DiamondDivider className="mt-9" />

      <div
        className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:gap-4"
        style={{ marginTop: 56 }}
      >
        {PORTRAITS.map((photo, i) => (
          <Reveal key={photo.key} variant="up" delay={(i % 3) * 70}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={t.portraits.openPhoto.replace("{n}", String(i + 1))}
              className="group relative block w-full aspect-[4/5] overflow-hidden photo-zoom border border-hairline"
              style={{ padding: 0, lineHeight: 0, minHeight: 44 }}
            >
              <ResponsiveImg
                sizes="(min-width: 1024px) 33vw, 50vw"
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading={i < 3 ? "eager" : "lazy"}
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </button>
          </Reveal>
        ))}
      </div>

      {open !== null && (
        <Lightbox
          photos={PORTRAITS}
          index={open}
          onClose={() => setOpen(null)}
          onIndexChange={setOpen}
          labels={{
            close: t.common.close,
            prev: t.portraits.prev,
            next: t.portraits.next,
            counter: (a, b) => t.portraits.counter.replace("{a}", String(a)).replace("{b}", String(b)),
          }}
        />
      )}
    </section>
  );
}
