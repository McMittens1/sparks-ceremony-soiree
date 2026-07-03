import { createFileRoute } from "@tanstack/react-router";

// Static climatology for Louisville, NE early October, plus civil sunset ~6:53pm CDT on Oct 10.
// Cheap, deterministic, no network dependency. NWS API can be wired in later if forecast window opens.
export const Route = createFileRoute("/api/public/weather")({
  server: {
    handlers: {
      GET: async () => {
        const body = {
          highF: 71,
          lowF: 45,
          precipPct: 22,
          sunset: "6:53 PM",
        };
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
