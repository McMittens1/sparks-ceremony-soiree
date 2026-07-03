import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";
import { SectionDivider } from "@/components/site/SectionDivider";
import barn from "@/assets/barn-interior.jpg";

export const Route = createFileRoute("/details")({
  head: () => ({ meta: [
    { title: "The Day · Geo & Partner" },
    { name: "description", content: "Day-of schedule, dress code, and venue notes for our wedding at Sparks' Barn." },
    { property: "og:title", content: "The Day · Geo & Partner" },
    { property: "og:description", content: "Day-of schedule, dress code, and venue notes." },
  ]}),
  component: Details,
});

function Details() {
  const t = useT();
  return (
    <div>
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-20">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary">October 10, 2026</p>
          <h1 className="mt-2 font-serif text-5xl sm:text-6xl">{t.details.title}</h1>
          <p className="mt-4 text-foreground/70 max-w-xl">{t.details.lead}</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal>
          <h2 className="font-serif text-3xl">{t.details.scheduleTitle}</h2>
        </Reveal>
        <ol className="mt-8 divide-y divide-border/60 border-y border-border/60">
          {t.details.schedule.map((s, i) => (
            <Reveal key={s.time} delay={i * 60}>
              <li className="grid grid-cols-[110px_1fr] gap-6 py-5">
                <div className="font-serif text-xl text-primary tabular-nums">{s.time}</div>
                <div className="text-foreground/85">{s.label}</div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <SectionDivider />

      <section className="mx-auto max-w-5xl px-4 sm:px-6 grid gap-10 sm:grid-cols-2 items-center">
        <Reveal>
          <img src={barn} alt="" width={1600} height={1100} loading="lazy" className="w-full h-auto rounded-sm object-cover aspect-[4/3]" />
        </Reveal>
        <Reveal delay={120}>
          <h2 className="font-serif text-3xl">{t.details.venueTitle}</h2>
          <p className="mt-4 text-foreground/80 leading-relaxed">{t.details.venueBody}</p>
          <h3 className="mt-8 font-serif text-2xl">{t.details.dressTitle}</h3>
          <p className="mt-3 text-foreground/80 leading-relaxed">{t.details.dressBody}</p>
        </Reveal>
      </section>
      <div className="h-24" />
    </div>
  );
}
