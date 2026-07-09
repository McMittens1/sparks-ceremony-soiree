import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/i18n/context";
import { SITE } from "@/lib/site";
import { Reveal } from "@/components/site/Reveal";
import { Countdown } from "@/components/site/Countdown";
import { PhotoUploadModal } from "@/components/site/PhotoUploadModal";
import { Lightbox } from "@/components/site/Lightbox";
import { SectionRail } from "@/components/site/SectionRail";
import { Parallax } from "@/components/site/Parallax";
import { SplitText } from "@/components/site/SplitText";
import { Magnetic } from "@/components/site/Magnetic";
import { StoryTimeline } from "@/components/site/StoryTimeline";
import { listApprovedPhotos, type GalleryPhoto } from "@/lib/photos.functions";
import { REGISTRY as registryItems, PARTY } from "@/lib/wedding-data";

import heroCouple from "@/assets/hero/hero-couple.jpg.asset.json";
import favorite from "@/assets/engagement/Favorite.jpg.asset.json";
import eng74 from "@/assets/engagement/Geo_AddiEngagement-74.jpg.asset.json";
import eng94 from "@/assets/engagement/Geo_AddiEngagement-94.jpg.asset.json";
import eng82 from "@/assets/engagement/Geo_AddiEngagement-82.jpg.asset.json";
import eng75 from "@/assets/engagement/Geo_AddiEngagement-75.jpg.asset.json";
import eng27 from "@/assets/engagement/Geo_AddiEngagement-27.jpg.asset.json";
import eng19 from "@/assets/engagement/Geo_AddiEngagement-19.jpg.asset.json";
import eng15 from "@/assets/engagement/Geo_AddiEngagement-15.jpg.asset.json";
import eng13 from "@/assets/engagement/Geo_AddiEngagement-13.jpg.asset.json";
import eng10 from "@/assets/engagement/Geo_AddiEngagement-10.jpg.asset.json";
const hero = heroCouple.url;
const heroDesktop = favorite.url;
const engagementStrip = [eng74, eng94, eng82, eng75, eng27, eng19, eng15, eng13, eng10];

export const Route = createFileRoute("/")({
  component: Home,
});


