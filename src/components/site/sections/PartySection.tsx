import { DiamondDivider } from "@/components/site/DiamondDivider";
import { SectionHeader } from "@/components/site/SectionHeader";
import { WeddingParty } from "@/components/site/WeddingParty";

export function PartySection() {
  return (
    <section id="party" className="border-t border-hairline rs-section">
      <SectionHeader
        eyebrow="IV · Wedding Party"
        title="Wedding Party"
        subhead="The friends and family standing with us that night."
      />
      <DiamondDivider className="mt-9" />
      <div className="mt-16">
        <WeddingParty />
      </div>
    </section>
  );
}
