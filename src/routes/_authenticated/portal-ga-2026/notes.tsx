import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useT } from "@/i18n/context";
import { listGuestsWithRsvps, type AdminGuestRow } from "@/lib/rsvp.functions";
import { isTestHousehold } from "@/lib/test-data";
import { escCsv, downloadCsv } from "@/lib/csv";
import { DiamondDivider } from "@/components/site/DiamondDivider";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/portal-ga-2026/notes")({
  head: () => ({
    meta: [
      { title: "Notes & song requests · Geo & Addison" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: NotesPage,
});

// Print rules stay with the page: they only ever apply here, and a printed
// copy has to read cleanly on white paper without the app chrome.
const PRINT_CSS = `
@media print {
  @page { margin: 14mm; }
  html, body { background: #fff !important; }
  .no-print, header, footer, nav, a[href="#main-content"] { display: none !important; }
  .report-section h2 { break-after: avoid; }
  tr, .report-card { break-inside: avoid; }
  a[href]:after { content: none !important; }
}
`;

type Entry = {
  id: string;
  household: string;
  status: string;
  submitted: string;
  song: string;
  note: string;
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function NotesPage() {
  const t = useT();
  const load = useServerFn(listGuestsWithRsvps);
  const [rows, setRows] = useState<AdminGuestRow[] | null>(null);
  const [includeTest, setIncludeTest] = useState(false);
  const [q, setQ] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");

  useEffect(() => {
    setGeneratedAt(
      new Date().toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }),
    );
    load(undefined as never)
      .then(setRows)
      .catch(() => toast.error("Couldn't load the guest list."));
  }, [load]);

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [];
    for (const r of rows ?? []) {
      if (!includeTest && isTestHousehold(r.primary_name)) continue;
      const rsvp = r.rsvp;
      if (!rsvp) continue;
      const song = (rsvp.song_request ?? "").trim();
      const note = (rsvp.message ?? "").trim();
      if (!song && !note) continue;
      list.push({
        id: r.id,
        household: r.primary_name,
        status: rsvp.status,
        submitted: rsvp.updated_at || rsvp.submitted_at,
        song,
        note,
      });
    }
    // Newest first so anything just written is at the top.
    return list.sort((a, b) => b.submitted.localeCompare(a.submitted));
  }, [rows, includeTest]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((e) =>
      `${e.household} ${e.song} ${e.note}`.toLowerCase().includes(needle),
    );
  }, [entries, q]);

  const messages = filtered.filter((e) => e.note);
  const songs = filtered.filter((e) => e.song);

  async function copySongs() {
    const text = songs.map((e) => `${e.song} — ${e.household}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t.admin.notesCopied);
    } catch {
      toast.error("Couldn't copy. Try the CSV download instead.");
    }
  }

  function exportCsv() {
    const header = ["household", "status", "song_request", "note", "submitted"];
    const body = filtered.map((e) =>
      [e.household, e.status, e.song, e.note, e.submitted].map(escCsv).join(","),
    );
    downloadCsv([header.join(","), ...body].join("\n"), "notes-and-songs");
    toast.success(`Exported ${filtered.length} responses.`);
  }

  if (!rows) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-24 text-center text-sm text-muted-foreground">
        {t.admin.reportLoading}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 print:py-0">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {SITE.couple}
        </p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl text-primary">
          {t.admin.notesTitle}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.admin.notesSubtitle}</p>
        <DiamondDivider className="mt-5" />
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.admin.reportGeneratedOn.replace("{date}", generatedAt)} ·{" "}
          {includeTest ? t.admin.reportScopeAll : t.admin.reportScopeReal}
        </p>
      </div>

      {/* Actions — never printed */}
      <div className="no-print mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/portal-ga-2026/dashboard"
          className="border border-border/60 px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
        >
          {t.admin.reportBack}
        </Link>
        <button
          onClick={() => window.print()}
          className="border border-primary px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary hover:bg-primary/5"
        >
          {t.admin.reportPrint}
        </button>
        <button
          onClick={exportCsv}
          className="border border-border/60 px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
        >
          {t.admin.reportDownload}
        </button>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={includeTest}
            onChange={(e) => setIncludeTest(e.target.checked)}
          />
          {t.admin.reportIncludeTest}
        </label>
      </div>

      <div className="no-print mt-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.admin.notesSearch}
          aria-label={t.admin.notesSearch}
          className="w-full border border-border/60 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      {/* Summary */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="report-card border border-border/40 p-6 text-center">
          <div className="font-serif text-5xl text-primary">{messages.length}</div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t.admin.notesCountMessages}
          </div>
        </div>
        <div className="report-card border border-border/40 p-6 text-center">
          <div className="font-serif text-5xl text-primary">{songs.length}</div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t.admin.notesCountSongs}
          </div>
        </div>
      </div>

      {/* ---------- Messages ---------- */}
      <section className="report-section mt-14">
        <SectionHead numeral="I" title={t.admin.notesMessagesTitle} note={`${messages.length}`} />
        {messages.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{t.admin.notesNoMessages}</p>
        ) : (
          <div className="mt-6 space-y-4">
            {messages.map((e) => (
              <div key={`m-${e.id}`} className="report-card border border-border/40 p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-serif text-lg text-primary">{e.household}</h3>
                  <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <StatusBadge status={e.status} />
                    {fmtDate(e.submitted)}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line font-serif text-[15px] leading-relaxed text-primary">
                  {e.note}
                </p>
                {e.song ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="uppercase tracking-[0.2em]">
                      {t.admin.notesSongsTitle}
                    </span>{" "}
                    · {e.song}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Song requests ---------- */}
      <section className="report-section mt-14">
        <SectionHead numeral="II" title={t.admin.notesSongsTitle} note={`${songs.length}`} />
        <div className="no-print mt-4">
          <button
            onClick={copySongs}
            disabled={songs.length === 0}
            className="border border-border/60 px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary disabled:opacity-40"
          >
            {t.admin.notesCopySongs}
          </button>
        </div>
        {songs.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{t.admin.notesNoSongs}</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <th className="py-2 pr-3">{t.admin.notesSongsTitle}</th>
                  <th className="py-2 pr-3">{t.admin.colHousehold}</th>
                  <th className="py-2 text-right">{t.admin.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((e) => (
                  <tr key={`s-${e.id}`} className="border-b border-border/30 align-top">
                    <td className="py-2 pr-3 text-primary">{e.song}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{e.household}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {fmtDate(e.submitted)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DiamondDivider className="mt-14" />
      <p className="mt-4 pb-6 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {t.admin.reportGeneratedOn.replace("{date}", generatedAt)}
      </p>
    </div>
  );
}

function SectionHead({
  numeral,
  title,
  note,
}: {
  numeral: string;
  title: string;
  note: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{numeral}</p>
      <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-primary">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      <DiamondDivider className="mt-4" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useT();
  const label =
    status === "attending"
      ? t.admin.statusAttending
      : status === "not_attending"
        ? t.admin.statusDeclined
        : status.replace(/_/g, " ");
  const tone =
    status === "attending"
      ? "border-primary/50 text-primary"
      : status === "not_attending"
        ? "border-destructive/40 text-destructive"
        : "border-border/60 text-muted-foreground";
  return (
    <span
      className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] ${tone}`}
    >
      {label}
    </span>
  );
}
