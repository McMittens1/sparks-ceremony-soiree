import { defineTool } from "@lovable.dev/mcp-js";
import { getRequest } from "@tanstack/react-start/server";

const FALLBACK = { highF: 71, lowF: 45, precipPct: 22, sunset: "6:53 PM" };

export default defineTool({
  name: "get_weather_forecast",
  title: "Wedding-day weather",
  description: "Typical early-October forecast for the venue area: high, low, chance of rain, sunset.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async () => {
    let payload: typeof FALLBACK = FALLBACK;
    try {
      const req = getRequest();
      const origin = new URL(req.url).origin;
      const res = await fetch(`${origin}/api/public/weather`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const body = (await res.json()) as Partial<typeof FALLBACK>;
        payload = { ...FALLBACK, ...body };
      }
    } catch {
      // fall back to climatology
    }
    const summary = `Typical early-October forecast for Louisville, NE: high ${payload.highF}°F, low ${payload.lowF}°F, ${payload.precipPct}% chance of rain, sunset ${payload.sunset}.`;
    return {
      content: [{ type: "text", text: summary }],
      structuredContent: payload,
    };
  },
});
