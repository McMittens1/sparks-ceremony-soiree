import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useLang, fmt } from "@/i18n/context";
import type { Dict } from "@/i18n/dictionaries";
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

type SubmitRecap = {
  status: PublicRsvp["status"];
  attendees: AttendeeChoice[];
  addressConfirmed: boolean;
  submittedAt: string;
};

export const Route = createFileRoute("/rsvp")({
  validateSearch: (s: Record<string, unknown>) => ({
    g: typeof s.g === "string" ? s.g : undefined,
    t: typeof s.t === "string" ? s.t : undefined,
  }),
  head: () =>
    buildMeta({
      title: "RSVP · Geovanni & Addison",
      description: `Respond to our wedding invitation. Please reply by ${SITE.rsvpDeadlinePretty.en}.`,
      image:
        "https://storage.googleapis.com/gpt-engineer-file-uploads/QgOLQ93F1TPGT6HHK39DmJ7E6bY2/social-images/social-1783945112817-IMG_1610.webp",
      url: `${SITE.siteUrl}/rsvp`,
    }),
  component: RsvpPage,
});

type Stage = "lookup" | "verify" | "form" | "done";
type VerifyTarget = { slug: string } | { token: string } | { selectToken: string };

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
const DANGER = "var(--color-destructive)";

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
  const cityLine = [a.city, [a.state, a.postal_code].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  if (cityLine) lines.push(cityLine);
  if (a.country) lines.push(a.country);
  return lines;
}

function hasAddress(a: GuestAddress): boolean {
  return Boolean(a.line1 || a.city || a.postal_code);
}

function looksLikeUsZip(v: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(v.trim());
}

const LOOKUP_MIN_CHARS = 2;
const LOOKUP_DEBOUNCE_MS = 300;

// updateGuestAddress/submitRsvp throw a short error code (see
// rsvp.functions.ts) rather than English prose, so the message shown here
// matches the guest's chosen language instead of always being English.
// Any code without a mapping — or a raw DB error message that slipped
// through unmapped — falls back to the generic localized message rather
// than displaying server text directly.
const RSVP_ERROR_MESSAGES: Partial<Record<string, keyof Dict["rsvp"]>> = {
  household_not_found: "errHouseholdNotFound",
  not_verified: "errNotVerified",
  rsvp_closed: "errRsvpClosed",
  too_many_guests: "errTooManyGuests",
  link_expired: "errLinkExpired",
  link_invalid: "errLinkInvalid",
  save_failed: "errSaveFailed",
  rate_limited: "errRateLimited",
};

function rsvpErrorMessage(e: unknown, t: Dict): string {
  const key = e instanceof Error ? RSVP_ERROR_MESSAGES[e.message] : undefined;
  return key ? t.rsvp[key] : t.rsvp.errGeneric;
}

