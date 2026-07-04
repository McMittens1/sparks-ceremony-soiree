import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";

const party = [
  { name: "Maria S.", role: "Maid of Honor" },
  { name: "Jordan T.", role: "Best Man" },
  { name: "Ashley R.", role: "Bridesmaid" },
  { name: "Sam L.", role: "Groomsman" },
  { name: "Priya N.", role: "Bridesmaid" },
  { name: "Diego M.", role: "Groomsman" },
];

export const Route = createFileRoute("/wedding-party")({
  head: () => ({ meta: [
    { title: "Wedding Party · Geovanni & Addison" },
    { name: "description", content: "The friends and family standing with us on October 10, 2026." },
    { property: "og:title", content: "Wedding Party · Geovanni & Addison" },
    { property: "og:description", content: "The friends and family standing with us on October 10, 2026." },
  ]}),
  component: Party,
});

function Party() {
  const t = useT();
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Beside us</p>
        <h1 className="mt-2 font-serif text-5xl sm:text-6xl">{t.party.title}</h1>
        <p className="mt-4 text-foreground/70 max-w-xl">{t.party.lead}</p>
      </Reveal>
      <Reveal delay={120}>
        <p className="mt-6 text-xs uppercase tracking-[0.35em] text-muted-foreground">Names to be announced</p>
      </Reveal>
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
        {party.map((p, i) => (
          <Reveal key={p.name} delay={i * 60}>
            <div className="aspect-[3/4] rounded-sm bg-secondary/60 border border-border/60 flex flex-col justify-end p-4 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-border/50 flex items-center justify-center font-serif text-2xl text-foreground/30">
                  {p.name.split(" ").map((n) => n[0]).join("")}
                </div>
              </div>
              <div className="relative z-10">
                <div className="font-serif text-xl">{p.name}</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{p.role}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
