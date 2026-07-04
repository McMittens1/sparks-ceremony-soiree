import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";
import { REGISTRY as items } from "@/lib/wedding-data";

export const Route = createFileRoute("/registry")({
  head: () => ({ meta: [
    { title: "Registry · Geovanni & Addison" },
    { name: "description", content: "Where we've registered — including a honeymoon fund and a local charity." },
    { property: "og:title", content: "Registry · Geovanni & Addison" },
    { property: "og:description", content: "Where we've registered." },
  ]}),
  component: Registry,
});

function Registry() {
  const t = useT();
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Only if you'd like</p>
        <h1 className="mt-2 font-serif text-5xl sm:text-6xl">{t.registry.title}</h1>
        <p className="mt-4 text-foreground/70 max-w-xl">{t.registry.lead}</p>
      </Reveal>
      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {items.map((it, i) => {
          const Card = (
            <div className={`block rounded-sm border border-border/70 bg-card p-6 h-full ${it.href ? "hover:border-primary transition-colors" : ""}`}>
              <div className="font-serif text-2xl text-primary">{it.name}</div>
              <p className="mt-3 text-sm text-foreground/75 leading-relaxed">{it.note}</p>
              <div className="mt-6 text-[11px] uppercase tracking-[0.2em] text-primary">
                {it.href ? "Visit →" : "Details coming soon"}
              </div>
            </div>
          );
          return (
            <Reveal key={it.name} delay={i * 80}>
              {it.href ? (
                <a href={it.href} target="_blank" rel="noopener" className="block h-full">
                  {Card}
                </a>
              ) : (
                Card
              )}
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
