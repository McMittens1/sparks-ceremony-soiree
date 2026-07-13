import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Countdown } from "@/components/site/Countdown";
import { StoryTimeline } from "@/components/site/StoryTimeline";
import { WeddingParty } from "@/components/site/WeddingParty";
import { DiamondDivider } from "@/components/site/DiamondDivider";
import { Reveal } from "@/components/site/Reveal";
import { SITE } from "@/lib/site";
import { REGISTRY, HOTELS, FAQ_LOGISTICS, FAQ_GUESTS } from "@/lib/wedding-data";
import favorite from "@/assets/engagement/Favorite.jpg.asset.json";

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

const HAIRLINE = "#E1D6C3";
const INK = "#2A2520";
const IVORY = "#F8F4EC";
const LAV = "#8779A3";
const LAV_DEEP = "#4C4066";
const TAN = "#A39680";
const TAN_DEEP = "#6B5F49";
const GOLD = "#D9C9A0";
const BODY = "#4A4238";
const SOFT = "#6E6255";

/** Section header used by every numbered section. */
function SectionHeader({
  eyebrow,
  title,
  subhead,
  eyebrowColor = TAN_DEEP,
  titleColor = INK,
  subheadColor = SOFT,
}: {
  eyebrow: string;
  title: string;
  subhead: string;
  eyebrowColor?: string;
  titleColor?: string;
  subheadColor?: string;
}) {
  return (
    <Reveal variant="blur">
      <p
        className="uppercase font-sans"
        style={{ fontSize: 12, letterSpacing: "0.4em", color: eyebrowColor, margin: "0 0 18px" }}
      >
        {eyebrow}
      </p>
      <h2
        className="font-serif italic"
        style={{
          fontWeight: 500,
          fontSize: "clamp(44px, 7vw, 76px)",
          color: titleColor,
          margin: 0,
        }}
      >
        {title}
      </h2>
      <p
        className="font-serif italic"
        style={{ fontSize: 22, color: subheadColor, margin: "18px 0 0" }}
      >
        {subhead}
      </p>
    </Reveal>
  );
}

