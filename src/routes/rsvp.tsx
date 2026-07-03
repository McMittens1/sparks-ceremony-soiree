import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useLang, useT, fmt } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";
import { lookupInvite, submitRsvp, type LookupResult, type SubmitResult } from "@/lib/rsvp.functions";

export const Route = createFileRoute("/rsvp")({
  head: () => ({ meta: [
    { title: "RSVP · Geo & Partner" },
    { name: "description", content: "Respond to our wedding invitation. Please reply by September 15, 2026." },
    { property: "og:title", content: "RSVP · Geo & Partner" },
    { property: "og:description", content: "Respond to our wedding invitation." },
  ]}),
  component: RsvpPage,
});

type Guest = { id?: string; full_name: string; is_child: boolean; attending: boolean | null };

function RsvpPage() {
  const t = useT();
  const { lang, setLang } = useLang();
  const lookup = useServerFn(lookupInvite);
  const submit = useServerFn(submitRsvp);

  const [stage, setStage] = useState<"lookup" | "form" | "recap" | "closed">("lookup");
  const [query, setQuery] = useState("");
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [invite, setInvite] = useState<LookupResult["invite"] | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [recap, setRecap] = useState<SubmitResult["recap"] | null>(null);

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupErr(null); setLookupLoading(true);
    try {
      const res = await lookup({ data: { query } });
      if (res.deadlinePassed) { setStage("closed"); return; }
      if (!res.ok || !res.invite) { setLookupErr(t.rsvp.lookupNotFound); return; }
      setInvite(res.invite);
      setGuests((res.guests ?? []).map((g) => ({ id: g.id, full_name: g.full_name, is_child: g.is_child, attending: g.attending })));
      setEmail(res.contact?.email ?? "");
      setPhone(res.contact?.phone ?? "");
      setMessage(res.contact?.message ?? "");
      if (res.invite.language === "es" || res.invite.language === "en") setLang(res.invite.language);
      setStage("form");
    } catch {
      setLookupErr(t.rsvp.errGeneric);
    } finally { setLookupLoading(false); }
  }

  function updateGuest(i: number, patch: Partial<Guest>) {
    setGuests((prev) => prev.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  }
  function addGuest() {
    if (!invite) return;
    if (guests.length >= invite.max_guests) return;
    setGuests((prev) => [...prev, { full_name: "", is_child: false, attending: true }]);
  }
  function removeGuest(i: number) {
    setGuests((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    if (!invite) return;
    if (guests.length === 0) { setFormErr(t.rsvp.errNoName); return; }
    if (guests.length > invite.max_guests) { setFormErr(fmt(t.rsvp.tooManyGuests, { n: invite.max_guests })); return; }
    if (guests.some((g) => g.full_name.trim().length === 0)) { setFormErr(t.rsvp.errName); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFormErr(t.rsvp.errEmail); return; }
    setSubmitting(true);
    try {
      const res = await submit({ data: {
        inviteId: invite.id, guests, contactEmail: email,
        contactPhone: phone || null, message: message || null,
        honeypot: honeypot || null,
      }});
      if (!res.ok) {
        if (res.error === "CLOSED") setStage("closed");
        else if (res.error === "TOO_MANY") setFormErr(fmt(t.rsvp.tooManyGuests, { n: res.max ?? invite.max_guests }));
        else setFormErr(t.rsvp.errGeneric);
        return;
      }
      setRecap(res.recap!);
      setStage("recap");
    } catch {
      setFormErr(t.rsvp.errGeneric);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">October 10, 2026</p>
        <h1 className="mt-2 font-serif text-5xl sm:text-6xl">{t.rsvp.title}</h1>
        <p className="mt-4 text-foreground/70">{t.rsvp.deadlineLine}</p>
      </Reveal>

      {stage === "closed" && (
        <div className="mt-12 rounded-sm border border-border/60 bg-card p-8">
          <h2 className="font-serif text-2xl text-primary">{t.rsvp.closedTitle}</h2>
          <p className="mt-3 text-foreground/80">{t.rsvp.closedBody}</p>
        </div>
      )}

      {stage === "lookup" && (
        <form onSubmit={onLookup} className="mt-12 space-y-6">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t.rsvp.lookupTitle}</label>
            <p className="mt-1 text-sm text-foreground/70">{t.rsvp.lookupHint}</p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.rsvp.lookupPlaceholder}
              className="mt-3 w-full rounded-sm border border-input bg-background px-4 py-3 font-serif text-lg focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          {lookupErr && <p className="text-sm text-destructive">{lookupErr}</p>}
          <button type="submit" disabled={lookupLoading} className="rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {lookupLoading ? t.common.loading : t.rsvp.lookupCta}
          </button>
        </form>
      )}

      {stage === "form" && invite && (
        <form onSubmit={onSubmit} className="mt-12 space-y-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{invite.party_name}</p>
            <h2 className="mt-1 font-serif text-3xl">{t.rsvp.partyTitle}</h2>
            <p className="mt-2 text-sm text-foreground/70">{t.rsvp.partySubtitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{fmt(t.rsvp.maxGuestsHint, { n: invite.max_guests })}</p>
          </div>

          <div className="space-y-4">
            {guests.map((g, i) => (
              <div key={g.id ?? `new-${i}`} className="rounded-sm border border-border/60 bg-card p-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] items-center">
                <input
                  value={g.full_name}
                  onChange={(e) => updateGuest(i, { full_name: e.target.value })}
                  placeholder={t.rsvp.fullName}
                  className="rounded-sm border border-input bg-background px-3 py-2"
                  required
                />
                <select
                  value={g.is_child ? "child" : "adult"}
                  onChange={(e) => updateGuest(i, { is_child: e.target.value === "child" })}
                  className="rounded-sm border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="adult">{t.rsvp.adult}</option>
                  <option value="child">{t.rsvp.child}</option>
                </select>
                <select
                  value={g.attending === true ? "y" : g.attending === false ? "n" : "u"}
                  onChange={(e) => updateGuest(i, { attending: e.target.value === "y" ? true : e.target.value === "n" ? false : null })}
                  className="rounded-sm border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="y">{t.rsvp.attending}</option>
                  <option value="n">{t.rsvp.notAttending}</option>
                  <option value="u">{t.rsvp.undecided}</option>
                </select>
                <button type="button" onClick={() => removeGuest(i)} className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive">
                  {t.rsvp.remove}
                </button>
              </div>
            ))}
            {guests.length < invite.max_guests && (
              <button type="button" onClick={addGuest} className="text-sm text-primary hover:underline">
                {t.rsvp.addGuest}
              </button>
            )}
          </div>

          <div>
            <h3 className="font-serif text-2xl">{t.rsvp.contactTitle}</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t.rsvp.email}</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t.rsvp.phone}</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t.rsvp.message}</span>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" />
              </label>
            </div>
          </div>

          {/* Honeypot */}
          <div aria-hidden style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }}>
            <label>Website
              <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </label>
          </div>

          {formErr && <p className="text-sm text-destructive">{formErr}</p>}
          <p className="text-xs text-muted-foreground">{t.rsvp.resubmitNote}</p>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {submitting ? t.rsvp.submitting : t.rsvp.submitCta}
            </button>
          </div>
        </form>
      )}

      {stage === "recap" && recap && (
        <div className="mt-12 rounded-sm border border-border/60 bg-card p-8">
          <h2 className="font-serif text-3xl text-primary">{t.rsvp.recapTitle}</h2>
          <p className="mt-3 text-foreground/80">{t.rsvp.recapBody}</p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{recap.partyName}</p>
          <ul className="mt-3 divide-y divide-border/60 border-y border-border/60">
            {recap.guests.map((g) => (
              <li key={g.full_name} className="py-3 flex items-center justify-between">
                <span className="font-serif text-lg">{g.full_name}{g.is_child ? ` · ${t.rsvp.child}` : ""}</span>
                <span className={`text-xs uppercase tracking-[0.2em] ${g.attending === true ? "text-primary" : g.attending === false ? "text-muted-foreground" : "text-accent-foreground"}`}>
                  {g.attending === true ? t.rsvp.attending : g.attending === false ? t.rsvp.notAttending : t.rsvp.undecided}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">{fmt(t.rsvp.emailSent, { email: recap.contactEmail })}</p>
          <button
            onClick={() => setStage("form")}
            className="mt-6 rounded-full border border-primary/40 px-5 py-2 text-sm uppercase tracking-[0.2em] text-primary hover:bg-primary/5"
          >
            {t.rsvp.recapUpdate}
          </button>
        </div>
      )}
    </div>
  );
}
