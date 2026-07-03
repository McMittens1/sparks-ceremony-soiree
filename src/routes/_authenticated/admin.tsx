import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/context";
import { getAdminSummary, getAdminPhotos, setPhotoStatus, type AdminSummary, type AdminPhoto } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Admin · Geo & Partner" },
    { name: "robots", content: "noindex,nofollow" },
  ]}),
  component: Admin,
});

function Admin() {
  const t = useT();
  const nav = useNavigate();
  const loadSummary = useServerFn(getAdminSummary);
  const loadPhotos = useServerFn(getAdminPhotos);
  const setStatus = useServerFn(setPhotoStatus);
  const [tab, setTab] = useState<"rsvps" | "photos">("rsvps");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [photoTab, setPhotoTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);

  useEffect(() => {
    loadSummary().then(setSummary).catch((e) => setErr(String(e)));
  }, [loadSummary]);
  useEffect(() => {
    if (tab === "photos") loadPhotos({ data: { status: photoTab } }).then(setPhotos).catch(() => {});
  }, [tab, photoTab, loadPhotos]);

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  }

  async function updatePhoto(id: string, s: "approved" | "rejected") {
    await setStatus({ data: { id, status: s } });
    const next = await loadPhotos({ data: { status: photoTab } });
    setPhotos(next);
  }

  function exportCsv() {
    if (!summary) return;
    const rows = [["party", "guest", "adult_child", "attending", "contact_email", "contact_phone", "submitted_at"]];
    for (const r of summary.rows) {
      for (const g of r.guests) {
        rows.push([
          r.party_name, g.full_name,
          g.is_child ? "child" : "adult",
          g.attending === true ? "yes" : g.attending === false ? "no" : "pending",
          r.contact_email ?? "", r.contact_phone ?? "", r.submitted_at ?? "",
        ]);
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rsvps-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-4xl text-primary">{t.admin.title}</h1>
        <button onClick={signOut} className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">{t.admin.signOut}</button>
      </div>

      <div className="mt-6 flex gap-2 border-b border-border/60">
        {(["rsvps", "photos"] as const).map((k) => (
          <button
            key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border-b-2 -mb-px ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            {k === "rsvps" ? t.admin.rsvpsTab : t.admin.photosTab}
          </button>
        ))}
      </div>

      {err && <p className="mt-4 text-sm text-destructive">{err}</p>}

      {tab === "rsvps" && summary && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Stat label={t.admin.totalsAttending} value={summary.attendingParties} tint="primary" />
            <Stat label={t.admin.totalsDeclined} value={summary.declinedParties} />
            <Stat label={t.admin.totalsPending} value={summary.pendingParties} />
            <Stat label={t.admin.totalsAdults} value={summary.attendingAdults} tint="primary" />
            <Stat label={t.admin.totalsChildren} value={summary.attendingChildren} tint="primary" />
          </div>
          <div className="flex justify-end">
            <button onClick={exportCsv} className="text-xs uppercase tracking-[0.2em] text-primary hover:underline">{t.admin.exportCsv}</button>
          </div>
          {summary.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.admin.noRsvps}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border/60">
                <thead className="bg-secondary/40 text-left text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">{t.admin.partyCol}</th>
                    <th className="px-3 py-2">{t.admin.guestsCol}</th>
                    <th className="px-3 py-2">{t.admin.contactCol}</th>
                    <th className="px-3 py-2">{t.admin.submittedCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.rows.map((r) => (
                    <tr key={r.invite_id} className="border-t border-border/60 align-top">
                      <td className="px-3 py-3 font-serif">{r.party_name}</td>
                      <td className="px-3 py-3">
                        <ul className="space-y-1">
                          {r.guests.map((g, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span>{g.full_name}</span>
                              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{g.is_child ? "child" : "adult"}</span>
                              <span className={`text-[10px] uppercase tracking-[0.15em] ${g.attending === true ? "text-primary" : g.attending === false ? "text-destructive" : "text-muted-foreground"}`}>
                                {g.attending === true ? "yes" : g.attending === false ? "no" : "pending"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {r.contact_email && <div>{r.contact_email}</div>}
                        {r.contact_phone && <div className="text-muted-foreground">{r.contact_phone}</div>}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "photos" && (
        <div className="mt-8">
          <div className="flex gap-2">
            {(["pending", "approved", "rejected"] as const).map((s) => (
              <button
                key={s} onClick={() => setPhotoTab(s)}
                className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${photoTab === s ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
              >
                {s === "pending" ? t.admin.pending : s === "approved" ? t.admin.approved : t.admin.rejected}
              </button>
            ))}
          </div>
          {photos.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">{t.admin.noPhotos}</p>
          ) : (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((p) => (
                <div key={p.id} className="rounded-sm border border-border/60 bg-card overflow-hidden">
                  <img src={p.url} alt="" className="w-full aspect-square object-cover" />
                  <div className="p-3 space-y-2">
                    <div className="text-sm">{p.uploader_name}</div>
                    {p.uploader_email && <div className="text-xs text-muted-foreground">{p.uploader_email}</div>}
                    {p.caption && <p className="text-xs text-foreground/80">{p.caption}</p>}
                    {photoTab === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => updatePhoto(p.id, "approved")} className="flex-1 rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-[0.15em] py-2">{t.admin.approve}</button>
                        <button onClick={() => updatePhoto(p.id, "rejected")} className="flex-1 rounded-full border border-input text-xs uppercase tracking-[0.15em] py-2">{t.admin.reject}</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint?: "primary" }) {
  return (
    <div className="rounded-sm border border-border/60 bg-card p-4">
      <div className={`font-serif text-3xl tabular-nums ${tint === "primary" ? "text-primary" : ""}`}>{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    </div>
  );
}
