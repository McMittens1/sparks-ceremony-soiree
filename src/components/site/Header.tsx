import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLang, useT } from "@/i18n/context";
import { useActiveSection } from "@/hooks/use-active-section";

const NAV = [
  { id: "story", key: "story" as const },
  { id: "day", key: "details" as const },
  { id: "party", key: "party" as const },
  { id: "travel", key: "travel" as const },
  { id: "photos", key: "photos" as const },
  { id: "registry", key: "registry" as const },
  { id: "faq", key: "faq" as const },
];

export function Header() {
  const t = useT();
  const { lang, setLang } = useLang();
  const location = useLocation();
  const nav = useNavigate();
  const active = useActiveSection();
  const onHome = location.pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);

  // Close on route change / on escape
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function goToSection(id: string) {
    setMenuOpen(false);
    if (onHome) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    } else {
      nav({ to: "/", hash: id });
    }
  }

  return (
    <>
    <header
      className="sticky top-0 z-40 border-b border-hairline"
      style={{
        background: "rgba(248,244,236,0.94)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 lg:px-8 py-4 lg:py-5">
        <button
          onClick={() => goToSection("hero")}
          className="flex items-center gap-2 shrink-0"
          aria-label="Back to top"
        >
          <span className="font-serif italic text-[22px] text-ink" aria-hidden="true">G</span>
          <span className="diamond" aria-hidden="true" />
          <span className="font-serif italic text-[22px] text-ink" aria-hidden="true">A</span>
        </button>

        {/* Desktop nav */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-[18px] uppercase whitespace-nowrap"
          style={{ fontSize: 10, letterSpacing: "0.18em" }}
        >
          {NAV.map((n) => {
            const isActive = onHome && active === n.id;
            return (
              <button
                key={n.id}
                onClick={() => goToSection(n.id)}
                aria-current={isActive ? "location" : undefined}
                className={`nav-link relative transition-colors py-2 ${isActive ? "text-lavender-deep" : "text-ink"}`}
              >
                {t.nav[n.key]}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 bg-lavender-deep"
                    style={{ bottom: 0, height: 1 }}
                  />
                )}
              </button>
            );
          })}
          <Link
            to="/rsvp"
            search={{}}
            className="px-[18px] py-[9px] border border-ink text-ink transition-colors hover:bg-ink hover:text-ivory"
          >
            {t.nav.rsvp}
          </Link>
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="ml-1 px-1 transition-colors text-lavender-deep"
            style={{ fontSize: 10 }}
            aria-label={`${t.common.language}: ${lang === "en" ? "switch to Spanish" : "switch to English"}`}
          >
            <span aria-hidden="true">{lang === "en" ? "EN / ES" : "ES / EN"}</span>
          </button>
        </nav>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <Link
            to="/rsvp"
            search={{}}
            className="uppercase font-sans px-3 py-2 border border-ink text-ink"
            style={{ fontSize: 10, letterSpacing: "0.24em" }}
          >
            {t.nav.rsvp}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="w-10 h-10 flex flex-col items-center justify-center gap-[5px]"
          >
            <span aria-hidden className="bg-ink" style={{ width: 22, height: 1, transition: "transform 220ms ease, opacity 220ms ease", transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none" }} />
            <span aria-hidden className="bg-ink" style={{ width: 22, height: 1, transition: "opacity 220ms ease", opacity: menuOpen ? 0 : 1 }} />
            <span aria-hidden className="bg-ink" style={{ width: 22, height: 1, transition: "transform 220ms ease", transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none" }} />
          </button>
        </div>
      </div>
    </header>

    {/* Mobile menu drawer (rendered as sibling of <header> so backdrop-filter
        on the header doesn't create a containing block that clips it) */}
      <div
        aria-hidden={!menuOpen}
        className={`mobile-menu-backdrop md:hidden ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside
        id="mobile-menu"
        aria-label="Site navigation"
        className={`mobile-menu-panel md:hidden ${menuOpen ? "is-open" : ""}`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="font-serif italic text-[22px] text-ink" aria-hidden="true">G</span>
            <span className="diamond" aria-hidden="true" />
            <span className="font-serif italic text-[22px] text-ink" aria-hidden="true">A</span>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="w-10 h-10 flex items-center justify-center text-ink"
          >
            <span aria-hidden style={{ fontSize: 24, lineHeight: 1 }}>×</span>
          </button>
        </div>
        <nav aria-label="Primary" className="flex flex-col gap-5">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => goToSection(n.id)}
              className="text-left font-serif italic text-ink"
              style={{ fontSize: 26 }}
            >
              {t.nav[n.key]}
            </button>
          ))}
          <Link
            to="/rsvp"
            search={{}}
            onClick={() => setMenuOpen(false)}
            className="text-center uppercase font-sans mt-4 py-4 bg-ink text-ivory"
            style={{ fontSize: 11, letterSpacing: "0.28em" }}
          >
            {t.nav.rsvp}
          </Link>
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="mt-6 self-start uppercase text-lavender-deep"
            style={{ fontSize: 11, letterSpacing: "0.24em" }}
            aria-label={`${t.common.language}: ${lang === "en" ? "switch to Spanish" : "switch to English"}`}
          >
            {lang === "en" ? "EN / ES" : "ES / EN"}
          </button>
        </nav>
      </aside>
    </header>
  );
}
