import { Link } from "@tanstack/react-router";
import favorite from "@/assets/engagement/Favorite.jpg.asset.json";
import barnSunset from "@/assets/venue/sparks-barn-sunset.jpg.asset.json";

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
          className="flex flex-col justify-center min-w-0 rs-hero-text"
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
            className="flex items-center flex-wrap"
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
        </div>
        <div
          className="min-w-0 rs-hero-image"
          style={{ flex: "1 1 560px", padding: "clamp(20px, 4cqh, 40px) 0", boxSizing: "border-box" }}
        >
          <img
            src={favorite.url}
            alt="Geovanni and Addison"
            className="h-full w-full object-cover border border-hairline hero-image-reveal"
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
  );
}
