import { useEffect, useRef } from "react";
import { Reveal } from "@/components/site/Reveal";
import fav from "@/assets/engagement/Favorite.jpg.asset.json";
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

const PHOTOS = [
  fav.url, eng74.url, eng06.url, eng94.url, eng82.url,
  eng75.url, eng27.url, eng19.url, eng15.url, eng13.url, eng10.url,
];

const pick = (start: number, count: number) =>
  Array.from({ length: count }, (_, j) => PHOTOS[(start + j) % PHOTOS.length]);

type Dated = {
  kind: "dated";
  date: string;
  place: string;
  title: string;
  body: string;
  photos: string[];
};
type Montage = {
  kind: "montage";
  label: string;
  title: string;
  body: string;
  photos: string[];
};
export type StoryEntry = Dated | Montage;

const ENTRIES_RAW: StoryEntry[] = [
  { kind: "dated", date: "October 3, 2022", place: "Kinkaider Brewery · The Haymarket", title: "The first date", body: "We met on Hinge and our first date almost didn't happen — Addi had literally moved into a new house that day and probably should have been unpacking. We met at Kinkaider anyway, and right as we sat down at the outdoor patio her glasses snapped clean in half. We laughed about it, grabbed Canes on the way back to her place, and spent the night watching a scary movie surrounded by moving boxes while her dog Odin barked at me the entire time like he hadn't decided if I was allowed to be there.", photos: pick(0, 3) },
  { kind: "dated", date: "Mid-October 2022", place: "Copper meets Odin", title: "The dogs approve", body: "We were only about two weeks into dating when we decided it was time to introduce the dogs, half expecting it to go badly. It didn't. Copper and Odin got along right away — no growling, no standoff, just two dogs that seemed to already know they'd be seeing a lot more of each other. It felt like a good sign for the rest of us too.", photos: pick(1, 2) },
  { kind: "dated", date: "March 2023", place: "Odin comes around", title: "From her dog to ours", body: "He liked me pretty much from the start, but somewhere along the way, without either of us really noticing it happening, he stopped being just Addi's dog and started being mine too. By that spring he was waiting by the door when I showed up, the same way he did for her.", photos: pick(2, 3) },
  { kind: "montage", label: "The years in between", title: "A lot of good ones, stacked", body: "No single story covers this part — just a lot of good ones stacked on top of each other. Trips we took, holidays with both families, random Tuesdays that didn't need a reason to be good. We got better at being a team without really talking about it. Somewhere in the middle of it all, Odin and Copper went from dogs that tolerated each other to actual brothers.", photos: pick(3, 9) },
  { kind: "dated", date: "May 15, 2025", place: "The Joyo Theater", title: "The proposal", body: "I told her we were going to see a movie, which was technically true — except I'd rented out the whole theater first. She sat through a video I made and then a string of movie trailers that kept getting stranger, some real, some completely made up. When it ended I walked her outside, and the marquee out front read \u201CAddi, will you marry me?\u201D She said yes — and she'll be the first to tell you she saw it coming.", photos: pick(4, 4) },
  { kind: "montage", label: "Getting ready for forever", title: "The months after the yes", body: "Telling everyone the news, watching family get just as excited as we were, starting to actually picture what our place together would look like. It didn't feel like planning so much as looking forward to something we already knew was coming.", photos: pick(5, 6) },
  { kind: "dated", date: "October 2025", place: "Moved in together", title: "One roof, four of us", body: "We were surrounded by boxes again — except this time they weren't going anywhere. It took a minute to feel like our place instead of just her place with my stuff in it, but it did. Odin and Copper have been under one roof together ever since, and neither of them seems to remember a time it was any other way.", photos: pick(6, 3) },
  { kind: "montage", label: "Settling in", title: "Ordinary, in the best way", body: "Since then it's mostly been us figuring out what a real life together looks like — Odin and Copper included, the two of them fully inseparable now. Ordinary as it sounds, it's been our favorite part so far, and it's all been building toward something a lot bigger.", photos: pick(7, 6) },
  { kind: "dated", date: "October 10, 2026", place: "Sparks' Barn", title: "The next chapter starts here", body: "With everyone we love in one place to celebrate it with us.", photos: pick(0, 2) },
];

export function StoryTimeline() {
  let datedSeen = 0;
  return (
    <div>
      {ENTRIES_RAW.map((entry, i) => {
        if (entry.kind === "dated") {
          datedSeen += 1;
          const flip = datedSeen % 2 === 0;
          return (
            <DatedRow
              key={i}
              entry={entry}
              index={i}
              flip={flip}
              numLabel={String(i + 1).padStart(2, "0")}
            />
          );
        }
        return <MontageRow key={i} entry={entry} />;
      })}
    </div>
  );
}

