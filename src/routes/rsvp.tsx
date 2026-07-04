import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";
import { Countdown } from "@/components/site/Countdown";
import { SITE } from "@/lib/site";
import eng75 from "@/assets/engagement/Geo_AddiEngagement-75.jpg.asset.json";

export const Route = createFileRoute("/rsvp")({
  head: () => ({ meta: [
    { title: "RSVP · Geovanni & Addison" },
    { name: "description", content: "Respond to our wedding invitation on The Knot. Please reply by September 15, 2026." },
    { property: "og:title", content: "RSVP · Geovanni & Addison" },
    { property: "og:description", content: "Respond to our wedding invitation on The Knot." },
  ]}),
  component: RsvpPage,
});

function RsvpPage() {
  const t = useT();
  return (
    <div className="relative">
      {/* Hero image band */}
      <div className="relative h-[38vh] min-h-[280px] w-full overflow-hidden">
        <img src={eng75.url} alt="Geovanni and Addison" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-background/40 to-background" />
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 -mt-16 pb-24 text-center relative">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.35em] text-accent">{SITE.couple} · {SITE.eventDatePretty.en}</p>
          <h1 className="mt-3 editorial-heading text-5xl sm:text-6xl text-primary">{t.rsvp.title}</h1>
          <p className="mt-6 max-w-md mx-auto text-foreground/75 font-serif italic text-lg">
            We're using The Knot to collect responses. One tap and you're there.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">{t.rsvp.deadlineLine}</p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <a
              href={SITE.rsvpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-primary bg-primary px-10 py-4 text-[11px] uppercase tracking-[0.35em] text-primary-foreground shadow-sm transition hover:bg-transparent hover:text-primary"
            >
              {t.home.rsvpCta}
              <span aria-hidden>↗</span>
            </a>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Opens theknot.com in a new tab</p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-16 border-t border-accent/20 pt-10">
            <p className="text-[10px] uppercase tracking-[0.35em] text-accent">Countdown</p>
            <div className="mt-6">
              <Countdown />
            </div>
          </div>
        </Reveal>

        <Reveal delay={280}>
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
