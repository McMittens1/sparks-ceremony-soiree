import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
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
  bulkDeleteGuests,
  importGuestsCsv,
  unlockGuestPhoneVerify,
  type AdminGuestRow,
  type PartyMember,
  type ImportRowResult,
} from "@/lib/rsvp.functions";
import { getFeatureFlags, setFeatureFlags, type FeatureFlag } from "@/lib/feature-flags.functions";
import { Switch } from "@/components/ui/switch";
import { SITE } from "@/lib/site";
import { PHOTO_CAPTION_MAX_LENGTH } from "@/lib/photo-config";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin · Geo & Addison" }, { name: "robots", content: "noindex,nofollow" }],
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
            {k === "rsvps"
              ? t.admin.rsvpsTab
              : k === "photos"
                ? t.admin.photosTab
                : t.admin.featuresTab}
          </button>
        ))}
      </div>

      {tab === "rsvps" ? (
        <RsvpsPanel />
      ) : tab === "photos" ? (
        <PhotosPanel />
      ) : (
        <FeatureFlagsPanel />
      )}
    </div>
  );
}

// ================== Activity strip ==================

function ActivityStrip() {
  const loadActivity = useServerFn(getRecentActivity);
  const [a, setA] = useState<Awaited<ReturnType<typeof loadActivity>> | null>(null);
  useEffect(() => {
    loadActivity({})
      .then(setA)
      .catch(() => {});
  }, [loadActivity]);
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
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            {label}
          </div>
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
  const runUnlock = useServerFn(unlockGuestPhoneVerify);
  const runBulkDelete = useServerFn(bulkDeleteGuests);
  const [rows, setRows] = useState<AdminGuestRow[] | null>(null);
  const [filter, setFilter] = useState<"all" | "attending" | "not_attending" | "no_response">(
    "all",
  );
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
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const refreshToken = useRef(0);

  async function refresh() {
    // If a newer refresh has started by the time this one resolves, drop
    // this result rather than let a slow, stale response clobber fresher
    // data (e.g. two quick unlocks firing back-to-back).
    const token = ++refreshToken.current;
    const next = await loadRows({});
    if (token !== refreshToken.current) return;
    setRows(next);
  }

  async function unlock(id: string) {
    setUnlockingId(id);
    try {
      await runUnlock({ data: { id } });
      await refresh();
      toast.success("Household unlocked.");
    } finally {
      setUnlockingId(null);
    }
  }

  async function doBulkDelete() {
    const n = selected.size;
    setBusy(true);
    try {
      await runBulkDelete({ data: { ids: Array.from(selected) } });
      setSelected(new Set());
      await refresh();
      toast.success(`${n} invitation${n === 1 ? "" : "s"} deleted.`);
      setConfirmBulkDelete(false);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

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
      if (filter === "attending")
        return r.rsvp.status === "attending" || r.rsvp.status === "partial";
      if (filter === "not_attending") return r.rsvp.status === "not_attending";
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    const statusRank = (r: AdminGuestRow) =>
      !r.rsvp ? 0 : r.rsvp.status === "attending" ? 3 : r.rsvp.status === "partial" ? 2 : 1;
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "name") {
        av = a.primary_name.toLowerCase();
        bv = b.primary_name.toLowerCase();
      } else if (sortKey === "status") {
        av = statusRank(a);
        bv = statusRank(b);
      } else if (sortKey === "party") {
        av = a.party_members.length || 1;
        bv = b.party_members.length || 1;
      } else if (sortKey === "city") {
        av = (a.city ?? "").toLowerCase();
        bv = (b.city ?? "").toLowerCase();
      } else if (sortKey === "submitted") {
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
    let attending = 0,
      declined = 0,
      pending = 0,
      adults = 0,
      children = 0;
    for (const r of rows) {
      if (!r.rsvp) {
        pending++;
        continue;
      }
      if (r.rsvp.status === "not_attending") {
        declined++;
        continue;
      }
      attending++;
      for (const a of r.rsvp.attendees) {
        if (!a.attending) continue;
        if (a.is_child) children++;
        else adults++;
      }
    }
    return { attending, declined, pending, adults, children };
  }, [rows]);

  const buildRsvpUrl = useCallback((row: AdminGuestRow) => {
    const path = `/rsvp/edit/${row.edit_token}`;
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, []);

  // The pre-invitation link for TextMyWedding — lands directly on the
  // household's phone-verification step, skipping name search. Long-lived
  // (see VERIFY_LINK_TTL_MS), safe to send well before RSVP opens. Built
  // from window.location.origin — fine for this on-screen copy-link
  // button (an admin is always looking at it from wherever they're
  // logged in), but NOT safe to reuse for the TextMyWedding export below,
  // which must always resolve to the real production domain regardless
  // of where it's generated from — see buildProdVerifyUrl.
  const buildVerifyUrl = useCallback((row: AdminGuestRow) => {
    const path = `/rsvp?t=${row.verify_token}`;
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, []);

  const membersField = (members: PartyMember[]) =>
    members.map((m) => (m.is_child ? `${m.name} (child)` : m.name)).join("; ");

  const attendeesField = (rsvp: AdminGuestRow["rsvp"]) =>
    (rsvp?.attendees ?? [])
      .map((a) => {
        const tags = [a.is_child ? "child" : null, a.attending ? null : "declined"].filter(Boolean);
        return tags.length ? `${a.name} (${tags.join(", ")})` : a.name;
      })
      .join("; ");

  function downloadCsv(csv: string, name: string) {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Complete Master CSV — the full, round-trippable backup. The first 12
  // columns exactly match Master Import's columns (same names, same
  // shapes), so this file can be re-imported as-is; everything after
  // is read-only RSVP/audit data, never re-imported.
  function toMasterCsv(list: AdminGuestRow[]) {
    const header = [
      "household_name",
      "slug",
      "phone",
      "members",
      "email",
      "address_line1",
      "address_line2",
      "city",
      "state",
      "postal_code",
      "country",
      "invite_notes",
      "rsvp_status",
      "rsvp_attendees",
      "address_confirmed",
      "song_request",
      "rsvp_message",
      "rsvp_submitted_at",
      "edit_url",
      "verify_url",
      "phone_verify_last_success_at",
      "address_confirmed_at",
      "address_updated_at",
      "created_at",
      "updated_at",
    ];
    const body = list.map((r) =>
      [
        r.primary_name,
        r.slug,
        r.phone,
        membersField(r.party_members),
        r.email,
        r.address_line1,
        r.address_line2,
        r.city,
        r.state,
        r.postal_code,
        r.country,
        r.invite_notes,
        r.rsvp?.status ?? "no_response",
        attendeesField(r.rsvp),
        r.rsvp?.address_confirmed ? "yes" : "no",
        r.rsvp?.song_request,
        r.rsvp?.message,
        r.rsvp?.submitted_at,
        buildRsvpUrl(r),
        buildVerifyUrl(r),
        r.phone_verify_last_success_at,
        r.address_confirmed_at,
        r.address_updated_at,
        r.created_at,
        r.updated_at,
      ]
        .map((v) => escCsv(typeof v === "string" ? v : (v ?? "")))
        .join(","),
    );
    return [header.join(","), ...body].join("\n");
  }

  // TextMyWedding export — their fixed format, kept entirely separate from
  // the master export above. Built from SITE.siteUrl, not
  // window.location.origin/buildVerifyUrl, so the link is always
  // production regardless of where this export runs from.
  function toTextMyWeddingCsv(list: AdminGuestRow[]) {
    const header = [
      "First Name",
      "Last Name",
      "Phone",
      "Email",
      "Address",
      "Apt/Unit",
      "City",
      "State",
      "Zip",
    ];
    const body = list.map((r) => {
      const isUS = !r.country?.trim() || /^us(a)?$/i.test(r.country.trim());
      return [
        r.primary_name,
        `${SITE.siteUrl}/rsvp?t=${r.verify_token}`,
        r.phone,
        r.email ?? "",
        isUS ? (r.address_line1 ?? "") : "",
        isUS ? (r.address_line2 ?? "") : "",
        isUS ? (r.city ?? "") : "",
        isUS ? (r.state ?? "") : "",
        isUS ? (r.postal_code ?? "") : "",
      ]
        .map((v) => escCsv(v))
        .join(",");
    });
    return [header.join(","), ...body].join("\n");
  }

  async function copySelectedLinks() {
    const links = filtered
      .filter((r) => selected.has(r.id))
      .map((r) => `${r.primary_name}\t${buildRsvpUrl(r)}`)
      .join("\n");
    if (!links) return;
    try {
      await navigator.clipboard.writeText(links);
      toast.success(`Copied ${selected.size} RSVP link${selected.size === 1 ? "" : "s"}.`);
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  }

  async function copyOneLink(row: AdminGuestRow) {
    try {
      await navigator.clipboard.writeText(buildRsvpUrl(row));
      toast.success(`Copied ${row.primary_name}'s RSVP link.`);
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  }

  function exportCsv(csv: string, name: string, count: number, label: string) {
    downloadCsv(csv, name);
    toast.success(`Exported ${count} household${count === 1 ? "" : "s"} to ${label}.`);
  }

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "submitted" ? "desc" : "asc");
    }
  }

  const allVisibleSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  function toggleAllVisible() {
    if (allVisibleSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  }

  const selectedRows = filtered.filter((r) => selected.has(r.id));

  // Every export/import toolbar action other than "(all)" operates on this
  // filtered view, not the full guest list — deliberately, so an admin can
  // e.g. filter to "no_response" before a TextMyWedding batch. The risk is a
  // filter left on from earlier work silently narrowing the next export with
  // no sign anything was excluded, so both the count-on-button-label below
  // and this banner exist to make that impossible to miss.
  const activeFilterCount = [
    search.trim() !== "",
    filter !== "all",
    partySize !== "any",
    cityFilter.trim() !== "",
    addrOnly,
    songOnly,
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setFilter("all");
    setPartySize("any");
    setCityFilter("");
    setAddrOnly(false);
    setSongOnly(false);
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
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              {label}
            </div>
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
          <input
            type="checkbox"
            checked={addrOnly}
            onChange={(e) => setAddrOnly(e.target.checked)}
          />
          Address unconfirmed
        </label>
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <input
            type="checkbox"
            checked={songOnly}
            onChange={(e) => setSongOnly(e.target.checked)}
          />
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
          Import Master CSV
        </button>
        <button
          onClick={() =>
            exportCsv(toMasterCsv(filtered), "master-filtered", filtered.length, "Master CSV")
          }
          className="text-xs uppercase tracking-[0.2em] border border-border text-foreground px-3 py-2"
          title="Complete backup of the currently filtered rows — importable"
        >
          Export Master CSV ({filtered.length})
        </button>
        <button
          onClick={() =>
            rows && exportCsv(toMasterCsv(rows), "master-all", rows.length, "Master CSV")
          }
          className="text-xs uppercase tracking-[0.2em] border border-border text-foreground px-3 py-2"
          title="Complete backup of every household — importable"
        >
          Export Master CSV (all {rows?.length ?? 0})
        </button>
        <button
          onClick={() =>
            exportCsv(
              toTextMyWeddingCsv(filtered),
              "textmywedding",
              filtered.length,
              "TextMyWedding CSV",
            )
          }
          className="text-xs uppercase tracking-[0.2em] border border-border text-foreground px-3 py-2"
          title="TextMyWedding's exact column format — not a backup. Exports the currently filtered rows."
        >
          Export TextMyWedding CSV ({filtered.length})
        </button>
        <button
          onClick={() => openHumanReadableReport(filtered)}
          className="text-xs uppercase tracking-[0.2em] border border-border text-foreground px-3 py-2"
          title="Polished, printable review document"
        >
          Human-Readable Report
        </button>
      </div>

      {activeFilterCount > 0 && rows && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border border-accent/50 bg-accent/10 px-4 py-2 text-xs">
          <span className="text-foreground">
            Showing <span className="font-medium text-primary">{filtered.length}</span> of{" "}
            {rows.length} households — {activeFilterCount} filter
            {activeFilterCount === 1 ? "" : "s"} active.
          </span>
          <span className="text-muted-foreground">
            The exports above act on this filtered view.
          </span>
          <button
            onClick={clearFilters}
            className="ml-auto uppercase tracking-[0.2em] text-primary link-underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-primary/40 bg-primary/5 px-4 py-2 text-xs">
          <span className="uppercase tracking-[0.2em] text-primary">{selected.size} selected</span>
          <button
            onClick={() =>
              exportCsv(
                toMasterCsv(selectedRows),
                "master-selected",
                selectedRows.length,
                "Master CSV",
              )
            }
            className="border border-primary text-primary px-3 py-1 uppercase tracking-[0.2em]"
          >
            Export selected
          </button>
          <button
            onClick={copySelectedLinks}
            className="border border-border text-foreground px-3 py-1 uppercase tracking-[0.2em]"
          >
            Copy RSVP links
          </button>
          <button
            onClick={() => setConfirmBulkDelete(true)}
            className="border border-destructive text-destructive px-3 py-1 uppercase tracking-[0.2em]"
          >
            Delete {selected.size}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-muted-foreground uppercase tracking-[0.2em]"
          >
            Clear
          </button>
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
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select all visible"
                  />
                </th>
                <SortHeader
                  label={t.admin.partyCol}
                  k="name"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader
                  label="Status"
                  k="status"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader
                  label="Party"
                  k="party"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader label="Attending" k={null} />
                <SortHeader
                  label="City"
                  k="city"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader
                  label="Submitted"
                  k="submitted"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader label="Link" k={null} />
                <SortHeader label="" k={null} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const attending = r.rsvp?.attendees.filter((a) => a.attending) ?? [];
                const isSel = selected.has(r.id);
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-border/20 align-top ${isSel ? "bg-primary/5" : ""}`}
                  >
                    <td className="py-3 pr-2">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={(e) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(r.id);
                            else next.delete(r.id);
                            return next;
                          });
                        }}
                        aria-label={`Select ${r.primary_name}`}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-serif text-primary">{r.primary_name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.phone ? formatPhoneDisplay(r.phone) : ""}
                        {r.phone && r.email ? " · " : ""}
                        {r.email ? r.email : ""}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {r.rsvp ? (
                        <span
                          className={`text-[10px] uppercase tracking-[0.2em] px-2 py-1 border ${
                            r.rsvp.status === "attending"
                              ? "border-primary text-primary"
                              : r.rsvp.status === "partial"
                                ? "border-accent text-accent"
                                : "border-muted-foreground text-muted-foreground"
                          }`}
                        >
                          {r.rsvp.status.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          no response
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {r.party_members.length || 1}
                      {r.rsvp ? (
                        <span className="text-muted-foreground"> · {attending.length}✓</span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {attending.length === 0
                        ? "—"
                        : attending.map((a) => (
                            <div key={a.name}>
                              {a.name}
                              {a.is_child ? " (child)" : ""}
                            </div>
                          ))}
                    </td>
                    <td className="py-3 pr-4 text-xs">{r.city ?? "—"}</td>
                    <td className="py-3 pr-4 text-xs">
                      {r.rsvp?.submitted_at
                        ? new Date(r.rsvp.submitted_at).toLocaleDateString()
                        : "—"}
                      {r.rsvp?.address_confirmed ? (
                        <div className="text-[10px] text-muted-foreground">✓ addr</div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-xs font-mono">
                      <button
                        onClick={() => copyOneLink(r)}
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
                      {r.phone_verify_locked_until &&
                        new Date(r.phone_verify_locked_until).getTime() > Date.now() && (
                          <div className="mt-1">
                            <span className="text-[10px] uppercase tracking-[0.15em] text-destructive">
                              Locked
                            </span>
                            <button
                              onClick={() => unlock(r.id)}
                              disabled={unlockingId === r.id}
                              className="block text-[10px] uppercase tracking-[0.2em] text-primary link-underline disabled:opacity-50"
                            >
                              {unlockingId === r.id ? "Unlocking…" : "Unlock"}
                            </button>
                          </div>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <GuestEditor
          row={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      )}
      {importOpen && <CsvImporter onClose={() => setImportOpen(false)} onDone={refresh} />}
      {confirmBulkDelete && (
        <ConfirmDialog
          title={`Delete ${selected.size} invitations?`}
          description="This also deletes each household's RSVP, if they submitted one. This cannot be undone."
          confirmLabel={`Delete ${selected.size}`}
          busy={busy}
          onConfirm={doBulkDelete}
          onCancel={() => setConfirmBulkDelete(false)}
        />
      )}
    </div>
  );
}

function SortHeader({
  label,
  k,
  sortKey,
  sortDir,
  onClick,
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

// ================== Phone formatting ==================
// Storage stays a normalized bare-digit string (see normalizePhone in
// rsvp.functions.ts) — this is purely the admin-facing display/typing
// layer, formatting live as (XXX) XXX-XXXX for US numbers and +CC (XXX)
// XXX-XXXX once more than 10 digits are entered (e.g. a pasted Mexico
// number with country code).

function formatPhoneDisplay(raw: string): string {
  let d = raw.replace(/\D/g, "").slice(0, 15);
  let cc = "";
  if (d.length > 10) {
    if (d.startsWith("1") && d.length === 11) {
      cc = "+1 ";
      d = d.slice(1);
    } else {
      cc = `+${d.slice(0, d.length - 10)} `;
      d = d.slice(-10);
    }
  }
  if (d.length === 0) return "";
  if (d.length <= 3) return cc + d;
  if (d.length <= 6) return `${cc}(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `${cc}(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

// Controlled input whose value prop/onChange deal in raw digits, while the
// rendered text is always the formatted display — the caret is repositioned
// after each keystroke (by counting digits before it) so reformatting
// doesn't jump the cursor to the end while editing mid-string. Handles
// pasted values the same way as typed ones, since paste just becomes part
// of the same change event.
function PhoneInput({
  value,
  onChange,
  className,
  placeholder,
  required,
}: {
  value: string;
  onChange: (digits: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const digitsBeforeCaret = el.value.slice(0, caret).replace(/\D/g, "").length;
    const digits = el.value.replace(/\D/g, "").slice(0, 15);
    onChange(digits);
    requestAnimationFrame(() => {
      if (!ref.current) return;
      const formatted = formatPhoneDisplay(digits);
      let seen = 0;
      let pos = formatted.length;
      if (digitsBeforeCaret === 0) {
        pos = 0;
      } else {
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) {
            seen++;
            if (seen === digitsBeforeCaret) {
              pos = i + 1;
              break;
            }
          }
        }
      }
      ref.current.setSelectionRange(pos, pos);
    });
  }

  return (
    <input
      ref={ref}
      type="tel"
      inputMode="tel"
      value={formatPhoneDisplay(value)}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      autoComplete="tel"
      className={className}
    />
  );
}

// ================== Address validation ==================

function looksLikeUsZip(v: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(v.trim());
}

function escCsv(s: string | null | undefined): string {
  const v = s ?? "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

// ================== Shared modal primitives ==================
// Every full-screen admin dialog (GuestEditor, CsvImporter, the feature-flag
// confirm overlay) is a hand-rolled fixed-inset div rather than a portal
// component, so Escape/backdrop-click have to be wired in explicitly here
// rather than coming for free from a dialog primitive. `active` lets a modal
// suppress both while a request is in flight, so a stray Escape or backdrop
// click can't drop the user out from under an unfinished save/import.

function useEscapeToClose(onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, active]);
}

function ModalBackdrop({
  onClose,
  active,
  className,
  children,
}: {
  onClose: () => void;
  active: boolean;
  className?: string;
  children: ReactNode;
}) {
  useEscapeToClose(onClose, active);
  return (
    <div
      className={
        className ??
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      }
      onMouseDown={(e) => {
        if (active && e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

// Site-styled stand-in for the destructive-action browser confirm() — kept
// visually consistent with the rest of the admin (square corners, uppercase
// tracking labels) rather than pulling in the default shadcn AlertDialog look.
function ConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalBackdrop
      onClose={onCancel}
      active={!busy}
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm bg-card border border-destructive/40 p-6">
        <h3 className="font-serif text-xl text-primary">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            className="border border-destructive bg-destructive text-destructive-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
          >
            {busy ? "Working…" : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="border border-border text-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// ================== Human-readable report ==================
// Client-side only — a print-optimized HTML view opened in a new tab,
// built from data already loaded in the admin dashboard. No server
// round-trip, no PDF library (this app's server functions run in a
// Worker runtime that can't use Node-only PDF tooling anyway); the
// browser's own "Print to PDF" is the PDF path.

function reportHtml(list: AdminGuestRow[]): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const addressLines = (r: AdminGuestRow) => {
    const lines: string[] = [];
    if (r.address_line1) lines.push([r.address_line1, r.address_line2].filter(Boolean).join(" "));
    const cityLine = [r.city, [r.state, r.postal_code].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");
    if (cityLine) lines.push(cityLine);
    if (r.country) lines.push(r.country);
    return lines.length ? lines.map(esc).join("<br>") : "<em>No address on file</em>";
  };
  const cards = list
    .map((r) => {
      const attending =
        r.rsvp?.attendees
          .filter((a) => a.attending)
          .map((a) => a.name + (a.is_child ? " (child)" : "")) ?? [];
      const declined = r.rsvp?.attendees.filter((a) => !a.attending).map((a) => a.name) ?? [];
      const members =
        r.party_members.map((m) => m.name + (m.is_child ? " (child)" : "")).join(", ") || "—";
      return `
        <section class="card">
          <h2>${esc(r.primary_name)} <span class="slug">${esc(r.slug)}</span></h2>
          <div class="grid">
            <div><span class="label">Invited party</span><p>${esc(members)}</p></div>
            <div><span class="label">Phone</span><p>${esc(formatPhoneDisplay(r.phone))}</p></div>
            <div><span class="label">Email</span><p>${r.email ? esc(r.email) : "<em>None on file</em>"}</p></div>
            <div><span class="label">Mailing address</span><p>${addressLines(r)}</p></div>
            <div><span class="label">RSVP status</span><p>${esc(r.rsvp?.status?.replace("_", " ") ?? "no response yet")}</p></div>
            <div><span class="label">Attending</span><p>${attending.length ? esc(attending.join(", ")) : "—"}</p></div>
            ${declined.length ? `<div><span class="label">Not attending</span><p>${esc(declined.join(", "))}</p></div>` : ""}
            <div><span class="label">Address confirmed</span><p>${r.rsvp?.address_confirmed ? "Yes" : "No"}</p></div>
            ${r.rsvp?.song_request ? `<div><span class="label">Song request</span><p>${esc(r.rsvp.song_request)}</p></div>` : ""}
            ${r.rsvp?.message ? `<div><span class="label">Message</span><p>${esc(r.rsvp.message)}</p></div>` : ""}
            ${r.invite_notes ? `<div><span class="label">Internal notes</span><p>${esc(r.invite_notes)}</p></div>` : ""}
          </div>
        </section>`;
    })
    .join("\n");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Guest List Report — ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Georgia, 'Iowan Old Style', serif; background: #F8F4EC; color: #4A4238; margin: 0; padding: 40px; }
    h1 { font-style: italic; color: #2A2520; font-weight: 400; margin: 0 0 4px; }
    .meta { font-family: -apple-system, sans-serif; font-size: 12px; color: #6E6255; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 32px; }
    .card { background: #fff; border: 1px solid #E1D6C3; padding: 20px 24px; margin-bottom: 18px; break-inside: avoid; page-break-inside: avoid; }
    .card h2 { font-style: italic; font-size: 20px; color: #2A2520; font-weight: 400; margin: 0 0 14px; }
    .card h2 .slug { font-family: 'SF Mono', monospace; font-size: 12px; color: #A39680; font-style: normal; margin-left: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
    .grid > div { grid-column: span 1; }
    .label { font-family: -apple-system, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6B5F49; display: block; margin-bottom: 2px; }
    .grid p { margin: 0; font-size: 14px; line-height: 1.5; }
    @media print { body { background: #fff; padding: 0; } .card { box-shadow: none; } }
  </style></head><body>
  <h1>Guest List Report</h1>
  <p class="meta">Generated ${new Date().toLocaleString()} · ${list.length} household${list.length === 1 ? "" : "s"}</p>
  ${cards}
  </body></html>`;
}

function openHumanReadableReport(list: AdminGuestRow[]): void {
  const html = reportHtml(list);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// ================== Guest editor ==================

function GuestEditor({
  row,
  onClose,
  onSaved,
}: {
  row: AdminGuestRow | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const runUpsert = useServerFn(upsertGuest);
  const runDelete = useServerFn(deleteGuest);
  const [primaryName, setPrimaryName] = useState(row?.primary_name ?? "");
  const [members, setMembers] = useState<PartyMember[]>(
    row?.party_members.length
      ? row.party_members
      : [{ name: row?.primary_name ?? "", is_child: false }],
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
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
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
          phone,
          email,
          address_line1: line1,
          address_line2: line2,
          city,
          state,
          postal_code: postal,
          country,
          invite_notes: notes,
        },
      });
      await onSaved();
      toast.success(row ? "Invitation saved." : `Invitation created for ${primaryName}.`);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!row) return;
    setDeleting(true);
    try {
      await runDelete({ data: { id: row.id } });
      await onSaved();
      toast.success(`Deleted ${row.primary_name}.`);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ModalBackdrop
      onClose={onClose}
      active={!saving && !deleting}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-card border border-border p-6 sm:p-8 my-8">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-primary">
            {row ? "Edit invitation" : "Add invitation"}
          </h3>
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Close
          </button>
        </div>

        {row && (
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p>
              Link code <span className="font-mono text-foreground">{row.slug}</span> — share{" "}
              <span className="font-mono text-foreground break-all">/rsvp?g={row.slug}</span>
            </p>
            <p>
              Pre-invitation link (for TextMyWedding, before invites mail) —{" "}
              <span className="font-mono text-foreground break-all">
                /rsvp?t={row.verify_token}
              </span>
            </p>
            {row.address_confirmed_at && (
              <p>Address confirmed {new Date(row.address_confirmed_at).toLocaleDateString()}</p>
            )}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Invitation name
            </label>
            <input
              value={primaryName}
              onChange={(e) => setPrimaryName(e.target.value)}
              placeholder="e.g. The Smith Family or John & Jane Doe"
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              How this invite is addressed on the envelope. Used to look them up.
            </p>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Guests on this invite
            </label>
            <div className="mt-1 space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={m.name}
                    onChange={(e) =>
                      setMembers((p) =>
                        p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                    placeholder="Full name"
                    className="flex-1 border border-input bg-background px-3 py-2 text-sm"
                  />
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={m.is_child}
                      onChange={(e) =>
                        setMembers((p) =>
                          p.map((x, j) => (j === i ? { ...x, is_child: e.target.checked } : x)),
                        )
                      }
                    />
                    child
                  </label>
                  <button
                    type="button"
                    onClick={() => setMembers((p) => p.filter((_, j) => j !== i))}
                    className="text-xs text-muted-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setMembers((p) => [...p, { name: "", is_child: false }])}
                className="text-xs uppercase tracking-[0.2em] text-primary"
              >
                + Add member
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                placeholder="Phone (required)"
                required
                className="w-full border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Required — the last 4 digits verify a household before their RSVP is shown. US or
                Mexico, 10 digits.
              </p>
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              autoComplete="email"
              maxLength={200}
              className="border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="Address line 1"
              autoComplete="address-line1"
              maxLength={200}
              className="sm:col-span-2 border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Address line 2"
              autoComplete="address-line2"
              maxLength={200}
              className="sm:col-span-2 border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              autoComplete="address-level2"
              maxLength={120}
              className="border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              autoComplete="address-level1"
              maxLength={60}
              className="border border-input bg-background px-3 py-2 text-sm"
            />
            <div>
              <input
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
                placeholder="ZIP"
                autoComplete="postal-code"
                maxLength={20}
                className="w-full border border-input bg-background px-3 py-2 text-sm"
              />
              {postal.trim() &&
                (!country.trim() || /^us(a)?$/i.test(country.trim())) &&
                !looksLikeUsZip(postal) && (
                  <p className="mt-1 text-[10px] text-destructive">
                    Doesn't look like a US ZIP (12345 or 12345-6789).
                  </p>
                )}
            </div>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              autoComplete="country-name"
              maxLength={60}
              className="border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Internal notes (guests never see these)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {row?.rsvp && (
            <div className="border-t border-border/40 pt-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Their RSVP
              </div>
              <div className="text-sm mt-1">
                Status: <span className="font-medium">{row.rsvp.status}</span> · Submitted{" "}
                {new Date(row.rsvp.submitted_at).toLocaleString()}
              </div>
              {row.rsvp.song_request && (
                <div className="text-sm mt-1">Song: {row.rsvp.song_request}</div>
              )}
              {row.rsvp.message && <div className="text-sm mt-1 italic">"{row.rsvp.message}"</div>}
            </div>
          )}

          {err && <p className="text-sm text-destructive">{err}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="border border-primary bg-primary text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {row && (
              <button
                onClick={() => setConfirmingDelete(true)}
                disabled={saving}
                className="border border-destructive text-destructive px-5 py-2 text-xs uppercase tracking-[0.2em] ml-auto disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
      {confirmingDelete && row && (
        <ConfirmDialog
          title="Delete this invitation?"
          description={`Delete ${row.primary_name}? This also deletes their RSVP. This cannot be undone.`}
          busy={deleting}
          onConfirm={doDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </ModalBackdrop>
  );
}

// ================== Master CSV importer — preview, then confirm ==================

interface ImportSummary {
  dryRun: boolean;
  totals: { inserted: number; updated: number; errors: number };
  rows: ImportRowResult[];
}

function actionBadge(action: ImportRowResult["action"]) {
  const cls =
    action === "insert"
      ? "border-primary text-primary"
      : action === "update"
        ? "border-accent text-accent"
        : "border-destructive text-destructive";
  return (
    <span className={`text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 border ${cls}`}>
      {action}
    </span>
  );
}

// Spreadsheet formats other than .csv/.txt are read as binary workbooks and
// converted to the same CSV text the plain-text path produces, so
// importGuestsCsv/planImportRows never need to know the source format. A
// column genuinely stored as a *number* in the source file (rather than
// text) can still lose a leading zero on save — e.g. a ZIP typed as 02134 —
// but that's identical to what Excel's own "Save as CSV" would do; nothing
// downstream of the file itself can recover a digit that was never stored.
const SPREADSHEET_EXTENSIONS = ["csv", "txt", "xlsx", "xls", "ods"] as const;
const SPREADSHEET_ACCEPT =
  ".csv,.txt,.xlsx,.xls,.ods,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.oasis.opendocument.spreadsheet";

type ImportPhase = "input" | "preview" | "importing" | "done";

function CsvImporter({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const runImport = useServerFn(importGuestsCsv);
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheetCount, setSheetCount] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [phase, setPhase] = useState<ImportPhase>("input");
  const [checking, setChecking] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = checking || parsing || phase === "importing";

  function editCsv(v: string) {
    setCsv(v);
    // A stale preview against edited text could be committed by mistake —
    // drop back to phase 1 the moment the source text changes.
    setPhase("input");
    setResult(null);
  }

  function resetAll() {
    setCsv("");
    setFileName(null);
    setSheetCount(1);
    setPhase("input");
    setResult(null);
    setErr(null);
  }

  async function loadFile(file: File) {
    const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
    if (!ext || !(SPREADSHEET_EXTENSIONS as readonly string[]).includes(ext)) {
      setErr("Please choose a .csv, .xlsx, .xls, or .ods file.");
      return;
    }
    setErr(null);
    setParsing(true);
    try {
      if (ext === "csv" || ext === "txt") {
        const text = await file.text();
        setFileName(file.name);
        setSheetCount(1);
        editCsv(text);
      } else {
        // Loaded on demand, not at module scope — xlsx is a ~140KB (gzipped)
        // parsing library that's only ever needed inside this client-side
        // file handler, never during server rendering. A static top-level
        // import would otherwise get pulled into the SSR/Worker bundle for
        // every admin page load, whether or not anyone imports a spreadsheet.
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheetName = wb.SheetNames[0];
        if (!sheetName) throw new Error("That file doesn't have any sheets.");
        const text = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName], { blankrows: false });
        setFileName(file.name);
        setSheetCount(wb.SheetNames.length);
        editCsv(text);
      }
    } catch (e) {
      setErr(
        e instanceof Error
          ? `Couldn't read that file: ${e.message}`
          : "Couldn't read that file. Please try again.",
      );
    } finally {
      setParsing(false);
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void loadFile(file);
    e.target.value = ""; // allow re-selecting the same file later
  }

  function onDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  }

  async function doPreview() {
    setChecking(true);
    setErr(null);
    try {
      const r = await runImport({ data: { csv, dryRun: true } });
      setResult(r);
      setPhase("preview");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setChecking(false);
    }
  }

  async function doConfirm() {
    setPhase("importing");
    setErr(null);
    try {
      const r = await runImport({ data: { csv, dryRun: false } });
      await onDone(); // refresh the admin table before declaring success
      setResult(r);
      setPhase("done");
      toast.success(
        `Import complete: ${r.totals.inserted} new, ${r.totals.updated} updated` +
          (r.totals.errors ? `, ${r.totals.errors} error${r.totals.errors === 1 ? "" : "s"}` : "") +
          ".",
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Import failed");
      setPhase("preview"); // back to the preview table, not stranded mid-progress
    }
  }

  function finishAndClose() {
    resetAll();
    onClose();
  }

  return (
    <ModalBackdrop
      onClose={finishAndClose}
      active={phase !== "importing"}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-3xl bg-card border border-border p-6 sm:p-8 my-8">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-primary">Import Master CSV</h3>
          {phase !== "importing" && (
            <button
              onClick={finishAndClose}
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Close
            </button>
          )}
        </div>

        {phase === "input" && (
          <>
            <p className="mt-2 text-xs text-muted-foreground">
              Columns (header row optional):{" "}
              <span className="font-mono">
                household_name, phone, members, email, address_line1, address_line2, city, state,
                postal_code, country, invite_notes, slug
              </span>
              . Separate party members with <span className="font-mono">;</span> and append{" "}
              <span className="font-mono">(child)</span> for kids. A{" "}
              <span className="font-mono">slug</span> column requires an explicit header row and
              matches an existing household for an update — omit it to always insert new.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="text-foreground">Phone is required for new households</span> — it's
              how they verify themselves before their RSVP is shown. On an update (matched by slug,
              phone, or email), a{" "}
              <span className="text-foreground">blank cell leaves that field unchanged</span> — it's
              never treated as "clear this."
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Accepts <span className="font-mono">.csv</span>,{" "}
              <span className="font-mono">.xlsx</span>, <span className="font-mono">.xls</span>, or{" "}
              <span className="font-mono">.ods</span> — only the first sheet of a workbook is read.
              If a phone or ZIP column loses a leading digit, format that column as{" "}
              <span className="text-foreground">Text</span> in Excel before saving.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsing}
                className="border border-border text-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
              >
                {parsing ? "Reading file…" : "Choose File"}
              </button>
              {fileName && (
                <span className="text-xs text-muted-foreground font-mono">
                  {fileName}
                  {sheetCount > 1 ? ` (sheet 1 of ${sheetCount})` : ""}
                </span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={SPREADSHEET_ACCEPT}
                onChange={onFileInputChange}
                className="hidden"
                aria-label="Choose a spreadsheet file to import"
              />
            </div>
            <textarea
              value={csv}
              onChange={(e) => {
                setFileName(null);
                setSheetCount(1);
                editCsv(e.target.value);
              }}
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              rows={12}
              placeholder="Drop a CSV/Excel/ODS file here, choose one above, or paste CSV text directly…&#10;household_name,phone,members,email,address_line1,city,state,postal_code&#10;Jane & John Doe,402-555-1234,Jane Doe;John Doe;Emma Doe (child),jane@example.com,123 Main St,Louisville,NE,68037"
              className={`mt-2 w-full border px-3 py-2 text-xs font-mono transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-input bg-background"
              }`}
            />

            {err && <p className="mt-3 text-sm text-destructive">{err}</p>}

            <div className="mt-4 flex gap-3">
              <button
                onClick={doPreview}
                disabled={busy || !csv.trim()}
                className="border border-primary bg-primary text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
              >
                {checking ? "Checking…" : "Preview"}
              </button>
            </div>
          </>
        )}

        {(phase === "preview" || phase === "importing") && result && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="uppercase tracking-[0.2em] text-primary">
                Preview: {result.totals.inserted} new, {result.totals.updated} updated,{" "}
                {result.totals.errors} error{result.totals.errors === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-3 max-h-[400px] overflow-y-auto border border-border/40">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground sticky top-0 bg-card">
                  <tr className="border-b border-border/40">
                    <th className="text-left py-2 px-3">Row</th>
                    <th className="text-left py-2 px-3">Household</th>
                    <th className="text-left py-2 px-3">Action</th>
                    <th className="text-left py-2 px-3">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r) => (
                    <tr key={r.row} className="border-b border-border/20 align-top">
                      <td className="py-2 px-3 text-muted-foreground">{r.row}</td>
                      <td className="py-2 px-3">{r.household_name ?? "—"}</td>
                      <td className="py-2 px-3">
                        {actionBadge(r.action)}
                        {r.matchedBy && (
                          <span className="ml-2 text-muted-foreground">by {r.matchedBy}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {r.error && <span className="text-destructive">{r.error}</span>}
                        {r.warnings.map((w, i) => (
                          <div key={i} className="text-muted-foreground">
                            {w}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {phase === "importing" ? (
              <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-primary">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin"
                  aria-hidden="true"
                />
                Importing {result.rows.length} row{result.rows.length === 1 ? "" : "s"}…
              </div>
            ) : (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={doConfirm}
                  disabled={busy}
                  className="border border-primary bg-primary text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
                >
                  Confirm Import
                </button>
                <button
                  onClick={() => editCsv(csv)}
                  disabled={busy}
                  className="border border-border text-foreground px-5 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-50"
                >
                  Back to edit
                </button>
              </div>
            )}

            {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
          </div>
        )}

        {phase === "done" && result && (
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary"
                aria-hidden="true"
              >
                ✓
              </span>
              <h4 className="font-serif text-xl text-primary">Import complete</h4>
            </div>
            <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["New households", result.totals.inserted],
                ["Updated", result.totals.updated],
                ["Warnings", result.rows.reduce((n, r) => n + r.warnings.length, 0)],
                ["Errors", result.totals.errors],
              ].map(([label, n]) => (
                <div key={label as string} className="border border-border/40 p-3 text-center">
                  <div
                    className={`text-xl font-serif ${label === "Errors" && (n as number) > 0 ? "text-destructive" : "text-primary"}`}
                  >
                    {n}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                    {label}
                  </div>
                </div>
              ))}
            </dl>

            {(result.totals.errors > 0 || result.rows.some((r) => r.warnings.length)) && (
              <div className="mt-4 max-h-[300px] overflow-y-auto border border-border/40">
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground sticky top-0 bg-card">
                    <tr className="border-b border-border/40">
                      <th className="text-left py-2 px-3">Row</th>
                      <th className="text-left py-2 px-3">Household</th>
                      <th className="text-left py-2 px-3">Action</th>
                      <th className="text-left py-2 px-3">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows
                      .filter((r) => r.error || r.warnings.length)
                      .map((r) => (
                        <tr key={r.row} className="border-b border-border/20 align-top">
                          <td className="py-2 px-3 text-muted-foreground">{r.row}</td>
                          <td className="py-2 px-3">{r.household_name ?? "—"}</td>
                          <td className="py-2 px-3">{actionBadge(r.action)}</td>
                          <td className="py-2 px-3">
                            {r.error && <span className="text-destructive">{r.error}</span>}
                            {r.warnings.map((w, i) => (
                              <div key={i} className="text-muted-foreground">
                                {w}
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={finishAndClose}
                className="border border-primary bg-primary text-primary-foreground px-5 py-2 text-xs uppercase tracking-[0.2em]"
              >
                Done
              </button>
              <button
                onClick={resetAll}
                className="border border-border text-foreground px-5 py-2 text-xs uppercase tracking-[0.2em]"
              >
                Import another file
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-[10px] text-muted-foreground">
          Fallback contact shown to guests who can't find their name:{" "}
          <span className="italic">{SITE.rsvpFallbackContact}</span> (edit in{" "}
          <span className="font-mono">src/lib/site.ts</span>).
        </p>
      </div>
    </ModalBackdrop>
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
  const [counts, setCounts] = useState<{
    pending: number;
    approved: number;
    rejected: number;
  } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const countsToken = useRef(0);
  const photosToken = useRef(0);

  const refreshCounts = useCallback(() => {
    const token = ++countsToken.current;
    loadCounts({})
      .then((next) => {
        if (token !== countsToken.current) return;
        setCounts(next);
      })
      .catch(() => {});
  }, [loadCounts]);

  const refreshPhotos = useCallback(async () => {
    // Rapid tab switches or back-to-back actions can resolve out of order —
    // drop this result if a newer refresh has since started.
    const token = ++photosToken.current;
    const next = await loadPhotos({ data: { status: photoTab } });
    if (token !== photosToken.current) return;
    setPhotos(next);
    // prune selection to visible ids
    setSelected((prev) => {
      const visible = new Set(next.map((p) => p.id));
      const nextSet = new Set<string>();
      for (const id of prev) if (visible.has(id)) nextSet.add(id);
      return nextSet;
    });
  }, [loadPhotos, photoTab]);

  useEffect(() => {
    refreshPhotos().catch(() => {});
  }, [refreshPhotos]);
  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const setOne = useCallback(
    async (id: string, s: "approved" | "rejected") => {
      setBusy(true);
      try {
        await setStatus({ data: { id, status: s } });
        await Promise.all([refreshPhotos(), Promise.resolve(refreshCounts())]);
      } finally {
        setBusy(false);
      }
    },
    [setStatus, refreshPhotos, refreshCounts],
  );

  const deleteOne = useCallback((id: string) => setConfirmDeleteId(id), []);

  const doDeleteOne = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        await runDelete({ data: { id } });
        await Promise.all([refreshPhotos(), Promise.resolve(refreshCounts())]);
        toast.success("Photo deleted.");
        setConfirmDeleteId(null);
      } finally {
        setBusy(false);
      }
    },
    [runDelete, refreshPhotos, refreshCounts],
  );

  async function bulkStatus(status: "approved" | "rejected" | "pending") {
    if (!selected.size) return;
    const n = selected.size;
    setBusy(true);
    try {
      await runBulkStatus({ data: { ids: Array.from(selected), status } });
      await Promise.all([refreshPhotos(), Promise.resolve(refreshCounts())]);
      toast.success(`${n} photo${n === 1 ? "" : "s"} moved to ${status}.`);
    } finally {
      setBusy(false);
    }
  }

  function bulkDelete() {
    if (!selected.size) return;
    setConfirmBulkDelete(true);
  }

  async function doBulkDelete() {
    const n = selected.size;
    setBusy(true);
    try {
      await runBulkDelete({ data: { ids: Array.from(selected) } });
      await Promise.all([refreshPhotos(), Promise.resolve(refreshCounts())]);
      toast.success(`${n} photo${n === 1 ? "" : "s"} deleted.`);
      setConfirmBulkDelete(false);
    } finally {
      setBusy(false);
    }
  }

  async function saveCaption(id: string) {
    setBusy(true);
    try {
      await runUpdateCaption({ data: { id, caption: captionDraft } });
      setEditingCaption(null);
      await refreshPhotos();
      toast.success("Caption saved.");
    } finally {
      setBusy(false);
    }
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
      else if (e.key === "ArrowRight")
        setLightbox((i) => (i === null ? null : Math.min(photos.length - 1, i + 1)));
      else if (e.key.toLowerCase() === "a" && photoTab !== "approved") {
        void setOne(p.id, "approved");
      } else if (e.key.toLowerCase() === "r" && photoTab !== "rejected") {
        void setOne(p.id, "rejected");
      } else if (e.key.toLowerCase() === "d") {
        void deleteOne(p.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photos, photoTab, setOne, deleteOne]);

  const tabLabel = (s: PhotoTab) => {
    const base =
      s === "pending" ? t.admin.pending : s === "approved" ? t.admin.approved : t.admin.rejected;
    const n = counts?.[s];
    return n === undefined ? base : `${base} (${n})`;
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setPhotoTab(s)}
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
            <button
              disabled={busy}
              onClick={() => bulkStatus("approved")}
              className="border border-primary text-primary px-3 py-1 uppercase tracking-[0.2em] disabled:opacity-50"
            >
              Approve {selected.size}
            </button>
          )}
          {photoTab !== "rejected" && (
            <button
              disabled={busy}
              onClick={() => bulkStatus("rejected")}
              className="border border-border text-foreground px-3 py-1 uppercase tracking-[0.2em] disabled:opacity-50"
            >
              Reject {selected.size}
            </button>
          )}
          {photoTab !== "pending" && (
            <button
              disabled={busy}
              onClick={() => bulkStatus("pending")}
              className="border border-border text-foreground px-3 py-1 uppercase tracking-[0.2em] disabled:opacity-50"
            >
              Move to pending
            </button>
          )}
          <button
            disabled={busy}
            onClick={bulkDelete}
            className="border border-destructive text-destructive px-3 py-1 uppercase tracking-[0.2em] disabled:opacity-50"
          >
            Delete {selected.size}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-muted-foreground uppercase tracking-[0.2em]"
          >
            Clear
          </button>
        </div>
      )}

      {photos.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t.admin.noPhotos}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((p, idx) => {
            const isSel = selected.has(p.id);
            return (
              <div
                key={p.id}
                className={`relative rounded-sm border ${isSel ? "border-primary" : "border-border/60"} bg-card overflow-hidden group`}
              >
                <label className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur rounded-sm px-1.5 py-0.5">
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={(e) => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(p.id);
                        else next.delete(p.id);
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
                  {p.uploader_email && (
                    <div className="text-xs text-muted-foreground truncate">{p.uploader_email}</div>
                  )}

                  {editingCaption === p.id ? (
                    <div className="space-y-1">
                      <textarea
                        value={captionDraft}
                        onChange={(e) => setCaptionDraft(e.target.value)}
                        rows={2}
                        maxLength={PHOTO_CAPTION_MAX_LENGTH}
                        className="w-full border border-input bg-background px-2 py-1 text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          disabled={busy}
                          onClick={() => saveCaption(p.id)}
                          className="text-[10px] uppercase tracking-[0.2em] text-primary"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCaption(null)}
                          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCaption(p.id);
                        setCaptionDraft(p.caption ?? "");
                      }}
                      className="block text-left w-full text-xs text-foreground/80 min-h-[1.25rem] hover:text-primary"
                      title="Click to edit caption"
                    >
                      {p.caption || (
                        <span className="italic text-muted-foreground">Add caption…</span>
                      )}
                    </button>
                  )}

                  <div className="flex gap-2 pt-1">
                    {photoTab !== "approved" && (
                      <button
                        disabled={busy}
                        onClick={() => setOne(p.id, "approved")}
                        className="flex-1 rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-[0.15em] py-1.5 disabled:opacity-50"
                      >
                        {t.admin.approve}
                      </button>
                    )}
                    {photoTab !== "rejected" && (
                      <button
                        disabled={busy}
                        onClick={() => setOne(p.id, "rejected")}
                        className="flex-1 rounded-full border border-input text-xs uppercase tracking-[0.15em] py-1.5 disabled:opacity-50"
                      >
                        {t.admin.reject}
                      </button>
                    )}
                    <button
                      disabled={busy}
                      onClick={() => deleteOne(p.id)}
                      className="rounded-full border border-destructive text-destructive text-xs uppercase tracking-[0.15em] py-1.5 px-3 disabled:opacity-50"
                      title="Delete permanently"
                    >
                      ×
                    </button>
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
          onNext={() =>
            setLightbox((i) => (i === null ? null : Math.min(photos.length - 1, i + 1)))
          }
        />
      )}

      <p className="mt-6 text-[10px] text-muted-foreground">
        Keyboard shortcuts (in lightbox): <span className="font-mono">← →</span> navigate ·
        <span className="font-mono"> A</span> approve · <span className="font-mono">R</span> reject
        ·<span className="font-mono"> D</span> delete · <span className="font-mono">Esc</span> close
      </p>

      {confirmDeleteId && (
        <ConfirmDialog
          title="Delete this photo?"
          description="This removes the file permanently. This cannot be undone."
          busy={busy}
          onConfirm={() => doDeleteOne(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
      {confirmBulkDelete && (
        <ConfirmDialog
          title={`Delete ${selected.size} photos?`}
          description="This removes the files permanently. This cannot be undone."
          confirmLabel={`Delete ${selected.size}`}
          busy={busy}
          onConfirm={doBulkDelete}
          onCancel={() => setConfirmBulkDelete(false)}
        />
      )}
    </div>
  );
}

function PhotoLightbox({
  photo,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  photo: AdminPhoto;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-5xl flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground pb-2">
        <div>
          {index + 1} / {total}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          Close
        </button>
      </div>
      <div
        className="flex-1 flex items-center gap-3 w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="text-2xl text-muted-foreground disabled:opacity-30 px-2"
        >
          ←
        </button>
        <img
          src={photo.url}
          alt={photo.caption || "Uploaded wedding photo"}
          className="flex-1 max-h-[80vh] object-contain"
        />
        <button
          onClick={onNext}
          disabled={index === total - 1}
          className="text-2xl text-muted-foreground disabled:opacity-30 px-2"
        >
          →
        </button>
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
  const refreshToken = useRef(0);

  const refresh = useCallback(() => {
    const token = ++refreshToken.current;
    loadFlags({})
      .then((flags) => {
        if (token !== refreshToken.current) return;
        setSaved(flags);
        setDraft({});
      })
      .catch(() => {});
  }, [loadFlags]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
                      <span className="text-[10px] uppercase tracking-[0.2em] text-primary">
                        Pending
                      </span>
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
        <p
          className={`mt-3 text-xs ${message.kind === "success" ? "text-primary" : "text-destructive"}`}
        >
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
        <ModalBackdrop onClose={() => setConfirming(false)} active={!saving}>
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
              <p
                className={`mt-4 text-xs ${message.kind === "success" ? "text-primary" : "text-destructive"}`}
              >
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
        </ModalBackdrop>
      )}
    </div>
  );
}
