import { useEffect, useRef } from "react";
import { Reveal } from "@/components/site/Reveal";
import { BodyProse, DisplayHeading, Eyebrow } from "@/components/site/typography";
import { STORY_ENTRIES, type StoryEntry } from "@/lib/wedding-data";
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

const photosFor = (entry: StoryEntry) =>
  Array.from({ length: entry.photoCount }, (_, j) => PHOTOS[(entry.photoStart + j) % PHOTOS.length]);

export function StoryTimeline() {
  let datedSeen = 0;
  return (
    <div>
      {STORY_ENTRIES.map((entry, i) => {
        if (entry.kind === "dated") {
          datedSeen += 1;
          const flip = datedSeen % 2 === 0;
          return (
            <DatedRow
              key={i}
              entry={entry}
              flip={flip}
              numLabel={String(i + 1).padStart(2, "0")}
              photos={photosFor(entry)}
            />
          );
        }
        return <MontageRow key={i} entry={entry} photos={photosFor(entry)} />;
      })}
    </div>
  );
}

function DatedRow({
  entry,
  flip,
  numLabel,
  photos,
}: {
  entry: Extract<StoryEntry, { kind: "dated" }>;
  flip: boolean;
  numLabel: string;
  photos: string[];
}) {
  const [main, ...rest] = photos;
  const photosOrder = flip ? "lg:order-3" : "lg:order-1";
  const textOrder = flip ? "lg:order-1" : "lg:order-3";
  return (
    <div className="relative mt-16 lg:mt-28">
      <span
        aria-hidden
        className="absolute font-serif select-none pointer-events-none text-lavender/10"
        style={{
          top: "-46px",
          left: "-8px",
          fontWeight: 500,
          fontSize: "clamp(120px, 34vw, 380px)",
          lineHeight: 1,
          color: "rgba(135,121,163,0.08)",
          zIndex: 0,
        }}
      >
        {numLabel}
      </span>

      <div className="relative z-[1] flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_88px_1fr] lg:items-stretch lg:gap-0">
        {/* Photos: mobile order-2 (below text), desktop flipped */}
        <div
          className={`order-2 flex flex-col gap-2 sm:gap-3 lg:flex-row lg:gap-3.5 lg:h-[640px] ${photosOrder}`}
        >
          <div className="relative photo-zoom w-full aspect-[4/5] max-h-[52svh] lg:aspect-auto lg:max-h-none lg:h-full lg:w-auto lg:flex-[0_0_62%]">
            <img
              src={main}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover object-top lg:object-center border border-hairline"
            />
          </div>
          {rest.length > 0 && (
            <div className="flex flex-row gap-2 sm:gap-3 lg:flex-col lg:gap-3 lg:flex-1 lg:min-w-0">
              {rest.map((src, j) => (
                <div
                  key={j}
                  className="flex-1 aspect-square max-h-[22svh] lg:aspect-auto lg:max-h-none lg:min-h-0 photo-zoom"
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover border border-hairline"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gutter — desktop only */}
        <div className="hidden lg:flex lg:items-center lg:justify-center lg:order-2">
          <StoryGutter />
        </div>

        {/* Text: mobile order-1 (above photos), desktop flipped */}
        <div className={`order-1 flex flex-col justify-center lg:px-2 ${textOrder}`}>
          <div className="flex items-center gap-3.5 mb-1.5 lg:mb-2.5">
            <Eyebrow as="span" size="md" color="lavender-deep">
              {numLabel}
            </Eyebrow>
            <div className="w-8 h-px bg-tan" />
            <time
              className="font-serif italic text-lavender-deep"
              style={{ fontSize: "clamp(16px, 2vw, 19px)" }}
            >
              {entry.date}
            </time>
          </div>
          <Eyebrow color="tan" size="sm" className="mb-3" style={{ letterSpacing: "0.24em" }}>
            {entry.place}
          </Eyebrow>
          <DisplayHeading
            as="h3"
            italic={false}
            size="sm"
            color="ink"
            style={{ margin: "0 0 18px" }}
          >
            {entry.title}
          </DisplayHeading>
          <BodyProse>{entry.body}</BodyProse>
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
      <div ref={ref} className="story-line absolute inset-0 bg-hairline" />
      <span
        className="absolute diamond-in is-in bg-lavender"
        aria-hidden
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(45deg)",
          width: 7,
          height: 7,
        }}
      />
    </div>
  );
}

function MontageRow({
  entry,
  photos,
}: {
  entry: Extract<StoryEntry, { kind: "montage" }>;
  photos: string[];
}) {
  return (
    <Reveal variant="up" className="text-center block">
      <div className="mt-16 lg:mt-28">
        <Eyebrow color="tan" size="lg" className="mb-4">
          — {entry.label} —
        </Eyebrow>
        <DisplayHeading as="h3" size="md" color="ink" style={{ margin: "0 0 20px" }}>
          {entry.title}
        </DisplayHeading>
        <BodyProse className="mx-auto" maxWidth={640} style={{ margin: "0 auto 44px" }}>
          {entry.body}
        </BodyProse>
        <div
          className="grid gap-2 sm:gap-3 lg:gap-3.5 text-left"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(clamp(120px, 42vw, 160px), 1fr))",
            gridAutoRows: "clamp(150px, 40vw, 200px)",
          }}
        >
          {photos.map((src, i) => (
            <div key={i} className="photo-zoom w-full h-full">
              <img
                src={src}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover border border-hairline"
              />
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
