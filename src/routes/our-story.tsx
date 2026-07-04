import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/site/Reveal";
import { SplitText } from "@/components/site/SplitText";

export const Route = createFileRoute("/our-story")({
  head: () => ({
    meta: [
      { title: "Our Story · Geovanni & Addison" },
      { name: "description", content: "How Geovanni & Addison got from a first date in the Haymarket to a wedding at Sparks' Barn." },
      { property: "og:title", content: "Our Story · Geovanni & Addison" },
      { property: "og:description", content: "From a first date in the Haymarket to forever." },
    ],
  }),
  component: StoryPage,
});

// ---------- content ----------
type Dated = {
  kind: "dated";
  date: string;
  place: string;
  title: string;
  body: string;
  photos: string[]; // urls
};
type Montage = {
  kind: "montage";
  label: string;
  title: string;
  body: string;
  photos: string[];
};
type Entry = Dated | Montage;

// placeholder image helper — swap for real assets later
const ph = (seed: string, w = 900, h = 1200) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

const ENTRIES: Entry[] = [
  {
    kind: "dated",
    date: "October 3, 2022",
    place: "Kinkaider Brewery · The Haymarket",
    title: "The first date",
    body:
      "We met on Hinge and our first date almost didn't happen — Addi had literally moved into a new house that day and probably should have been unpacking. We met at Kinkaider anyway, and right as we sat down at the outdoor patio her glasses snapped clean in half. We laughed about it, grabbed Canes on the way back to her place, and spent the night watching a scary movie surrounded by moving boxes while her dog Odin barked at me the entire time like he hadn't decided if I was allowed to be there.",
    photos: [ph("story-first-1", 900, 1200), ph("story-first-2", 900, 700), ph("story-first-3", 900, 900)],
  },
  {
    kind: "dated",
    date: "Mid-October 2022",
    place: "Copper meets Odin",
    title: "The dogs approve",
    body:
      "We were only about two weeks into dating when we decided it was time to introduce the dogs, half expecting it to go badly. It didn't. Copper and Odin got along right away — no growling, no standoff, just two dogs that seemed to already know they'd be seeing a lot more of each other. It felt like a good sign for the rest of us too.",
    photos: [ph("story-dogs-1", 900, 1100), ph("story-dogs-2", 900, 900)],
  },
  {
    kind: "dated",
    date: "March 2023",
    place: "Odin comes around",
    title: "From her dog to ours",
    body:
      "He liked me pretty much from the start, but somewhere along the way, without either of us really noticing it happening, he stopped being just Addi's dog and started being mine too. By that spring he was waiting by the door when I showed up, the same way he did for her.",
    photos: [ph("story-odin-1", 900, 1200), ph("story-odin-2", 900, 800), ph("story-odin-3", 900, 1000)],
  },
  {
    kind: "montage",
    label: "The years in between",
    title: "A lot of good ones, stacked",
    body:
      "No single story covers this part — just a lot of good ones stacked on top of each other. Trips we took, holidays with both families, random Tuesdays that didn't need a reason to be good. We got better at being a team without really talking about it. Somewhere in the middle of it all, Odin and Copper went from dogs that tolerated each other to actual brothers.",
    photos: [
      ph("story-mid-1", 800, 1100),
      ph("story-mid-2", 900, 700),
      ph("story-mid-3", 800, 800),
      ph("story-mid-4", 900, 1200),
      ph("story-mid-5", 900, 700),
      ph("story-mid-6", 800, 900),
      ph("story-mid-7", 900, 1000),
      ph("story-mid-8", 900, 1200),
      ph("story-mid-9", 900, 800),
    ],
  },
  {
    kind: "dated",
    date: "May 15, 2025",
    place: "The Joyo Theater",
    title: "The proposal",
    body:
      "I told her we were going to see a movie, which was technically true — except I'd rented out the whole theater first. She sat through a video I made and then a string of movie trailers that kept getting stranger, some real, some completely made up. When it ended I walked her outside, and the marquee out front read \u201CAddi, will you marry me?\u201D She said yes — and she'll be the first to tell you she saw it coming.",
    photos: [
      ph("story-prop-1", 900, 1200),
      ph("story-prop-2", 900, 700),
      ph("story-prop-3", 900, 1000),
      ph("story-prop-4", 900, 900),
    ],
  },
  {
    kind: "montage",
    label: "Getting ready for forever",
    title: "The months after the yes",
    body:
      "Telling everyone the news, watching family get just as excited as we were, starting to actually picture what our place together would look like. It didn't feel like planning so much as looking forward to something we already knew was coming.",
    photos: [
      ph("story-ready-1", 900, 1200),
      ph("story-ready-2", 900, 900),
      ph("story-ready-3", 900, 700),
      ph("story-ready-4", 900, 1000),
      ph("story-ready-5", 900, 1100),
      ph("story-ready-6", 900, 800),
    ],
  },
  {
    kind: "dated",
    date: "October 2025",
    place: "Moved in together",
    title: "One roof, four of us",
    body:
      "We were surrounded by boxes again — except this time they weren't going anywhere. It took a minute to feel like our place instead of just her place with my stuff in it, but it did. Odin and Copper have been under one roof together ever since, and neither of them seems to remember a time it was any other way.",
    photos: [ph("story-move-1", 900, 1200), ph("story-move-2", 900, 800), ph("story-move-3", 900, 1000)],
  },
  {
    kind: "montage",
    label: "Settling in",
    title: "Ordinary, in the best way",
    body:
      "Since then it's mostly been us figuring out what a real life together looks like — Odin and Copper included, the two of them fully inseparable now. Ordinary as it sounds, it's been our favorite part so far, and it's all been building toward something a lot bigger.",
    photos: [
      ph("story-settle-1", 900, 1100),
      ph("story-settle-2", 900, 800),
      ph("story-settle-3", 900, 1200),
      ph("story-settle-4", 900, 900),
      ph("story-settle-5", 900, 700),
      ph("story-settle-6", 900, 1000),
    ],
  },
  {
    kind: "dated",
    date: "October 10, 2026",
    place: "Sparks' Barn",
    title: "The next chapter starts here",
    body:
      "With everyone we love in one place to celebrate it with us.",
    photos: [ph("story-wed-1", 900, 1200), ph("story-wed-2", 900, 900)],
  },
];

