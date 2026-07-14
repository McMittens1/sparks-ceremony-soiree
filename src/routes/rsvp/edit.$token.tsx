import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/i18n/context";
import { SITE } from "@/lib/site";
import {
  getRsvpByToken,
  updateRsvpByToken,
  type PublicGuest,
  type PublicRsvp,
  type AttendeeChoice,
  type GuestAddress,
} from "@/lib/rsvp.functions";

export const Route = createFileRoute("/rsvp/edit/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Edit your RSVP · Geovanni & Addison" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EditRsvpPage,
});

const INK = "var(--color-ink)";
const IVORY = "var(--color-ivory)";
const HAIRLINE = "var(--color-hairline)";
const LAV = "var(--color-lavender)";
const LAV_DEEP = "var(--color-lavender-deep)";
const TAN = "var(--color-tan)";
const SOFT = "var(--color-ink-soft)";

const inputStyle: React.CSSProperties = {
  fontFamily: "Cormorant, serif",
  fontStyle: "italic",
  fontSize: 19,
  color: INK,
  border: "none",
  borderBottom: `1px solid ${TAN}`,
  background: "transparent",
  outline: "none",
  width: "100%",
  padding: "0 0 10px",
  boxSizing: "border-box",
};

function EditRsvpPage() {
  const t = useT();
  const { token } = Route.useParams();
  const runGet = useServerFn(getRsvpByToken);
  const runUpdate = useServerFn(updateRsvpByToken);

  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error"; reason: "malformed" | "invalid" | "expired" | "not_found" }
    | { kind: "ready"; guest: PublicGuest; rsvp: PublicRsvp | null }
    | { kind: "done" }
  >({ kind: "loading" });

  const [attendees, setAttendees] = useState<AttendeeChoice[]>([]);
  const [address, setAddress] = useState<GuestAddress>({});
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [email, setEmail] = useState("");
  const [songRequest, setSongRequest] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await runGet({ data: { token } });
        if (!alive) return;
        if (!res.ok) {
          setState({ kind: "error", reason: res.reason });
          return;
        }
        const { guest, rsvp } = res;
        setEmail(guest.email ?? "");
        if (rsvp) {
          setAttendees(rsvp.attendees.length ? rsvp.attendees : guest.party_members.map((m) => ({ ...m, attending: false })));
          setAddress(rsvp.address ?? guest.address);
          setAddressConfirmed(rsvp.address_confirmed);
          setSongRequest(rsvp.song_request ?? "");
          setMessage(rsvp.message ?? "");
        } else {
          setAttendees(guest.party_members.map((m) => ({ ...m, attending: true })));
          setAddress(guest.address);
        }
        setState({ kind: "ready", guest, rsvp });
      } catch {
        if (alive) setState({ kind: "error", reason: "invalid" });
      }
    })();
    return () => { alive = false; };
  }, [token, runGet]);

  function updateAttendee(i: number, patch: Partial<AttendeeChoice>) {
    setAttendees((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function addAttendee() {
    setAttendees((prev) => [...prev, { name: "", is_child: false, attending: true }]);
  }
  function removeAttendee(i: number) {
    setAttendees((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind !== "ready") return;
    const cleaned = attendees.filter((a) => a.name.trim().length > 0);
    if (cleaned.length === 0) { setErr(t.rsvp.errNoName); return; }
    setSaving(true); setErr(null);
    try {
      await runUpdate({
        data: {
          token,
          attendees: cleaned,
          address_confirmed: addressConfirmed,
          address,
          email,
          song_request: songRequest,
          message,
        },
      });
      setState({ kind: "done" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.rsvp.errGeneric);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: IVORY, minHeight: "100vh" }}>
      <div className="flex items-center justify-between" style={{ padding: "26px 56px", borderBottom: `1px solid ${HAIRLINE}` }}>
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif italic" style={{ fontSize: 22, color: INK }}>G</span>
          <span style={{ width: 5, height: 5, background: LAV, transform: "rotate(45deg)" }} />
          <span className="font-serif italic" style={{ fontSize: 22, color: INK }}>A</span>
        </Link>
        <Link
          to="/"
          className="uppercase font-sans"
          style={{ fontSize: 10, letterSpacing: "0.2em", color: LAV_DEEP, borderBottom: `1px solid ${LAV_DEEP}`, padding: "2px 0" }}
        >
          ← Back to the site
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center" style={{ padding: "60px 20px" }}>
        <div style={{ width: 640, maxWidth: "100%", background: IVORY, border: `1px solid ${HAIRLINE}`, boxShadow: "0 50px 90px -50px rgba(42,37,32,0.28)", padding: "56px 64px" }}>
          <p className="uppercase font-sans text-center" style={{ fontSize: 11, letterSpacing: "0.35em", color: TAN, margin: "0 0 16px" }}>
            {SITE.couple} · {SITE.eventDatePretty.en}
          </p>
          <h1 className="font-serif italic text-center" style={{ fontWeight: 500, fontSize: 40, color: INK, margin: 0 }}>
            {state.kind === "done" ? "Updated — thank you." : "Edit your RSVP"}
          </h1>
          <p className="uppercase font-sans text-center" style={{ fontSize: 10, letterSpacing: "0.3em", color: SOFT, margin: "14px 0 0" }}>
            {t.rsvp.deadlineLine}
          </p>

          <div className="my-9 flex items-center gap-3.5">
            <div className="flex-1 h-px" style={{ background: HAIRLINE }} />
            <span style={{ width: 6, height: 6, background: LAV, transform: "rotate(45deg)" }} aria-hidden />
            <div className="flex-1 h-px" style={{ background: HAIRLINE }} />
          </div>

          {state.kind === "loading" && (
            <p className="text-center font-sans" style={{ color: SOFT, fontSize: 14 }}>Loading your invitation…</p>
          )}

          {state.kind === "error" && (
            <div className="text-center font-sans" style={{ fontSize: 14, color: SOFT, lineHeight: 1.7 }}>
              <p className="font-serif italic" style={{ fontSize: 20, color: INK }}>
                {state.reason === "expired"
                  ? "This edit link has expired."
                  : state.reason === "not_found"
                  ? "We can’t find that invitation."
                  : "This edit link isn’t valid."}
              </p>
              <p className="mt-3">{SITE.rsvpFallbackContact}</p>
              <Link to="/rsvp" className="mt-6 inline-block uppercase" style={{ fontSize: 11, letterSpacing: "0.24em", color: LAV_DEEP, borderBottom: `1px solid ${LAV_DEEP}`, paddingBottom: 2 }}>
                Go to RSVP lookup
              </Link>
            </div>
          )}

          {state.kind === "done" && (
            <div className="text-center font-sans" style={{ fontSize: 14, color: SOFT, lineHeight: 1.7 }}>
              <p className="font-serif italic" style={{ fontSize: 20, color: INK }}>Your response has been updated.</p>
              <p className="mt-3">A fresh copy will be on its way to your inbox.</p>
              <Link to="/" className="mt-6 inline-block uppercase" style={{ fontSize: 11, letterSpacing: "0.24em", color: LAV_DEEP, borderBottom: `1px solid ${LAV_DEEP}`, paddingBottom: 2 }}>
                Back to the site
              </Link>
            </div>
          )}

          {state.kind === "ready" && (
            <form onSubmit={onSubmit} className="space-y-10">
              <p className="uppercase font-sans" style={{ fontSize: 10, letterSpacing: "0.2em", color: LAV }}>
                {state.guest.primary_name}
                {state.rsvp && <> — last saved {new Date(state.rsvp.updated_at).toLocaleDateString()}</>}
              </p>

              <section>
                <p className="uppercase font-sans" style={{ fontSize: 11, letterSpacing: "0.3em", color: LAV_DEEP, margin: "0 0 8px" }}>Your party</p>
                <p className="font-sans" style={{ fontSize: 14, color: SOFT, margin: "0 0 20px", lineHeight: 1.6 }}>{t.rsvp.partySubtitle}</p>
                <div className="space-y-5">
                  {attendees.map((a, i) => (
                    <div key={i} className="border" style={{ padding: 18, borderColor: HAIRLINE }}>
                      <input
                        value={a.name}
                        onChange={(e) => updateAttendee(i, { name: e.target.value })}
                        placeholder={t.rsvp.fullName}
                        aria-label={`${t.rsvp.fullName} — guest ${i + 1}`}
                        maxLength={120}
                        style={inputStyle}
                      />
                      <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
                        <div className="flex gap-2">
                          <Pill active={!a.is_child} onClick={() => updateAttendee(i, { is_child: false })} label={t.rsvp.adult} />
                          <Pill active={a.is_child} onClick={() => updateAttendee(i, { is_child: true })} label={t.rsvp.child} />
                        </div>
                        <div className="flex gap-2">
                          <Pill active={a.attending === true} onClick={() => updateAttendee(i, { attending: true })} label={t.rsvp.attending} />
                          <Pill active={a.attending === false} onClick={() => updateAttendee(i, { attending: false })} label={t.rsvp.notAttending} />
                        </div>
                        <button type="button" onClick={() => removeAttendee(i)} className="uppercase font-sans" style={{ fontSize: 10, letterSpacing: "0.2em", color: TAN }}>
                          {t.rsvp.remove}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addAttendee} className="mt-4 uppercase font-sans" style={{ fontSize: 10, letterSpacing: "0.2em", color: LAV_DEEP }}>
                  {t.rsvp.addGuest}
                </button>
              </section>

              <section className="space-y-3">
                <p className="uppercase font-sans" style={{ fontSize: 11, letterSpacing: "0.3em", color: LAV_DEEP }}>{t.rsvp.contactTitle}</p>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.rsvp.email} style={inputStyle} maxLength={200} />
                <input value={songRequest} onChange={(e) => setSongRequest(e.target.value)} placeholder="Song request (optional)" style={inputStyle} maxLength={200} />
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.rsvp.message} maxLength={1000}
                  style={{ ...inputStyle, borderBottom: `1px solid ${TAN}`, minHeight: 80, resize: "vertical" }} />
                <label className="flex items-center gap-2 font-sans" style={{ fontSize: 13, color: SOFT }}>
                  <input type="checkbox" checked={addressConfirmed} onChange={(e) => setAddressConfirmed(e.target.checked)} />
                  Address on file is correct
                </label>
              </section>

              {err && <p className="font-sans" style={{ fontSize: 14, color: "#7a2f26" }}>{err}</p>}

              <button type="submit" disabled={saving} className="block w-full uppercase font-sans"
                style={{ background: INK, color: IVORY, padding: "16px 0", fontSize: 11, letterSpacing: "0.26em", border: `1px solid ${INK}`, opacity: saving ? 0.5 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? t.rsvp.submitting : "Update RSVP"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Pill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="uppercase font-sans"
      style={{
        padding: "8px 14px",
        fontSize: 10,
        letterSpacing: "0.2em",
        border: `1px solid ${active ? INK : HAIRLINE}`,
        background: active ? INK : "transparent",
        color: active ? IVORY : INK,
      }}>
      {label}
    </button>
  );
}