function DatedRow({
  entry,
  flip,
  numLabel,
}: {
  entry: Dated;
  index: number;
  flip: boolean;
  numLabel: string;
}) {
  const [main, ...rest] = entry.photos;
  return (
    <div className="relative" style={{ marginTop: 110 }}>
      <span
        aria-hidden
        className="absolute font-serif select-none pointer-events-none rs-story-big-num"
        style={{
          top: -56,
          left: -16,
          fontWeight: 500,
          fontSize: "min(28vw, 380px)",
          lineHeight: 1,
          color: "rgba(135,121,163,0.08)",
          zIndex: 0,
        }}
      >
        {numLabel}
      </span>
      <div
        className="relative grid items-stretch rs-story-row"
        style={{ gridTemplateColumns: "1fr 88px 1fr", zIndex: 1 }}
      >
        {/* Photo stage — fixed 640px height, hero 62% + filmstrip fills rest */}
        <div
          className="flex gap-3.5 rs-story-photos"
          style={{
            order: flip ? 3 : 1,
            height: 640,
          }}
        >
          <div className="relative photo-zoom rs-story-photo-main" style={{ flex: "0 0 62%" }}>
            <img
              src={main}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover border"
              style={{ borderColor: "#E1D6C3" }}
            />
          </div>
          {rest.length > 0 && (
            <div className="flex-1 min-w-0 flex flex-col gap-3 rs-story-photo-rest">
              {rest.map((src, j) => (
                <div key={j} className="flex-1 min-h-0 photo-zoom">
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover border"
                    style={{ borderColor: "#E1D6C3" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gutter with hairline + diamond */}
        <div className="flex items-center justify-center rs-story-gutter" style={{ order: 2 }}>
          <StoryGutter />
        </div>

        {/* Text column */}
        <div
          className="flex flex-col justify-center px-2 rs-story-text"
          style={{ order: flip ? 1 : 3 }}
        >
          <div className="flex items-center gap-3.5 mb-2.5">
            <span
              className="uppercase font-sans"
              style={{ fontSize: 11, letterSpacing: "0.3em", color: "#4C4066" }}
            >
              {numLabel}
            </span>
            <div className="w-8 h-px" style={{ background: "#A39680" }} />
            <time
              className="font-serif italic"
              style={{ fontSize: 19, color: "#4C4066" }}
            >
              {entry.date}
            </time>
          </div>
          <p
            className="uppercase mb-3 font-sans"
            style={{ fontSize: 11, letterSpacing: "0.24em", color: "#A39680" }}
          >
            {entry.place}
          </p>
          <h3
            className="font-serif"
            style={{
              fontWeight: 500,
              fontSize: "clamp(30px, 4vw, 46px)",
              color: "#2A2520",
              lineHeight: 1.1,
              margin: "0 0 22px",
            }}
          >
            {entry.title}
          </h3>
          <p
            className="font-sans"
            style={{
              fontSize: 17,
              lineHeight: 1.8,
              color: "#4A4238",
              maxWidth: 560,
            }}
          >
            {entry.body}
          </p>
        </div>
      </div>
    </div>
  );
}

function StoryGutter() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="relative" style={{ width: 1, height: "70%" }}>
      <div
        ref={ref}
        className="story-line absolute inset-0"
        style={{ background: "#E1D6C3" }}
      />
      <span
        className="absolute diamond-in is-in"
        aria-hidden
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(45deg)",
          width: 7,
          height: 7,
          background: "#8779A3",
        }}
      />
    </div>
  );
}

function MontageRow({ entry }: { entry: Montage }) {
  return (
    <Reveal variant="up" className="text-center block" >
      <div style={{ marginTop: 110 }}>
        <p
          className="uppercase font-sans"
          style={{ fontSize: 11, letterSpacing: "0.4em", color: "#A39680", marginBottom: 16 }}
        >
          — {entry.label} —
        </p>
        <h3
          className="font-serif italic"
          style={{
            fontWeight: 500,
            fontSize: "clamp(32px, 5vw, 52px)",
            color: "#2A2520",
            margin: "0 0 20px",
          }}
        >
          {entry.title}
        </h3>
        <p
          className="font-sans mx-auto"
          style={{
            fontSize: 17,
            lineHeight: 1.8,
            color: "#4A4238",
            maxWidth: 640,
            margin: "0 auto 44px",
          }}
        >
          {entry.body}
        </p>
        <div
          className="grid gap-3.5 text-left"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gridAutoRows: 200,
          }}
        >
          {entry.photos.map((src, i) => (
            <div key={i} className="photo-zoom w-full h-full">
              <img
                src={src}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover border"
                style={{ borderColor: "#E1D6C3" }}
              />
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