// ---------- page ----------
function StoryPage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setProgress(1);
      return;
    }
    let raf = 0;
    const tick = () => {
      raf = 0;
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = rect.top - vh * 0.5;
      const end = rect.bottom - vh * 0.5;
      const total = end - start;
      const p = total <= 0 ? 1 : Math.max(0, Math.min(1, -start / total));
      setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* ambient background wash */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-[40%] -right-40 h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* Hero */}
      <header className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 sm:pt-32 pb-16 text-center">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.4em] text-primary">Our Story</p>
        </Reveal>
        <SplitText
          text="From a Tuesday to forever."
          as="h1"
          by="word"
          stagger={70}
          className="mt-4 font-serif italic text-5xl sm:text-7xl md:text-8xl leading-[0.95] text-foreground"
        />
        <Reveal delay={300}>
          <p className="mx-auto mt-6 max-w-xl text-foreground/70">
            Nine chapters, one long walk toward October 10, 2026.
          </p>
          <div className="mx-auto mt-8 h-px w-24 bg-primary/40 draw-line origin-left" />
        </Reveal>
      </header>

      {/* Timeline */}
      <div ref={trackRef} className="relative mx-auto max-w-6xl px-4 sm:px-6 pb-32">
        {/* spine — mobile left, desktop centered */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0 left-6 md:left-1/2 md:-translate-x-1/2 w-px bg-foreground/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-6 md:left-1/2 md:-translate-x-1/2 w-px bg-primary origin-top"
          style={{ height: "100%", transform: `scaleY(${progress})`, transition: "transform 120ms linear" }}
        />

        <div className="space-y-24 sm:space-y-32">
          {ENTRIES.map((entry, i) =>
            entry.kind === "dated" ? (
              <DatedEntry key={i} entry={entry} index={i} side={i % 2 === 0 ? "right" : "left"} />
            ) : (
              <MontageEntry key={i} entry={entry} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- dated entry ----------
function DatedEntry({
  entry,
  side,
  index,
}: {
  entry: Dated;
  side: "left" | "right";
  index: number;
}) {
  // On mobile everything is on the right of the spine. On desktop we alternate.
  const desktopSide = side === "right" ? "md:pl-16 md:pr-0 md:ml-[50%]" : "md:pr-16 md:pl-0 md:mr-[50%] md:text-right";
  return (
    <Reveal variant={side === "right" ? "right" : "left"}>
      <article className={`relative pl-16 md:pl-0 ${desktopSide}`}>
        {/* marker dot */}
        <span
          aria-hidden
          className="absolute top-2 left-6 md:left-1/2 -translate-x-1/2 z-10 flex h-4 w-4 items-center justify-center"
        >
          <span className="absolute inline-flex h-4 w-4 rounded-full bg-primary/20 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
        </span>

        {/* date pill */}
        <div className={`mb-3 flex items-center gap-3 ${side === "left" ? "md:justify-end" : ""}`}>
          <span className="text-[10px] uppercase tracking-[0.35em] text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="h-px w-8 bg-primary/40" />
          <time className="font-serif italic text-primary text-sm sm:text-base">{entry.date}</time>
        </div>

        <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/50">{entry.place}</p>
        <h2 className="mt-2 font-serif text-3xl sm:text-4xl md:text-5xl leading-tight">{entry.title}</h2>
        <p className="mt-4 max-w-xl text-foreground/80 leading-relaxed md:inline-block">{entry.body}</p>

        <div className="mt-8">
          <PhotoStrip photos={entry.photos} align={side} />
        </div>
      </article>
    </Reveal>
  );
}

// ---------- montage entry (breakout, no timeline dot) ----------
function MontageEntry({ entry }: { entry: Montage }) {
  return (
    <Reveal variant="blur">
      <section className="relative -mx-4 sm:-mx-6 md:mx-0">
        {/* soft breakout background */}
        <div className="relative rounded-3xl bg-gradient-to-b from-primary/5 via-transparent to-accent/5 px-4 sm:px-8 md:px-12 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] uppercase tracking-[0.4em] text-accent-foreground/70">— {entry.label} —</p>
            <h2 className="mt-3 font-serif italic text-4xl sm:text-5xl md:text-6xl text-foreground">
              {entry.title}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-foreground/75 leading-relaxed">{entry.body}</p>
          </div>

          <div className="mt-12">
            <Montage photos={entry.photos} />
          </div>
        </div>
      </section>
    </Reveal>
  );
}

// ---------- photo groups ----------
function PhotoStrip({ photos, align }: { photos: string[]; align: "left" | "right" }) {
  if (photos.length === 1) {
    return (
      <PhotoTile
        src={photos[0]}
        className={`aspect-[4/5] w-full max-w-sm ${align === "left" ? "md:ml-auto" : ""}`}
      />
    );
  }
  if (photos.length === 2) {
    return (
      <div className={`grid grid-cols-2 gap-3 max-w-lg ${align === "left" ? "md:ml-auto" : ""}`}>
        <PhotoTile src={photos[0]} className="aspect-[3/4] translate-y-2" />
        <PhotoTile src={photos[1]} className="aspect-[3/4] -translate-y-2" />
      </div>
    );
  }
  // 3+ : featured + stack
  const [hero, ...rest] = photos;
  return (
    <div className={`grid grid-cols-5 gap-3 max-w-2xl ${align === "left" ? "md:ml-auto" : ""}`}>
      <PhotoTile src={hero} className="col-span-3 aspect-[4/5]" />
      <div className="col-span-2 flex flex-col gap-3">
        {rest.slice(0, 3).map((src, i) => (
          <PhotoTile key={i} src={src} className="aspect-[4/3] flex-1" />
        ))}
      </div>
    </div>
  );
}

function Montage({ photos }: { photos: string[] }) {
  // Asymmetric masonry: columns 2/3/4 with varying aspect and a hint of rotation for the "loose" feel.
  const rots = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2", "rotate-0"];
  const spans = ["row-span-2", "", "row-span-2", "", "", "row-span-2", "", "", ""];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[120px] sm:auto-rows-[160px] gap-3 sm:gap-4">
      {photos.map((src, i) => (
        <PhotoTile
          key={i}
          src={src}
          className={`${spans[i % spans.length]} ${rots[i % rots.length]} hover:rotate-0 h-full w-full`}
        />
      ))}
    </div>
  );
}

function PhotoTile({ src, className = "" }: { src: string; className?: string }) {
  return (
    <figure
      className={`group relative overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-foreground/5 transition-all duration-500 will-change-transform hover:shadow-xl hover:ring-primary/30 ${className}`}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </figure>
  );
}
