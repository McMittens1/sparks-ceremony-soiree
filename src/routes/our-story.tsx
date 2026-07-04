import { createFileRoute } from "@tanstack/react-router";
import { Reveal } from "@/components/site/Reveal";
import { SplitText } from "@/components/site/SplitText";
import { StoryTimeline } from "@/components/site/StoryTimeline";

export const Route = createFileRoute("/our-story")({
  head: () => ({
    meta: [
      { title: "Our Story · Geovanni & Addison" },
      { name: "description", content: "How Geovanni & Addison got from a first date in the Haymarket to a wedding at Sparks' Barn." },
      { property: "og:title", content: "Our Story · Geovanni & Addison" },
      { property: "og:description", content: "From a first date in the Haymarket to forever." },
    ],
  }),
  component: StoryPage,
});

function StoryPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-[40%] -right-40 h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <header className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 sm:pt-32 pb-16 text-center">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.4em] text-primary">Our Story</p>
        </Reveal>
        <SplitText
          text="From a Tuesday to forever."
          as="h1"
          by="word"
          stagger={70}
          className="mt-4 font-serif italic text-5xl sm:text-7xl md:text-8xl leading-[0.95] text-foreground"
        />
        <Reveal delay={300}>
          <p className="mx-auto mt-6 max-w-xl text-foreground/70">
            Nine chapters, one long walk toward October 10, 2026.
          </p>
          <div className="mx-auto mt-8 h-px w-24 bg-primary/40 draw-line origin-left" />
        </Reveal>
      </header>

      <div className="pb-32">
        <StoryTimeline />
      </div>
    </div>
  );
}
