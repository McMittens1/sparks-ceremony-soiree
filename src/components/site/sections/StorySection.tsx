import { DiamondDivider } from "@/components/site/DiamondDivider";
import { SectionHeader } from "@/components/site/SectionHeader";
import { StoryTimeline } from "@/components/site/StoryTimeline";

export function StorySection({ numeral = "II" }: { numeral?: string }) {
  return (
    <section id="story" className="border-t border-hairline rs-section">
      <SectionHeader
        eyebrow={`${numeral} · Our Story`}
        title="Our Story"
        subhead="The short version of how all of this happened."
      />
      <DiamondDivider className="mt-9" />
      <StoryTimeline />
    </section>
  );
}
