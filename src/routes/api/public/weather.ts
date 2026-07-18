import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/lib/site";

// Static climatology for Louisville, NE early October, plus civil sunset ~6:53pm CDT on Oct 10.
// Always used outside the NWS forecast window (see NWS_WINDOW_DAYS below), and used as the
// fallback whenever the live fetch fails or returns something unexpected.
const CLIMATOLOGY = { highF: 71, lowF: 45, precipPct: 22, sunset: "6:53 PM", isForecast: false };

type WeatherPayload = typeof CLIMATOLOGY;

const EVENT_DATE_ISO = SITE.eventDate.slice(0, 10);
// Approximate coordinates for Louisville, NE (the venue's town) — NWS forecast
// grid cells are ~2.5km, so town-center precision is plenty for a high/low/
// rain-chance summary.
const VENUE_LAT = 41.009;
const VENUE_LON = -96.161;
// api.weather.gov only publishes real forecast periods roughly 7 days out
// (occasionally reaching ~9 in the extended periods) — asking earlier than
// that would just return periods that don't cover Oct 10 yet, so we skip the
// request entirely and stay on climatology until we're inside the window.
const NWS_WINDOW_DAYS = 9;
const NWS_USER_AGENT = `${new URL(SITE.siteUrl).hostname} wedding-day weather widget`;

async function fetchNwsForecast(): Promise<WeatherPayload | null> {
  try {
    const pointsRes = await fetch(`https://api.weather.gov/points/${VENUE_LAT},${VENUE_LON}`, {
      headers: { "User-Agent": NWS_USER_AGENT, Accept: "application/geo+json" },
    });
    if (!pointsRes.ok) return null;
    const points = (await pointsRes.json()) as { properties?: { forecast?: string } };
    const forecastUrl = points.properties?.forecast;
    if (!forecastUrl) return null;

    const forecastRes = await fetch(forecastUrl, {
      headers: { "User-Agent": NWS_USER_AGENT, Accept: "application/geo+json" },
    });
    if (!forecastRes.ok) return null;
    const forecast = (await forecastRes.json()) as {
      properties?: {
        periods?: Array<{
          startTime?: string;
          isDaytime?: boolean;
          temperature?: number;
          probabilityOfPrecipitation?: { value?: number | null };
        }>;
      };
    };
    const periods = forecast.properties?.periods ?? [];

    // NWS periods carry startTime with the local UTC offset already applied
    // (e.g. "2026-10-10T06:00:00-05:00"), so the date portion directly gives
    // the local calendar date the period covers.
    const isEventDay = (startTime: string | undefined) =>
      (startTime ?? "").slice(0, 10) === EVENT_DATE_ISO;
    const day = periods.find((p) => isEventDay(p.startTime) && p.isDaytime);
    const night = periods.find((p) => isEventDay(p.startTime) && !p.isDaytime);
    if (!day || typeof day.temperature !== "number") return null;

    return {
      highF: day.temperature,
      lowF: typeof night?.temperature === "number" ? night.temperature : CLIMATOLOGY.lowF,
      precipPct:
        typeof day.probabilityOfPrecipitation?.value === "number"
          ? day.probabilityOfPrecipitation.value
          : CLIMATOLOGY.precipPct,
      // NWS doesn't publish sunset time — keep the precomputed civil sunset.
      sunset: CLIMATOLOGY.sunset,
      isForecast: true,
    };
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/weather")({
  server: {
    handlers: {
      GET: async () => {
        const daysUntil = (new Date(SITE.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        let body: WeatherPayload = CLIMATOLOGY;
        if (daysUntil >= 0 && daysUntil <= NWS_WINDOW_DAYS) {
          body = (await fetchNwsForecast()) ?? CLIMATOLOGY;
        }
        return new Response(JSON.stringify(body), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
