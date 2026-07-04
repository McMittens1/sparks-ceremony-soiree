import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/context";
import { getAdminPhotos, setPhotoStatus, type AdminPhoto } from "@/lib/admin.functions";
import {
  listGuestsWithRsvps,
  upsertGuest,
  deleteGuest,
  importGuestsCsv,
  type AdminGuestRow,
  type PartyMember,
} from "@/lib/rsvp.functions";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Geo & Addison" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Admin,
});

type Tab = "rsvps" | "photos";

function Admin() {
  const t = useT();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("rsvps");

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-4xl text-primary">{t.admin.title}</h1>
        <button
          onClick={signOut}
          className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
        >
          {t.admin.signOut}
        </button>
      </div>

      <div className="mt-6 flex gap-2 border-b border-border/40">
        {(["rsvps", "photos"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-xs uppercase tracking-[0.2em] ${
              tab === k ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
            }`}
          >
            {k === "rsvps" ? t.admin.rsvpsTab : t.admin.photosTab}
          </button>
        ))}
      </div>

      {tab === "rsvps" ? <RsvpsPanel /> : <PhotosPanel />}
    </div>
  );
}

// ================== RSVPs ==================

function RsvpsPanel() {
  const t = useT();
  const loadRows = useServerFn(listGuestsWithRsvps);
  const [rows, setRows] = useState<AdminGuestRow[] | null>(null);
  const [filter, setFilter] = useState<"all" | "attending" | "not_attending" | "no_response">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminGuestRow | "new" | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  async function refresh() {
    const next = await loadRows({});
    setRows(next);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      if (search && !r.primary_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "all") return true;
      if (filter === "no_response") return !r.rsvp;
      if (!r.rsvp) return false;
      if (filter === "attending") return r.rsvp.status === "attending" || r.rsvp.status === "partial";
      if (filter === "not_attending") return r.rsvp.status === "not_attending";
      return true;
    });
  }, [rows, search, filter]);

  const totals = useMemo(() => {
    if (!rows) return { attending: 0, declined: 0, pending: 0, adults: 0, children: 0 };
    let attending = 0, declined = 0, pending = 0, adults = 0, children = 0;
    for (const r of rows) {
      if (!r.rsvp) { pending++; continue; }
      if (r.rsvp.status === "not_attending") { declined++; continue; }
      attending++;
      for (const a of r.rsvp.attendees) {
        if (!a.attending) continue;
        if (a.is_child) children++; else adults++;
      }
    }
    return { attending, declined, pending, adults, children };
  }, [rows]);

  function downloadCsv() {
    if (!rows) return;
    const header = [
      "primary_name", "slug", "status", "attending_names", "child_count",
      "phone", "email", "address_confirmed",
      "address_line1", "address_line2", "city", "state", "postal_code", "country",
      "song_request", "message", "submitted_at",
    ];
    const esc = (s: string | null | undefined) => {
      const v = s ?? "";
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    };
    const body = rows.map((r) => {
      const attending = r.rsvp?.attendees.filter((a) => a.attending) ?? [];
      const addr = r.rsvp?.address ?? {
        line1: r.address_line1, line2: r.address_line2, city: r.city,
        state: r.state, postal_code: r.postal_code, country: r.country,
      };
      return [
        r.primary_name, r.slug, r.rsvp?.status ?? "no_response",
        attending.filter((a) => !a.is_child).map((a) => a.name).join("; "),
        String(attending.filter((a) => a.is_child).length),
        r.phone, r.email, r.rsvp?.address_confirmed ? "yes" : "no",
        addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country,
        r.rsvp?.song_request, r.rsvp?.message, r.rsvp?.submitted_at,
      ].map((v) => esc(typeof v === "string" ? v : v ?? "")).join(",");
    });
    const csv = [header.join(","), ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8">
      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          [t.admin.totalsAttending, totals.attending],
          [t.admin.totalsDeclined, totals.declined],
          [t.admin.totalsPending, totals.pending],
          [t.admin.totalsAdults, totals.adults],
          [t.admin.totalsChildren, totals.children],
        ].map(([label, n]) => (
          <div key={label as string} className="border border-border/40 p-4 text-center">
            <div className="text-2xl font-serif text-primary">{n}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search names…"
          className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="attending">Attending</option>
          <option value="not_attending">Declined</option>
          <option value="no_response">No response</option>
        </select>
        <button
          onClick={() => setEditing("new")}
          className="ml-auto text-xs uppercase tracking-[0.2em] border border-primary text-primary px-3 py-2 hover:bg-primary hover:text-primary-foreground"
        >
          + Add guest
        </button>
        <button
          onClick={() => setImportOpen(true)}
          className="text-xs uppercase tracking-[0.2em] border border-border text-foreground px-3 py-2"
        >
          Import CSV
        </button>
        <button
          onClick={downloadCsv}
          className="text-xs uppercase tracking-[0.2em] border border-border text-foreground px-3 py-2"
        >
          {t.admin.exportCsv}
        </button>
      </div>

      {rows === null ? (
        <p className="mt-8 text-sm text-muted-foreground">{t.common.loading}</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t.admin.noRsvps}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr className="border-b border-border/40">
                <th className="text-left py-2 pr-4">{t.admin.partyCol}</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2 pr-4">Attending</th>
                <th className="text-left py-2 pr-4">Address</th>
                <th className="text-left py-2 pr-4">Link code</th>
                <th className="text-left py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const attending = r.rsvp?.attendees.filter((a) => a.attending) ?? [];
                return (
                  <tr key={r.id} className="border-b border-border/20 align-top">
                    <td className="py-3 pr-4">
                      <div className="font-serif text-primary">{r.primary_name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Party of {r.party_members.length || 1}
                        {r.phone ? ` · ${r.phone}` : ""}
                        {r.email ? ` · ${r.email}` : ""}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {r.rsvp ? (
                        <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-1 border ${
                          r.rsvp.status === "attending" ? "border-primary text-primary" :
                          r.rsvp.status === "partial" ? "border-accent text-accent" :
                          "border-muted-foreground text-muted-foreground"
                        }`}>
                          {r.rsvp.status.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">no response</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {attending.length === 0 ? "—" : attending.map((a) => (
                        <div key={a.name}>{a.name}{a.is_child ? " (child)" : ""}</div>
                      ))}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {r.rsvp?.address_confirmed ? "✓ confirmed" : "not confirmed"}
                    </td>
                    <td className="py-3 pr-4 text-xs font-mono">{r.slug}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => setEditing(r)}
                        className="text-[10px] uppercase tracking-[0.2em] text-primary link-underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && <GuestEditor row={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={refresh} />}
      {importOpen && <CsvImporter onClose={() => setImportOpen(false)} onDone={refresh} />}
    </div>
  );
}

