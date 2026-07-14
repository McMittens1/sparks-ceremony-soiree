import { DiamondDivider } from "@/components/site/DiamondDivider";
import { SectionHeader } from "@/components/site/SectionHeader";
import { REGISTRY } from "@/lib/wedding-data";

export function RegistrySection() {
  return (
    <section id="registry" className="border-t border-hairline rs-section">
      <SectionHeader
        eyebrow="VII · Registry"
        title="Registry"
        subhead="Your presence is the gift. If you'd like to do more, these are the places we've registered."
      />
      <DiamondDivider className="mt-9" />

      <div className="grid rs-stack-4" style={{ marginTop: 64 }}>

        {REGISTRY.map((r) => {
          const lead = r.lead === true;
          return (
            <div
              key={r.name}
              className={`flex flex-col border ${lead ? "border-lavender-deep bg-lavender-wash" : "border-hairline bg-ivory"}`}
              style={{ padding: "40px 32px" }}
            >
              <span
                className={`flex-shrink-0 ${lead ? "bg-lavender-deep" : "bg-tan"}`}
                style={{
                  width: lead ? 8 : 6,
                  height: lead ? 8 : 6,
                  transform: "rotate(45deg)",
                }}
              />
              <p
                className="font-serif italic text-ink"
                style={{ fontSize: lead ? 32 : 26, margin: "22px 0 0" }}
              >
                {r.name}
              </p>
              <p
                className="font-sans text-ink-body"
                style={{ fontSize: 14, lineHeight: 1.7, margin: "16px 0 0", flex: 1 }}
              >
                {r.note}
              </p>
              {r.href ? (
                lead ? (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener"
                    className="uppercase font-sans inline-block text-center bg-ink text-ivory border border-ink"
                    style={{
                      marginTop: 24,
                      padding: "14px 0",
                      fontSize: 10,
                      letterSpacing: "0.24em",
                    }}
                  >
                    {r.cta ?? "Visit"}
                  </a>
                ) : (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener"
                    className="uppercase font-sans inline-block self-start text-lavender-deep border-b border-lavender-deep"
                    style={{
                      marginTop: 24,
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      paddingBottom: 3,
                    }}
                  >
                    {r.cta ?? "Visit"}
                  </a>
                )
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
