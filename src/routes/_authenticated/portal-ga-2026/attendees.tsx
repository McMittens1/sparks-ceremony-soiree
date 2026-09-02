import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useT } from "@/i18n/context";
import { listGuestsWithRsvps, type AdminGuestRow } from "@/lib/rsvp.functions";
import {
  computeNamedAttendees,
  type NamedHousehold,
  type NamedPerson,
} from "@/lib/rsvp-party";
import { isTestHousehold } from "@/lib/test-data";
import { escCsv, downloadCsv } from "@/lib/csv";
import { DiamondDivider } from "@/components/site/DiamondDivider";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/portal-ga-2026/attendees")({
  head: () => ({
    meta: [
      { title: "Attendee report · Geo & Addison" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AttendeeReport,
});

// Print rules live with the page rather than in styles.css: they only ever
// apply here, and a printed copy must stay legible on white paper without
// the app chrome.
const PRINT_CSS = `
@media print {
  @page { margin: 14mm; }
  html, body { background: #fff !important; }
  .no-print, body > div > header, body > div > footer, a[href="#main-content"] { display: none !important; }
  .report-section { break-inside: auto; }
  .report-section h2 { break-after: avoid; }
  tr, .report-card { break-inside: avoid; }
  a[href]:after { content: none !important; }
}
`;

function AttendeeReport() {
  const t = useT();
  const load = useServerFn(listGuestsWithRsvps);
  const [rows, setRows] = useState<AdminGuestRow[] | null>(null);
  const [includeTest, setIncludeTest] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>("");

  useEffect(() => {
    setGeneratedAt(
      new Date().toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }),
    );
    load(undefined as never)
      .then(setRows)
      .catch(() => toast.error("Couldn't load the guest list."));
  }, [load]);

  const scoped = useMemo(
    () => (rows ?? []).filter((r) => includeTest || !isTestHousehold(r.primary_name)),
    [rows, includeTest],
  );

  const report = useMemo(
    () =>
      computeNamedAttendees(
        scoped.map((r) => ({
          id: r.id,
          primary_name: r.primary_name,
          party_limit: r.party_limit,
          party_members: r.party_members,
          rsvp: r.rsvp ? { status: r.rsvp.status, attendees: r.rsvp.attendees } : null,
        })),
      ),
    [scoped],
  );

  const rsvpHouseholds = useMemo(
    () => report.households.filter((h) => h.rsvp_status !== null),
    [report],
  );

  const sortedHouseholds = useMemo(
    () =>
      [...report.households].sort((a, b) => a.primary_name.localeCompare(b.primary_name)),
    [report],
  );

  const statusLabel = (s: NamedPerson["status"]) =>
    s === "attending"
      ? t.admin.statusAttending
      : s === "declined"
        ? t.admin.statusDeclined
        : t.admin.statusNoResponse;

  function exportCsv() {
    const header = [
      "household",
      "person",
      "source",
      "type",
      "status",
      "party_limit",
      "household_unnamed_remaining",
    ];
    const body: string[] = [];
    for (const h of sortedHouseholds) {
      for (const p of h.people) {
        body.push(
          [
            h.primary_name,
            p.name,
            p.source === "rsvp" ? "rsvp" : "invitation",
            p.is_child ? "child" : "adult",
            p.status,
            String(h.party_limit),
            String(h.unnamed_remaining),
          ]
            .map(escCsv)
            .join(","),
        );
      }
    }
    downloadCsv([header.join(","), ...body].join("\n"), "named-attendees");
    toast.success(`Exported ${report.totalNamed} named attendees.`);
  }

  if (!rows) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-24 text-center text-sm text-muted-foreground">
        {t.admin.reportLoading}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 print:py-0">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Masthead */}
      <header className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {SITE.couple}
        </p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl text-primary">
          {t.admin.reportTitle}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.admin.reportSubtitle}</p>
        <DiamondDivider className="mt-5" />
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.admin.reportGeneratedOn.replace("{date}", generatedAt)} ·{" "}
          {includeTest ? t.admin.reportScopeAll : t.admin.reportScopeReal}
        </p>
      </header>

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

      {/* ---------- Summary ---------- */}
      <section className="report-section mt-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryCard label={t.admin.sumTotalNamed} value={report.totalNamed} hero />
          <SummaryCard
            label={t.admin.sumConfirmedAttending}
            value={report.confirmedAttending}
            hero
          />
          <SummaryCard label={t.admin.sumMaxNamedOnly} value={report.maxNamedOnly} />
          <SummaryCard label={t.admin.sumMaxPossible} value={report.maxPossible} />
        </div>

        {/* The arithmetic, spelled out so the ceiling is checkable at a glance */}
        <div className="report-card mt-4 border border-border/40 p-5">
          <dl className="space-y-2 text-sm">
            <Line label={t.admin.reportBreakdownNamed} value={report.totalNamed} />
            <Line label={t.admin.reportBreakdownUnnamed} value={report.remainingUnnamed} />
            <div className="pt-2 border-t border-border/40">
              <Line label={t.admin.reportBreakdownMax} value={report.maxPossible} strong />
            </div>
          </dl>
          <p className="mt-3 text-[11px] text-muted-foreground">{t.admin.reportNamedNote}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              [t.admin.totalsAdults, report.adults],
              [t.admin.totalsChildren, report.children],
              [t.admin.rsvpTotalsDeclined, report.declinedPeople],
              [t.admin.reportUnnamedRemaining, report.remainingUnnamed],
            ] as const
          ).map(([label, n]) => (
            <div key={label} className="border border-border/40 p-3 text-center">
              <div className="text-xl font-serif text-primary">{n}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- All named attendees ---------- */}
      <section className="report-section mt-14">
        <SectionHead
          numeral="I"
          title={t.admin.reportNamedTitle}
          note={`${t.admin.sumTotalNamed}: ${report.totalNamed}`}
        />
        <div className="mt-6 space-y-6">
          {sortedHouseholds.map((h) => (
            <HouseholdBlock key={h.id} h={h} statusLabel={statusLabel} />
          ))}
        </div>
      </section>

      {/* ---------- All RSVPs ---------- */}
      <section className="report-section mt-14">
        <SectionHead
          numeral="II"
          title={t.admin.reportRsvpsTitle}
          note={`${t.admin.rsvpTotalsAttending}: ${report.confirmedAttending} · ${t.admin.rsvpTotalsDeclined}: ${report.declinedPeople} · ${t.admin.rsvpTotalsPending}: ${report.householdsPending}`}
        />

        <div className="mt-4 grid grid-cols-3 gap-3">
          {(
            [
              [t.admin.rsvpTotalsAttending, report.householdsAttending],
              [t.admin.rsvpTotalsDeclined, report.householdsDeclined],
              [t.admin.rsvpTotalsPending, report.householdsPending],
            ] as const
          ).map(([label, n]) => (
            <div key={label} className="border border-border/40 p-3 text-center">
              <div className="text-xl font-serif text-primary">{n}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {label} · {t.admin.householdsHeading.toLowerCase()}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="py-2 pr-3">{t.admin.colHousehold}</th>
                <th className="py-2 pr-3">{t.admin.colStatus}</th>
                <th className="py-2 pr-3">{t.admin.colNamedGuests}</th>
                <th className="py-2 pr-3 text-right">{t.admin.colAttendees}</th>
                <th className="py-2 text-right">{t.admin.colUnnamed}</th>
              </tr>
            </thead>
            <tbody>
              {rsvpHouseholds.map((h) => {
                const attending = h.people.filter((p) => p.status === "attending");
                return (
                  <tr key={h.id} className="border-b border-border/30 align-top">
                    <td className="py-2 pr-3 font-medium text-primary">{h.primary_name}</td>
                    <td className="py-2 pr-3">
                      <StatusBadge status={h.rsvp_status ?? ""} />
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {attending.map((p) => p.name).join(", ") || "—"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{attending.length}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {h.names_pending + h.unnamed_remaining}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {numeral}
      </p>
      <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-primary">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      <DiamondDivider className="mt-4" />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hero = false,
}: {
  label: string;
  value: number;
  hero?: boolean;
}) {
  return (
    <div className="report-card border border-border/40 p-6 text-center">
      <div className={`font-serif text-primary ${hero ? "text-6xl" : "text-4xl"}`}>{value}</div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "text-primary" : "text-muted-foreground"}>{label}</dt>
      <dd
        className={`tabular-nums ${strong ? "font-serif text-2xl text-primary" : "text-primary"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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
      {status.replace(/_/g, " ")}
    </span>
  );
}

function HouseholdBlock({
  h,
  statusLabel,
}: {
  h: NamedHousehold;
  statusLabel: (s: NamedPerson["status"]) => string;
}) {
  const t = useT();
  return (
    <div className="report-card border border-border/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-lg text-primary">{h.primary_name}</h3>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {h.people.length} {t.admin.colNamedGuests.toLowerCase()} ·{" "}
          {h.unnamed_remaining} {t.admin.colUnnamed.toLowerCase()}
        </p>
      </div>
      {h.people.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">—</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/30">
          {h.people.map((p) => (
            <li
              key={`${h.id}-${p.name}`}
              className="flex flex-wrap items-baseline justify-between gap-2 py-1.5 text-sm"
            >
              <span className="text-primary">
                {p.name}
                {p.is_child ? (
                  <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {t.admin.typeChild}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {p.source === "rsvp" ? t.admin.srcRsvp : t.admin.srcInvitation} ·{" "}
                {statusLabel(p.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
