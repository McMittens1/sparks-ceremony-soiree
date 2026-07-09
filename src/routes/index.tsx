import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
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

import favorite from "@/assets/engagement/Favorite.jpg.asset.json";
import eng74 from "@/assets/engagement/Geo_AddiEngagement-74.jpg.asset.json";
import eng06 from "@/assets/engagement/Geo_AddiEngagement-06.jpg.asset.json";
import eng94 from "@/assets/engagement/Geo_AddiEngagement-94.jpg.asset.json";
import eng82 from "@/assets/engagement/Geo_AddiEngagement-82.jpg.asset.json";
import eng75 from "@/assets/engagement/Geo_AddiEngagement-75.jpg.asset.json";
import eng27 from "@/assets/engagement/Geo_AddiEngagement-27.jpg.asset.json";
import eng19 from "@/assets/engagement/Geo_AddiEngagement-19.jpg.asset.json";
import eng15 from "@/assets/engagement/Geo_AddiEngagement-15.jpg.asset.json";
import eng13 from "@/assets/engagement/Geo_AddiEngagement-13.jpg.asset.json";
import eng10 from "@/assets/engagement/Geo_AddiEngagement-10.jpg.asset.json";
const hero = favorite.url;
const florals = eng06.url;
const engagementStrip = [eng74, eng94, eng82, eng75, eng27, eng19, eng15, eng13, eng10];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:image", content: `https://sparks-ceremony-soiree.lovable.app${favorite.url}` },
      { property: "og:image:alt", content: "Geovanni Moreno and Addison Hillman." },
      { property: "og:url", content: "https://sparks-ceremony-soiree.lovable.app/" },
      { name: "twitter:image", content: `https://sparks-ceremony-soiree.lovable.app${favorite.url}` },
    ],
    links: [
      { rel: "canonical", href: "https://sparks-ceremony-soiree.lovable.app/" },
      { rel: "preload", as: "image", href: favorite.url, fetchpriority: "high" },
    ],
  }),
  component: Home,
});