// Calendar-date difference in the wedding's own timezone (Central, matching
// rsvpDeadline's -05:00), not the ambient server/browser one — getFullYear()
// etc. read local-to-the-runtime fields, and this renders during SSR on a
// server that runs in UTC, which shifts a 23:59:59-05:00 deadline into the
// next UTC calendar day and silently adds a phantom day to the count. Using
// Intl with an explicit timeZone keeps "today" and "the deadline" anchored
// to the same real-world calendar regardless of where the code executes.
const centralDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" });
function daysBetweenCalendarDates(from: Date, to: Date): number {
  const a = new Date(`${centralDateFormatter.format(from)}T00:00:00`);
  const b = new Date(`${centralDateFormatter.format(to)}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

type Match = { selectToken: string; primary_name: string; party_size: number };

function RsvpPage() {
  const { t, lang } = useLang();
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
  const daysUntilDeadline = daysBetweenCalendarDates(new Date(), new Date(SITE.rsvpDeadline));

  const [stage, setStage] = useState<Stage>("lookup");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRequestId = useRef(0);

  // Verify stage
  const [pendingTarget, setPendingTarget] = useState<VerifyTarget | null>(null);
  const [verifyLabel, setVerifyLabel] = useState<string | null>(null);
  const [last4, setLast4] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);

  const [guest, setGuest] = useState<PublicGuest | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
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
  const [recap, setRecap] = useState<SubmitRecap | null>(null);

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

  function hydrateFromGuest(g: PublicGuest, r: PublicRsvp | null, token: string) {
    setGuest(g);
    setSessionToken(token);
    setExistingRsvp(r);
    setEmail(g.email ?? "");
    setAddressMode("view");
    setAddressSaved(false);
    setAddressErr(null);
    if (r) {
      setAttendees(
        r.attendees.length ? r.attendees : g.party_members.map((m) => ({ ...m, attending: false })),
      );
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
        hydrateFromGuest(res.guest, res.rsvp, res.sessionToken);
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

  // Live search-as-you-type: debounced, cancels stale in-flight requests by
  // request id so a slow early response can't clobber a later one. Doesn't
  // auto-navigate on a single match — unlike the old submit-triggered
  // lookup, jumping the guest to a new screen mid-keystroke would be
  // jarring for a live search box. Enter/click still confirms fast.
  useEffect(() => {
    const q = query.trim();
    if (q.length < LOOKUP_MIN_CHARS) {
      setMatches(null);
      setMatchesLoading(false);
      setActiveIndex(-1);
      return;
    }
    setMatchesLoading(true);
    setErr(null);
    const id = ++searchRequestId.current;
    const handle = setTimeout(async () => {
      try {
        const res = await runLookup({ data: { query: q, honeypot } });
        if (searchRequestId.current !== id) return; // a newer keystroke superseded this request
        setMatches(res.matches);
        setActiveIndex(res.matches.length > 0 ? 0 : -1);
      } catch {
        if (searchRequestId.current !== id) return;
        setMatches([]);
        setActiveIndex(-1);
      } finally {
        if (searchRequestId.current === id) setMatchesLoading(false);
      }
    }, LOOKUP_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function selectMatch(m: Match) {
    setDropdownOpen(false);
    void beginVerify({ selectToken: m.selectToken }, m.primary_name);
  }

  function onLookupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && matches?.[activeIndex]) selectMatch(matches[activeIndex]);
  }

  function onLookupKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Escape always closes the dropdown, whether or not there are matches
    // to navigate — arrow-key navigation is the only thing that needs any.
    if (e.key === "Escape") {
      setDropdownOpen(false);
      return;
    }
    if (!matches || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDropdownOpen(true);
      setActiveIndex((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDropdownOpen(true);
      setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
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
    if (!guest || !sessionToken) return;
    setAddressSaving(true);
    setAddressErr(null);
    try {
      await runUpdateAddress({ data: { sessionToken, address } });
      setAddressMode("view");
      setAddressSaved(true);
      setAddressConfirmed(true);
    } catch (e) {
      setAddressErr(rsvpErrorMessage(e, t));
    } finally {
      setAddressSaving(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guest || !sessionToken) return;
    const cleaned = attendees.filter((a) => a.name.trim().length > 0);
    if (cleaned.length === 0) {
      setErr(t.rsvp.errNoName);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await runSubmit({
        data: {
          sessionToken,
          attendees: cleaned,
          address_confirmed: addressConfirmed,
          address,
          email,
          song_request: songRequest,
          message,
        },
      });
      setRecap({
        status: res.status,
        attendees: cleaned,
        addressConfirmed,
        submittedAt: res.submitted_at,
      });
      setStage("done");
    } catch (e) {
      setErr(rsvpErrorMessage(e, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ background: IVORY, minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Minimal chrome */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "26px 56px", borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif italic" style={{ fontSize: 22, color: INK }}>
            G
          </span>
          <span style={{ width: 5, height: 5, background: LAV, transform: "rotate(45deg)" }} />
          <span className="font-serif italic" style={{ fontSize: 22, color: INK }}>
            A
          </span>
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
            {stage === "done"
              ? t.rsvp.recapTitle
              : stage === "verify"
                ? t.rsvp.verifyTitle
                : t.rsvp.title}
          </h1>
          <p
            className="uppercase font-sans text-center"
            style={{ fontSize: 10, letterSpacing: "0.3em", color: SOFT, margin: "14px 0 0" }}
          >
            {fmt(t.rsvp.deadlineLine, { date: SITE.rsvpDeadlinePretty[lang] })}
          </p>
          {!isLate && (
            <p
              className="text-center font-sans"
              style={{ fontSize: 11, letterSpacing: "0.15em", color: LAV_DEEP, marginTop: 8 }}
            >
              {daysUntilDeadline <= 0
                ? t.rsvp.daysLeftToday
                : daysUntilDeadline === 1
                  ? t.rsvp.daysLeftOne
                  : fmt(t.rsvp.daysLeftMany, { n: daysUntilDeadline })}
            </p>
          )}
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
              <p className="font-sans" style={{ fontSize: 14, color: SOFT }}>
                {t.common.loading}
              </p>
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
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.32em",
                      color: LAV_DEEP,
                      margin: "0 0 8px",
                    }}
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
                    You can still look over your invitation and confirm your address below — RSVP
                    itself will open closer to the date.
                  </p>
                </div>
              )}

              {/* Lookup — live search-as-you-type combobox. Matches update on
              every debounced keystroke; nothing beyond name + party size is
              ever shown pre-verification (see lookupGuest). */}
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
                  <div className="relative">
                    <input
                      id="rsvp-lookup"
                      autoFocus
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setDropdownOpen(true);
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                      onKeyDown={onLookupKeyDown}
                      placeholder={t.rsvp.lookupPlaceholder}
                      aria-label={t.rsvp.lookupPlaceholder}
                      autoComplete="off"
                      maxLength={120}
                      role="combobox"
                      aria-expanded={dropdownOpen && query.trim().length >= LOOKUP_MIN_CHARS}
                      aria-controls="rsvp-matches-listbox"
                      aria-activedescendant={
                        activeIndex >= 0 && matches?.[activeIndex]
                          ? `rsvp-match-${activeIndex}`
                          : undefined
                      }
                      style={inputStyle}
                    />

                    {dropdownOpen && query.trim().length >= LOOKUP_MIN_CHARS && (
                      <div
                        id="rsvp-matches-listbox"
                        role="listbox"
                        aria-label="Matching invitations"
                        className="absolute left-0 right-0 z-10"
                        style={{
                          top: "calc(100% + 6px)",
                          background: IVORY,
                          border: `1px solid ${HAIRLINE}`,
                          boxShadow: "0 20px 40px -20px rgba(42,37,32,0.3)",
                        }}
                      >
                        {matchesLoading && !matches ? (
                          <p
                            className="font-sans"
                            style={{ fontSize: 13, color: SOFT, padding: "14px 16px" }}
                          >
                            {t.common.loading}
                          </p>
                        ) : matches && matches.length > 0 ? (
                          matches.map((m, i) => (
                            <button
                              key={m.selectToken}
                              id={`rsvp-match-${i}`}
                              role="option"
                              aria-selected={i === activeIndex}
                              type="button"
                              // onMouseDown (not onClick) fires before the input's onBlur closes the dropdown.
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectMatch(m);
                              }}
                              onMouseEnter={() => setActiveIndex(i)}
                              className="w-full text-left transition-colors"
                              style={{
                                padding: "14px 16px",
                                background:
                                  i === activeIndex ? "rgba(135,121,163,0.08)" : "transparent",
                                borderBottom:
                                  i < matches.length - 1 ? `1px solid ${HAIRLINE}` : "none",
                              }}
                            >
                              <div
                                className="font-serif italic"
                                style={{ color: INK, fontSize: 18 }}
                              >
                                {m.primary_name}
                              </div>
                              <div
                                className="font-sans"
                                style={{ fontSize: 12, color: SOFT, marginTop: 4 }}
                              >
                                Party of {m.party_size || 1}
                              </div>
                            </button>
                          ))
                        ) : matches && matches.length === 0 ? (
                          <div style={{ padding: "16px" }}>
                            <p className="font-sans" style={{ fontSize: 13, color: SOFT }}>
                              {t.rsvp.lookupNotFound}
                            </p>
                            <p
                              className="mt-2 italic font-serif"
                              style={{ color: SOFT, fontSize: 12 }}
                            >
                              {SITE.rsvpFallbackContact}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Honeypot: hidden from sighted/keyboard users, some bots fill it anyway. */}
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    autoComplete="off"
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
                  />

                  <div role="alert" aria-live="polite">
                    {err && (
                      <div className="mt-6 font-sans" style={{ fontSize: 14, color: DANGER }}>
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
                      <div className="mt-6 font-sans" style={{ fontSize: 14, color: DANGER }}>
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
                    style={{
                      border: "none",
                      padding: 0,
                      margin: 0,
                      minInlineSize: "auto",
                      opacity: rsvpOpen ? 1 : 0.55,
                    }}
                  >
                    <section>
                      <p
                        style={{
                          ...eyebrow,
                          color: LAV_DEEP,
                          letterSpacing: "0.3em",
                          fontSize: 11,
                        }}
                      >
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
                        style={{
                          ...eyebrow,
                          color: LAV_DEEP,
                          letterSpacing: "0.3em",
                          fontSize: 11,
                          margin: 0,
                        }}
                      >
                        Mailing address
                      </p>
                      {addressMode === "view" && (
                        <button
                          type="button"
                          onClick={() => {
                            setAddressMode("edit");
                            setAddressSaved(false);
                            setAddressErr(null);
                          }}
                          className="uppercase font-sans"
                          style={{
                            fontSize: 10,
                            letterSpacing: "0.2em",
                            color: LAV_DEEP,
                            borderBottom: `1px solid ${LAV_DEEP}`,
                            paddingBottom: 2,
                          }}
                        >
                          {hasAddress(address) ? t.rsvp.addressEditCta : t.rsvp.addressAddCta}
                        </button>
                      )}
                    </div>

                    {addressMode === "view" ? (
                      <div className="mt-3">
                        {hasAddress(address) ? (
                          <div
                            className="font-serif italic"
                            style={{ fontSize: 17, color: INK, lineHeight: 1.6 }}
                          >
                            {formatAddress(address).map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
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
                          <div>
                            <input
                              value={address.postal_code ?? ""}
                              onChange={(e) =>
                                setAddress({ ...address, postal_code: e.target.value })
                              }
                              placeholder="ZIP / postal"
                              aria-label="ZIP or postal code"
                              autoComplete="postal-code"
                              maxLength={20}
                              style={inputStyle}
                            />
                            {(address.postal_code ?? "").trim() &&
                              (!(address.country ?? "").trim() ||
                                /^us(a)?$/i.test((address.country ?? "").trim())) &&
                              !looksLikeUsZip(address.postal_code ?? "") && (
                                <p
                                  className="font-sans"
                                  style={{ fontSize: 11, color: DANGER, marginTop: 6 }}
                                >
                                  Doesn&rsquo;t look like a US ZIP (12345 or 12345-6789).
                                </p>
                              )}
                          </div>
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
                          <p className="mt-3 font-sans" style={{ fontSize: 13, color: DANGER }}>
                            {addressErr}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-5">
                          <button
                            type="button"
                            onClick={saveAddress}
                            disabled={addressSaving}
                            className="uppercase font-sans"
                            style={{
                              background: INK,
                              color: IVORY,
                              padding: "12px 28px",
                              fontSize: 10,
                              letterSpacing: "0.24em",
                              border: `1px solid ${INK}`,
                              opacity: addressSaving ? 0.5 : 1,
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
                    style={{
                      border: "none",
                      padding: 0,
                      margin: 0,
                      minInlineSize: "auto",
                      opacity: rsvpOpen ? 1 : 0.55,
                    }}
                  >
                    <section className="space-y-6">
                      <div>
                        <label
                          htmlFor="rsvp-email"
                          className="block"
                          style={{
                            ...eyebrow,
                            color: LAV_DEEP,
                            letterSpacing: "0.3em",
                            fontSize: 11,
                            margin: "0 0 6px",
                          }}
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
                          style={{
                            ...eyebrow,
                            color: LAV_DEEP,
                            letterSpacing: "0.3em",
                            fontSize: 11,
                          }}
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
                          style={{
                            ...eyebrow,
                            color: LAV_DEEP,
                            letterSpacing: "0.3em",
                            fontSize: 11,
                          }}
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
                        <p className="font-sans" style={{ fontSize: 14, color: DANGER }}>
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
                          setSessionToken(null);
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

              {/* Done — a real recap of what was just submitted, not just a
              generic thank-you. Built from the server's response (status,
              submitted_at) plus the exact attendee list just sent, so it
              can't drift from what's actually in the database. */}
              {stage === "done" && recap && (
                <div>
                  <p
                    className="font-sans text-center"
                    style={{ fontSize: 15, color: BODY, lineHeight: 1.7, margin: "0 0 32px" }}
                  >
                    {t.rsvp.recapBody}
                  </p>

                  <div className="border" style={{ borderColor: HAIRLINE, padding: "24px 28px" }}>
                    <p
                      style={{
                        ...eyebrow,
                        color: LAV_DEEP,
                        letterSpacing: "0.3em",
                        fontSize: 11,
                        margin: "0 0 4px",
                      }}
                    >
                      {recap.status === "attending"
                        ? t.rsvp.attending
                        : recap.status === "not_attending"
                          ? t.rsvp.notAttending
                          : `${t.rsvp.attending} / ${t.rsvp.notAttending}`}
                    </p>
                    <p
                      className="font-sans"
                      style={{ fontSize: 12, color: SOFT, margin: "0 0 18px" }}
                    >
                      Submitted {new Date(recap.submittedAt).toLocaleString()}
                    </p>

                    <div className="space-y-2">
                      {recap.attendees.map((a, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between font-sans"
                          style={{ fontSize: 14, color: INK }}
                        >
                          <span>
                            {a.name}
                            {a.is_child ? (
                              <span style={{ color: SOFT }}> ({t.rsvp.child})</span>
                            ) : null}
                          </span>
                          <span
                            className="uppercase"
                            style={{
                              fontSize: 10,
                              letterSpacing: "0.15em",
                              color: a.attending ? LAV_DEEP : SOFT,
                            }}
                          >
                            {a.attending ? t.rsvp.attending : t.rsvp.notAttending}
                          </span>
                        </div>
                      ))}
                    </div>

                    {recap.addressConfirmed && (
                      <p className="font-sans mt-5" style={{ fontSize: 12, color: SOFT }}>
                        ✓ Mailing address confirmed
                      </p>
                    )}
                  </div>

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
