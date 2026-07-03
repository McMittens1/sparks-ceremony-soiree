import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";

const items = [
  { name: "Zola", href: "https://zola.com", note: "Main registry — dishes, linens, the boring good stuff." },
  { name: "Honeymoon Fund", href: "#", note: "A weekend somewhere warm after the barn cools down." },
  { name: "Local charity", href: "#", note: "In lieu of a gift, a Lincoln food bank we care about." },
];

export const Route = createFileRoute("/registry")({
  head: () => ({ meta: [
    { title: "Registry · Geo & Partner" },
    { name: "description", content: "Where we've registered — including a honeymoon fund and a local charity." },
    { property: "og:title", content: "Registry · Geo & Partner" },
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
        {items.map((it, i) => (
          <Reveal key={it.name} delay={i * 80}>
            <a href={it.href} target="_blank" rel="noopener" className="block rounded-sm border border-border/70 bg-card p-6 hover:border-primary transition-colors h-full">
              <div className="font-serif text-2xl text-primary">{it.name}</div>
              <p className="mt-3 text-sm text-foreground/75 leading-relaxed">{it.note}</p>
              <div className="mt-6 text-[11px] uppercase tracking-[0.2em] text-primary">Visit →</div>
            </a>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
