import { useT } from "@/i18n/context";
import { SITE } from "@/lib/site";

export function Footer() {
  const t = useT();
  return (
    <footer className="mt-24 border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-muted-foreground">
        <div>
          <div className="font-script text-2xl text-primary">G &amp; P</div>
          <div className="mt-1 text-xs tracking-[0.2em] uppercase">{SITE.venue} · {SITE.city}</div>
        </div>
        <div className="text-xs tracking-[0.2em] uppercase">{t.footer.made}</div>
      </div>
    </footer>
  );
}
