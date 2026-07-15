import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/i18n/context";
import { useFeatureFlag } from "@/hooks/use-feature-flags";
import { SITE } from "@/lib/site";
import { buildMeta } from "@/lib/seo";
import {
  lookupGuest,
  getVerifyTargetLabel,
  verifyHouseholdAccess,
  updateGuestAddress,
  submitRsvp,
  type PublicGuest,
  type PublicRsvp,
  type AttendeeChoice,
  type GuestAddress,
} from "@/lib/rsvp.functions";

export const Route = createFileRoute("/rsvp")({
  validateSearch: (s: Record<string, unknown>) => ({
    g: typeof s.g === "string" ? s.g : undefined,
    t: typeof s.t === "string" ? s.t : undefined,
  }),
  head: () =>
    buildMeta({
      title: "RSVP · Geovanni & Addison",
      description: "Respond to our wedding invitation. Please reply by September 15, 2026.",
      image:
        "https://storage.googleapis.com/gpt-engineer-file-uploads/QgOLQ93F1TPGT6HHK39DmJ7E6bY2/social-images/social-1783945112817-IMG_1610.webp",
      url: `${SITE.siteUrl}/rsvp`,
    }),
  component: RsvpPage,
});

type Stage = "lookup" | "verify" | "form" | "done";
type VerifyTarget = { slug: string } | { token: string };

// CSS-variable shorthands for inline styles where a Tailwind class doesn't fit
// (e.g. dynamic borderBottom, background). Class-based color usage below still
// prefers text-ink / bg-ink / border-hairline etc.
const INK = "var(--color-ink)";
const IVORY = "var(--color-ivory)";
const HAIRLINE = "var(--color-hairline)";
const LAV = "var(--color-lavender)";
const LAV_DEEP = "var(--color-lavender-deep)";
const TAN = "var(--color-tan)";
const TAN_DEEP = "var(--color-tan-deep)";
const BODY = "var(--color-ink-body)";
const SOFT = "var(--color-ink-soft)";

// Styled input (Cormorant italic on a hairline underline) matching the prototype.
const inputStyle: React.CSSProperties = {
  fontFamily: "Cormorant, serif",
  fontStyle: "italic",
  fontSize: 19,
  color: INK,
  border: "none",
  borderBottom: `1px solid ${TAN_DEEP}`,
  background: "transparent",
  width: "100%",
  padding: "0 0 10px",
  boxSizing: "border-box",
};

const eyebrow: React.CSSProperties = {
  fontFamily: "Work Sans, sans-serif",
  fontSize: 10,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: TAN,
  margin: "0 0 8px",
};

