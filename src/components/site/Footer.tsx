import { useT } from "@/i18n/context";
import { SITE } from "@/lib/site";

export function Footer() {
  const t = useT();
  return (
    <footer className="mt-24 border-t border-tan/25 bg-background">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 py-14 grid gap-8 sm:grid-cols-2 items-start">
        <div>
          <div className="font-serif italic text-4xl text-foreground leading-none">{SITE.coupleShort}</div>
          <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.35em] text-tan">
            10 · 10 · 2026 · Sparks' Barn · Louisville, NE
          </div>
        </div>
        <div className="sm:text-right font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/60">
          {t.footer.made}
        </div>
      </div>
    </footer>
  );
}
