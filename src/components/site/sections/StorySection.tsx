import { DiamondDivider } from "@/components/site/DiamondDivider";
import { SectionHeader } from "@/components/site/SectionHeader";
import { StoryTimeline } from "@/components/site/StoryTimeline";

export function StorySection() {
  return (
    <section
      id="story"
      className="border-t border-hairline rs-section"
      style={{ padding: "100px 64px", maxWidth: 1500, margin: "0 auto" }}
    >
      <SectionHeader
        eyebrow="II · Our Story"
        title="Our Story"
        subhead="How we got from a first hello to forever."
      />
      <DiamondDivider className="mt-9" />
      <StoryTimeline />
    </section>
  );
}
