import { useEffect, useState } from "react";
import { DiamondDivider } from "@/components/site/DiamondDivider";
import { SectionHeader } from "@/components/site/SectionHeader";
import { BodyProse, Eyebrow } from "@/components/site/typography";
import { HOTELS } from "@/lib/wedding-data";

interface WeatherData {
  highF: number;
  lowF: number;
  precipPct: number;
  sunset: string;
  isForecast: boolean;
}

export function TravelSection() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
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
        eyebrow="V · Travel"
        title="Travel"
        subhead="Sparks' Barn is in Louisville, Nebraska, about 25 minutes south of Omaha and 40 minutes east of Lincoln. Here's what to know if you're coming from out of town."
      />
      <DiamondDivider className="mt-9" />

      <div style={{ marginTop: 64 }}>
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
        className="border-t border-hairline"
        style={{ marginTop: 72, paddingTop: 48, maxWidth: 640 }}
      >
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
              High {weather.highF}°F · Low {weather.lowF}°F · {weather.precipPct}% chance of rain ·
              Sunset {weather.sunset}
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
          The ceremony is outdoors and the barn cools off fast after sunset. Bring a light jacket or
          wrap and shoes you can walk on grass in.
        </BodyProse>
      </div>
    </section>
  );
}
