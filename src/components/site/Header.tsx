import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/i18n/context";
import { SITE } from "@/lib/site";

const sections = [
  { id: "story", key: "story" as const },
  { id: "details", key: "details" as const },
  { id: "party", key: "party" as const },
  { id: "travel", key: "travel" as const },
  { id: "photos", key: "photos" as const },
  { id: "registry", key: "registry" as const },
  { id: "faq", key: "faq" as const },
];

export function Header() {
  const t = useT();
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const nav = useNavigate();
  const onHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function goToSection(id: string) {
    setOpen(false);
    if (onHome) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    } else {
      nav({ to: "/", hash: id });
    }
  }

  return (
    <header className={`sticky top-0 z-40 transition-all duration-500 ${scrolled ? "bg-background/90 backdrop-blur-md border-b border-accent/20" : "bg-transparent border-b border-transparent"}`}>
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 lg:px-12 py-5">
        <button
          onClick={() => goToSection("home")}
          className="flex items-baseline gap-2 group"
          aria-label="Home"
        >
          <span className="font-serif italic text-2xl text-primary tracking-tight">{SITE.coupleShort}</span>
          <span className="hidden sm:inline text-[9px] uppercase tracking-[0.35em] text-accent group-hover:text-primary transition-colors">10 · 10 · 26</span>
        </button>

        <nav className="hidden lg:flex items-center gap-4 xl:gap-8 text-[10px] uppercase tracking-[0.3em] text-foreground/70 whitespace-nowrap">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => goToSection(s.id)}
              className="hover:text-primary transition-colors relative py-2"
            >
              {t.nav[s.key]}
            </button>
          ))}
          <Link
            to="/rsvp"
            className="ml-2 border border-primary text-primary px-5 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {t.nav.rsvp}
          </Link>
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="ml-1 text-[9px] tracking-[0.3em] text-muted-foreground hover:text-primary"
            aria-label={t.common.language}
          >
            {lang === "en" ? "EN / ES" : "ES / EN"}
          </button>
        </nav>

        <button
          className="lg:hidden text-[10px] uppercase tracking-[0.3em] text-primary"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Menu"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-accent/20 bg-background animate-rise">
          <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col gap-4 text-sm">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => goToSection(s.id)}
                className="text-left py-2 uppercase tracking-[0.25em] text-xs text-foreground/80 hover:text-primary"
              >
                {t.nav[s.key]}
              </button>
            ))}
            <Link
              to="/rsvp"
              onClick={() => setOpen(false)}
              className="mt-2 self-start border border-primary text-primary px-5 py-2 text-[10px] uppercase tracking-[0.3em]"
            >
              {t.nav.rsvp}
            </Link>
            <button
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              className="self-start text-[10px] tracking-[0.3em] text-muted-foreground mt-2 uppercase"
            >
              {lang === "en" ? "Español" : "English"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
