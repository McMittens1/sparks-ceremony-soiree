import { useEffect, useState } from "react";
import { DiamondDivider } from "@/components/site/DiamondDivider";
import { SectionHeader } from "@/components/site/SectionHeader";
import { BodyProse, DisplayHeading, Eyebrow } from "@/components/site/typography";
import { HOTELS } from "@/lib/wedding-data";
import { SITE } from "@/lib/site";

interface WeatherData {
  highF: number;
  lowF: number;
  precipPct: number;
  sunset: string;
  isForecast: boolean;
}

export function TravelSection() {
  const [copied, setCopied] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SITE.address)}`;
  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(SITE.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/weather")
      .then((r) => (r.ok ? (r.json() as Promise<WeatherData>) : null))
      .then((data) => {
        if (!cancelled && data) setWeather(data);
      })
      .catch(() => {
        /* leave the loading state as-is — no data is safer than broken data */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <section id="travel" className="border-t border-hairline rs-section">
      <SectionHeader
        eyebrow="V · Getting There"
        title="Getting There"
        subhead="Sparks' Barn is in Louisville, Nebraska, about 25 minutes south of Omaha and 40 minutes east of Lincoln."
      />
      <DiamondDivider className="mt-9" />

      <div className="grid items-start rs-stack" style={{ marginTop: 64 }}>
        <div>
          <Eyebrow color="lavender-deep" style={{ marginBottom: 14 }}>
            Venue address
          </Eyebrow>
          <DisplayHeading
            as="h3"
            size="sm"
            italic
            style={{ margin: "0 0 8px", fontSize: 28, lineHeight: 1.3 }}
          >
            Sparks&rsquo; Barn
          </DisplayHeading>
          <p
            className="font-sans text-ink-body"
            style={{ fontSize: 16, lineHeight: 1.7, margin: 0 }}
          >
            13817 108th St
            <br />
            Louisville, NE 68037
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener"
              className="uppercase font-sans"
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "var(--color-ivory)",
                background: "var(--color-lavender-deep)",
                padding: "10px 16px",
              }}
            >
              Get directions →
            </a>
            <button
              type="button"
              onClick={copyAddress}
              className="uppercase font-sans"
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "var(--color-lavender-deep)",
                border: "1px solid var(--color-lavender-deep)",
                background: "transparent",
                padding: "10px 16px",
              }}
              aria-live="polite"
            >
              {copied ? "Copied ✓" : "Copy address"}
            </button>
            <a
              href={SITE.mapLink}
              target="_blank"
              rel="noopener"
              className="uppercase font-sans self-center"
              style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--color-tan-deep)" }}
            >
              Open in maps →
            </a>
          </div>
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
        <Eyebrow color="lavender-deep" style={{ marginBottom: 10 }}>
          Where to stay
        </Eyebrow>
        <BodyProse maxWidth={760} style={{ margin: "0 0 40px", fontSize: 16, lineHeight: 1.75 }}>
          We haven&rsquo;t blocked rooms anywhere. Most out-of-town guests stay in Lincoln or Omaha,
          here are well-known options in each area.
        </BodyProse>
        <div className="grid rs-stack-3">
          {HOTELS.map((group) => (
            <div key={group.area}>
              <p className="font-serif italic text-ink" style={{ fontSize: 22, margin: "0 0 4px" }}>
                {group.area}
              </p>
              <Eyebrow color="tan" size="sm" style={{ marginBottom: 20, letterSpacing: "0.2em" }}>
                {group.drive}
              </Eyebrow>
              {group.items.map((h) => (
                <div
                  key={h.name}
                  className="border-t border-hairline"
                  style={{ padding: "14px 0" }}
                >
                  <p className="font-sans text-ink" style={{ fontSize: 15, margin: 0 }}>
                    {h.name}
                  </p>
                  <p
                    className="font-sans text-tan-deep"
                    style={{ fontSize: 12, margin: "4px 0 0" }}
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
        className="grid border-t border-hairline rs-stack-2"
        style={{ marginTop: 72, paddingTop: 48 }}
      >
        <div>
          <Eyebrow color="lavender-deep" style={{ marginBottom: 10 }}>
            Parking
          </Eyebrow>
          <BodyProse style={{ fontSize: 16, lineHeight: 1.75 }}>
            Free on-site parking. You can leave a car overnight if you&rsquo;re getting a ride home.
          </BodyProse>
        </div>
        <div>
          <Eyebrow color="lavender-deep" style={{ marginBottom: 10 }}>
            What to pack
          </Eyebrow>
          {weather ? (
            <div style={{ marginBottom: 12 }}>
              <span
                className="uppercase font-sans"
                style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--color-tan-deep)" }}
              >
                {weather.isForecast ? "Live forecast" : "Typical early October"}
              </span>
              <p className="font-sans text-ink" style={{ fontSize: 15, margin: "4px 0 0" }}>
                High {weather.highF}°F · Low {weather.lowF}°F · {weather.precipPct}% chance of rain
                · Sunset {weather.sunset}
              </p>
            </div>
          ) : (
            <p
              className="font-sans"
              style={{ fontSize: 13, color: "var(--color-tan-deep)", marginBottom: 12 }}
            >
              Checking the forecast…
            </p>
          )}
          <BodyProse style={{ fontSize: 16, lineHeight: 1.75 }}>
            The ceremony is outdoors and the barn cools off fast after sunset. Bring a light jacket
            or wrap and shoes you can walk on grass in.
          </BodyProse>
        </div>
      </div>
    </section>
  );
}