function Home() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace(/^#/, "");
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);

  return (
    <div>
      {/* ============ HERO ============ */}
      <section
        id="hero"
        className="rs-hero-section"
        style={{
          height: "calc(100vh - 73px)",
          minHeight: 560,
          display: "flex",
          flexDirection: "column",
          containerType: "size",
        }}
      >
        <div
          className="flex-1 min-h-0 flex items-stretch justify-center rs-hero-inner"
          style={{
            gap: "clamp(28px, 5cqw, 72px)",
            padding: "0 clamp(20px, 5cqw, 64px)",
            maxWidth: 1800,
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            className="flex flex-col justify-center min-w-0 rs-hero-text"
            style={{ flex: "0 1 440px" }}
          >
            <p
              className="uppercase font-sans"
              style={{
                fontSize: "clamp(9px, 1.3cqh, 12px)",
                letterSpacing: "0.42em",
                color: TAN,
                margin: "0 0 clamp(10px, 2cqh, 22px)",
              }}
            >
              The Wedding Of
            </p>
            <h1 style={{ margin: 0, fontWeight: "normal" }}>
              <div
                className="font-serif rs-hero-title"
                style={{
                  fontWeight: 500,
                  fontSize: "clamp(30px, 9.5cqh, 92px)",
                  lineHeight: 1,
                  color: INK,
                }}
              >
                Geovanni
              </div>
              <div
                className="font-serif rs-hero-title"
                style={{
                  fontWeight: 500,
                  fontSize: "clamp(30px, 9.5cqh, 92px)",
                  lineHeight: 1.05,
                  color: INK,
                  marginTop: "clamp(2px, 0.6cqh, 8px)",
                }}
              >
                <span style={{ fontStyle: "italic", color: LAV }}>&amp;</span> Addison
              </div>
            </h1>
            <p
              className="font-serif italic"
              style={{
                margin: "clamp(14px, 3cqh, 32px) 0 0",
                fontSize: "clamp(15px, 2.6cqh, 24px)",
                color: LAV_DEEP,
              }}
            >
              October 10, 2026
            </p>
            <p
              className="uppercase font-sans"
              style={{
                margin: "clamp(4px, 1cqh, 10px) 0 0",
                fontSize: "clamp(10px, 1.3cqh, 13px)",
                letterSpacing: "0.22em",
                color: BODY,
              }}
            >
              Sparks&rsquo; Barn <span style={{ color: TAN }}>·</span> Louisville, NE
            </p>
            <div
              className="flex items-center flex-wrap"
              style={{
                marginTop: "clamp(16px, 3cqh, 32px)",
                gap: "clamp(16px, 2.5cqw, 26px)",
              }}
            >
              <Link
                to="/rsvp"
                search={{}}
                className="inline-block uppercase font-sans"
                style={{
                  background: INK,
                  color: IVORY,
                  padding: "clamp(10px, 1.8cqh, 16px) clamp(20px, 3cqw, 32px)",
                  fontSize: "clamp(9px, 1.3cqh, 11px)",
                  letterSpacing: "0.26em",
                  border: `1px solid ${INK}`,
                }}
              >
                RSVP now
              </Link>
              <a
                href="#day"
                className="uppercase font-sans"
                style={{
                  fontSize: "clamp(9px, 1.2cqh, 11px)",
                  letterSpacing: "0.2em",
                  color: LAV_DEEP,
                  borderBottom: `1px solid ${LAV_DEEP}`,
                  paddingBottom: 2,
                }}
              >
                See details
              </a>
            </div>
          </div>
          <div
            className="min-w-0 rs-hero-image"
            style={{ flex: "1 1 560px", padding: "clamp(20px, 4cqh, 40px) 0", boxSizing: "border-box" }}
          >
            <img
              src={favorite.url}
              alt="Geovanni and Addison"
              className="h-full w-full object-cover border hero-image-reveal"
              style={{ borderColor: HAIRLINE }}
              loading="eager"
              fetchPriority="high"
              ref={(el) => {
                if (!el) return;
                requestAnimationFrame(() => el.classList.add("is-in"));
              }}
            />
          </div>
        </div>
      </section>


      {/* ============ COUNTDOWN ============ */}
      <section
        id="countdown"
        className="text-center border-t"
        style={{ padding: "72px 32px", borderColor: HAIRLINE }}
      >
        <p
          className="uppercase font-sans"
          style={{ fontSize: 12, letterSpacing: "0.4em", color: TAN, margin: "0 0 40px" }}
        >
          I · Counting Down
        </p>
        <Countdown />
        <div className="max-w-[600px] mx-auto" style={{ marginTop: 48 }}>
          <DiamondDivider />
        </div>
      </section>

      {/* ============ OUR STORY ============ */}
      <section
        id="story"
        className="border-t rs-section"
        style={{
          padding: "100px 64px",
          maxWidth: 1500,
          margin: "0 auto",
          borderColor: HAIRLINE,
        }}
      >
        <SectionHeader
          eyebrow="II · Our Story"
          title="Our Story"
          subhead="How we got from a first hello to forever."
        />
        <DiamondDivider className="mt-9" />
        <StoryTimeline />
      </section>


      {/* ============ THE DAY ============ */}
      <section
        id="day"
        className="border-t rs-section"
        style={{ padding: "100px 64px", background: LAV_DEEP, borderColor: HAIRLINE }}
      >
        <div className="mx-auto" style={{ maxWidth: 1400 }}>
          <p
            className="uppercase font-sans"
            style={{ fontSize: 12, letterSpacing: "0.4em", color: GOLD, margin: "0 0 18px" }}
          >
            III · The Day
          </p>
          <h2
            className="font-serif italic"
            style={{ fontWeight: 500, fontSize: "clamp(44px, 7vw, 76px)", color: IVORY, margin: 0 }}
          >
            The Day
          </h2>
          <p
            className="font-serif italic"
            style={{ fontSize: 22, color: "rgba(248,244,236,0.75)", margin: "18px 0 0" }}
          >
            Everything happens at Sparks&rsquo; Barn: ceremony, dinner, dancing.
          </p>

          <div
            className="flex items-end flex-wrap"
            style={{
              marginTop: 56,
              gap: "clamp(20px, 5vw, 56px)",
              borderTop: "1px solid rgba(248,244,236,0.18)",
              paddingTop: 44,
            }}
          >
            {[
              { n: "10", cap: "Sat" },
              { n: "10", cap: "Oct" },
              { n: "26", cap: "MMXXVI" },
            ].map((d, i) => (
              <div key={i} className="flex items-end" style={{ gap: "clamp(20px, 5vw, 56px)" }}>
                {i > 0 && (
                  <span
                    className="font-serif"
                    style={{ fontSize: 64, color: "rgba(248,244,236,0.35)", paddingBottom: 16 }}
                  >
                    ·
                  </span>
                )}
                <div className="text-center">
                  <div
                    className="font-serif"
                    style={{
                      fontWeight: 500,
                      fontSize: "clamp(60px, 9vw, 120px)",
                      color: IVORY,
                      lineHeight: 0.8,
                    }}
                  >
                    {d.n}
                  </div>
                  <div
                    className="uppercase font-sans"
                    style={{
                      marginTop: 10,
                      fontSize: 11,
                      letterSpacing: "0.4em",
                      color: GOLD,
                    }}
                  >
                    {d.cap}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="grid rs-stack"
            style={{ marginTop: 70, gridTemplateColumns: "5fr 7fr", gap: 64 }}
          >
            <div>
              <p
                className="uppercase font-sans"
                style={{ fontSize: 11, letterSpacing: "0.3em", color: GOLD, margin: "0 0 20px" }}
              >
                Day-of schedule
              </p>
              {[
                { time: "4:30", label: "Guests arrive" },
                { time: "5:00", label: "Ceremony" },
                { time: "5:45", label: "Cocktail hour" },
                { time: "7:00", label: "Dinner & toasts" },
                { time: "8:30", label: "First dance & open floor" },
                { time: "11:30", label: "Send-off" },
              ].map((s, i, arr) => (
                <div
                  key={i}
                  className="grid items-baseline"
                  style={{
                    gridTemplateColumns: "88px 1fr",
                    gap: 20,
                    padding: "16px 0",
                    borderTop: "1px solid rgba(248,244,236,0.15)",
                    borderBottom: i === arr.length - 1 ? "1px solid rgba(248,244,236,0.15)" : undefined,
                  }}
                >
                  <span className="font-serif italic" style={{ fontSize: 22, color: GOLD }}>
                    {s.time}
                  </span>
                  <span
                    className="font-sans"
                    style={{ fontSize: 16, color: "rgba(248,244,236,0.92)" }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid content-start" style={{ gap: 36 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  aspectRatio: "16 / 10",
                  background: "rgba(248,244,236,0.06)",
                  border: "1px dashed rgba(217,201,160,0.5)",
                }}
              >
                <span
                  className="uppercase font-sans text-center"
                  style={{ fontSize: 11, letterSpacing: "0.2em", color: GOLD, padding: "0 20px" }}
                >
                  Photo needed · the barn
                </span>
              </div>
              <div>
                <p
                  className="uppercase font-sans"
                  style={{ fontSize: 11, letterSpacing: "0.3em", color: GOLD, margin: "0 0 10px" }}
                >
                  Dress code
                </p>
                <p
                  className="font-sans"
                  style={{ fontSize: 16, lineHeight: 1.75, color: "rgba(248,244,236,0.88)", margin: 0 }}
                >
                  Cocktail attire in warm neutrals, lavender, or plum. Skip the stilettos, the barn
                  floor is uneven and the lawn is grass.
                </p>
              </div>
              <div>
                <p
                  className="uppercase font-sans"
                  style={{ fontSize: 11, letterSpacing: "0.3em", color: GOLD, margin: "0 0 10px" }}
                >
                  The venue
                </p>
                <p
                  className="font-sans"
                  style={{ fontSize: 16, lineHeight: 1.75, color: "rgba(248,244,236,0.88)", margin: 0 }}
                >
                  Sparks&rsquo; Barn is an open-air barn on farmland outside Louisville, Nebraska.
                  The ceremony happens outdoors on the lawn, then dinner and dancing move inside
                  the barn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WEDDING PARTY ============ */}
      <section
        id="party"
        className="border-t rs-section"
        style={{
          padding: "100px 64px",
          maxWidth: 1500,
          margin: "0 auto",
          borderColor: HAIRLINE,
        }}
      >
        <SectionHeader
          eyebrow="IV · Wedding Party"
          title="Wedding Party"
          subhead="The friends and family standing with us that night."
        />
        <DiamondDivider className="mt-9" />
        <div className="mt-16">
          <WeddingParty />
        </div>
      </section>

      {/* ============ GETTING THERE ============ */}
      <section
        id="travel"
        className="border-t rs-section"
        style={{
          padding: "100px 64px",
          maxWidth: 1500,
          margin: "0 auto",
          borderColor: HAIRLINE,
        }}
      >
        <SectionHeader
          eyebrow="V · Getting There"
          title="Getting There"
          subhead="Sparks' Barn is in Louisville, Nebraska, about 25 minutes south of Omaha and 40 minutes east of Lincoln."
        />
        <DiamondDivider className="mt-9" />

        <div
          className="grid items-start rs-stack"
          style={{ marginTop: 64, gridTemplateColumns: "5fr 7fr", gap: 64 }}
        >
          <div>
            <p
              className="uppercase font-sans"
              style={{ fontSize: 11, letterSpacing: "0.3em", color: LAV_DEEP, margin: "0 0 14px" }}
            >
              Venue address
            </p>
            <p
              className="font-serif italic"
              style={{ fontSize: 28, color: INK, margin: "0 0 8px", lineHeight: 1.3 }}
            >
              Sparks&rsquo; Barn
            </p>
            <p
              className="font-sans"
              style={{ fontSize: 16, lineHeight: 1.7, color: BODY, margin: 0 }}
            >
              13817 108th St
              <br />
              Louisville, NE 68037
            </p>
            <a
              href={SITE.mapLink}
              target="_blank"
              rel="noopener"
              className="mt-6 inline-block uppercase font-sans"
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                color: LAV_DEEP,
                borderBottom: `1px solid ${LAV_DEEP}`,
                paddingBottom: 3,
              }}
            >
              Open in maps →
            </a>
          </div>
          <div
            style={{
              aspectRatio: "16 / 7",
              background: "#EFE9DD",
              border: "1px solid #C9BB9F",
              overflow: "hidden",
            }}
          >
            <iframe
              src={SITE.mapEmbed}
              title="Sparks' Barn on the map"
              className="w-full h-full"
              style={{ border: 0, filter: "grayscale(0.2) sepia(0.1)" }}
              loading="lazy"
            />
          </div>
        </div>

        <div style={{ marginTop: 72 }}>
          <p
            className="uppercase font-sans"
            style={{ fontSize: 11, letterSpacing: "0.3em", color: LAV_DEEP, margin: "0 0 10px" }}
          >
            Where to stay
          </p>
          <p
            className="font-sans"
            style={{ fontSize: 16, lineHeight: 1.75, color: BODY, maxWidth: 760, margin: "0 0 40px" }}
          >
            We haven&rsquo;t blocked rooms anywhere. Most out-of-town guests stay in Lincoln or
            Omaha, here are well-known options in each area.
          </p>
          <div className="grid rs-stack-3" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 48 }}>
            {HOTELS.map((group) => (
              <div key={group.area}>
                <p
                  className="font-serif italic"
                  style={{ fontSize: 22, color: INK, margin: "0 0 4px" }}
                >
                  {group.area}
                </p>
                <p
                  className="uppercase font-sans"
                  style={{ fontSize: 10, letterSpacing: "0.2em", color: TAN, margin: "0 0 20px" }}
                >
                  {group.drive}
                </p>
                {group.items.map((h) => (
                  <div
                    key={h.name}
                    className="border-t"
                    style={{ padding: "14px 0", borderColor: HAIRLINE }}
                  >
                    <p className="font-sans" style={{ fontSize: 15, color: INK, margin: 0 }}>
                      {h.name}
                    </p>
                    <p
                      className="font-sans"
                      style={{ fontSize: 12, color: TAN_DEEP, margin: "4px 0 0" }}
                    >
                      {h.city}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div
          className="grid border-t rs-stack-2"
          style={{
            marginTop: 72,
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
            paddingTop: 48,
            borderColor: HAIRLINE,
          }}
        >
          <div>
            <p
              className="uppercase font-sans"
              style={{ fontSize: 11, letterSpacing: "0.3em", color: LAV_DEEP, margin: "0 0 10px" }}
            >
              Parking
            </p>
            <p
              className="font-sans"
              style={{ fontSize: 16, lineHeight: 1.75, color: BODY, margin: 0 }}
            >
              Free on-site parking. You can leave a car overnight if you&rsquo;re getting a ride home.
            </p>
          </div>
          <div>
            <p
              className="uppercase font-sans"
              style={{ fontSize: 11, letterSpacing: "0.3em", color: LAV_DEEP, margin: "0 0 10px" }}
            >
              What to pack
            </p>
            <p
              className="font-sans"
              style={{ fontSize: 16, lineHeight: 1.75, color: BODY, margin: 0 }}
            >
              The ceremony is outdoors and the barn cools off fast after sunset. Bring a light
              jacket or wrap and shoes you can walk on grass in.
            </p>
          </div>
        </div>
      </section>

      {/* ============ PHOTOS ============ */}
      <section
        id="photos"
        className="border-t rs-section"
        style={{
          padding: "100px 64px",
          maxWidth: 1500,
          margin: "0 auto",
          borderColor: HAIRLINE,
        }}
      >
        <SectionHeader
          eyebrow="VI · Photos"
          title="Photos"
          subhead="A shared gallery, coming after the wedding. We'll open uploads closer to the day."
        />
        <DiamondDivider className="mt-9" />

        <div className="grid rs-stack" style={{ marginTop: 64, gridTemplateColumns: "5fr 7fr", gap: 64 }}>
          <div className="flex flex-col justify-center">
            <span
              className="flex-shrink-0"
              style={{ width: 10, height: 10, background: LAV, transform: "rotate(45deg)" }}
            />
            <p
              className="font-serif italic"
              style={{ fontSize: 30, color: INK, margin: "24px 0 0", lineHeight: 1.3 }}
            >
              Photos will appear here after the wedding.
            </p>
            <p
              className="font-sans"
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                color: SOFT,
                margin: "20px 0 0",
                maxWidth: 420,
              }}
            >
              In the meantime, this is exactly where the upload form lives, so guests can start
              sending photos the moment they take them.
            </p>
          </div>
          <form
            className="border"
            style={{ padding: 40, borderColor: HAIRLINE }}
            aria-labelledby="photo-share-heading"
            onSubmit={(e) => e.preventDefault()}
          >
            <p
              id="photo-share-heading"
              className="uppercase font-sans"
              style={{ fontSize: 11, letterSpacing: "0.3em", color: LAV_DEEP, margin: "0 0 10px" }}
            >
              Share a photo
            </p>
            <p
              className="font-sans"
              style={{ fontSize: 14, lineHeight: 1.7, color: SOFT, margin: "0 0 26px" }}
            >
              Up to 5 images, JPG or PNG, 10 MB each. Nothing goes public until we approve it.
            </p>
            <div className="grid rs-stack-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <label
                  htmlFor="photo-name"
                  className="block uppercase font-sans"
                  style={{ fontSize: 10, letterSpacing: "0.2em", color: "#6B5F49", margin: "0 0 8px" }}
                >
                  Your name
                </label>
                <input
                  id="photo-name"
                  type="text"
                  disabled
                  autoComplete="name"
                  style={{
                    width: "100%",
                    height: 30,
                    border: "none",
                    borderBottom: `1px solid ${TAN}`,
                    background: "transparent",
                    fontFamily: "Cormorant, serif",
                    fontSize: 17,
                    color: INK,
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="photo-email"
                  className="block uppercase font-sans"
                  style={{ fontSize: 10, letterSpacing: "0.2em", color: "#6B5F49", margin: "0 0 8px" }}
                >
                  Email (optional)
                </label>
                <input
                  id="photo-email"
                  type="email"
                  disabled
                  autoComplete="email"
                  style={{
                    width: "100%",
                    height: 30,
                    border: "none",
                    borderBottom: `1px solid ${TAN}`,
                    background: "transparent",
                    fontFamily: "Cormorant, serif",
                    fontSize: 17,
                    color: INK,
                  }}
                />
              </div>
            </div>
            <label
              htmlFor="photo-caption"
              className="block uppercase font-sans"
              style={{ fontSize: 10, letterSpacing: "0.2em", color: "#6B5F49", margin: "0 0 8px" }}
            >
              Caption (optional)
            </label>
            <input
              id="photo-caption"
              type="text"
              disabled
              style={{
                width: "100%",
                height: 30,
                border: "none",
                borderBottom: `1px solid ${TAN}`,
                background: "transparent",
                fontFamily: "Cormorant, serif",
                fontSize: 17,
                color: INK,
                marginBottom: 20,
              }}
            />
            <div
              className="text-center"
              style={{
                border: "1px dashed #C9BB9F",
                background: "#EFE9DD",
                padding: 26,
                marginBottom: 22,
              }}
              aria-hidden="true"
            >
              <span
                className="uppercase font-sans"
                style={{ fontSize: 11, letterSpacing: "0.2em", color: "#6B5F49" }}
              >
                Choose photos
              </span>
            </div>
            <button
              type="submit"
              className="block w-full text-center uppercase font-sans"
              style={{
                background: INK,
                color: IVORY,
                padding: "15px 0",
                fontSize: 11,
                letterSpacing: "0.24em",
                border: "none",
                cursor: "not-allowed",
                opacity: 0.7,
              }}
              aria-label="Upload photo — not yet available, opens closer to the wedding"
              disabled
            >
              Upload
            </button>
            <p
              className="font-sans"
              style={{ fontSize: 12, color: SOFT, marginTop: 12, textAlign: "center" }}
            >
              Uploads open closer to the wedding.
            </p>
          </form>
        </div>
      </section>

      {/* ============ REGISTRY ============ */}
      <section
        id="registry"
        className="border-t rs-section"
        style={{
          padding: "100px 64px",
          maxWidth: 1500,
          margin: "0 auto",
          borderColor: HAIRLINE,
        }}
      >
        <SectionHeader
          eyebrow="VII · Registry"
          title="Registry"
          subhead="Your presence is the gift. If you'd like to do more, these are the places we've registered."
        />
        <DiamondDivider className="mt-9" />

        <div className="grid rs-stack-4" style={{ marginTop: 64, gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {REGISTRY.map((r) => {
            const lead = r.lead === true;
            const bg = lead ? "#EAE3F1" : IVORY;
            const borderColor = lead ? LAV_DEEP : HAIRLINE;
            const dotColor = lead ? LAV_DEEP : TAN;
            const dotSize = lead ? 8 : 6;
            const titleSize = lead ? 32 : 26;
            return (
              <div
                key={r.name}
                className="flex flex-col border"
                style={{ padding: "40px 32px", background: bg, borderColor }}
              >
                <span
                  className="flex-shrink-0"
                  style={{
                    width: dotSize,
                    height: dotSize,
                    background: dotColor,
                    transform: "rotate(45deg)",
                  }}
                />
                <p
                  className="font-serif italic"
                  style={{ fontSize: titleSize, color: INK, margin: "22px 0 0" }}
                >
                  {r.name}
                </p>
                <p
                  className="font-sans"
                  style={{ fontSize: 14, lineHeight: 1.7, color: BODY, margin: "16px 0 0", flex: 1 }}
                >
                  {r.note}
                </p>
                {r.href ? (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener"
                    className="uppercase font-sans"
                    style={
                      lead
                        ? {
                            display: "inline-block",
                            textAlign: "center",
                            marginTop: 24,
                            background: INK,
                            color: IVORY,
                            padding: "14px 0",
                            fontSize: 10,
                            letterSpacing: "0.24em",
                            border: `1px solid ${INK}`,
                          }
                        : {
                            display: "inline-block",
                            alignSelf: "flex-start",
                            marginTop: 24,
                            fontSize: 10,
                            letterSpacing: "0.2em",
                            color: LAV_DEEP,
                            borderBottom: `1px solid ${LAV_DEEP}`,
                            paddingBottom: 3,
                          }
                    }
                  >
                    {r.cta ?? "Visit"}
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="border-t" style={{ borderColor: HAIRLINE }}>
        <div
          style={{
            padding: "100px 64px",
            maxWidth: 1500,
            margin: "0 auto",
          }}
        >
          <SectionHeader
            eyebrow="VIII · FAQ"
            title="FAQ"
            subhead="The questions we've been getting most."
          />
          <DiamondDivider className="mt-9" />

          <div className="grid" style={{ marginTop: 60, gridTemplateColumns: "1fr 1fr", gap: 64 }}>
            {(
              [
                { title: "Logistics", items: FAQ_LOGISTICS },
                { title: "Attire & guests", items: FAQ_GUESTS },
              ] as const
            ).map((col) => (
              <div key={col.title}>
                <p
                  className="uppercase font-sans"
                  style={{ fontSize: 11, letterSpacing: "0.3em", color: LAV_DEEP, margin: "0 0 8px" }}
                >
                  {col.title}
                </p>
                {col.items.map((item, i) => (
                  <details
                    key={i}
                    data-anim
                    className="border-t"
                    style={{ padding: "20px 0", borderColor: HAIRLINE }}
                    open={item.open}
                  >
                    <summary
                      className="flex justify-between gap-5 cursor-pointer font-serif italic"
                      style={{ fontSize: 21, color: INK }}
                    >
                      {item.q}
                      <span
                        aria-hidden
                        className="chev flex-shrink-0"
                        style={{
                          width: 6,
                          height: 6,
                          background: LAV,
                          transform: "rotate(45deg)",
                          marginTop: 9,
                        }}
                      />
                    </summary>
                    <div className="faq-body">
                      <p
                        className="font-sans"
                        style={{ fontSize: 15, lineHeight: 1.75, color: BODY, margin: "14px 0 0" }}
                      >
                        {item.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            ))}
          </div>
          <p
            className="text-center font-serif italic"
            style={{ marginTop: 56, fontSize: 16, color: SOFT }}
          >
            Still have a question? Text Addi or Geo directly, we&rsquo;ll get you sorted.
          </p>
        </div>

        {/* Closing CTA */}
        <div className="text-center" style={{ padding: "130px 64px", background: "#EAE3F1" }}>
          <p
            className="uppercase font-sans"
            style={{ fontSize: 12, letterSpacing: "0.4em", color: LAV_DEEP, margin: "0 0 26px" }}
          >
            See you soon
          </p>
          <h2
            className="font-serif italic mx-auto"
            style={{
              fontWeight: 500,
              fontSize: "clamp(32px, 6vw, 60px)",
              color: INK,
              margin: 0,
              maxWidth: 720,
              lineHeight: 1.15,
            }}
          >
            Won&rsquo;t be the same without you.
          </h2>
          <div style={{ marginTop: 44 }}>
            <Link
              to="/rsvp"
              search={{}}
              className="inline-block uppercase font-sans"
              style={{
                background: INK,
                color: IVORY,
                padding: "19px 44px",
                fontSize: 12,
                letterSpacing: "0.3em",
                border: `1px solid ${INK}`,
              }}
            >
              RSVP now
            </Link>
          </div>
          <p
            className="uppercase font-sans"
            style={{ margin: "26px 0 0", fontSize: 11, letterSpacing: "0.24em", color: SOFT }}
          >
            Please respond by September 15, 2026
          </p>
        </div>
      </section>
    </div>
  );
}
