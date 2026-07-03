import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/i18n/context";
import { Countdown } from "@/components/site/Countdown";
import { Reveal } from "@/components/site/Reveal";
import { SectionDivider } from "@/components/site/SectionDivider";
import { SITE } from "@/lib/site";
import hero from "@/assets/hero-barn.jpg";
import florals from "@/assets/florals.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const t = useT();
  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={hero} alt="" width={1920} height={1280} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-background/55" />
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-24 sm:py-36 text-center">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.35em] text-primary">{t.home.kicker}</p>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-6 text-sm sm:text-base text-foreground/80">{t.home.title}</p>
            <h1 className="font-script text-6xl sm:text-8xl text-primary mt-2">Geo &amp; Partner</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-xs sm:text-sm uppercase tracking-[0.28em] text-foreground/70">
              {t.home.dateLine}
            </p>
          </Reveal>
          <Reveal delay={240} className="mt-10">
            <p className="mx-auto max-w-xl text-base sm:text-lg text-foreground/85 leading-relaxed">
              {t.home.intro}
            </p>
          </Reveal>
          <Reveal delay={320} className="mt-12">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/rsvp" className="rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 transition-colors">
                {t.home.rsvpCta}
              </Link>
              <Link to="/details" className="rounded-full border border-primary/40 px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary hover:bg-primary/5 transition-colors">
                {t.home.detailsCta}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <SectionDivider />

      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <p className="text-center text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{t.home.countdownLabel}</p>
        </Reveal>
        <div className="mt-8">
          <Countdown />
        </div>
      </section>

      <SectionDivider />

      <section className="mx-auto max-w-6xl px-4 sm:px-6 grid gap-10 sm:grid-cols-2 items-center">
        <Reveal>
          <img src={florals} alt="" width={1600} height={1000} loading="lazy" className="w-full h-auto rounded-sm object-cover aspect-[4/3]" />
        </Reveal>
        <Reveal delay={120}>
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary">{SITE.venue}</p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl">An evening in Nebraska.</h2>
          <p className="mt-4 text-foreground/80 leading-relaxed">
            The ceremony is outdoors at golden hour, then dinner and dancing inside the barn.
            No formalities we don't need — just the people we love, warm light, and a night that runs
            long enough to actually mean something.
          </p>
          <Link to="/details" className="mt-6 inline-flex items-center text-sm uppercase tracking-[0.2em] text-primary border-b border-primary/40 pb-1 hover:border-primary">
            {t.home.detailsCta} →
          </Link>
        </Reveal>
      </section>

      <div className="h-24" />
    </div>
  );
}
