import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";
import { SectionDivider } from "@/components/site/SectionDivider";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/travel")({
  head: () => ({ meta: [
    { title: "Travel · Geo & Partner" },
    { name: "description", content: "How to get to Sparks' Barn in Louisville, Nebraska — plus hotels, parking, and what to pack." },
    { property: "og:title", content: "Travel · Geo & Partner" },
    { property: "og:description", content: "Directions, hotels, parking, and weather for October 10, 2026." },
  ]}),
  component: Travel,
});

interface Weather {
  highF: number;
  lowF: number;
  precipPct: number;
  sunset: string;
}

function Travel() {
  const t = useT();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [wLoading, setWLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    fetch("/api/public/weather").then((r) => r.json()).then((d) => {
      if (!cancel) { setWeather(d); setWLoading(false); }
    }).catch(() => setWLoading(false));
    return () => { cancel = true; };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Louisville, NE</p>
        <h1 className="mt-2 font-serif text-5xl sm:text-6xl">{t.travel.title}</h1>
        <p className="mt-4 text-foreground/70 max-w-xl">{t.travel.lead}</p>
      </Reveal>

      <SectionDivider />

      <Reveal>
        <h2 className="font-serif text-2xl">{t.travel.mapTitle}</h2>
        <div className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-sm border border-border/60">
          <iframe
            title={t.travel.mapTitle}
            src={SITE.mapEmbed}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <a href={SITE.mapLink} target="_blank" rel="noopener" className="mt-3 inline-block text-sm text-primary underline underline-offset-4">
          Open in Google Maps →
        </a>
      </Reveal>

      <SectionDivider />

      <div className="grid gap-10 sm:grid-cols-2">
        <Reveal>
          <h3 className="font-serif text-2xl">{t.travel.hotelsTitle}</h3>
          <p className="mt-3 text-foreground/80 leading-relaxed">{t.travel.hotelsBody}</p>
        </Reveal>
        <Reveal delay={100}>
          <h3 className="font-serif text-2xl">{t.travel.parkingTitle}</h3>
          <p className="mt-3 text-foreground/80 leading-relaxed">{t.travel.parkingBody}</p>
        </Reveal>
      </div>

      <SectionDivider />

      <Reveal>
        <h3 className="font-serif text-2xl">{t.travel.weatherTitle}</h3>
        <div className="mt-6 rounded-sm border border-border/60 bg-card p-6 sm:p-8">
          {wLoading || !weather ? (
            <p className="text-sm text-muted-foreground">{t.travel.weatherLoading}</p>
          ) : (
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{t.travel.weatherAvg}</p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
                <Stat label={t.travel.weatherHigh} value={`${weather.highF}°F`} />
                <Stat label={t.travel.weatherLow} value={`${weather.lowF}°F`} />
                <Stat label={t.travel.weatherRain} value={`${weather.precipPct}%`} />
                <Stat label={t.travel.weatherSunset} value={weather.sunset} />
              </div>
              <p className="mt-6 text-sm text-foreground/80 leading-relaxed border-t border-border/60 pt-4">
                {t.travel.weatherAdvice}
              </p>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-serif text-3xl text-primary tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    </div>
  );
}
