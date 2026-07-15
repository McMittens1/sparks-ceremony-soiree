import { useT } from "@/i18n/context";

export function Footer() {
  const t = useT();
  return (
    <footer className="flex items-center justify-between gap-4 px-16 py-11 border-t border-hairline">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-serif italic text-[26px] text-ink">G</span>
          <span className="diamond" />
          <span className="font-serif italic text-[26px] text-ink">A</span>
        </div>
        <p
          className="mt-2.5 uppercase text-tan-deep"
          style={{ fontSize: 10, letterSpacing: "0.24em" }}
        >
          October · 2026
        </p>
      </div>
      <p className="uppercase text-tan-deep" style={{ fontSize: 10, letterSpacing: "0.24em" }}>
        10 · 10 · 26
      </p>
      <p className="uppercase text-tan-deep" style={{ fontSize: 10, letterSpacing: "0.24em" }}>
        {t.footer.made}
      </p>
    </footer>
  );
}
