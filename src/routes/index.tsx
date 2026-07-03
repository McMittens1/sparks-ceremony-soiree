import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useT } from "@/i18n/context";
import { SITE } from "@/lib/site";
import { Reveal } from "@/components/site/Reveal";
import { Marquee } from "@/components/site/Marquee";
import { Countdown } from "@/components/site/Countdown";
import { PhotoUploadModal } from "@/components/site/PhotoUploadModal";
import { listApprovedPhotos, type GalleryPhoto } from "@/lib/photos.functions";
import hero from "@/assets/hero-barn.jpg";
import florals from "@/assets/florals.jpg";
import interior from "@/assets/barn-interior.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

const registryItems = [
  { name: "Zola", href: "https://zola.com", note: "Main registry — dishes, linens, the boring good stuff." },
  { name: "Honeymoon Fund", href: "#", note: "A weekend somewhere warm after the barn cools down." },
  { name: "Local charity", href: "#", note: "In lieu of a gift, a Lincoln food bank we care about." },
];

function Home() {
  const t = useT();
  const location = useLocation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const loadPhotos = useServerFn(listApprovedPhotos);
  const heroImgRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadPhotos().then(setPhotos).catch(() => {}); }, [loadPhotos]);

  // Cursor-linked parallax on the hero image
  useEffect(() => {
    const el = heroImgRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `translate3d(${cx * -14}px, ${cy * -14}px, 0) scale(1.04)`;
    };
    const onLeave = () => { el.style.transform = ""; };
    const parent = el.parentElement;
    parent?.addEventListener("mousemove", onMove);
    parent?.addEventListener("mouseleave", onLeave);
    return () => {
      parent?.removeEventListener("mousemove", onMove);
      parent?.removeEventListener("mouseleave", onLeave);
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
      {/* ============ HERO ============ */}
      <section className="relative min-h-[100svh] pt-20 pb-16 overflow-hidden">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12 grid grid-cols-12 gap-6 lg:gap-12 items-end min-h-[85svh]">
          {/* Left: image + tan accent */}
          <div className="col-span-12 lg:col-span-7 relative z-10">
            <div className="relative aspect-[4/5] sm:aspect-[5/6] w-full overflow-hidden shadow-2xl animate-rise">
              <div ref={heroImgRef} className="absolute inset-0 transition-transform duration-500 ease-out">
                <img src={hero} alt="Sparks' Barn at golden hour" className="h-full w-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 left-6 lg:left-12 w-40 h-40 bg-accent -z-10 hidden sm:block" />
          </div>

          {/* Right: typographic stack */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-between h-full pt-8 lg:pt-16 lg:-ml-24 relative z-20">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-accent animate-rise" style={{ animationDelay: "0.1s" }}>
                {t.home.kicker}
              </p>
              <h1 className="mt-6 editorial-heading text-[18vw] sm:text-[13vw] lg:text-[9vw] xl:text-[8rem] animate-rise" style={{ animationDelay: "0.25s" }}>
                Geovanni<br />
                <span className="text-primary-soft">&</span> Addison
              </h1>
              <div className="mt-10 space-y-8 animate-rise" style={{ animationDelay: "0.45s" }}>
                <div className="border-l-2 border-accent pl-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/60 font-semibold">
                    {t.home.title}
                  </p>
                  <p className="mt-2 font-serif italic text-2xl text-primary leading-tight">
                    {t.home.dateLine}
                  </p>
                </div>
                <p className="max-w-md text-foreground/80 leading-relaxed">
                  {t.home.intro}
                </p>
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <Link
                    to="/rsvp"
                    className="border border-primary bg-primary text-primary-foreground px-8 py-4 text-[10px] uppercase tracking-[0.3em] hover:bg-transparent hover:text-primary transition-colors"
                  >
                    {t.home.rsvpCta}
                  </Link>
                  <a
                    href="#details"
                    className="text-[10px] uppercase tracking-[0.3em] text-primary border-b border-primary/50 pb-1 hover:border-primary"
                  >
                    {t.home.detailsCta} →
                  </a>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -right-6 top-16 h-full pointer-events-none">
              <p className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-accent text-[10px] tracking-[0.6em] uppercase font-semibold">
                Louisville · Nebraska · MMXXVI
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ KINETIC MARQUEE ============ */}
      <Marquee items={["Sparks' Barn", "October 10, 2026", "Louisville · Nebraska", "Geovanni & Addison", "Diez de Octubre"]} className="my-16" />

      {/* ============ COUNTDOWN ============ */}
      <section className="mx-auto max-w-[1600px] px-6 lg:px-12 py-16">
        <Reveal>
          <div className="grid grid-cols-12 gap-8 items-baseline">
            <div className="col-span-12 sm:col-span-4">
              <p className="text-[10px] uppercase tracking-[0.4em] text-accent">01 / Countdown</p>
              <h2 className="mt-4 editorial-heading text-5xl sm:text-6xl">
                Until we<br />say <span className="text-primary-soft italic">I do</span>
              </h2>
            </div>
            <div className="col-span-12 sm:col-span-8">
              <Countdown />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ OUR STORY ============ */}
      <section id="story" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-32 border-t border-accent/20">
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.4em] text-accent">02 / Our Story</p>
          <h2 className="mt-4 editorial-heading text-6xl sm:text-8xl max-w-4xl">
            {t.story.title}
          </h2>
          <p className="mt-6 max-w-xl text-foreground/70 text-lg font-serif italic">{t.story.lead}</p>
        </Reveal>
        <div className="mt-20 grid gap-16 lg:grid-cols-2 items-start">
          <Reveal delay={80}>
            <div className="aspect-[4/5] overflow-hidden">
              <img src={florals} alt="Florals" className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
            </div>
          </Reveal>
          <div className="lg:pt-20">
            {t.story.timeline.map((item, i) => (
              <Reveal key={i} delay={120 + i * 80}>
                <div className="grid grid-cols-[80px_1fr] gap-6 py-8 border-t border-accent/20 first:border-t-0">
                  <div className="editorial-heading text-4xl text-accent">{item.year}</div>
                  <p className="text-foreground/80 leading-relaxed text-lg font-serif">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DETAILS ============ */}
      <section id="details" className="relative py-32 bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center">
          <div className="whitespace-nowrap text-[20vw] font-serif italic text-primary-foreground">10 · 10 · 26</div>
        </div>
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12 relative">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.4em] text-accent">03 / The Day</p>
            <h2 className="mt-4 editorial-heading text-6xl sm:text-8xl text-primary-foreground">
              {t.details.title}
            </h2>
            <p className="mt-6 max-w-xl text-primary-foreground/80 text-lg font-serif italic">{t.details.lead}</p>
          </Reveal>

          <div className="mt-20 grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="text-[10px] uppercase tracking-[0.35em] text-accent">{t.details.scheduleTitle}</p>
              </Reveal>
              <ul className="mt-6">
                {t.details.schedule.map((s, i) => (
                  <Reveal key={i} delay={80 + i * 40}>
                    <li className="grid grid-cols-[100px_1fr] gap-6 items-baseline py-4 border-t border-primary-foreground/15">
                      <span className="font-serif italic text-2xl text-accent tabular-nums">{s.time}</span>
                      <span className="text-primary-foreground/90 text-lg font-serif">{s.label}</span>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-7 grid gap-10 content-start lg:pl-8">
              <Reveal>
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={interior} alt="Barn interior" className="h-full w-full object-cover" />
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
      <section id="party" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-32">
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.4em] text-accent">04 / Wedding Party</p>
          <h2 className="mt-4 editorial-heading text-6xl sm:text-8xl">{t.party.title}</h2>
          <p className="mt-6 max-w-xl text-foreground/70 text-lg font-serif italic">{t.party.lead}</p>
        </Reveal>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {["Maid of Honor", "Best Man", "Bridesmaids", "Groomsmen"].map((role, i) => (
            <Reveal key={role} delay={i * 80}>
              <div className="aspect-[4/5] bg-accent/10 flex items-end p-6 border border-accent/20 group hover:border-primary transition-colors">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-accent">{String(i + 1).padStart(2, "0")}</p>
                  <p className="mt-2 font-serif italic text-2xl text-primary">{role}</p>
                  <p className="mt-1 text-xs text-muted-foreground">To be announced</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ TRAVEL ============ */}
      <section id="travel" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-32 border-t border-accent/20">
        <div className="grid gap-16 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.4em] text-accent">05 / Getting There</p>
              <h2 className="mt-4 editorial-heading text-6xl sm:text-7xl">{t.travel.title}</h2>
              <p className="mt-6 text-foreground/70 font-serif italic text-lg">{t.travel.lead}</p>
            </Reveal>
            <div className="mt-12 space-y-10">
              <Reveal>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-accent">{t.travel.hotelsTitle}</p>
                  <p className="mt-3 text-foreground/80 leading-relaxed">{t.travel.hotelsBody}</p>
                </div>
              </Reveal>
              <Reveal>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-accent">{t.travel.parkingTitle}</p>
                  <p className="mt-3 text-foreground/80 leading-relaxed">{t.travel.parkingBody}</p>
                </div>
              </Reveal>
              <Reveal>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-accent">{t.travel.weatherTitle}</p>
                  <p className="mt-3 text-foreground/80 leading-relaxed">{t.travel.weatherAdvice}</p>
                </div>
              </Reveal>
            </div>
          </div>
          <Reveal delay={120}>
            <div className="lg:col-span-7 lg:col-start-6 aspect-[4/3] overflow-hidden border border-accent/20">
              <iframe
                src={SITE.mapEmbed}
                title={t.travel.mapTitle}
                className="w-full h-full grayscale"
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ PHOTOS ============ */}
      <section id="photos" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-32">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-accent">06 / Photos</p>
              <h2 className="mt-4 editorial-heading text-6xl sm:text-8xl">{t.photos.title}</h2>
              <p className="mt-6 max-w-xl text-foreground/70 text-lg font-serif italic">{t.photos.lead}</p>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="border border-primary text-primary px-6 py-3 text-[10px] uppercase tracking-[0.3em] hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {t.photos.uploadTitle} +
            </button>
          </div>
        </Reveal>

        {photos.length === 0 ? (
          <Reveal>
            <div className="mt-20 aspect-[16/6] border border-dashed border-accent/40 flex items-center justify-center text-center px-6">
              <p className="font-serif italic text-2xl text-primary/60 max-w-md">{t.photos.empty}</p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((p, i) => (
              <Reveal key={p.id} delay={i * 40}>
                <a href={p.url} target="_blank" rel="noopener" className="block overflow-hidden group">
                  <img src={p.url} alt={p.caption ?? ""} loading="lazy" className="w-full h-auto object-cover aspect-square transition-transform duration-700 group-hover:scale-105" />
                </a>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ============ REGISTRY ============ */}
      <section id="registry" className="relative py-32 bg-accent/10 border-y border-accent/20">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.4em] text-accent">07 / Registry</p>
            <h2 className="mt-4 editorial-heading text-6xl sm:text-8xl">{t.registry.title}</h2>
            <p className="mt-6 max-w-xl text-foreground/70 text-lg font-serif italic">{t.registry.lead}</p>
          </Reveal>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {registryItems.map((it, i) => (
              <Reveal key={it.name} delay={i * 100}>
                <a
                  href={it.href}
                  target="_blank"
                  rel="noopener"
                  className="block bg-background border border-accent/30 p-8 hover:border-primary transition-all hover:-translate-y-1 h-full group"
                >
                  <div className="text-[10px] uppercase tracking-[0.3em] text-accent">{String(i + 1).padStart(2, "0")}</div>
                  <div className="mt-4 editorial-heading text-4xl">{it.name}</div>
                  <p className="mt-4 text-sm text-foreground/75 leading-relaxed">{it.note}</p>
                  <div className="mt-8 text-[10px] uppercase tracking-[0.3em] text-primary border-b border-primary/40 pb-1 inline-block group-hover:border-primary">Visit →</div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-32">
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.4em] text-accent">08 / FAQ</p>
          <h2 className="mt-4 editorial-heading text-6xl sm:text-8xl">{t.faq.title}</h2>
          <p className="mt-6 max-w-xl text-foreground/70 text-lg font-serif italic">{t.faq.lead}</p>
        </Reveal>
        <div className="mt-16 grid gap-0 lg:grid-cols-2 lg:gap-x-16">
          {t.faq.items.map((item, i) => (
            <Reveal key={i} delay={i * 60}>
              <details className="group border-t border-accent/20 py-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-baseline justify-between gap-6 cursor-pointer list-none">
                  <span className="font-serif italic text-xl text-primary leading-snug">{item.q}</span>
                  <span className="text-accent text-2xl transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-foreground/80 leading-relaxed">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative py-32 text-center border-t border-accent/20 overflow-hidden">
        <Marquee items={["RSVP by September 15", "Confirma antes del 15 de Septiembre"]} className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-30 border-y-0" />
        <div className="relative mx-auto max-w-2xl px-6">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.4em] text-accent">See you at the barn</p>
            <h2 className="mt-6 editorial-heading text-5xl sm:text-7xl">
              Won't be the same<br />without <span className="text-primary-soft italic">you</span>.
            </h2>
            <div className="mt-10">
              <Link
                to="/rsvp"
                className="inline-block border border-primary bg-primary text-primary-foreground px-10 py-4 text-[11px] uppercase tracking-[0.35em] hover:bg-transparent hover:text-primary transition-colors"
              >
                {t.home.rsvpCta}
              </Link>
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">{t.rsvp.deadlineLine}</p>
          </Reveal>
        </div>
      </section>

      <PhotoUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
