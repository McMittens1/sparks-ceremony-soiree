import { Countdown } from "@/components/site/Countdown";
import { DiamondDivider } from "@/components/site/DiamondDivider";
import { Eyebrow } from "@/components/site/typography";

export function CountdownSection() {
  return (
    <section
      id="countdown"
      className="hidden md:block text-center border-t border-hairline"
      style={{
        paddingBlock: "clamp(56px, 8svh, 88px)",
        paddingInline: "clamp(20px, 4vw, 32px)",
      }}
    >
      <Eyebrow color="tan" size="lg" style={{ marginBottom: 40 }}>
        I · Counting Down
      </Eyebrow>
      <Countdown />
      <div className="max-w-[600px] mx-auto" style={{ marginTop: 48 }}>
        <DiamondDivider />
      </div>
    </section>
  );
}
