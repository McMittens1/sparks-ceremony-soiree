import { Link } from "@tanstack/react-router";
import { Countdown, COUNTDOWN_HERO_VISIBLE } from "@/components/site/Countdown";
import heroPortrait from "@/assets/engagement/hero-portrait.png.asset.json";

const HERO_SRCSET = "/images/hero-portrait-600.webp 600w, /images/hero-portrait-1200.webp 1200w";
const HERO_SIZES = "(max-width: 1023px) 300px, 50vw";

function HeroImage({
  alt,
  className,
  style,
}: {
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <picture className={className} style={style}>
      <source srcSet={HERO_SRCSET} sizes={HERO_SIZES} type="image/webp" />
      <img
        src={heroPortrait.url}
        alt={alt}
        loading="eager"
        fetchPriority="high"
        width={1256}
        height={1024}
        style={{
          width: "100%",
          height: "auto",
          maxHeight: "100%",
          objectFit: "contain",
          display: "block",
          mixBlendMode: "multiply",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 55%, rgba(0,0,0,0.7) 72%, rgba(0,0,0,0.35) 86%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 55%, rgba(0,0,0,0.7) 72%, rgba(0,0,0,0.35) 86%, transparent 100%)",
        }}
      />
    </picture>
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
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, black 55%, rgba(0,0,0,0.7) 72%, rgba(0,0,0,0.35) 86%, transparent 100%)",
                maskImage:
                  "linear-gradient(to bottom, black 0%, black 55%, rgba(0,0,0,0.7) 72%, rgba(0,0,0,0.35) 86%, transparent 100%)",
              }}
            />
          </div>
          <p
            className="uppercase font-sans text-tan-deep"
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
              search={{ g: undefined, t: undefined }}
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
          <div
            className={`${COUNTDOWN_HERO_VISIBLE} w-full mx-auto`}
            style={{ maxWidth: 460, marginTop: "clamp(20px, 4svh, 40px)" }}
            aria-label="Countdown to the wedding"
          >
            <Countdown variant="hero" />
          </div>
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
            alt="Geovanni Moreno and Addison Hillman"
            loading="eager"
            fetchPriority="high"
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "100%",
              objectFit: "contain",
              display: "block",
              mixBlendMode: "multiply",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 55%, rgba(0,0,0,0.7) 72%, rgba(0,0,0,0.35) 86%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 55%, rgba(0,0,0,0.7) 72%, rgba(0,0,0,0.35) 86%, transparent 100%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
