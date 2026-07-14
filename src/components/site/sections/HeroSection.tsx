import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";
import heroPortrait from "@/assets/engagement/hero-portrait.png.asset.json";

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
      className="lg:hidden w-full mx-auto"
      style={{ maxWidth: 460, marginTop: "clamp(20px, 4svh, 40px)" }}
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
              style={{ fontWeight: 500, fontSize: "clamp(28px, 7vw, 40px)", lineHeight: 1 }}
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
        minHeight: "calc(100svh - var(--header-h, 64px))",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="flex-1 min-h-0 flex flex-col lg:flex-row items-center lg:items-stretch justify-center rs-hero-inner"
        style={{
          gap: "clamp(24px, 4vw, 72px)",
          padding: "clamp(32px, 6svh, 64px) clamp(20px, 5vw, 64px)",
          maxWidth: 1800,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          className="flex flex-col justify-center min-w-0 rs-hero-text text-center lg:text-left w-full"
          style={{ flex: "0 1 440px" }}
        >
          <div
            className="lg:hidden mx-auto"
            style={{
              width: "clamp(180px, 44vw, 300px)",
              marginBottom: "clamp(14px, 3svh, 26px)",
            }}
            aria-hidden="true"
          >
            <img
              src={heroPortrait.url}
              alt=""
              loading="eager"
              fetchPriority="high"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                display: "block",
                mixBlendMode: "multiply",
              }}
            />
          </div>
          <p
            className="uppercase font-sans text-tan"
            style={{
              fontSize: "clamp(9px, 1.2vw, 12px)",
              letterSpacing: "0.42em",
              margin: "0 0 clamp(12px, 2svh, 22px)",
            }}
          >
            The Wedding Of
          </p>
          <h1 style={{ margin: 0, fontWeight: "normal" }}>
            <div
              className="font-serif rs-hero-title text-ink"
              style={{
                fontWeight: 500,
                fontSize: "clamp(44px, 10vw, 92px)",
                lineHeight: 1,
              }}
            >
              Geovanni
            </div>
            <div
              className="font-serif rs-hero-title text-ink"
              style={{
                fontWeight: 500,
                fontSize: "clamp(44px, 10vw, 92px)",
                lineHeight: 1.05,
                marginTop: "clamp(2px, 0.6svh, 8px)",
              }}
            >
              <span className="italic text-lavender">&amp;</span> Addison
            </div>
          </h1>
          <p
            className="font-serif italic text-lavender-deep"
            style={{
              margin: "clamp(14px, 3svh, 32px) 0 0",
              fontSize: "clamp(17px, 2.4vw, 24px)",
            }}
          >
            October 10, 2026
          </p>
          <p
            className="uppercase font-sans text-ink-body"
            style={{
              margin: "clamp(6px, 1svh, 10px) 0 0",
              fontSize: "clamp(10px, 1.2vw, 13px)",
              letterSpacing: "0.22em",
            }}
          >
            Sparks&rsquo; Barn <span className="text-tan">·</span> Louisville, NE
          </p>
          <div
            className="flex items-center flex-wrap justify-center lg:justify-start"
            style={{
              marginTop: "clamp(20px, 3svh, 32px)",
              gap: "clamp(16px, 2.5vw, 26px)",
            }}
          >
            <Link
              to="/rsvp"
              search={{}}
              className="inline-block uppercase font-sans bg-ink text-ivory border border-ink"
              style={{
                padding: "clamp(12px, 1.6svh, 16px) clamp(22px, 3vw, 32px)",
                fontSize: "clamp(10px, 1.1vw, 11px)",
                letterSpacing: "0.26em",
              }}
            >
              RSVP now
            </Link>
            <a
              href="#day"
              className="uppercase font-sans text-lavender-deep border-b border-lavender-deep"
              style={{
                fontSize: "clamp(10px, 1.1vw, 11px)",
                letterSpacing: "0.2em",
                paddingBottom: 2,
              }}
            >
              See details
            </a>
          </div>
          <HeroCountdown />
        </div>

        <div
          className="rs-hero-image min-w-0 hidden lg:flex"
          style={{
            flex: "1 1 520px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={heroPortrait.url}
            alt="Pencil illustration of Geovanni Moreno and Addison Hillman"
            loading="eager"
            fetchPriority="high"
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "100%",
              objectFit: "contain",
              display: "block",
              mixBlendMode: "multiply",
            }}
          />
        </div>
      </div>
    </section>
  );
}
