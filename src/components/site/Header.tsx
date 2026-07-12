import { Link, useLocation, useNavigate } from "@tanstack/react-router";
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

  function goToSection(id: string) {
    if (onHome) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    } else {
      nav({ to: "/", hash: id });
    }
  }

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "rgba(248,244,236,0.94)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderColor: "#E1D6C3",
      }}
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between px-8 py-5">
        <button
          onClick={() => goToSection("hero")}
          className="flex items-center gap-2"
          aria-label="Home"
        >
          <span className="font-serif italic text-[22px]" style={{ color: "#2A2520" }}>G</span>
          <span className="diamond" />
          <span className="font-serif italic text-[22px]" style={{ color: "#2A2520" }}>A</span>
        </button>

        <nav className="flex items-center gap-[22px] uppercase whitespace-nowrap" style={{ fontSize: 10, letterSpacing: "0.18em" }}>
          {NAV.map((n) => {
            const isActive = onHome && active === n.id;
            return (
              <button
                key={n.id}
                onClick={() => goToSection(n.id)}
                className="transition-colors py-2"
                style={{ color: isActive ? "#8779A3" : "#4A4238" }}
              >
                {t.nav[n.key]}
              </button>
            );
          })}
          <Link
            to="/rsvp"
            search={{}}
            className="px-[18px] py-[9px] border transition-colors hover:bg-ink hover:text-ivory"
            style={{ borderColor: "#2A2520", color: "#2A2520" }}
          >
            {t.nav.rsvp}
          </Link>
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="ml-1 px-1 transition-colors hover:text-ink"
            style={{ fontSize: 9, color: "#A39680" }}
            aria-label={t.common.language}
          >
            {lang === "en" ? "EN / ES" : "ES / EN"}
          </button>
        </nav>
      </div>
    </header>
  );
}