// ================== Guest editor ==================

function GuestEditor({ row, onClose, onSaved }: { row: AdminGuestRow | null; onClose: () => void; onSaved: () => void | Promise<void> }) {
  const runUpsert = useServerFn(upsertGuest);
  const runDelete = useServerFn(deleteGuest);
  const [primaryName, setPrimaryName] = useState(row?.primary_name ?? "");
  const [members, setMembers] = useState<PartyMember[]>(
    row?.party_members.length ? row.party_members : [{ name: row?.primary_name ?? "", is_child: false }],
  );
  const [phone, setPhone] = useState(row?.phone ?? "");
  const [email, setEmail] = useState(row?.email ?? "");
  const [line1, setLine1] = useState(row?.address_line1 ?? "");
  const [line2, setLine2] = useState(row?.address_line2 ?? "");
  const [city, setCity] = useState(row?.city ?? "");
  const [state, setState] = useState(row?.state ?? "");
  const [postal, setPostal] = useState(row?.postal_code ?? "");
  const [country, setCountry] = useState(row?.country ?? "");
  const [notes, setNotes] = useState(row?.invite_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      await runUpsert({
        data: {
          id: row?.id,
          primary_name: primaryName,
          party_members: members.filter((m) => m.name.trim()),
          phone, email, address_line1: line1, address_line2: line2,
          city, state, postal_code: postal, country, invite_notes: notes,
        },
      });
      await onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!row) return;
    if (!confirm(`Delete ${row.primary_name}? This also deletes their RSVP.`)) return;
    await runDelete({ data: { id: row.id } });
    await onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-card border border-border p-6 sm:p-8 my-8">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-primary">{row ? "Edit guest" : "Add guest"}</h3>
          <button onClick={onClose} className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Close</button>
        </div>

        {row && (
          <p className="mt-2 text-xs text-muted-foreground">
            Link code <span className="font-mono text-foreground">{row.slug}</span> —
            share <span className="font-mono text-foreground break-all">/rsvp?g={row.slug}</span>
          </p>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Primary name (household label)</label>
            <input value={primaryName} onChange={(e) => setPrimaryName(e.target.value)} className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Party members</label>
            <div className="mt-1 space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={m.name}
                    onChange={(e) => setMembers((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                    placeholder="Full name"
                    className="flex-1 border border-input bg-background px-3 py-2 text-sm"
                  />
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <input type="checkbox" checked={m.is_child}
                      onChange={(e) => setMembers((p) => p.map((x, j) => j === i ? { ...x, is_child: e.target.checked } : x))}
                    />
                    child
                  </label>
                  <button type="button" onClick={() => setMembers((p) => p.filter((_, j) => j !== i))} className="text-xs text-muted-foreground">×</button>
                </div>
              ))}
              <button type="button" onClick={() => setMembers((p) => [...p, { name: "", is_child: false }])} className="text-xs uppercase tracking-[0.2em] text-primary">
                + Add member
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="border border-input bg-background px-3 py-2 text-sm" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="border border-input bg-background px-3 py-2 text-sm" />
            <input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Address line 1" className="sm:col-span-2 border border-input bg-background px-3 py-2 text-sm" />
            <input value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Address line 2" className="sm:col-span-2 border border-input bg-background px-3 py-2 text-sm" />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="border border-input bg-background px-3 py-2 text-sm" />
            <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="border border-input bg-background px-3 py-2 text-sm" />
            <input value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="ZIP" className="border border-input bg-background px-3 py-2 text-sm" />
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="border border-input bg-background px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Internal notes (guests never see these)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm" />
          </div>

          {row?.rsvp && (
            <div className="border-t border-border/40 pt-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Their RSVP</div>
              <div className="text-sm mt-1">
                Status: <span className="font-medium">{row.rsvp.status}</span> · Submitted{" "}
                {new Date(row.rsvp.submitted_at).toLocaleString()}
              </div>
              {row.rsvp.song_request && <div className="text-sm mt-1">Song: {row.rsvp.song_request}</div>}
              {row.rsvp.message && <div className="text-sm mt-1 italic">"{row.rsvp.message}"</div>}
            </div>
          )}

          {err && <p className="text-sm text-destructive">{err}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving} className="border border-primary bg-primary text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            {row && (
              <button onClick={remove} className="border border-destructive text-destructive px-5 py-2 text-xs uppercase tracking-[0.2em] ml-auto">
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================== CSV importer ==================

function CsvImporter({ onClose, onDone }: { onClose: () => void; onDone: () => void | Promise<void> }) {
  const runImport = useServerFn(importGuestsCsv);
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    try {
      const r = await runImport({ data: { csv } });
      setResult(`Imported ${r.inserted}, skipped ${r.skipped}.`);
      await onDone();
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-card border border-border p-6 sm:p-8 my-8">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-primary">Import guests (CSV)</h3>
          <button onClick={onClose} className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Close</button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Columns (header row optional): <span className="font-mono">primary_name, party_members, phone, email, address_line1, address_line2, city, state, postal_code, country, invite_notes</span>.
          Separate party members with <span className="font-mono">;</span> and append <span className="font-mono">(child)</span> for kids. Example: <span className="font-mono">Jane Doe;John Doe;Emma Doe (child)</span>.
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={12}
          placeholder="primary_name,party_members,phone,email,address_line1,city,state,postal_code&#10;Jane & John Doe,Jane Doe;John Doe;Emma Doe (child),402-555-1234,jane@example.com,123 Main St,Louisville,NE,68037"
          className="mt-4 w-full border border-input bg-background px-3 py-2 text-xs font-mono"
        />
        {result && <p className="mt-3 text-sm">{result}</p>}
        <div className="mt-4 flex gap-3">
          <button onClick={run} disabled={busy || !csv.trim()} className="border border-primary bg-primary text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-50">
            {busy ? "Importing…" : "Import"}
          </button>
        </div>
        <p className="mt-4 text-[10px] text-muted-foreground">
          Fallback contact shown to guests who can't find their name: <span className="italic">{SITE.rsvpFallbackContact}</span> (edit in <span className="font-mono">src/lib/site.ts</span>).
        </p>
      </div>
    </div>
  );
}

// ================== Photos (unchanged behavior) ==================

function PhotosPanel() {
  const t = useT();
  const loadPhotos = useServerFn(getAdminPhotos);
  const setStatus = useServerFn(setPhotoStatus);
  const [photoTab, setPhotoTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);

  useEffect(() => {
    loadPhotos({ data: { status: photoTab } }).then(setPhotos).catch(() => {});
  }, [photoTab, loadPhotos]);

  async function updatePhoto(id: string, s: "approved" | "rejected") {
    await setStatus({ data: { id, status: s } });
    const next = await loadPhotos({ data: { status: photoTab } });
    setPhotos(next);
  }

  return (
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
  );
}