function Home() {
  const t = useT();
  const location = useLocation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const loadPhotos = useServerFn(listApprovedPhotos);

  useEffect(() => { loadPhotos().then(setPhotos).catch(() => {}); }, [loadPhotos]);

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const nextPhoto = useCallback(() => {
    setLightboxIndex((i) => (i === null || photos.length === 0 ? null : (i + 1) % photos.length));
  }, [photos.length]);
  const prevPhoto = useCallback(() => {
    setLightboxIndex((i) => (i === null || photos.length === 0 ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  // Scroll to hash on load / hash change
  useEffect(() => {
    const hash = location.hash;
    if (!hash) return;
    const id = hash.replace(/^#/, "");
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);

  return (
    <div id="home">
      <SectionRail />
      {/* ============ HERO — Cinematic B&W (mobile) ============ */}
      <section className="relative md:hidden h-[100svh] min-h-[640px] w-full overflow-hidden bg-black text-white">
        <img
          src={hero}
          alt="Geovanni Moreno and Addison Hillman."
          className="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.05] animate-rise"
          style={{ animationDuration: "1.6s" }}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          width={1332}
          height={999}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/90" />
        <div aria-hidden className="absolute inset-0 grain pointer-events-none" />

        {/* Top meta */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-5 font-mono text-[9px] uppercase tracking-[0.35em] text-white/85 animate-rise" style={{ animationDelay: "0.2s" }}>
          <span>Est. MMXXVI</span>
          <span className="flex items-center gap-2">
            <span>10</span><span className="text-white/50">·</span><span>10</span><span className="text-white/50">·</span><span>26</span>
          </span>
        </div>

        {/* Bottom lockup */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-8">
          <p
            className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/70 animate-rise"
            style={{ animationDelay: "0.35s" }}
          >
            {t.home.kicker}
          </p>
          <h1 aria-label="Geovanni and Addison" className="mt-3 font-serif leading-[0.85] text-white">
            <span
              className="block text-[3.5rem] tracking-tight animate-rise"
              style={{ animationDelay: "0.5s" }}
            >
              Geovanni
            </span>
            <span
              className="block italic text-[3rem] text-white/90 ml-6 mt-1 animate-rise"
              style={{ animationDelay: "0.7s" }}
            >
              &amp; Addison
            </span>
          </h1>

          <div className="mt-6 flex items-center gap-3 animate-rise" style={{ animationDelay: "0.9s" }}>
            <div className="h-px w-8 bg-white/60" />
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/80">
              {SITE.venue} · Louisville, NE
            </p>
          </div>

          <div className="mt-7 flex items-center gap-5 animate-rise" style={{ animationDelay: "1.05s" }}>
            <Link
              to="/rsvp"
              search={{}}
              className="inline-block px-7 py-3.5 border border-white text-white text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-white hover:text-black transition-colors duration-500"
            >
              {t.home.rsvpCta}
            </Link>
            <a
              href="#countdown"
              className="text-[10px] uppercase tracking-[0.3em] text-white/80 link-underline"
            >
              {t.home.detailsCta} ↓
            </a>
          </div>
        </div>
      </section>

      {/* ============ HERO — Editorial Masthead (desktop) ============ */}
      <section className="relative hidden md:block p-6 md:p-12 overflow-hidden bg-background">
        <div className="mx-auto max-w-[1600px] w-full grid grid-cols-12 gap-0 border border-tan/25">
          <div className="col-span-12 md:col-span-1 flex md:flex-col justify-between items-center py-4 md:py-8 px-4 md:px-0 border-b md:border-b-0 md:border-r border-tan/30">
            <span className="font-mono text-[10px] tracking-[0.35em] text-foreground/60 uppercase md:-rotate-90 md:origin-center whitespace-nowrap animate-rise" style={{ animationDelay: "0.1s" }}>Est. MMXXVI</span>
            <div className="font-mono flex md:flex-col items-center gap-3 md:gap-4 text-[11px] text-foreground font-medium animate-rise" style={{ animationDelay: "0.2s" }}>
              <span>10</span><span className="text-lavender">—</span><span className="text-tan">10</span><span className="text-lavender">—</span><span>26</span>
            </div>
          </div>

          <div className="col-span-12 md:col-span-11 grid grid-cols-1 md:grid-cols-11">
            <div className="md:col-span-5 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-14 md:py-16 z-10 order-2 md:order-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan animate-rise" style={{ animationDelay: "0.15s" }}>{t.home.kicker}</p>
              <h1 aria-label="Geovanni and Addison" className="mt-5 font-serif leading-[0.82] text-foreground flex flex-col">
                <span className="text-6xl sm:text-7xl md:text-[6.5rem] lg:text-[8.5rem] tracking-tight animate-rise" style={{ animationDelay: "0.25s" }}>Geovanni</span>
                <span className="italic text-lavender text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[7rem] ml-8 md:ml-14 lg:ml-20 mt-1 animate-rise" style={{ animationDelay: "0.4s" }}>&amp; Addison</span>
              </h1>
              <div className="mt-10 sm:mt-14 space-y-8 animate-rise" style={{ animationDelay: "0.55s" }}>
                <div className="flex items-start gap-4">
                  <div className="w-px h-12 bg-tan mt-1 shrink-0" />
                  <p className="text-[11px] uppercase tracking-[0.28em] leading-relaxed text-foreground/80">
                    Celebrating at <span className="font-semibold text-foreground">{SITE.venue}</span><br />Louisville, Nebraska
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-5">
                  <Magnetic strength={0.2}>
                    <Link to="/rsvp" search={{}} className="inline-block px-9 py-4 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors duration-500 text-[10px] uppercase tracking-[0.3em] font-medium">{t.home.rsvpCta}</Link>
                  </Magnetic>
                  <a href="#countdown" className="text-[10px] uppercase tracking-[0.3em] text-foreground/70 link-underline">{t.home.detailsCta} →</a>
                </div>
              </div>
            </div>

            <div className="md:col-span-6 relative order-1 md:order-2">
              <div className="aspect-[4/5] md:aspect-auto md:h-[86vh] overflow-hidden bg-muted">
                <img src={heroDesktop} alt="Geovanni Moreno and Addison Hillman." className="h-full w-full object-cover animate-rise" style={{ animationDelay: "0.1s", animationDuration: "1.4s" }} loading="eager" fetchPriority="high" decoding="async" width={1920} height={2400} />
              </div>
              <div className="absolute top-0 right-0 bg-lavender px-4 py-2 hidden md:block animate-rise" style={{ animationDelay: "0.7s" }}>
                <span className="font-mono text-[9px] text-background uppercase tracking-[0.25em] font-bold">MMXXVI</span>
              </div>
              <div className="absolute -bottom-6 -left-6 md:-left-10 bg-background p-6 md:p-8 hidden md:block border border-tan/30 shadow-2xl z-20 animate-rise" style={{ animationDelay: "0.85s" }}>
                <div className="font-mono text-[10px] space-y-2 text-foreground min-w-[180px]">
                  <div className="flex justify-between gap-6 border-b border-tan/25 pb-1.5"><span className="text-foreground/60">LOC</span><span className="font-semibold">40.9997° N</span></div>
                  <div className="flex justify-between gap-6"><span className="text-foreground/60">DAT</span><span className="font-semibold">10.10.2026</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 border-t border-tan/30 py-4 px-4 sm:px-6 flex flex-wrap gap-4 justify-between items-center bg-background">
            <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-tan">Louisville · Nebraska · Two Thousand Twenty Six</div>
            <div className="hidden md:flex gap-6 font-mono text-[9px]"><span className="text-foreground/40">[ 01 ]</span><span className="text-foreground/40">[ 02 ]</span><span className="text-foreground">[ 03 ]</span></div>
          </div>
        </div>
      </section>


      {/* ============ COUNTDOWN — editorial panoramic ============ */}
      <section id="countdown" className="relative overflow-hidden bg-background">
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 py-20 sm:py-24 lg:py-28">
          <div className="relative border-t border-b border-tan/60 py-10 md:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-end">
              {/* Headline block */}
              <Reveal className="lg:col-span-5 lg:border-r border-tan/40 lg:pr-10">
                <div>
                  <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] text-foreground leading-[0.88] tracking-tight">
                    {t.home.countdownLabel.split(" ").slice(0, -2).join(" ") || "Until we say"}
                    <br />
                    <span className="italic text-lavender">
                      {t.home.countdownLabel.split(" ").slice(-2).join(" ") || "I do"}
                    </span>
                  </h2>
                  <div className="mt-8 flex items-center gap-4">
                    <div className="h-px w-12 bg-tan draw-line origin-left" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/80">
                      October 10, 2026
                    </p>
                  </div>
                </div>
              </Reveal>

              {/* Countdown grid */}
              <Reveal delay={200} className="lg:col-span-7 w-full">
                <Countdown />
              </Reveal>
            </div>

            {/* Live indicator overhang */}
            <div className="absolute bottom-0 right-4 sm:right-8 translate-y-1/2 flex items-center gap-3 bg-background px-3">
              <span className="w-1.5 h-1.5 rounded-full bg-lavender animate-pulse" aria-hidden />
              <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-tan">
                Counting Down
              </span>
            </div>
          </div>
        </div>
      </section>


      {/* ============ OUR STORY ============ */}
      <section id="story" className="mx-auto max-w-[1600px] px-6 md:px-12 py-24 sm:py-28 lg:py-32 border-t border-tan/25">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end mb-16 sm:mb-20">
          <div className="lg:col-span-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">01 / Chapters</p>
            <SplitText as="h2" text={t.story.title} className="mt-4 font-serif text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] leading-[0.9] text-foreground block" stagger={70} />
          </div>
          <div className="lg:col-span-4">
            <Reveal delay={200}>
              <div className="flex items-start gap-4">
                <div className="h-px w-10 bg-tan mt-3 shrink-0" />
                <p className="text-foreground/75 leading-relaxed font-serif italic text-xl max-w-md">
                  {t.story.lead}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
        <StoryTimeline />
      </section>


      {/* ============ ENGAGEMENT STRIP ============ */}
      <section aria-label="Engagement photos" className="py-16 border-t border-tan/25 overflow-hidden">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-tan">Engagement · MMXXV</p>
          </Reveal>
        </div>
        <div className="mt-8 flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 lg:px-12 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {engagementStrip.map((img, i) => (
            <Reveal key={i} variant="scale" delay={i * 60}>
              <div className="snap-start shrink-0 w-[70vw] sm:w-[38vw] lg:w-[26vw] aspect-[3/4] overflow-hidden group border border-tan/20">
                <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" width={800} height={1067} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ DETAILS — cinematic dark editorial ============ */}
      <section id="details" className="relative py-24 sm:py-28 lg:py-32 bg-ink text-background overflow-hidden">
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 relative">
          {/* Header row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-end">
            <div className="lg:col-span-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-tan">02 / The Day</p>
              <SplitText as="h2" text={t.details.title} className="mt-4 font-serif text-6xl sm:text-7xl md:text-8xl lg:text-[8rem] leading-[0.9] text-background block" stagger={70} />
            </div>
            <div className="lg:col-span-4">
              <Reveal delay={200}>
                <div className="flex items-start gap-4">
                  <div className="h-px w-10 bg-tan mt-3 shrink-0" />
                  <p className="text-background/75 font-serif italic text-xl leading-relaxed">{t.details.lead}</p>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Cinematic date lockup */}
          <Reveal variant="up" delay={280}>
            <div className="mt-20 sm:mt-24 border-t border-tan/40 pt-10">
              <div className="flex items-end justify-between flex-wrap gap-y-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-tan">
                  Saturday · The tenth · MMXXVI
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-tan hidden md:block">
                  Louisville, Nebraska
                </div>
              </div>
              <div className="mt-6 font-serif text-[24vw] sm:text-[18vw] md:text-[14vw] lg:text-[13rem] xl:text-[16rem] leading-[0.85] text-background flex items-baseline justify-between">
                <span>10</span>
                <span className="text-tan italic mx-2 sm:mx-4">.</span>
                <span>10</span>
                <span className="text-tan italic mx-2 sm:mx-4">.</span>
                <span>26</span>
              </div>
              <div className="mt-4 draw-line h-px bg-tan/60 origin-left" />
            </div>
          </Reveal>

          {/* Content grid */}
          <div className="mt-16 sm:mt-20 grid gap-12 lg:gap-16 lg:grid-cols-12">
            {/* Schedule column */}
            <div className="lg:col-span-5">
              <Reveal>
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">{t.details.scheduleTitle}</p>
              </Reveal>
              <ul className="mt-8">
                {t.details.schedule.map((s, i) => (
                  <Reveal key={i} delay={80 + i * 40}>
                    <li className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] gap-6 items-baseline py-5 border-t border-tan/25">
                      <span className="font-mono text-sm sm:text-base text-tan tabular-nums tracking-tight">{s.time}</span>
                      <span className="text-background/95 text-lg sm:text-xl font-serif">{s.label}</span>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>

            {/* Image + venue/dress */}
            <div className="lg:col-span-7 grid gap-12 content-start lg:pl-8">
              <Reveal variant="mask">
                <div className="aspect-[4/3] overflow-hidden border border-tan/25">
                  <Parallax speed={-0.12} className="h-full w-full">
                    <img src={eng82.url} alt="" className="h-full w-full object-cover scale-110" width={1600} height={1200} />
                  </Parallax>
                </div>
              </Reveal>
              <div className="grid sm:grid-cols-2 gap-10">
                <Reveal>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">{t.details.dressTitle}</p>
                    <p className="mt-4 text-background/85 leading-relaxed">{t.details.dressBody}</p>
                  </div>
                </Reveal>
                <Reveal delay={80}>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">{t.details.venueTitle}</p>
                    <p className="mt-4 text-background/85 leading-relaxed">{t.details.venueBody}</p>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WEDDING PARTY ============ */}
      <section id="party" className="mx-auto max-w-[1600px] px-6 md:px-12 py-24 sm:py-28 lg:py-32 border-t border-tan/25">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end mb-16 sm:mb-20">
          <div className="lg:col-span-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">03 / The Cast</p>
            <SplitText as="h2" text={t.party.title} className="mt-4 font-serif text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] leading-[0.9] text-foreground block" stagger={70} />
          </div>
          <div className="lg:col-span-4">
            <Reveal delay={200}>
              <div className="flex items-start gap-4">
                <div className="h-px w-10 bg-tan mt-3 shrink-0" />
                <p className="text-foreground/75 leading-relaxed font-serif italic text-xl max-w-md">
                  {t.party.lead}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
        <div className="space-y-16">
            {(() => {
              const featured = PARTY.filter((p) => ["Maid of Honor", "Best Man"].includes(p.role));
              const bridesmaids = PARTY.filter((p) => p.role === "Bridesmaid");
              const groomsmen = PARTY.filter((p) => p.role === "Groomsman");
              const kids = PARTY.filter((p) => ["Flower Girl", "Ring Bearer"].includes(p.role));
              const ushers = PARTY.filter((p) => p.role === "Usher");

              const initials = (n: string) =>
                n.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

              const Portrait = ({
                p,
                size = "md",
              }: {
                p: (typeof PARTY)[number];
                size?: "sm" | "md" | "lg";
              }) => {
                const sizeClass =
                  size === "lg"
                    ? "text-3xl sm:text-4xl"
                    : size === "sm"
                      ? "text-lg"
                      : "text-2xl";
                return (
                  <div className="group">
                    <div className="relative aspect-[4/5] overflow-hidden bg-muted border border-tan/25 transition-colors duration-500 group-hover:border-tan/60">
                      {p.photo ? (
                        <img
                          src={p.photo}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-serif text-4xl sm:text-5xl text-tan/70">
                            {initials(p.name)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className={`mt-4 font-serif text-foreground ${sizeClass}`}>{p.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-tan mt-1">
                      {p.role}
                    </p>
                  </div>
                );
              };

              return (
                <>
                  {/* Featured: Maid of Honor & Best Man */}
                  {featured.length > 0 && (
                    <Reveal variant="up">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-accent mb-6">Standing closest</p>
                        <div className="grid gap-8 sm:grid-cols-2">
                          {featured.map((p) => (
                            <Portrait key={p.name} p={p} size="lg" />
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  )}

                  {/* Bridesmaids */}
                  {bridesmaids.length > 0 && (
                    <Reveal variant="up" delay={100}>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-accent mb-6">Bridesmaids</p>
                        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                          {bridesmaids.map((p) => (
                            <Portrait key={p.name} p={p} size="sm" />
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  )}

                  {/* Groomsmen */}
                  {groomsmen.length > 0 && (
                    <Reveal variant="up" delay={150}>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-accent mb-6">Groomsmen</p>
                        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                          {groomsmen.map((p) => (
                            <Portrait key={p.name} p={p} size="sm" />
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  )}

                  {/* Flower Girl & Ring Bearer */}
                  {kids.length > 0 && (
                    <Reveal variant="up" delay={200}>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-accent mb-6">Down the aisle first</p>
                        <div className="grid gap-6 grid-cols-2 sm:max-w-md">
                          {kids.map((p) => (
                            <Portrait key={p.name} p={p} size="sm" />
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  )}

                  {/* Ushers */}
                  {ushers.length > 0 && (
                    <Reveal delay={250}>
                      <div className="pt-10 border-t border-accent/20">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-accent mb-4">Ushers</p>
                        <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                          {ushers.map((p) => p.name).join(" · ")}
                        </p>
                      </div>
                    </Reveal>
                  )}
                </>
              );
            })()}
          </div>
      </section>



      {/* ============ TRAVEL ============ */}
      <section id="travel" className="mx-auto max-w-[1600px] px-6 md:px-12 py-24 sm:py-28 lg:py-32 border-t border-tan/25 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end mb-16 sm:mb-20">
          <div className="lg:col-span-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">04 / Getting There</p>
            <SplitText as="h2" text={t.travel.title} className="mt-4 font-serif text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] leading-[0.9] text-foreground block" stagger={60} />
          </div>
          <div className="lg:col-span-4">
            <Reveal delay={180}>
              <div className="flex items-start gap-4">
                <div className="h-px w-10 bg-tan mt-3 shrink-0" />
                <p className="text-foreground/75 leading-relaxed font-serif italic text-xl max-w-md">
                  {t.travel.lead}
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="grid gap-10 lg:gap-16 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5 space-y-10">
            <Reveal variant="left">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">{t.travel.addressLabel}</p>
                <p className="mt-4 text-foreground/85 leading-relaxed">
                  <span className="font-serif text-2xl text-foreground block">{SITE.venue}</span>
                  <a
                    href={SITE.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline mt-1 inline-block"
                  >
                    {SITE.address}
                  </a>
                </p>
              </div>
            </Reveal>
            <Reveal variant="left" delay={60}>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">{t.travel.hotelsTitle}</p>
                <p className="mt-4 text-foreground/80 leading-relaxed">{t.travel.hotelsBody}</p>
                <div className="mt-6 space-y-6">
                  {t.travel.hotelGroups.map((group) => (
                    <div key={group.area} className="border-t border-tan/20 pt-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/80">
                        {group.area} <span className="text-tan"> · {group.drive}</span>
                      </p>
                      <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
                        {group.items.map((h) => (
                          <li key={h.name}>
                            <span className="text-foreground">{h.name}</span>
                            <span className="text-foreground/55"> — {h.city}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal variant="left" delay={120}>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">{t.travel.parkingTitle}</p>
                <p className="mt-4 text-foreground/80 leading-relaxed">{t.travel.parkingBody}</p>
              </div>
            </Reveal>
            <Reveal variant="left" delay={180}>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">{t.travel.weatherTitle}</p>
                <p className="mt-4 text-foreground/80 leading-relaxed">{t.travel.weatherAdvice}</p>
              </div>
            </Reveal>
          </div>
          <Reveal variant="right" delay={120} className="lg:col-span-7 lg:col-start-6">
            <div className="aspect-[4/3] overflow-hidden border border-tan/30 group">
              <iframe
                src={SITE.mapEmbed}
                title={t.travel.mapTitle}
                className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-1000"
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ PHOTOS ============ */}
      <section id="photos" className="mx-auto max-w-[1600px] px-6 md:px-12 py-24 sm:py-28 border-t border-tan/25">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end mb-14">
          <div className="lg:col-span-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">05 / Photos</p>
            <SplitText as="h2" text={t.photos.title} className="mt-4 font-serif text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] leading-[0.9] text-foreground block" stagger={70} />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Reveal delay={200}>
              <div className="flex items-start gap-4">
                <div className="h-px w-10 bg-tan mt-3 shrink-0" />
                <p className="text-foreground/75 leading-relaxed font-serif italic text-xl">{t.photos.lead}</p>
              </div>
            </Reveal>
            <Reveal delay={280}>
              <Magnetic strength={0.2}>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="border border-foreground text-foreground px-7 py-3.5 text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-foreground hover:text-background transition-colors"
                >
                  {t.photos.uploadTitle} +
                </button>
              </Magnetic>
            </Reveal>
          </div>
        </div>

        {photos.length === 0 ? (
          <Reveal>
            <div className="mt-6 aspect-[16/6] border border-dashed border-tan/40 flex items-center justify-center text-center px-6">
              <p className="font-serif italic text-2xl text-foreground/50 max-w-md">{t.photos.empty}</p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((p, i) => (
              <Reveal key={p.id} variant="scale" delay={i * 40}>
                <button
                  onClick={() => openLightbox(i)}
                  className="block w-full overflow-hidden group relative text-left border border-tan/20 hover:border-tan/60 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/40"
                >
                  <img src={p.url} alt={p.caption ?? ""} loading="lazy" className="w-full h-auto object-cover aspect-square transition-transform duration-700 group-hover:scale-110" />
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNext={nextPhoto}
          onPrev={prevPhoto}
        />
      )}

      {/* ============ REGISTRY ============ */}
      <section id="registry" className="relative py-24 sm:py-28 lg:py-32 border-t border-tan/25 bg-background">
        <div className="mx-auto max-w-[1600px] px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end mb-16">
            <div className="lg:col-span-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">06 / Registry</p>
              <SplitText as="h2" text={t.registry.title} className="mt-4 font-serif text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] leading-[0.9] text-foreground block" stagger={70} />
            </div>
            <div className="lg:col-span-4">
              <Reveal delay={200}>
                <div className="flex items-start gap-4">
                  <div className="h-px w-10 bg-tan mt-3 shrink-0" />
                  <p className="text-foreground/75 leading-relaxed font-serif italic text-xl">{t.registry.lead}</p>
                </div>
              </Reveal>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-tan/30">
            {registryItems.map((it, i) => {
              const cardInner = (
                <>
                  <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-6 font-serif text-3xl md:text-4xl text-foreground leading-tight transition-transform duration-500 group-hover:translate-x-1">
                    {it.name}
                  </div>
                  <p className="mt-4 text-sm text-foreground/75 leading-relaxed">{it.note}</p>
                  <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground link-underline">
                    {it.href ? "Visit →" : "Details soon"}
                  </div>
                </>
              );
              const baseClass = "relative block bg-background border-r border-b border-tan/30 p-8 md:p-10 transition-all h-full group overflow-hidden hover:bg-tan/5";
              return (
                <Reveal key={it.name} variant="blur" delay={i * 100}>
                  {it.href ? (
                    <a
                      href={it.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={baseClass}
                    >
                      {cardInner}
                    </a>
                  ) : (
                    <div className={baseClass}>{cardInner}</div>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="mx-auto max-w-[1600px] px-6 md:px-12 py-24 sm:py-28 border-t border-tan/25">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end mb-14">
          <div className="lg:col-span-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-tan">07 / FAQ</p>
            <SplitText as="h2" text={t.faq.title} className="mt-4 font-serif text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] leading-[0.9] text-foreground block" stagger={70} />
          </div>
          <div className="lg:col-span-4">
            <Reveal delay={200}>
              <div className="flex items-start gap-4">
                <div className="h-px w-10 bg-tan mt-3 shrink-0" />
                <p className="text-foreground/75 leading-relaxed font-serif italic text-xl">{t.faq.lead}</p>
              </div>
            </Reveal>
          </div>
        </div>
        <div className="grid gap-0 lg:grid-cols-2 lg:gap-x-16">
          {t.faq.items.map((item, i) => (
            <Reveal key={i} variant="up" delay={i * 60}>
              <details className="group border-t border-tan/25 py-6 [&_summary::-webkit-details-marker]:hidden transition-colors hover:border-tan">
                <summary className="flex items-baseline justify-between gap-6 cursor-pointer list-none">
                  <span className="font-serif text-xl md:text-2xl text-foreground leading-snug transition-transform duration-500 group-hover:translate-x-1">{item.q}</span>
                  <span aria-hidden className="font-mono text-tan text-lg transition-transform duration-500 group-open:rotate-45 shrink-0">+</span>
                </summary>
                <p className="mt-4 text-foreground/80 leading-relaxed">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative py-28 sm:py-32 lg:py-40 text-center border-t border-tan/25 overflow-hidden bg-ink text-background">
        <div aria-hidden className="absolute inset-0 -z-0">
          <img src={eng10.url} alt="" className="h-full w-full object-cover object-center opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/70 to-ink" />
        </div>
        <div className="relative mx-auto max-w-2xl px-6">
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-tan">See you soon</p>
          </Reveal>
          <SplitText as="h2" text="Won't be the same without you." className="mt-8 font-serif italic text-5xl sm:text-6xl md:text-7xl text-background leading-[1] block" stagger={65} />
          <Reveal delay={400}>
            <div className="mt-14 flex flex-col items-center gap-6">
              <Magnetic strength={0.3}>
                <Link
                  to="/rsvp"
                  search={{}}
                  className="inline-block border border-background bg-background text-ink px-12 py-4 text-[10px] uppercase tracking-[0.35em] font-medium hover:bg-transparent hover:text-background transition-colors"
                >
                  {t.home.rsvpCta} →
                </Link>
              </Magnetic>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-tan">{t.rsvp.deadlineLine}</p>
            </div>
          </Reveal>
        </div>
      </section>


      <PhotoUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