function Home() {
  const t = useT();
  const location = useLocation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const loadPhotos = useServerFn(listApprovedPhotos);
  const heroImgRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadPhotos().then(setPhotos).catch(() => {}); }, [loadPhotos]);

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const nextPhoto = useCallback(() => {
    setLightboxIndex((i) => (i === null || photos.length === 0 ? null : (i + 1) % photos.length));
  }, [photos.length]);
  const prevPhoto = useCallback(() => {
    setLightboxIndex((i) => (i === null || photos.length === 0 ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  // Cursor-linked parallax on the hero image — gated so it doesn't fight the entrance animation
  useEffect(() => {
    const el = heroImgRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `translate3d(${cx * -14}px, ${cy * -14}px, 0) scale(1.04)`;
    };
    const onLeave = () => { el.style.transform = ""; };
    const timer = setTimeout(() => {
      parent.addEventListener("mousemove", onMove);
      parent.addEventListener("mouseleave", onLeave);
    }, 900);
    return () => {
      clearTimeout(timer);
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, []);

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
      {/* ============ HERO — editorial framed portrait ============ */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          {/* Kicker */}
          <p className="text-center text-[10px] uppercase tracking-[0.5em] text-accent animate-rise" style={{ animationDelay: "0.05s" }}>
            {t.home.kicker}
          </p>

          {/* Editorial name block — overlaps the photo on desktop */}
          <h1
            aria-label="Geovanni and Addison"
            className="relative z-10 mt-6 sm:mt-8 editorial-heading leading-[0.85] text-center lg:text-left"
          >
            <span
              className="block text-[14vw] sm:text-[12vw] lg:text-[9vw] xl:text-[10rem] animate-rise lg:pl-[4%]"
              style={{ animationDelay: "0.15s" }}
            >
              Geovanni
            </span>
            <span
              className="block italic text-primary-soft text-[12vw] sm:text-[10vw] lg:text-[7vw] xl:text-[8rem] animate-rise lg:pl-[38%] -mt-2 lg:-mt-4"
              style={{ animationDelay: "0.3s" }}
            >
              &amp;
            </span>
            <span
              className="block text-[14vw] sm:text-[12vw] lg:text-[9vw] xl:text-[10rem] animate-rise lg:pl-[30%] -mt-2 lg:-mt-6"
              style={{ animationDelay: "0.45s" }}
            >
              Addison
            </span>
          </h1>

          {/* Framed portrait — pulls up under the names on desktop */}
          <div className="relative mt-6 sm:mt-10 lg:-mt-10 animate-rise" style={{ animationDelay: "0.55s" }}>
            {/* accent block behind */}
            <div aria-hidden className="absolute -bottom-5 -left-5 sm:-bottom-8 sm:-left-8 w-24 h-24 sm:w-40 sm:h-40 bg-accent -z-10" />
            <div className="relative bg-background p-2 sm:p-3 shadow-2xl border border-accent/25 overflow-hidden">
              <div className="relative aspect-[5/4] sm:aspect-[4/3] lg:aspect-[16/10] w-full overflow-hidden bg-muted">
                <div ref={heroImgRef} className="absolute inset-0 transition-transform duration-500 ease-out will-change-transform">
                  <img
                    src={hero}
                    alt="Geovanni Moreno and Addison Hillman."
                    className="h-full w-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                    width={1920}
                    height={1200}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Museum-plate caption bar */}
          <div className="mt-8 sm:mt-10 grid gap-6 sm:grid-cols-3 sm:items-center animate-rise" style={{ animationDelay: "0.7s" }}>
            <div className="text-center sm:text-left">
              <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/60 font-semibold">
                {t.home.title}
              </p>
              <p className="mt-2 font-serif italic text-xl sm:text-2xl text-primary leading-tight">
                {t.home.dateLine}
              </p>
            </div>
            <div className="text-center text-[10px] uppercase tracking-[0.35em] text-foreground/70 sm:border-x sm:border-accent/25 sm:px-6">
              <a href={SITE.mapLink} target="_blank" rel="noopener" className="link-underline">
                Sparks' Barn
                <span className="mx-2 text-accent">·</span>
                Louisville, NE
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-5">
              <Magnetic strength={0.25}>
                <Link
                  to="/rsvp"
                  search={{}}
                  className="inline-block border border-primary bg-primary text-primary-foreground px-7 py-3.5 text-[10px] uppercase tracking-[0.3em] hover:bg-transparent hover:text-primary transition-colors"
                >
                  {t.home.rsvpCta} →
                </Link>
              </Magnetic>
              <a
                href="#countdown"
                className="link-underline text-[10px] uppercase tracking-[0.3em] text-primary"
              >
                {t.home.detailsCta} →
              </a>
            </div>
          </div>

          {/* Intro paragraph */}
          <p className="mx-auto mt-10 sm:mt-14 max-w-2xl text-center text-foreground/75 leading-relaxed animate-rise" style={{ animationDelay: "0.85s" }}>
            {t.home.intro}
          </p>
        </div>
      </section>


      {/* ============ COUNTDOWN — hero moment ============ */}
      <section id="countdown" className="relative border-y border-accent/20 bg-gradient-to-b from-background via-accent/5 to-background overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl animate-float" />
        </div>
        <div className="mx-auto max-w-[1500px] px-6 lg:px-12 py-20 sm:py-28 lg:py-32">
          <Reveal>
            <div className="flex flex-col items-center text-center">
              <p className="text-[10px] uppercase tracking-[0.4em] text-accent">01 / Countdown</p>
              <SplitText
                as="h2"
                text={t.home.countdownLabel}
                className="mt-6 editorial-heading text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] leading-[0.9] block"
                stagger={70}
              />
              <div className="mt-6 h-px w-24 bg-accent draw-line origin-center" />
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-14 sm:mt-20">
              <Countdown />
            </div>
          </Reveal>
        </div>
      </section>


      {/* ============ OUR STORY ============ */}
      <section id="story" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-20 border-t border-accent/20">
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.4em] text-accent">02 / Our Story</p>
        </Reveal>
        <SplitText as="h2" text={t.story.title} className="mt-4 editorial-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl max-w-4xl block" stagger={70} />
        <Reveal delay={200}>
          <p className="mt-6 max-w-xl text-foreground/70 text-lg font-serif italic">{t.story.lead}</p>
        </Reveal>
        <div className="mt-16">
          <StoryTimeline />
        </div>
      </section>


      {/* ============ ENGAGEMENT STRIP ============ */}
      <section aria-label="Engagement photos" className="py-16 border-t border-accent/20 overflow-hidden">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.4em] text-accent">Engagement · MMXXV</p>
          </Reveal>
        </div>
        <div className="mt-8 flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 lg:px-12 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {engagementStrip.map((img, i) => (
            <Reveal key={i} variant="scale" delay={i * 60}>
              <div className="snap-start shrink-0 w-[70vw] sm:w-[38vw] lg:w-[26vw] aspect-[3/4] overflow-hidden group">
                <img src={img.url} alt="Geovanni and Addison" loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ DETAILS ============ */}
      <section id="details" className="relative py-20 bg-primary text-primary-foreground overflow-hidden grain">

        <div className="mx-auto max-w-[1600px] px-6 lg:px-12 relative">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.4em] text-accent">03 / The Day</p>
          </Reveal>
          <SplitText as="h2" text={t.details.title} className="mt-4 editorial-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-primary-foreground block" stagger={70} />
          <Reveal delay={200}>
            <p className="mt-6 max-w-xl text-primary-foreground/80 text-lg font-serif italic">{t.details.lead}</p>
          </Reveal>

          {/* Integrated date lockup — draws itself in on scroll */}
          <Reveal variant="up" delay={280}>
            <div className="mt-10 flex flex-wrap items-end gap-x-4 gap-y-6 sm:gap-x-8 md:gap-x-10 border-t border-primary-foreground/15 pt-10">
              {[
                { n: "10", cap: "Sat" },
                { n: "10", cap: "Oct" },
                { n: "26", cap: "MMXXVI" },
              ].map((d, i) => (
                <div key={i} className="flex items-end gap-4 sm:gap-8 md:gap-10">
                  <div className="text-center">
                    <div className="editorial-heading text-primary-foreground text-[14vw] sm:text-[11vw] md:text-[9vw] lg:text-[8vw] leading-[0.8]">{d.n}</div>
                    <div className="mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.35em] sm:tracking-[0.4em] text-accent">{d.cap}</div>
                  </div>
                  {i < 2 && <span className="editorial-heading text-primary-foreground/40 text-[8vw] sm:text-[6vw] md:text-[5vw] pb-4 sm:pb-6">·</span>}
                </div>
              ))}
            </div>

            <div className="draw-line mt-4 h-px bg-accent origin-left" />
          </Reveal>

          <div className="mt-12 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="text-[10px] uppercase tracking-[0.35em] text-accent">{t.details.scheduleTitle}</p>
              </Reveal>
              <ul className="mt-6">
                {t.details.schedule.map((s, i) => (
                  <Reveal key={i} delay={80 + i * 40}>
                    <li className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-4 sm:gap-6 items-baseline py-4 border-t border-primary-foreground/15">
                      <span className="font-serif italic text-xl sm:text-2xl text-accent tabular-nums">{s.time}</span>
                      <span className="text-primary-foreground/90 text-base sm:text-lg font-serif">{s.label}</span>
                    </li>

                  </Reveal>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-7 grid gap-10 content-start lg:pl-8">
              <Reveal variant="mask">
                <div className="aspect-[16/10] overflow-hidden">
                  <Parallax speed={-0.12} className="h-full w-full">
                    <img src={eng82.url} alt="Geovanni and Addison" className="h-full w-full object-cover scale-110" />
                  </Parallax>
                </div>
              </Reveal>
              <Reveal>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-accent">{t.details.dressTitle}</p>
                  <p className="mt-3 text-primary-foreground/85 leading-relaxed">{t.details.dressBody}</p>
                </div>
              </Reveal>
              <Reveal>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-accent">{t.details.venueTitle}</p>
                  <p className="mt-3 text-primary-foreground/85 leading-relaxed">{t.details.venueBody}</p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WEDDING PARTY ============ */}
      <section id="party" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-20 border-t border-accent/20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.4em] text-accent">04 / Wedding Party</p>
            </Reveal>
            <SplitText as="h2" text={t.party.title} className="mt-4 editorial-heading text-5xl sm:text-6xl md:text-7xl block" stagger={70} />
            <Reveal delay={200}>
              <p className="mt-6 max-w-md text-foreground/70 text-lg font-serif italic">{t.party.lead}</p>
            </Reveal>
          </div>
          <div className="lg:col-span-8 space-y-16">
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
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-accent/10 ring-1 ring-accent/20">
                      {p.photo ? (
                        <img
                          src={p.photo}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="editorial-heading text-4xl sm:text-5xl text-accent/60">
                            {initials(p.name)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className={`mt-4 font-serif italic text-primary ${sizeClass}`}>{p.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
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
        </div>
      </section>



      {/* ============ TRAVEL ============ */}
      <section id="travel" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-20 border-t border-accent/20 overflow-hidden">
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.4em] text-accent">05 / Getting There</p>
            </Reveal>
            <SplitText as="h2" text={t.travel.title} className="mt-4 editorial-heading text-5xl sm:text-6xl md:text-7xl block" stagger={60} />
            <Reveal delay={180}>
              <p className="mt-6 text-foreground/70 font-serif italic text-lg">{t.travel.lead}</p>
            </Reveal>
            <div className="mt-12 space-y-6">
              <Reveal variant="left">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-accent">{t.travel.addressLabel}</p>
                  <p className="mt-3 text-foreground/80 leading-relaxed">
                    <span className="font-serif text-lg text-primary">{SITE.venue}</span>
                    <br />
                    <a
                      href={SITE.mapLink}
                      target="_blank"
                      rel="noopener"
                      className="link-underline"
                    >
                      {SITE.address}
                    </a>
                  </p>
                </div>
              </Reveal>
              <Reveal variant="left" delay={60}>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-accent">{t.travel.hotelsTitle}</p>
                  <p className="mt-3 text-foreground/80 leading-relaxed">{t.travel.hotelsBody}</p>
                  <div className="mt-5 space-y-5">
                    {t.travel.hotelGroups.map((group) => (
                      <div key={group.area}>
                        <p className="text-[11px] uppercase tracking-[0.25em] text-primary/80">
                          {group.area} <span className="text-foreground/50 normal-case tracking-normal">· {group.drive}</span>
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-foreground/80">
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
                  <p className="text-[10px] uppercase tracking-[0.3em] text-accent">{t.travel.parkingTitle}</p>
                  <p className="mt-3 text-foreground/80 leading-relaxed">{t.travel.parkingBody}</p>
                </div>
              </Reveal>
              <Reveal variant="left" delay={180}>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-accent">{t.travel.weatherTitle}</p>
                  <p className="mt-3 text-foreground/80 leading-relaxed">{t.travel.weatherAdvice}</p>
                </div>
              </Reveal>
            </div>
          </div>
          <Reveal variant="right" delay={120} className="lg:col-span-7 lg:col-start-6">
            <div className="aspect-[4/3] overflow-hidden border border-accent/20 group">
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
      <section id="photos" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.4em] text-accent">06 / Photos</p>
            </Reveal>
            <SplitText as="h2" text={t.photos.title} className="mt-4 editorial-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl block" stagger={70} />
            <Reveal delay={200}>
              <p className="mt-6 max-w-xl text-foreground/70 text-lg font-serif italic">{t.photos.lead}</p>
            </Reveal>
          </div>
          {/* Upload button hidden pre-wedding; re-enable closer to the day. */}
        </div>

        {photos.length === 0 ? (
          <Reveal>
            <div className="mt-12 aspect-[16/6] border border-dashed border-accent/40 flex items-center justify-center text-center px-6">
              <p className="font-serif italic text-2xl text-primary/60 max-w-md">{t.photos.empty}</p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((p, i) => (
              <Reveal key={p.id} variant="scale" delay={i * 40}>
                <button
                  onClick={() => openLightbox(i)}
                  className="block w-full overflow-hidden group relative text-left focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <img src={p.url} alt={p.caption ?? ""} loading="lazy" className="w-full h-auto object-cover aspect-square transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-500" />
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
      <section id="registry" className="relative py-20 bg-accent/10 border-y border-accent/20">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.4em] text-accent">07 / Registry</p>
          </Reveal>
          <SplitText as="h2" text={t.registry.title} className="mt-4 editorial-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl block" stagger={70} />
          <Reveal delay={200}>
            <p className="mt-6 max-w-xl text-foreground/70 text-lg font-serif italic">{t.registry.lead}</p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {registryItems.map((it, i) => (
              <Reveal key={it.name} variant="blur" delay={i * 120}>
                <a
                  href={it.href ?? "#"}
                  target={it.href ? "_blank" : undefined}
                  rel={it.href ? "noopener" : undefined}
                  aria-disabled={it.href ? undefined : true}
                  onClick={(e) => { if (!it.href) e.preventDefault(); }}
                  className="relative block bg-background border border-accent/30 p-8 transition-all h-full group overflow-hidden hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                  <div className="text-[10px] uppercase tracking-[0.3em] text-accent">{String(i + 1).padStart(2, "0")}</div>
                  <div className="mt-4 editorial-heading text-4xl transition-transform duration-500 group-hover:translate-x-1">{it.name}</div>
                  <p className="mt-4 text-sm text-foreground/75 leading-relaxed">{it.note}</p>
                  <div className="mt-8 text-[10px] uppercase tracking-[0.3em] text-primary link-underline">
                    {it.href ? "Visit →" : "Details coming soon"}
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-20">
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.4em] text-accent">08 / FAQ</p>
        </Reveal>
        <SplitText as="h2" text={t.faq.title} className="mt-4 editorial-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl block" stagger={70} />
        <Reveal delay={200}>
          <p className="mt-6 max-w-xl text-foreground/70 text-lg font-serif italic">{t.faq.lead}</p>
        </Reveal>
        <div className="mt-10 grid gap-0 lg:grid-cols-2 lg:gap-x-16">
          {t.faq.items.map((item, i) => (
            <Reveal key={i} variant="up" delay={i * 60}>
              <details className="group border-t border-accent/20 py-6 [&_summary::-webkit-details-marker]:hidden transition-colors hover:border-accent">
                <summary className="flex items-baseline justify-between gap-6 cursor-pointer list-none">
                  <span className="font-serif italic text-xl text-primary leading-snug transition-transform duration-500 group-hover:translate-x-1">{item.q}</span>
                  <span className="text-accent text-2xl transition-transform duration-500 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-foreground/80 leading-relaxed">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="mt-12 text-center text-sm text-foreground/60 font-serif italic">
            Still have a question? {SITE.rsvpFallbackContact}
          </p>
        </Reveal>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative py-20 sm:py-28 lg:py-32 text-center border-t border-accent/20 overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10">
          <img src={eng10.url} alt="" className="h-full w-full object-cover object-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
        </div>
        <div className="relative mx-auto max-w-2xl px-6">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.4em] text-accent">See you soon</p>
          </Reveal>
          <SplitText as="h2" text="Won't be the same without you." className="mt-6 editorial-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl block" stagger={65} />
          <Reveal delay={400}>
            <div className="mt-12 flex flex-col items-center gap-6">
              <Magnetic strength={0.3}>
                <Link
                  to="/rsvp"
                  search={{}}
                  className="inline-block border border-primary bg-primary text-primary-foreground px-10 py-4 text-[11px] uppercase tracking-[0.35em] hover:bg-transparent hover:text-primary transition-colors"
                >
                  {t.home.rsvpCta} →
                </Link>
              </Magnetic>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{t.rsvp.deadlineLine}</p>
              <div className="draw-line h-px w-24 bg-accent origin-left" />
              <Link to="/rsvp" search={{}} className="text-[10px] uppercase tracking-[0.3em] text-primary link-underline">See RSVP page →</Link>
            </div>
          </Reveal>
        </div>
      </section>


      <PhotoUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
