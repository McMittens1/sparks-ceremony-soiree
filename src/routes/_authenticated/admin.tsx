import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/context";
import {
  getAdminPhotos,
  setPhotoStatus,
  bulkSetPhotoStatus,
  updatePhotoCaption,
  deletePhoto,
  bulkDeletePhotos,
  getPhotoCounts,
  getRecentActivity,
  type AdminPhoto,
} from "@/lib/admin.functions";
import {
  listGuestsWithRsvps,
  upsertGuest,
  deleteGuest,
  importGuestsCsv,
  type AdminGuestRow,
  type PartyMember,
} from "@/lib/rsvp.functions";
import { getFeatureFlags, setFeatureFlags, type FeatureFlag } from "@/lib/feature-flags.functions";
import { Switch } from "@/components/ui/switch";
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

type Tab = "rsvps" | "photos" | "features";

function Admin() {
  const t = useT();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("rsvps");

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/portal-ga-2026" });
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

      <ActivityStrip />

      <div className="mt-6 flex gap-2 border-b border-border/40">
        {(["rsvps", "photos", "features"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-xs uppercase tracking-[0.2em] ${
              tab === k ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
            }`}
          >
            {k === "rsvps" ? t.admin.rsvpsTab : k === "photos" ? t.admin.photosTab : t.admin.featuresTab}
          </button>
        ))}
      </div>

      {tab === "rsvps" ? <RsvpsPanel /> : tab === "photos" ? <PhotosPanel /> : <FeatureFlagsPanel />}
    </div>
  );
}

// ================== Activity strip ==================

function ActivityStrip() {
  const loadActivity = useServerFn(getRecentActivity);
  const [a, setA] = useState<Awaited<ReturnType<typeof loadActivity>> | null>(null);
  useEffect(() => { loadActivity({}).then(setA).catch(() => {}); }, [loadActivity]);
  if (!a) return null;
  const items = [
    ["RSVPs · last 24h", a.rsvps_last_24h],
    ["RSVPs · last 7d", a.rsvps_last_7d],
    ["Photos pending", a.photos_pending],
    ["Photos · last 7d", a.photos_last_7d],
  ] as const;
  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(([label, n]) => (
        <div key={label} className="border border-border/40 p-3 text-center bg-card/40">
          <div className="text-xl font-serif text-primary">{n}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ================== RSVPs ==================

type SortKey = "name" | "status" | "party" | "submitted" | "city";
type SortDir = "asc" | "desc";

function RsvpsPanel() {
  const t = useT();
  const loadRows = useServerFn(listGuestsWithRsvps);
  const [rows, setRows] = useState<AdminGuestRow[] | null>(null);
  const [filter, setFilter] = useState<"all" | "attending" | "not_attending" | "no_response">("all");
  const [search, setSearch] = useState("");
  const [partySize, setPartySize] = useState<"any" | "1" | "2" | "3plus">("any");
  const [cityFilter, setCityFilter] = useState("");
  const [addrOnly, setAddrOnly] = useState(false);
  const [songOnly, setSongOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("submitted");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editing, setEditing] = useState<AdminGuestRow | "new" | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function refresh() {
    const next = await loadRows({});
    setRows(next);
  }

  useEffect(() => { refresh().catch(() => {}); }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    const cq = cityFilter.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (q && !r.primary_name.toLowerCase().includes(q)) return false;
      if (cq && !(r.city ?? "").toLowerCase().includes(cq)) return false;
      const size = r.party_members.length || 1;
      if (partySize === "1" && size !== 1) return false;
      if (partySize === "2" && size !== 2) return false;
      if (partySize === "3plus" && size < 3) return false;
      if (addrOnly && r.rsvp?.address_confirmed) return false;
      if (songOnly && !(r.rsvp?.song_request ?? "").trim()) return false;
      if (filter === "all") return true;
      if (filter === "no_response") return !r.rsvp;
      if (!r.rsvp) return false;
      if (filter === "attending") return r.rsvp.status === "attending" || r.rsvp.status === "partial";
      if (filter === "not_attending") return r.rsvp.status === "not_attending";
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    const statusRank = (r: AdminGuestRow) =>
      !r.rsvp ? 0 : r.rsvp.status === "attending" ? 3 : r.rsvp.status === "partial" ? 2 : 1;
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "name") { av = a.primary_name.toLowerCase(); bv = b.primary_name.toLowerCase(); }
      else if (sortKey === "status") { av = statusRank(a); bv = statusRank(b); }
      else if (sortKey === "party") { av = a.party_members.length || 1; bv = b.party_members.length || 1; }
      else if (sortKey === "city") { av = (a.city ?? "").toLowerCase(); bv = (b.city ?? "").toLowerCase(); }
      else if (sortKey === "submitted") {
        av = a.rsvp?.submitted_at ? new Date(a.rsvp.submitted_at).getTime() : 0;
        bv = b.rsvp?.submitted_at ? new Date(b.rsvp.submitted_at).getTime() : 0;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return list;
  }, [rows, search, cityFilter, partySize, addrOnly, songOnly, filter, sortKey, sortDir]);

  // Drop selection entries no longer visible
  useEffect(() => {
    if (!selected.size) return;
    const visible = new Set(filtered.map((r) => r.id));
    const next = new Set<string>();
    for (const id of selected) if (visible.has(id)) next.add(id);
    if (next.size !== selected.size) setSelected(next);
  }, [filtered, selected]);

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

  const buildRsvpUrl = useCallback((row: AdminGuestRow) => {
    const path = `/rsvp/edit/${row.edit_token}`;
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, []);

  function toCsv(list: AdminGuestRow[]) {
    const header = [
      "primary_name", "slug", "status", "attending_names", "child_count",
      "phone", "email", "address_confirmed",
      "address_line1", "address_line2", "city", "state", "postal_code", "country",
      "song_request", "message", "submitted_at", "rsvp_url",
    ];
    const esc = (s: string | null | undefined) => {
      const v = s ?? "";
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    };
    const body = list.map((r) => {
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
        buildRsvpUrl(r),
      ].map((v) => esc(typeof v === "string" ? v : v ?? "")).join(",");
    });
    return [header.join(","), ...body].join("\n");
  }

  function downloadCsv(list: AdminGuestRow[], suffix = "") {
    const csv = toCsv(list);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvps${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copySelectedLinks() {
    const links = filtered.filter((r) => selected.has(r.id)).map((r) => `${r.primary_name}\t${buildRsvpUrl(r)}`).join("\n");
    if (!links) return;
    try { await navigator.clipboard.writeText(links); } catch { /* ignore */ }
  }

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "submitted" ? "desc" : "asc"); }
  }

  const allVisibleSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  function toggleAllVisible() {
    if (allVisibleSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  }

  const selectedRows = filtered.filter((r) => selected.has(r.id));

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
          <option value="all">All statuses</option>
          <option value="attending">Attending</option>
          <option value="not_attending">Declined</option>
          <option value="no_response">No response</option>
        </select>
        <select
          value={partySize}
          onChange={(e) => setPartySize(e.target.value as typeof partySize)}
          className="border border-input bg-background px-3 py-2 text-sm"
          title="Party size"
        >
          <option value="any">Any size</option>
          <option value="1">1 guest</option>
          <option value="2">2 guests</option>
          <option value="3plus">3+ guests</option>
        </select>
        <input
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          placeholder="City filter…"
          className="border border-input bg-background px-3 py-2 text-sm w-32"
        />
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <input type="checkbox" checked={addrOnly} onChange={(e) => setAddrOnly(e.target.checked)} />
          Address unconfirmed
        </label>
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <input type="checkbox" checked={songOnly} onChange={(e) => setSongOnly(e.target.checked)} />
          Has song request
        </label>
        <button
          onClick={() => setEditing("new")}
          className="ml-auto text-xs uppercase tracking-[0.2em] border border-primary text-primary px-3 py-2 hover:bg-primary hover:text-primary-foreground"
        >
          + Add invitation
        </button>
        <button
          onClick={() => setImportOpen(true)}
          className="text-xs uppercase tracking-[0.2em] border border-border text-foreground px-3 py-2"
        >
          Import CSV
        </button>
        <button
          onClick={() => downloadCsv(filtered, "-filtered")}
          className="text-xs uppercase tracking-[0.2em] border border-border text-foreground px-3 py-2"
          title="Export the currently filtered rows"
        >
          Export filtered
        </button>
        <button
          onClick={() => rows && downloadCsv(rows)}
          className="text-xs uppercase tracking-[0.2em] border border-border text-foreground px-3 py-2"
        >
          {t.admin.exportCsv} (all)
        </button>
      </div>

      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-primary/40 bg-primary/5 px-4 py-2 text-xs">
          <span className="uppercase tracking-[0.2em] text-primary">{selected.size} selected</span>
          <button onClick={() => downloadCsv(selectedRows, "-selected")} className="border border-primary text-primary px-3 py-1 uppercase tracking-[0.2em]">Export selected</button>
          <button onClick={copySelectedLinks} className="border border-border text-foreground px-3 py-1 uppercase tracking-[0.2em]">Copy RSVP links</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-muted-foreground uppercase tracking-[0.2em]">Clear</button>
        </div>
      )}

      {rows === null ? (
        <p className="mt-8 text-sm text-muted-foreground">{t.common.loading}</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t.admin.noRsvps}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr className="border-b border-border/40">
                <th className="w-8 py-2 pr-2">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all visible" />
                </th>
                <SortHeader label={t.admin.partyCol} k="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHeader label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHeader label="Party" k="party" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHeader label="Attending" k={null} />
                <SortHeader label="City" k="city" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHeader label="Submitted" k="submitted" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortHeader label="Link" k={null} />
                <SortHeader label="" k={null} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const attending = r.rsvp?.attendees.filter((a) => a.attending) ?? [];
                const isSel = selected.has(r.id);
                return (
                  <tr key={r.id} className={`border-b border-border/20 align-top ${isSel ? "bg-primary/5" : ""}`}>
                    <td className="py-3 pr-2">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={(e) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(r.id); else next.delete(r.id);
                            return next;
                          });
                        }}
                        aria-label={`Select ${r.primary_name}`}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-serif text-primary">{r.primary_name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.phone ? `${r.phone}` : ""}
                        {r.phone && r.email ? " · " : ""}
                        {r.email ? r.email : ""}
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
                      {r.party_members.length || 1}
                      {r.rsvp ? <span className="text-muted-foreground"> · {attending.length}✓</span> : null}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {attending.length === 0 ? "—" : attending.map((a) => (
                        <div key={a.name}>{a.name}{a.is_child ? " (child)" : ""}</div>
                      ))}
                    </td>
                    <td className="py-3 pr-4 text-xs">{r.city ?? "—"}</td>
                    <td className="py-3 pr-4 text-xs">
                      {r.rsvp?.submitted_at ? new Date(r.rsvp.submitted_at).toLocaleDateString() : "—"}
                      {r.rsvp?.address_confirmed ? <div className="text-[10px] text-muted-foreground">✓ addr</div> : null}
                    </td>
                    <td className="py-3 pr-4 text-xs font-mono">
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(buildRsvpUrl(r)).catch(() => {});
                        }}
                        className="text-primary link-underline"
                        title="Copy RSVP link"
                      >
                        {r.slug}
                      </button>
                    </td>
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

function SortHeader({
  label, k, sortKey, sortDir, onClick,
}: {
  label: string;
  k: SortKey | null;
  sortKey?: SortKey;
  sortDir?: SortDir;
  onClick?: (k: SortKey) => void;
}) {
  if (!k) return <th className="text-left py-2 pr-4">{label}</th>;
  const active = sortKey === k;
  const arrow = active ? (sortDir === "asc" ? "↑" : "↓") : "";
  return (
    <th className="text-left py-2 pr-4">
      <button
        type="button"
        onClick={() => onClick?.(k)}
        className={`uppercase tracking-[0.2em] ${active ? "text-primary" : "text-muted-foreground"}`}
      >
        {label} {arrow}
      </button>
    </th>
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
          <h3 className="font-serif text-2xl text-primary">{row ? "Edit invitation" : "Add invitation"}</h3>
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
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Invitation name</label>
            <input value={primaryName} onChange={(e) => setPrimaryName(e.target.value)} placeholder="e.g. The Smith Family or John & Jane Doe" className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm" />
            <p className="mt-1 text-[11px] text-muted-foreground">How this invite is addressed on the envelope. Used to look them up.</p>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Guests on this invite</label>
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
      setResult(`Imported ${r.inserted}, skipped ${r.skipped}, ${r.duplicates} duplicate${r.duplicates === 1 ? "" : "s"} ignored.`);
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

// ================== Photos ==================

type PhotoTab = "pending" | "approved" | "rejected";

function PhotosPanel() {
  const t = useT();
  const loadPhotos = useServerFn(getAdminPhotos);
  const loadCounts = useServerFn(getPhotoCounts);
  const setStatus = useServerFn(setPhotoStatus);
  const runBulkStatus = useServerFn(bulkSetPhotoStatus);
  const runUpdateCaption = useServerFn(updatePhotoCaption);
  const runDelete = useServerFn(deletePhoto);
  const runBulkDelete = useServerFn(bulkDeletePhotos);

  const [photoTab, setPhotoTab] = useState<PhotoTab>("pending");
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [counts, setCounts] = useState<{ pending: number; approved: number; rejected: number } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");

  const refreshCounts = useCallback(() => {
    loadCounts({}).then(setCounts).catch(() => {});
  }, [loadCounts]);

  const refreshPhotos = useCallback(async () => {
    const next = await loadPhotos({ data: { status: photoTab } });
    setPhotos(next);
    // prune selection to visible ids
    setSelected((prev) => {
      const visible = new Set(next.map((p) => p.id));
      const nextSet = new Set<string>();
      for (const id of prev) if (visible.has(id)) nextSet.add(id);
      return nextSet;
    });
  }, [loadPhotos, photoTab]);

  useEffect(() => { refreshPhotos().catch(() => {}); }, [refreshPhotos]);
  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  const setOne = useCallback(async (id: string, s: "approved" | "rejected") => {
    setBusy(true);
    try {
      await setStatus({ data: { id, status: s } });
      await Promise.all([refreshPhotos(), Promise.resolve(refreshCounts())]);
    } finally { setBusy(false); }
  }, [setStatus, refreshPhotos, refreshCounts]);

  const deleteOne = useCallback(async (id: string) => {
    if (!confirm("Delete this photo permanently? This removes the file too.")) return;
    setBusy(true);
    try {
      await runDelete({ data: { id } });
      await Promise.all([refreshPhotos(), Promise.resolve(refreshCounts())]);
    } finally { setBusy(false); }
  }, [runDelete, refreshPhotos, refreshCounts]);

  async function bulkStatus(status: "approved" | "rejected" | "pending") {
    if (!selected.size) return;
    setBusy(true);
    try {
      await runBulkStatus({ data: { ids: Array.from(selected), status } });
      await Promise.all([refreshPhotos(), Promise.resolve(refreshCounts())]);
    } finally { setBusy(false); }
  }

  async function bulkDelete() {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} photos permanently? This removes the files too.`)) return;
    setBusy(true);
    try {
      await runBulkDelete({ data: { ids: Array.from(selected) } });
      await Promise.all([refreshPhotos(), Promise.resolve(refreshCounts())]);
    } finally { setBusy(false); }
  }

  async function saveCaption(id: string) {
    setBusy(true);
    try {
      await runUpdateCaption({ data: { id, caption: captionDraft } });
      setEditingCaption(null);
      await refreshPhotos();
    } finally { setBusy(false); }
  }

  const allSelected = photos.length > 0 && photos.every((p) => selected.has(p.id));
  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(photos.map((p) => p.id)));
  }

  // Keyboard shortcuts (only when lightbox open)
  useEffect(() => {
    if (lightbox === null) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (lightbox === null) return;
      const p = photos[lightbox];
      if (!p) return;
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? null : Math.max(0, i - 1)));
      else if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : Math.min(photos.length - 1, i + 1)));
      else if (e.key.toLowerCase() === "a" && photoTab !== "approved") { void setOne(p.id, "approved"); }
      else if (e.key.toLowerCase() === "r" && photoTab !== "rejected") { void setOne(p.id, "rejected"); }
      else if (e.key.toLowerCase() === "d") { void deleteOne(p.id); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photos, photoTab, setOne, deleteOne]);

  const tabLabel = (s: PhotoTab) => {
    const base = s === "pending" ? t.admin.pending : s === "approved" ? t.admin.approved : t.admin.rejected;
    const n = counts?.[s];
    return n === undefined ? base : `${base} (${n})`;
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s} onClick={() => setPhotoTab(s)}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${photoTab === s ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
          >
            {tabLabel(s)}
          </button>
        ))}
        {photos.length > 0 && (
          <label className="ml-4 text-xs text-muted-foreground flex items-center gap-2">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            Select all ({photos.length})
          </label>
        )}
      </div>

      {selected.size > 0 && (
        <div className="mt-4 sticky top-2 z-20 flex flex-wrap items-center gap-3 border border-primary/40 bg-primary/5 backdrop-blur px-4 py-2 text-xs">
          <span className="uppercase tracking-[0.2em] text-primary">{selected.size} selected</span>
          {photoTab !== "approved" && (
            <button disabled={busy} onClick={() => bulkStatus("approved")} className="border border-primary text-primary px-3 py-1 uppercase tracking-[0.2em] disabled:opacity-50">Approve {selected.size}</button>
          )}
          {photoTab !== "rejected" && (
            <button disabled={busy} onClick={() => bulkStatus("rejected")} className="border border-border text-foreground px-3 py-1 uppercase tracking-[0.2em] disabled:opacity-50">Reject {selected.size}</button>
          )}
          {photoTab !== "pending" && (
            <button disabled={busy} onClick={() => bulkStatus("pending")} className="border border-border text-foreground px-3 py-1 uppercase tracking-[0.2em] disabled:opacity-50">Move to pending</button>
          )}
          <button disabled={busy} onClick={bulkDelete} className="border border-destructive text-destructive px-3 py-1 uppercase tracking-[0.2em] disabled:opacity-50">Delete {selected.size}</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-muted-foreground uppercase tracking-[0.2em]">Clear</button>
        </div>
      )}

      {photos.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t.admin.noPhotos}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((p, idx) => {
            const isSel = selected.has(p.id);
            return (
              <div key={p.id} className={`relative rounded-sm border ${isSel ? "border-primary" : "border-border/60"} bg-card overflow-hidden group`}>
                <label className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur rounded-sm px-1.5 py-0.5">
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={(e) => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(p.id); else next.delete(p.id);
                        return next;
                      });
                    }}
                    aria-label={`Select photo from ${p.uploader_name}`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setLightbox(idx)}
                  className="block w-full aspect-square overflow-hidden focus:outline-none"
                  aria-label="Open larger view"
                >
                  <img
                    src={p.url}
                    alt={p.caption ?? `Photo from ${p.uploader_name}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
                <div className="p-3 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-sm truncate">{p.uploader_name}</div>
                    <div className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {p.uploader_email && <div className="text-xs text-muted-foreground truncate">{p.uploader_email}</div>}

                  {editingCaption === p.id ? (
                    <div className="space-y-1">
                      <textarea
                        value={captionDraft}
                        onChange={(e) => setCaptionDraft(e.target.value)}
                        rows={2}
                        maxLength={300}
                        className="w-full border border-input bg-background px-2 py-1 text-xs"
                      />
                      <div className="flex gap-2">
                        <button disabled={busy} onClick={() => saveCaption(p.id)} className="text-[10px] uppercase tracking-[0.2em] text-primary">Save</button>
                        <button onClick={() => setEditingCaption(null)} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setEditingCaption(p.id); setCaptionDraft(p.caption ?? ""); }}
                      className="block text-left w-full text-xs text-foreground/80 min-h-[1.25rem] hover:text-primary"
                      title="Click to edit caption"
                    >
                      {p.caption || <span className="italic text-muted-foreground">Add caption…</span>}
                    </button>
                  )}

                  <div className="flex gap-2 pt-1">
                    {photoTab !== "approved" && (
                      <button disabled={busy} onClick={() => setOne(p.id, "approved")} className="flex-1 rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-[0.15em] py-1.5 disabled:opacity-50">{t.admin.approve}</button>
                    )}
                    {photoTab !== "rejected" && (
                      <button disabled={busy} onClick={() => setOne(p.id, "rejected")} className="flex-1 rounded-full border border-input text-xs uppercase tracking-[0.15em] py-1.5 disabled:opacity-50">{t.admin.reject}</button>
                    )}
                    <button disabled={busy} onClick={() => deleteOne(p.id)} className="rounded-full border border-destructive text-destructive text-xs uppercase tracking-[0.15em] py-1.5 px-3 disabled:opacity-50" title="Delete permanently">×</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lightbox !== null && photos[lightbox] && (
        <PhotoLightbox
          photo={photos[lightbox]}
          index={lightbox}
          total={photos.length}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox((i) => (i === null ? null : Math.max(0, i - 1)))}
          onNext={() => setLightbox((i) => (i === null ? null : Math.min(photos.length - 1, i + 1)))}
        />
      )}

      <p className="mt-6 text-[10px] text-muted-foreground">
        Keyboard shortcuts (in lightbox): <span className="font-mono">← →</span> navigate ·
        <span className="font-mono"> A</span> approve · <span className="font-mono">R</span> reject ·
        <span className="font-mono"> D</span> delete · <span className="font-mono">Esc</span> close
      </p>
    </div>
  );
}

function PhotoLightbox({
  photo, index, total, onClose, onPrev, onNext,
}: {
  photo: AdminPhoto;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-5xl flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground pb-2">
        <div>{index + 1} / {total}</div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }}>Close</button>
      </div>
      <div className="flex-1 flex items-center gap-3 w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onPrev} disabled={index === 0} className="text-2xl text-muted-foreground disabled:opacity-30 px-2">←</button>
        <img src={photo.url} alt={photo.caption || "Uploaded wedding photo"} className="flex-1 max-h-[80vh] object-contain" />
        <button onClick={onNext} disabled={index === total - 1} className="text-2xl text-muted-foreground disabled:opacity-30 px-2">→</button>
      </div>
      <div className="w-full max-w-5xl pt-3 text-sm text-center">
        <div className="font-serif text-primary">{photo.uploader_name}</div>
        {photo.caption && <p className="text-xs text-foreground/80 mt-1">{photo.caption}</p>}
      </div>
    </div>
  );
}

// ================== Feature flags ==================

function FeatureFlagsPanel() {
  const loadFlags = useServerFn(getFeatureFlags);
  const saveFlags = useServerFn(setFeatureFlags);
  const [saved, setSaved] = useState<FeatureFlag[] | null>(null);
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const refresh = useCallback(() => {
    loadFlags({}).then((flags) => {
      setSaved(flags);
      setDraft({});
    }).catch(() => {});
  }, [loadFlags]);

  useEffect(() => { refresh(); }, [refresh]);

  function toggleDraft(key: string, currentEnabled: boolean) {
    setDraft((prev) => {
      const effective = key in prev ? prev[key] : currentEnabled;
      const next = { ...prev };
      const flipped = !effective;
      if (flipped === currentEnabled) delete next[key];
      else next[key] = flipped;
      return next;
    });
    setMessage(null);
  }

  const pendingChanges = (saved ?? [])
    .filter((f) => f.key in draft)
    .map((f) => ({ key: f.key, label: f.label, from: f.enabled, to: draft[f.key] }));
  const hasPending = pendingChanges.length > 0;

  async function confirmSave() {
    setSaving(true);
    try {
      await saveFlags({
        data: { changes: pendingChanges.map((c) => ({ key: c.key, enabled: c.to })) },
      });
      setMessage({
        kind: "success",
        text: `Saved ${pendingChanges.length} change${pendingChanges.length > 1 ? "s" : ""}.`,
      });
      setConfirming(false);
      refresh();
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "Couldn't save changes. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  function discardDraft() {
    setDraft({});
    setMessage(null);
  }

  return (
    <div className="mt-8">
      <p className="text-xs text-muted-foreground max-w-2xl">
        Control which guest-facing features are live on the public site. Toggle what you want to
        change, then review and confirm — nothing goes live until you save.
      </p>
      <div className="mt-4 border border-border/40 divide-y divide-border/40">
        {saved === null ? (
          <div className="p-4 text-xs text-muted-foreground">Loading…</div>
        ) : saved.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground">No feature flags yet.</div>
        ) : (
          saved.map((f) => {
            const isPending = f.key in draft;
            const effective = isPending ? draft[f.key] : f.enabled;
            return (
              <div
                key={f.key}
                className={`flex items-center justify-between gap-4 p-4 ${isPending ? "bg-primary/5" : ""}`}
              >
                <div className="min-w-0">
                  <div className="text-sm text-foreground flex items-center gap-2">
                    {f.label}
                    {isPending && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-primary">Pending</span>
                    )}
                  </div>
                  {f.description && (
                    <div className="text-xs text-muted-foreground mt-1">{f.description}</div>
                  )}
                </div>
                <Switch
                  checked={effective}
                  disabled={saving}
                  onCheckedChange={() => toggleDraft(f.key, f.enabled)}
                />
              </div>
            );
          })
        )}
      </div>

      {message && !confirming && (
        <p className={`mt-3 text-xs ${message.kind === "success" ? "text-primary" : "text-destructive"}`}>
          {message.text}
        </p>
      )}

      {hasPending && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setConfirming(true)}
            className="border border-primary bg-primary text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.2em]"
          >
            Save changes
          </button>
          <button
            onClick={discardDraft}
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Discard
          </button>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-card border border-border p-6 sm:p-8 my-8">
            <h3 className="font-serif text-2xl text-primary">Confirm changes</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              These changes take effect on the public site immediately.
            </p>
            <ul className="mt-4 space-y-2">
              {pendingChanges.map((c) => (
                <li
                  key={c.key}
                  className="text-sm flex items-center justify-between border border-border/40 px-3 py-2"
                >
                  <span>{c.label}</span>
                  <span className="text-xs uppercase tracking-[0.2em]">
                    {c.from ? "On" : "Off"} →{" "}
                    <span className={c.to ? "text-primary" : "text-destructive"}>
                      {c.to ? "On" : "Off"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {message && (
              <p className={`mt-4 text-xs ${message.kind === "success" ? "text-primary" : "text-destructive"}`}>
                {message.text}
              </p>
            )}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={confirmSave}
                disabled={saving}
                className="border border-primary bg-primary text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Confirm"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={saving}
                className="border border-border text-foreground px-3 py-2 text-xs uppercase tracking-[0.2em]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

