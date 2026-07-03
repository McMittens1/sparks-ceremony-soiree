import { useT } from "@/i18n/context";
import { SITE } from "@/lib/site";

export function Footer() {
  const t = useT();
  return (
    <footer className="mt-32 border-t border-accent/20 bg-background">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12 py-12 grid gap-8 sm:grid-cols-3 items-start text-xs">
        <div>
          <div className="font-serif italic text-3xl text-primary">{SITE.coupleShort}</div>
          <div className="mt-3 tracking-[0.25em] uppercase text-muted-foreground">{SITE.venue}</div>
          <div className="mt-1 tracking-[0.25em] uppercase text-muted-foreground">{SITE.city}</div>
        </div>
        <div className="tracking-[0.25em] uppercase text-muted-foreground sm:text-center">
          10 · 10 · 26
        </div>
        <div className="tracking-[0.25em] uppercase text-muted-foreground sm:text-right">{t.footer.made}</div>
      </div>
    </footer>
  );
}
