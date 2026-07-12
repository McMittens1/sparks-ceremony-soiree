import { useT } from "@/i18n/context";

export function Footer() {
  const t = useT();
  return (
    <footer
      className="flex items-center justify-between gap-4 px-16 py-11 border-t"
      style={{ borderColor: "#E1D6C3" }}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="font-serif italic text-[26px]" style={{ color: "#2A2520" }}>G</span>
          <span className="diamond" />
          <span className="font-serif italic text-[26px]" style={{ color: "#2A2520" }}>A</span>
        </div>
        <p className="mt-2.5 uppercase" style={{ fontSize: 10, letterSpacing: "0.24em", color: "#A39680" }}>
          October · MMXXVI
        </p>
      </div>
      <p className="uppercase" style={{ fontSize: 10, letterSpacing: "0.24em", color: "#A39680" }}>
        10 · 10 · 26
      </p>
      <p className="uppercase" style={{ fontSize: 10, letterSpacing: "0.24em", color: "#A39680" }}>
        {t.footer.made}
      </p>
    </footer>
  );
}
