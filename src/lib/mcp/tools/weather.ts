import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_weather_forecast",
  title: "Wedding-day weather",
  description: "Typical early-October forecast for the venue area: high, low, chance of rain, sunset.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: () => {
    // Same static climatology as /api/public/weather.
    const payload = { highF: 71, lowF: 45, precipPct: 22, sunset: "6:53 PM" };
    return {
      content: [
        {
          type: "text",
          text: `Typical early October: high ${payload.highF}°F, low ${payload.lowF}°F, ${payload.precipPct}% chance of rain, sunset ${payload.sunset}.`,
        },
      ],
      structuredContent: payload,
    };
  },
});
