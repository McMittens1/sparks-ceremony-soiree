import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useLang, useT } from "@/i18n/context";

const links = [
  { to: "/", key: "home" as const },
  { to: "/our-story", key: "story" as const },
  { to: "/details", key: "details" as const },
  { to: "/wedding-party", key: "party" as const },
  { to: "/travel", key: "travel" as const },
  { to: "/photos", key: "photos" as const },
  { to: "/registry", key: "registry" as const },
  { to: "/faq", key: "faq" as const },
];

export function Header() {
  const t = useT();
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
        <Link to="/" className="font-script text-xl sm:text-2xl text-primary" onClick={() => setOpen(false)}>
          G &amp; P
        </Link>
        <nav className="hidden lg:flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-foreground/80">
          {links.map((l) => (
            // @ts-expect-error TanStack typed routes
            <Link key={l.to} to={l.to} className="hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>
              {t.nav[l.key]}
            </Link>
          ))}
          <Link to="/rsvp" className="rounded-full bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
            {t.nav.rsvp}
          </Link>
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="ml-2 text-[10px] tracking-[0.25em] text-muted-foreground hover:text-primary"
            aria-label={t.common.language}
          >
            {lang === "en" ? "EN · es" : "ES · en"}
          </button>
        </nav>
        <button
          className="lg:hidden text-xs uppercase tracking-[0.2em]"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Menu"
        >
          {open ? t.common.close : "Menu"}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background">
          <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-3 text-sm">
            {links.map((l) => (
              // @ts-expect-error
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="py-1" activeProps={{ className: "text-primary" }}>
                {t.nav[l.key]}
              </Link>
            ))}
            <Link to="/rsvp" onClick={() => setOpen(false)} className="mt-2 self-start rounded-full bg-primary px-4 py-2 text-primary-foreground">
              {t.nav.rsvp}
            </Link>
            <button
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              className="self-start text-[10px] tracking-[0.25em] text-muted-foreground mt-2"
            >
              {lang === "en" ? "Español" : "English"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
