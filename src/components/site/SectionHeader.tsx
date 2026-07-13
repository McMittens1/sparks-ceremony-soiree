import { Reveal } from "@/components/site/Reveal";
import { DisplayHeading, Eyebrow, Subhead } from "@/components/site/typography";

type Color = Parameters<typeof Eyebrow>[0]["color"];

/** Standard eyebrow + display title + serif subhead used by every numbered section. */
export function SectionHeader({
  eyebrow,
  title,
  subhead,
  eyebrowColor = "tan-deep",
  titleColor = "ink",
  subheadColor = "ink-soft",
}: {
  eyebrow: string;
  title: string;
  subhead: string;
  eyebrowColor?: Color;
  titleColor?: Color;
  subheadColor?: Color;
}) {
  return (
    <Reveal variant="blur">
      <Eyebrow size="lg" color={eyebrowColor} style={{ marginBottom: 18 }}>
        {eyebrow}
      </Eyebrow>
      <DisplayHeading color={titleColor}>{title}</DisplayHeading>
      <Subhead color={subheadColor} style={{ marginTop: 18 }}>
        {subhead}
      </Subhead>
    </Reveal>
  );
}
