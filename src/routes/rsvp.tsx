import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";
import { Countdown } from "@/components/site/Countdown";
import { SITE } from "@/lib/site";
import eng75 from "@/assets/engagement/Geo_AddiEngagement-75.jpg.asset.json";
import {
  lookupGuest,
  getGuestBySlug,
  submitRsvp,
  type PublicGuest,
  type PublicRsvp,
  type AttendeeChoice,
  type GuestAddress,
} from "@/lib/rsvp.functions";

export const Route = createFileRoute("/rsvp")({
  validateSearch: (s: Record<string, unknown>) => ({
    g: typeof s.g === "string" ? s.g : undefined,
  }),
  head: () => ({
    meta: [
      { title: "RSVP · Geovanni & Addison" },
      { name: "description", content: "Respond to our wedding invitation. Please reply by September 15, 2026." },
      { property: "og:title", content: "RSVP · Geovanni & Addison" },
      { property: "og:description", content: "Respond to our wedding invitation." },
    ],
  }),
  component: RsvpPage,
});

type Stage = "lookup" | "form" | "done";

function RsvpPage() {
  const t = useT();
  const search = useSearch({ from: "/rsvp" });
  const runLookup = useServerFn(lookupGuest);
  const runGet = useServerFn(getGuestBySlug);
  const runSubmit = useServerFn(submitRsvp);

  const isLate = Date.now() > new Date(SITE.rsvpDeadline).getTime();

  const [stage, setStage] = useState<Stage>("lookup");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<{ slug: string; primary_name: string; party_size: number }[] | null>(null);

  const [guest, setGuest] = useState<PublicGuest | null>(null);
  const [existingRsvp, setExistingRsvp] = useState<PublicRsvp | null>(null);
  const [attendees, setAttendees] = useState<AttendeeChoice[]>([]);
  const [address, setAddress] = useState<GuestAddress>({});
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [songRequest, setSongRequest] = useState("");
  const [message, setMessage] = useState("");

  // Auto-load if ?g=SLUG present.
  useEffect(() => {
    if (search.g && stage === "lookup") loadSlug(search.g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.g]);

  async function loadSlug(slug: string) {
    setLoading(true);
    setErr(null);
    try {
      const res = await runGet({ data: { slug } });
      if (!res.guest) {
        setErr(t.rsvp.lookupNotFound);
        return;
      }
      hydrateFromGuest(res.guest, res.rsvp);
    } catch {
      setErr(t.rsvp.errGeneric);
    } finally {
      setLoading(false);
    }
  }

  function hydrateFromGuest(g: PublicGuest, r: PublicRsvp | null) {
    setGuest(g);
    setExistingRsvp(r);
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
        await loadSlug(res.matches[0].slug);
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
    <div className="relative">
      {/* Hero */}
      <div className="relative h-[38vh] min-h-[280px] w-full overflow-hidden">
        <img src={eng75.url} alt="Geovanni and Addison" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-background/40 to-background" />
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 -mt-16 pb-24 relative">
        <Reveal>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.35em] text-accent">
              {SITE.couple} · {SITE.eventDatePretty.en}
            </p>
            <h1 className="mt-3 editorial-heading text-5xl sm:text-6xl text-primary">{t.rsvp.title}</h1>
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {t.rsvp.deadlineLine}
            </p>
            {isLate && (
              <p className="mt-2 text-xs italic text-accent">
                Past the deadline — we'll do our best to accommodate you.
              </p>
            )}
          </div>
        </Reveal>

        {/* Lookup stage */}
        {stage === "lookup" && (
          <Reveal delay={120}>
            <div className="mt-12 border border-accent/20 bg-card/60 backdrop-blur-sm p-6 sm:p-10">
              <h2 className="font-serif text-2xl text-primary">{t.rsvp.lookupTitle}</h2>
              <p className="mt-2 text-sm text-foreground/75">{t.rsvp.lookupHint}</p>
              <form onSubmit={onLookupSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.rsvp.lookupPlaceholder}
                  maxLength={120}
                  className="flex-1 border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="border border-primary bg-primary text-primary-foreground px-6 py-3 text-[11px] uppercase tracking-[0.3em] disabled:opacity-50"
                >
                  {loading ? t.common.loading : t.rsvp.lookupCta}
                </button>
              </form>

              {matches && matches.length > 1 && (
                <div className="mt-6 space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Is this you?</p>
                  {matches.map((m) => (
                    <button
                      key={m.slug}
                      onClick={() => loadSlug(m.slug)}
                      className="w-full text-left border border-border/60 hover:border-primary px-4 py-3 transition"
                    >
                      <div className="font-serif text-primary">{m.primary_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Party of {m.party_size || 1} · code {m.slug}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {err && (
                <div className="mt-6 text-sm text-destructive">
                  <p>{err}</p>
                  <p className="mt-2 text-xs text-muted-foreground italic">{SITE.rsvpFallbackContact}</p>
                </div>
              )}
            </div>
          </Reveal>
        )}

        {/* Form stage */}
        {stage === "form" && guest && (
          <Reveal delay={120}>
            <form onSubmit={onSubmit} className="mt-12 space-y-10">
              {existingRsvp && (
                <p className="text-xs uppercase tracking-[0.2em] text-accent">
                  Editing your response — last saved{" "}
                  {new Date(existingRsvp.updated_at).toLocaleDateString()}.
                </p>
              )}

              {/* Party */}
              <section className="border border-accent/20 bg-card/60 backdrop-blur-sm p-6 sm:p-8">
                <h2 className="font-serif text-2xl text-primary">{t.rsvp.partyTitle}</h2>
                <p className="mt-2 text-sm text-foreground/75">{t.rsvp.partySubtitle}</p>
                <div className="mt-6 space-y-4">
                  {attendees.map((a, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-center border border-border/40 p-3">
                      <input
                        value={a.name}
                        onChange={(e) => updateAttendee(i, { name: e.target.value })}
                        placeholder={t.rsvp.fullName}
                        maxLength={120}
                        className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={a.is_child}
                          onChange={(e) => updateAttendee(i, { is_child: e.target.checked })}
                        />
                        {t.rsvp.child}
                      </label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => updateAttendee(i, { attending: true })}
                          className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border ${
                            a.attending ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                          }`}
                        >
                          {t.rsvp.attending}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAttendee(i, { attending: false })}
                          className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border ${
                            !a.attending ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                          }`}
                        >
                          {t.rsvp.notAttending}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttendee(i)}
                        className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-destructive"
                      >
                        {t.rsvp.remove}
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addAttendee}
                  className="mt-4 text-xs uppercase tracking-[0.2em] text-primary link-underline"
                >
                  {t.rsvp.addGuest}
                </button>
              </section>

              {/* Address */}
              <section className="border border-accent/20 bg-card/60 backdrop-blur-sm p-6 sm:p-8">
                <h2 className="font-serif text-2xl text-primary">Confirm your address</h2>
                <p className="mt-2 text-sm text-foreground/75">
                  A paper invite is on its way — please confirm your mailing address so we don't send it to the wrong place.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={address.line1 ?? ""}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    placeholder="Street address"
                    maxLength={200}
                    className="sm:col-span-2 border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <input
                    value={address.line2 ?? ""}
                    onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                    placeholder="Apt / suite (optional)"
                    maxLength={200}
                    className="sm:col-span-2 border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <input
                    value={address.city ?? ""}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="City"
                    maxLength={120}
                    className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <input
                    value={address.state ?? ""}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    placeholder="State"
                    maxLength={60}
                    className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <input
                    value={address.postal_code ?? ""}
                    onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                    placeholder="ZIP / postal code"
                    maxLength={20}
                    className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <input
                    value={address.country ?? ""}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    placeholder="Country (if not US)"
                    maxLength={60}
                    className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm text-foreground/80">
                  <input
                    type="checkbox"
                    checked={addressConfirmed}
                    onChange={(e) => setAddressConfirmed(e.target.checked)}
                  />
                  This address is correct.
                </label>
              </section>

              {/* Extras */}
              <section className="border border-accent/20 bg-card/60 backdrop-blur-sm p-6 sm:p-8 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    Song request (optional)
                  </label>
                  <input
                    value={songRequest}
                    onChange={(e) => setSongRequest(e.target.value)}
                    placeholder="One song that'll get you on the floor"
                    maxLength={200}
                    className="w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    {t.rsvp.message}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    className="w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </section>

              {err && <p className="text-sm text-destructive">{err}</p>}

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => { setStage("lookup"); setGuest(null); setMatches(null); setErr(null); }}
                  className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
                >
                  ← {t.common.back}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="border border-primary bg-primary text-primary-foreground px-8 py-3 text-[11px] uppercase tracking-[0.3em] disabled:opacity-50"
                >
                  {loading ? t.rsvp.submitting : t.rsvp.submitCta}
                </button>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
                {t.rsvp.resubmitNote}
              </p>
            </form>
          </Reveal>
        )}

        {/* Done stage */}
        {stage === "done" && (
          <Reveal delay={120}>
            <div className="mt-12 border border-accent/20 bg-card/60 backdrop-blur-sm p-8 sm:p-12 text-center">
              <h2 className="font-serif text-3xl text-primary">{t.rsvp.recapTitle}</h2>
              <p className="mt-3 text-foreground/75">{t.rsvp.recapBody}</p>
              <div className="mt-8 flex flex-col items-center gap-4">
                <button
                  onClick={() => setStage("form")}
                  className="text-xs uppercase tracking-[0.2em] text-primary link-underline"
                >
                  {t.rsvp.recapUpdate}
                </button>
                <Link to="/" className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground link-underline">
                  Back to the site →
                </Link>
              </div>
            </div>
          </Reveal>
        )}

        {/* Countdown */}
        <Reveal delay={280}>
          <div className="mt-20 border-t border-accent/20 pt-10">
            <p className="text-[10px] uppercase tracking-[0.35em] text-accent text-center">Countdown</p>
            <div className="mt-6"><Countdown /></div>
          </div>
        </Reveal>

        <Reveal delay={340}>
          <div className="mt-16 flex flex-wrap justify-center gap-6 text-[10px] uppercase tracking-[0.3em]">
            <Link to="/" hash="details" className="text-primary link-underline">Details →</Link>
            <Link to="/" hash="travel" className="text-primary link-underline">Travel & lodging →</Link>
            <Link to="/" hash="faq" className="text-primary link-underline">FAQ →</Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
