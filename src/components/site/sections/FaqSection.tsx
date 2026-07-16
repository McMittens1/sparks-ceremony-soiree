import { Link } from "@tanstack/react-router";
import { DiamondDivider } from "@/components/site/DiamondDivider";
import { SectionHeader } from "@/components/site/SectionHeader";
import { BodyProse, Eyebrow } from "@/components/site/typography";
import { FAQ_LOGISTICS, FAQ_GUESTS } from "@/lib/wedding-data";
import { SITE } from "@/lib/site";

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-hairline">
      <div className="rs-section">
        <SectionHeader
          eyebrow="VIII · FAQ"
          title="FAQ"
          subhead="The questions we've been getting most."
        />
        <DiamondDivider className="mt-9" />

        <div className="grid rs-stack-2" style={{ marginTop: 60 }}>
          {(
            [
              { title: "Logistics", items: FAQ_LOGISTICS },
              { title: "Attire & guests", items: FAQ_GUESTS },
            ] as const
          ).map((col) => (
            <div key={col.title}>
              <h3
                className="uppercase font-sans text-lavender-deep"
                style={{ margin: 0, fontSize: 11, letterSpacing: "0.3em", marginBottom: 8 }}
              >
                {col.title}
              </h3>
              {col.items.map((item, i) => (
                <details
                  key={i}
                  data-anim
                  className="border-t border-hairline"
                  style={{ padding: "20px 0" }}
                  open={item.open}
                >
                  <summary
                    className="flex justify-between gap-5 cursor-pointer font-serif italic text-ink"
                    style={{ fontSize: 21 }}
                  >
                    {item.q}
                    <span
                      aria-hidden
                      className="chev flex-shrink-0 bg-lavender"
                      style={{ width: 6, height: 6, transform: "rotate(45deg)", marginTop: 9 }}
                    />
                  </summary>
                  <div className="faq-body">
                    <BodyProse style={{ fontSize: 15, lineHeight: 1.75, margin: "14px 0 0" }}>
                      {item.a}
                    </BodyProse>
                  </div>
                </details>
              ))}
            </div>
          ))}
        </div>
        <p
          className="text-center font-serif italic text-ink-soft"
          style={{ marginTop: 56, fontSize: 16 }}
        >
          Still have a question? {SITE.rsvpFallbackContact}
        </p>
      </div>

      {/* Closing CTA */}
      <div
        className="text-center rs-section-bleed bg-lavender-wash"
        style={{ paddingBlock: "clamp(80px, 14svh, 130px)" }}
      >
        <Eyebrow color="lavender-deep" size="lg" style={{ marginBottom: 26 }}>
          See you soon
        </Eyebrow>
        <h3
          className="font-serif italic mx-auto text-ink"
          style={{
            fontWeight: 500,
            fontSize: "clamp(32px, 6vw, 60px)",
            margin: 0,
            maxWidth: 720,
            lineHeight: 1.15,
          }}
        >
          Won&rsquo;t be the same without you.
        </h3>
        <div style={{ marginTop: 44 }}>
          <Link
            to="/rsvp"
            search={{ g: undefined, t: undefined }}
            className="inline-block uppercase font-sans bg-ink text-ivory border border-ink"
            style={{ padding: "19px 44px", fontSize: 12, letterSpacing: "0.3em" }}
          >
            RSVP now
          </Link>
        </div>
        <Eyebrow color="ink-soft" style={{ marginTop: 26 }}>
          Please respond by {SITE.rsvpDeadlinePretty.en}
        </Eyebrow>
      </div>
    </section>
  );
}
