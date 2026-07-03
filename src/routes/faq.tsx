import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [
    { title: "FAQ · Geo & Partner" },
    { name: "description", content: "Answers to the most common questions about our wedding day." },
    { property: "og:title", content: "FAQ · Geo & Partner" },
    { property: "og:description", content: "Answers to the most common questions." },
  ]}),
  component: FAQ,
});

function FAQ() {
  const t = useT();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Just asking</p>
        <h1 className="mt-2 font-serif text-5xl sm:text-6xl">{t.faq.title}</h1>
        <p className="mt-4 text-foreground/70">{t.faq.lead}</p>
      </Reveal>
      <div className="mt-12 divide-y divide-border/60 border-y border-border/60">
        {t.faq.items.map((item, i) => (
          <div key={item.q} className="py-2">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left py-4 flex items-center justify-between gap-4"
              aria-expanded={open === i}
            >
              <span className="font-serif text-lg">{item.q}</span>
              <span className="text-primary text-2xl leading-none">{open === i ? "–" : "+"}</span>
            </button>
            {open === i && (
              <p className="pb-5 text-foreground/80 leading-relaxed">{item.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
