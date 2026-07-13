import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";
import favorite from "@/assets/engagement/Favorite.jpg.asset.json";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms % 86_400_000) / 3_600_000),
    m: Math.floor((ms % 3_600_000) / 60_000),
    s: Math.floor((ms % 60_000) / 1000),
  };
}
const pad = (n: number | null) => (n === null ? "--" : String(n).padStart(2, "0"));

function HeroCountdown() {
  const target = new Date(SITE.eventDate).getTime();
  const [tick, setTick] = useState<ReturnType<typeof diff> | null>(null);
  useEffect(() => {
    setTick(diff(target));
    const id = setInterval(() => setTick(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  const items: [string, string][] = [
    [pad(tick?.d ?? null), "Days"],
    [pad(tick?.h ?? null), "Hrs"],
    [pad(tick?.m ?? null), "Min"],
    [pad(tick?.s ?? null), "Sec"],
  ];
  return (
    <div
      className="md:hidden"
      style={{ marginTop: "clamp(24px, 4cqh, 36px)" }}
      aria-label="Countdown to the wedding"
    >
      <p
        className="uppercase font-sans text-tan"
        style={{
          fontSize: 9,
          letterSpacing: "0.42em",
          margin: "0 0 14px",
        }}
      >
        Counting Down
      </p>
      <div
        className="grid grid-cols-4"
        style={{
          borderTop: "1px solid rgba(42,37,32,0.18)",
          borderBottom: "1px solid rgba(42,37,32,0.18)",
        }}
      >
        {items.map(([val, label], i) => (
          <div
            key={label}
            className="text-center"
            style={{
              padding: "14px 4px 12px",
              borderLeft: i === 0 ? undefined : "1px solid rgba(42,37,32,0.14)",
            }}
          >
            <div
              className="font-serif tabular-nums text-ink"
              style={{ fontWeight: 500, fontSize: "clamp(30px, 8vw, 40px)", lineHeight: 1 }}
            >
              {val}
            </div>
            <p
              className="uppercase text-tan-deep"
              style={{ fontSize: 9, letterSpacing: "0.24em", marginTop: 8 }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
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
          className="flex flex-col justify-center min-w-0 rs-hero-text text-center md:text-left"
          style={{ flex: "0 1 440px" }}
        >
          <p
            className="uppercase font-sans text-tan"
            style={{
              fontSize: "clamp(9px, 1.3cqh, 12px)",
              letterSpacing: "0.42em",
              margin: "0 0 clamp(10px, 2cqh, 22px)",
            }}
          >
            The Wedding Of
          </p>
          <h1 style={{ margin: 0, fontWeight: "normal" }}>
            <div
              className="font-serif rs-hero-title text-ink"
              style={{
                fontWeight: 500,
                fontSize: "clamp(30px, 9.5cqh, 92px)",
                lineHeight: 1,
              }}
            >
              Geovanni
            </div>
            <div
              className="font-serif rs-hero-title text-ink"
              style={{
                fontWeight: 500,
                fontSize: "clamp(30px, 9.5cqh, 92px)",
                lineHeight: 1.05,
                marginTop: "clamp(2px, 0.6cqh, 8px)",
              }}
            >
              <span className="italic text-lavender">&amp;</span> Addison
            </div>
          </h1>
          <p
            className="font-serif italic text-lavender-deep"
            style={{
              margin: "clamp(14px, 3cqh, 32px) 0 0",
              fontSize: "clamp(15px, 2.6cqh, 24px)",
            }}
          >
            October 10, 2026
          </p>
          <p
            className="uppercase font-sans text-ink-body"
            style={{
              margin: "clamp(4px, 1cqh, 10px) 0 0",
              fontSize: "clamp(10px, 1.3cqh, 13px)",
              letterSpacing: "0.22em",
            }}
          >
            Sparks&rsquo; Barn <span className="text-tan">·</span> Louisville, NE
          </p>
          <div
            className="flex items-center flex-wrap justify-center md:justify-start"
            style={{
              marginTop: "clamp(16px, 3cqh, 32px)",
              gap: "clamp(16px, 2.5cqw, 26px)",
            }}
          >
            <Link
              to="/rsvp"
              search={{}}
              className="inline-block uppercase font-sans bg-ink text-ivory border border-ink"
              style={{
                padding: "clamp(10px, 1.8cqh, 16px) clamp(20px, 3cqw, 32px)",
                fontSize: "clamp(9px, 1.3cqh, 11px)",
                letterSpacing: "0.26em",
              }}
            >
              RSVP now
            </Link>
            <a
              href="#day"
              className="uppercase font-sans text-lavender-deep border-b border-lavender-deep"
              style={{
                fontSize: "clamp(9px, 1.2cqh, 11px)",
                letterSpacing: "0.2em",
                paddingBottom: 2,
              }}
            >
              See details
            </a>
          </div>
          <HeroCountdown />
        </div>

      </div>
    </section>
  );
}