function formatAddress(a: GuestAddress): string[] {
  const lines: string[] = [];
  if (a.line1) lines.push([a.line1, a.line2].filter(Boolean).join(" "));
  const cityLine = [a.city, [a.state, a.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  if (a.country) lines.push(a.country);
  return lines;
}

function hasAddress(a: GuestAddress): boolean {
  return Boolean(a.line1 || a.city || a.postal_code);
}

function RsvpPage() {
  const t = useT();
  const search = useSearch({ from: "/rsvp" });
  const runLookup = useServerFn(lookupGuest);
  const runGetLabel = useServerFn(getVerifyTargetLabel);
  const runVerify = useServerFn(verifyHouseholdAccess);
  const runUpdateAddress = useServerFn(updateGuestAddress);
  const runSubmit = useServerFn(submitRsvp);
  // Admin-controlled via the Features tab. Gates RSVP submission only —
  // household lookup/verification and address management work regardless,
  // since guests may reach this page well before RSVP officially opens.
  const { enabled: rsvpOpen, loading: rsvpFlagLoading } = useFeatureFlag("rsvp_open");

  const isLate = Date.now() > new Date(SITE.rsvpDeadline).getTime();

  const [stage, setStage] = useState<Stage>("lookup");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<{ slug: string; primary_name: string; party_size: number }[] | null>(null);

  // Verify stage
  const [pendingTarget, setPendingTarget] = useState<VerifyTarget | null>(null);
  const [verifyLabel, setVerifyLabel] = useState<string | null>(null);
  const [last4, setLast4] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);

  const [guest, setGuest] = useState<PublicGuest | null>(null);
  const [existingRsvp, setExistingRsvp] = useState<PublicRsvp | null>(null);
  const [attendees, setAttendees] = useState<AttendeeChoice[]>([]);
  const [address, setAddress] = useState<GuestAddress>({});
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [addressMode, setAddressMode] = useState<"view" | "edit">("view");
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [addressErr, setAddressErr] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [songRequest, setSongRequest] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (stage !== "lookup") return;
    if (search.t) beginVerify({ token: search.t });
    else if (search.g) beginVerify({ slug: search.g });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.g, search.t]);

  async function beginVerify(target: VerifyTarget, knownLabel?: string) {
    setPendingTarget(target);
    setStage("verify");
    setVerifyErr(null);
    setLast4("");
    setVerifyLabel(knownLabel ?? null);
    if (!knownLabel) {
      try {
        const res = await runGetLabel({ data: target });
        if (res.ok) setVerifyLabel(res.primary_name);
      } catch {
        // Non-fatal — the verify screen still works without a greeting.
      }
    }
  }

  function hydrateFromGuest(g: PublicGuest, r: PublicRsvp | null) {
    setGuest(g);
    setExistingRsvp(r);
    setEmail(g.email ?? "");
    setAddressMode("view");
    setAddressSaved(false);
    setAddressErr(null);
    if (r) {
      setAttendees(r.attendees.length ? r.attendees : g.party_members.map((m) => ({ ...m, attending: false })));
      setAddress(r.address ?? g.address);
      setAddressConfirmed(r.address_confirmed);
      setSongRequest(r.song_request ?? "");
      setMessage(r.message ?? "");
    } else {
      setAttendees(g.party_members.map((m) => ({ ...m, attending: true })));
      setAddress(g.address);
      setAddressConfirmed(false);
      setSongRequest("");
      setMessage("");
    }
    setStage("form");
  }

  async function onVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingTarget || !/^\d{4}$/.test(last4)) return;
    setVerifying(true);
    setVerifyErr(null);
    try {
      const res = await runVerify({ data: { ...pendingTarget, last4 } });
      if (res.ok) {
        hydrateFromGuest(res.guest, res.rsvp);
      } else if (res.reason === "locked") {
        setVerifyErr(t.rsvp.verifyLocked);
      } else {
        setVerifyErr(t.rsvp.verifyInvalid);
      }
    } catch {
      setVerifyErr(t.rsvp.errGeneric);
    } finally {
      setVerifying(false);
    }
  }

  async function onLookupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setErr(null);
    setMatches(null);
    try {
      const res = await runLookup({ data: { query: query.trim() } });
      if (res.matches.length === 0) {
        setErr(t.rsvp.lookupNotFound);
      } else if (res.matches.length === 1) {
        await beginVerify({ slug: res.matches[0].slug }, res.matches[0].primary_name);
      } else {
        setMatches(res.matches);
      }
    } catch {
      setErr(t.rsvp.errGeneric);
    } finally {
      setLoading(false);
    }
  }

  function updateAttendee(i: number, patch: Partial<AttendeeChoice>) {
    setAttendees((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function addAttendee() {
    setAttendees((prev) => [...prev, { name: "", is_child: false, attending: true }]);
  }
  function removeAttendee(i: number) {
    setAttendees((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function saveAddress() {
    if (!guest) return;
    setAddressSaving(true);
    setAddressErr(null);
    try {
      await runUpdateAddress({ data: { slug: guest.slug, address } });
      setAddressMode("view");
      setAddressSaved(true);
      setAddressConfirmed(true);
    } catch (e) {
      setAddressErr(e instanceof Error ? e.message : t.rsvp.errGeneric);
    } finally {
      setAddressSaving(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guest) return;
    const cleaned = attendees.filter((a) => a.name.trim().length > 0);
    if (cleaned.length === 0) {
      setErr(t.rsvp.errNoName);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      await runSubmit({
        data: {
          slug: guest.slug,
          attendees: cleaned,
          address_confirmed: addressConfirmed,
          address,
          email,
          song_request: songRequest,
          message,
        },
      });
      setStage("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.rsvp.errGeneric;
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: IVORY, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Minimal chrome */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "26px 56px", borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif italic" style={{ fontSize: 22, color: INK }}>G</span>
          <span style={{ width: 5, height: 5, background: LAV, transform: "rotate(45deg)" }} />
          <span className="font-serif italic" style={{ fontSize: 22, color: INK }}>A</span>
        </Link>
        <Link
          to="/"
          className="uppercase font-sans"
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            color: LAV_DEEP,
            borderBottom: `1px solid ${LAV_DEEP}`,
            padding: "2px 0",
          }}
        >
          ← Back to the site
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center" style={{ padding: "60px 20px" }}>
        <div
          style={{
            width: 640,
            maxWidth: "100%",
            background: IVORY,
            border: `1px solid ${HAIRLINE}`,
            boxShadow: "0 50px 90px -50px rgba(42,37,32,0.28)",
            padding: "56px 64px",
          }}
        >
          <p
            className="uppercase font-sans text-center"
            style={{ fontSize: 11, letterSpacing: "0.35em", color: TAN, margin: "0 0 16px" }}
          >
            {SITE.couple} · {SITE.eventDatePretty.en}
          </p>
          <h1
            className="font-serif italic text-center"
            style={{ fontWeight: 500, fontSize: 48, color: INK, margin: 0 }}
          >
            {stage === "done" ? t.rsvp.recapTitle : stage === "verify" ? t.rsvp.verifyTitle : t.rsvp.title}
          </h1>
          <p
            className="uppercase font-sans text-center"
            style={{ fontSize: 10, letterSpacing: "0.3em", color: SOFT, margin: "14px 0 0" }}
          >
            {t.rsvp.deadlineLine}
          </p>
          {isLate && (
            <p
              className="text-center font-serif italic"
              style={{ fontSize: 14, color: LAV_DEEP, marginTop: 10 }}
            >
              Past the deadline — we&rsquo;ll do our best to accommodate you.
            </p>
          )}

          <div className="my-9 flex items-center gap-3.5">
            <div className="flex-1 h-px" style={{ background: HAIRLINE }} />
            <span
              style={{ width: 6, height: 6, background: LAV, transform: "rotate(45deg)" }}
              aria-hidden
            />
            <div className="flex-1 h-px" style={{ background: HAIRLINE }} />
          </div>

          {rsvpFlagLoading ? (
            <div className="text-center" style={{ padding: "48px 0" }}>
              <p className="font-sans" style={{ fontSize: 14, color: SOFT }}>{t.common.loading}</p>
            </div>
          ) : (
          <>
          {!rsvpOpen && (stage === "form" || stage === "done") && (
            <div
              role="status"
              className="text-center"
              style={{
                border: `1px solid ${LAV}`,
                background: "rgba(135,121,163,0.06)",
                padding: "22px 24px",
                margin: "0 0 32px",
              }}
            >
              <p
                className="uppercase font-sans"
                style={{ fontSize: 10, letterSpacing: "0.32em", color: LAV_DEEP, margin: "0 0 8px" }}
              >
                RSVPs open soon
              </p>
              <p
                className="font-serif italic"
                style={{ fontSize: 18, color: INK, lineHeight: 1.5, margin: 0 }}
              >
                We&rsquo;re not accepting responses just yet.
              </p>
              <p
                className="font-sans"
                style={{ fontSize: 13, color: SOFT, lineHeight: 1.6, margin: "8px 0 0" }}
              >
                You can still look over your invitation and confirm your address below — RSVP itself
                will open closer to the date.
              </p>
            </div>
          )}

          {/* Lookup */}
          {stage === "lookup" && (
            <form onSubmit={onLookupSubmit} noValidate>
              <p
                className="font-serif italic text-center"
                style={{ fontSize: 22, color: INK, margin: "0 0 8px" }}
              >
                {t.rsvp.lookupTitle}
              </p>
              <label
                htmlFor="rsvp-lookup"
                className="block text-center font-sans"
                style={{ fontSize: 14, color: SOFT, margin: "0 0 30px" }}
              >
                {t.rsvp.lookupHint}
              </label>
              <input
                id="rsvp-lookup"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.rsvp.lookupPlaceholder}
                aria-label={t.rsvp.lookupPlaceholder}
                autoComplete="name"
                maxLength={120}
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="mt-8 block w-full uppercase font-sans"
                style={{
                  background: INK,
                  color: IVORY,
                  padding: "16px 0",
                  fontSize: 11,
                  letterSpacing: "0.26em",
                  border: `1px solid ${INK}`,
                  opacity: loading || !query.trim() ? 0.5 : 1,
                  cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                }}
              >
                {loading ? t.common.loading : t.rsvp.lookupCta}
              </button>

              {matches && matches.length > 1 && (
                <div className="mt-8 space-y-2" role="group" aria-label="Matching guests">
                  <p style={{ ...eyebrow, color: TAN_DEEP }}>Is this you?</p>
                  {matches.map((m) => (
                    <button
                      key={m.slug}
                      type="button"
                      onClick={() => beginVerify({ slug: m.slug }, m.primary_name)}
                      className="w-full text-left border transition-colors"
                      style={{ padding: "14px 16px", borderColor: HAIRLINE }}
                    >
                      <div className="font-serif italic" style={{ color: INK, fontSize: 18 }}>
                        {m.primary_name}
                      </div>
                      <div className="font-sans" style={{ fontSize: 12, color: SOFT, marginTop: 4 }}>
                        Party of {m.party_size || 1}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div role="alert" aria-live="polite">
                {err && (
                  <div className="mt-6 font-sans" style={{ fontSize: 14, color: "#7a2f26" }}>
                    <p>{err}</p>
                    <p className="mt-2 italic font-serif" style={{ color: SOFT, fontSize: 13 }}>
                      {SITE.rsvpFallbackContact}
                    </p>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* Verify — last 4 digits of the household's phone, shared by name
              lookup and a personalized link alike. Neither path reveals
              anything about the household until this succeeds. */}
          {stage === "verify" && (
            <form onSubmit={onVerifySubmit} noValidate>
              {verifyLabel && (
                <p
                  className="font-serif italic text-center"
                  style={{ fontSize: 20, color: INK, margin: "0 0 8px" }}
                >
                  {verifyLabel}
                </p>
              )}
              <label
                htmlFor="rsvp-verify-last4"
                className="block text-center font-sans"
                style={{ fontSize: 14, color: SOFT, margin: "0 0 30px" }}
              >
                {t.rsvp.verifyHint}
              </label>
              <input
                id="rsvp-verify-last4"
                autoFocus
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder={t.rsvp.verifyPlaceholder}
                aria-label={t.rsvp.verifyHint}
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                className="text-center"
                style={{ ...inputStyle, letterSpacing: "0.5em" }}
              />
              <button
                type="submit"
                disabled={verifying || last4.length !== 4}
                className="mt-8 block w-full uppercase font-sans"
                style={{
                  background: INK,
                  color: IVORY,
                  padding: "16px 0",
                  fontSize: 11,
                  letterSpacing: "0.26em",
                  border: `1px solid ${INK}`,
                  opacity: verifying || last4.length !== 4 ? 0.5 : 1,
                  cursor: verifying || last4.length !== 4 ? "not-allowed" : "pointer",
                }}
              >
                {verifying ? t.rsvp.verifying : t.rsvp.verifyCta}
              </button>

              <div role="alert" aria-live="polite">
                {verifyErr && (
                  <div className="mt-6 font-sans" style={{ fontSize: 14, color: "#7a2f26" }}>
                    <p>{verifyErr}</p>
                    <p className="mt-2 italic font-serif" style={{ color: SOFT, fontSize: 13 }}>
                      {SITE.rsvpFallbackContact}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setStage("lookup");
                  setPendingTarget(null);
                  setVerifyLabel(null);
                  setLast4("");
                  setVerifyErr(null);
                }}
                className="mt-8 block mx-auto uppercase font-sans"
                style={{ fontSize: 10, letterSpacing: "0.2em", color: TAN_DEEP }}
              >
                {t.rsvp.verifyBack}
              </button>
            </form>
          )}

          {/* Form */}
          {stage === "form" && guest && (
            <form onSubmit={onSubmit} className="space-y-10">
              {existingRsvp && (
                <p
                  className="uppercase font-sans"
                  style={{ fontSize: 10, letterSpacing: "0.2em", color: LAV_DEEP }}
                >
                  Editing your response — last saved{" "}
                  {new Date(existingRsvp.updated_at).toLocaleDateString()}.
                </p>
              )}

              {/* Party — gated by rsvp_open; address below is not. */}
              <fieldset
                disabled={!rsvpOpen}
                aria-disabled={!rsvpOpen}
                style={{ border: "none", padding: 0, margin: 0, minInlineSize: "auto", opacity: rsvpOpen ? 1 : 0.55 }}
              >
                <section>
                  <p style={{ ...eyebrow, color: LAV_DEEP, letterSpacing: "0.3em", fontSize: 11 }}>
                    Your party
                  </p>
                  <p
                    className="font-sans"
                    style={{ fontSize: 14, color: SOFT, margin: "0 0 20px", lineHeight: 1.6 }}
                  >
                    {t.rsvp.partySubtitle}
                  </p>
                  <div className="space-y-5">
                    {attendees.map((a, i) => (
                      <div
                        key={i}
                        className="border"
                        style={{ padding: 18, borderColor: HAIRLINE }}
                      >
                        <input
                          value={a.name}
                          onChange={(e) => updateAttendee(i, { name: e.target.value })}
                          placeholder={t.rsvp.fullName}
                          aria-label={`${t.rsvp.fullName} — guest ${i + 1}`}
                          autoComplete="name"
                          maxLength={120}
                          style={inputStyle}
                        />
                        <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
                          <div className="flex gap-2">
                            <PillToggle
                              active={!a.is_child}
                              onClick={() => updateAttendee(i, { is_child: false })}
                              label={t.rsvp.adult}
                            />
                            <PillToggle
                              active={a.is_child}
                              onClick={() => updateAttendee(i, { is_child: true })}
                              label={t.rsvp.child}
                            />
                          </div>
                          <div className="flex gap-2">
                            <PillToggle
                              active={a.attending === true}
                              onClick={() => updateAttendee(i, { attending: true })}
                              label={t.rsvp.attending}
                            />
                            <PillToggle
                              active={a.attending === false}
                              onClick={() => updateAttendee(i, { attending: false })}
                              label={t.rsvp.notAttending}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttendee(i)}
                            className="uppercase font-sans"
                            style={{
                              fontSize: 10,
                              letterSpacing: "0.2em",
                              color: TAN_DEEP,
                            }}
                          >
                            {t.rsvp.remove}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addAttendee}
                    className="mt-4 uppercase font-sans"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      color: LAV_DEEP,
                      borderBottom: `1px solid ${LAV_DEEP}`,
                      paddingBottom: 3,
                    }}
                  >
                    {t.rsvp.addGuest}
                  </button>
                </section>
              </fieldset>

              {/* Address — independent of rsvp_open and of RSVP submission.
                  Starts collapsed: view the address on file (or "none yet"),
                  edit only on request, save immediately on its own. */}
              <section aria-labelledby="rsvp-address-heading">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p
                    id="rsvp-address-heading"
                    style={{ ...eyebrow, color: LAV_DEEP, letterSpacing: "0.3em", fontSize: 11, margin: 0 }}
                  >
                    Mailing address
                  </p>
                  {addressMode === "view" && (
                    <button
                      type="button"
                      onClick={() => { setAddressMode("edit"); setAddressSaved(false); setAddressErr(null); }}
                      className="uppercase font-sans"
                      style={{ fontSize: 10, letterSpacing: "0.2em", color: LAV_DEEP, borderBottom: `1px solid ${LAV_DEEP}`, paddingBottom: 2 }}
                    >
                      {hasAddress(address) ? t.rsvp.addressEditCta : t.rsvp.addressAddCta}
                    </button>
                  )}
                </div>

                {addressMode === "view" ? (
                  <div className="mt-3">
                    {hasAddress(address) ? (
                      <div className="font-serif italic" style={{ fontSize: 17, color: INK, lineHeight: 1.6 }}>
                        {formatAddress(address).map((line, i) => <div key={i}>{line}</div>)}
                      </div>
                    ) : (
                      <p className="font-sans italic" style={{ fontSize: 13, color: SOFT }}>
                        {t.rsvp.addressNotOnFile}
                      </p>
                    )}
                    {addressSaved && (
                      <p className="mt-2 font-sans" style={{ fontSize: 12, color: LAV_DEEP }}>
                        {t.rsvp.addressSaved}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6">
                      <div className="col-span-2">
                        <input
                          value={address.line1 ?? ""}
                          onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                          placeholder="Street address"
                          aria-label="Street address"
                          autoComplete="address-line1"
                          maxLength={200}
                          style={inputStyle}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          value={address.line2 ?? ""}
                          onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                          placeholder="Apt / suite (optional)"
                          aria-label="Apartment or suite (optional)"
                          autoComplete="address-line2"
                          maxLength={200}
                          style={inputStyle}
                        />
                      </div>
                      <input
                        value={address.city ?? ""}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        placeholder="City"
                        aria-label="City"
                        autoComplete="address-level2"
                        maxLength={120}
                        style={inputStyle}
                      />
                      <input
                        value={address.state ?? ""}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        placeholder="State"
                        aria-label="State"
                        autoComplete="address-level1"
                        maxLength={60}
                        style={inputStyle}
                      />
                      <input
                        value={address.postal_code ?? ""}
                        onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                        placeholder="ZIP / postal"
                        aria-label="ZIP or postal code"
                        autoComplete="postal-code"
                        maxLength={20}
                        style={inputStyle}
                      />
                      <input
                        value={address.country ?? ""}
                        onChange={(e) => setAddress({ ...address, country: e.target.value })}
                        placeholder="Country (if not US)"
                        aria-label="Country"
                        autoComplete="country-name"
                        maxLength={60}
                        style={inputStyle}
                      />
                    </div>
                    {addressErr && (
                      <p className="mt-3 font-sans" style={{ fontSize: 13, color: "#7a2f26" }}>{addressErr}</p>
                    )}
                    <div className="flex items-center gap-4 mt-5">
                      <button
                        type="button"
                        onClick={saveAddress}
                        disabled={addressSaving}
                        className="uppercase font-sans"
                        style={{
                          background: INK, color: IVORY, padding: "12px 28px", fontSize: 10,
                          letterSpacing: "0.24em", border: `1px solid ${INK}`, opacity: addressSaving ? 0.5 : 1,
                        }}
                      >
                        {addressSaving ? t.rsvp.addressSaving : t.rsvp.addressSaveCta}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddressMode("view")}
                        className="uppercase font-sans"
                        style={{ fontSize: 10, letterSpacing: "0.2em", color: TAN_DEEP }}
                      >
                        {t.rsvp.addressCancel}
                      </button>
                    </div>
                  </>
                )}
              </section>

              {/* Extras — gated by rsvp_open, same as the party section. */}
              <fieldset
                disabled={!rsvpOpen}
                aria-disabled={!rsvpOpen}
                style={{ border: "none", padding: 0, margin: 0, minInlineSize: "auto", opacity: rsvpOpen ? 1 : 0.55 }}
              >
                <section className="space-y-6">
                  <div>
                    <label
                      htmlFor="rsvp-email"
                      className="block"
                      style={{ ...eyebrow, color: LAV_DEEP, letterSpacing: "0.3em", fontSize: 11, margin: "0 0 6px" }}
                    >
                      Email — for your RSVP confirmation
                    </label>
                    <input
                      id="rsvp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      maxLength={200}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rsvp-song"
                      className="block"
                      style={{ ...eyebrow, color: LAV_DEEP, letterSpacing: "0.3em", fontSize: 11 }}
                    >
                      Song request (optional)
                    </label>
                    <input
                      id="rsvp-song"
                      value={songRequest}
                      onChange={(e) => setSongRequest(e.target.value)}
                      placeholder="One song that&rsquo;ll get you on the floor"
                      maxLength={200}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rsvp-message"
                      className="block"
                      style={{ ...eyebrow, color: LAV_DEEP, letterSpacing: "0.3em", fontSize: 11 }}
                    >
                      {t.rsvp.message}
                    </label>
                    <textarea
                      id="rsvp-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      style={{
                        ...inputStyle,
                        paddingBottom: 8,
                        borderBottom: `1px solid ${TAN_DEEP}`,
                        resize: "vertical",
                      }}
                    />
                  </div>
                </section>

                <div role="alert" aria-live="polite">
                  {err && (
                    <p className="font-sans" style={{ fontSize: 14, color: "#7a2f26" }}>
                      {err}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 mt-10">
                  <button
                    type="button"
                    onClick={() => {
                      setStage("lookup");
                      setGuest(null);
                      setMatches(null);
                      setErr(null);
                    }}
                    className="uppercase font-sans"
                    style={{ fontSize: 10, letterSpacing: "0.2em", color: TAN_DEEP }}
                  >
                    ← {t.common.back}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !rsvpOpen}
                    className="uppercase font-sans"
                    style={{
                      background: INK,
                      color: IVORY,
                      padding: "16px 40px",
                      fontSize: 11,
                      letterSpacing: "0.3em",
                      border: `1px solid ${INK}`,
                      opacity: loading || !rsvpOpen ? 0.5 : 1,
                    }}
                  >
                    {loading ? t.rsvp.submitting : t.rsvp.submitCta}
                  </button>
                </div>
                <p
                  className="text-center uppercase font-sans mt-4"
                  style={{ fontSize: 10, letterSpacing: "0.2em", color: SOFT }}
                >
                  {t.rsvp.resubmitNote}
                </p>
              </fieldset>
            </form>
          )}

          {/* Done */}
          {stage === "done" && (
            <div className="text-center">
              <p className="font-sans" style={{ fontSize: 15, color: BODY, lineHeight: 1.7 }}>
                {t.rsvp.recapBody}
              </p>
              <div className="mt-10 flex flex-col items-center gap-5">
                <button
                  onClick={() => setStage("form")}
                  className="uppercase font-sans"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    color: LAV_DEEP,
                    borderBottom: `1px solid ${LAV_DEEP}`,
                    paddingBottom: 3,
                  }}
                >
                  {t.rsvp.recapUpdate}
                </button>
                <Link
                  to="/"
                  className="uppercase font-sans"
                  style={{ fontSize: 10, letterSpacing: "0.25em", color: TAN_DEEP }}
                >
                  Back to the site →
                </Link>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

function PillToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="uppercase font-sans transition-colors"
      style={{
        padding: "8px 14px",
        fontSize: 10,
        letterSpacing: "0.2em",
        border: `1px solid ${active ? INK : HAIRLINE}`,
        background: active ? INK : "transparent",
        color: active ? IVORY : BODY,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
