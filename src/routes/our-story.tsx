import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/our-story")({
  head: () => ({ meta: [
    { title: "Our Story · Geo & Partner" },
    { name: "description", content: "From karaoke bar to Sparks' Barn — the short version of our story." },
    { property: "og:title", content: "Our Story · Geo & Partner" },
    { property: "og:description", content: "From karaoke bar to Sparks' Barn — the short version of our story." },
  ]}),
  component: Story,
});

function Story() {
  const t = useT();
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Chapter</p>
        <h1 className="mt-2 font-serif text-5xl sm:text-6xl">{t.story.title}</h1>
        <p className="mt-4 text-foreground/70">{t.story.lead}</p>
      </Reveal>
      <div className="mt-16 space-y-16">
        {t.story.timeline.map((item, i) => (
          <Reveal key={item.year} delay={i * 100}>
            <div className="grid grid-cols-[80px_1fr] gap-6 items-baseline border-l border-primary/30 pl-6 -ml-6">
              <div className="font-serif text-3xl text-primary">{item.year}</div>
              <p className="text-foreground/85 leading-relaxed">{item.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
