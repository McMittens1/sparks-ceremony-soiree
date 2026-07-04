import { defineTool } from "@lovable.dev/mcp-js";
import { SITE } from "@/lib/site";
import { dictionaries } from "@/i18n/dictionaries";

export default defineTool({
  name: "get_travel_info",
  title: "Travel & lodging",
  description: "Venue address, map link, hotel block, and parking notes.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const t = dictionaries.en.travel;
    const payload = {
      city: SITE.city,
      address: SITE.address,
      mapLink: SITE.mapLink,
      lead: t.lead,
      hotels: t.hotelsBody,
      parking: t.parkingBody,
      whatToPack: t.weatherAdvice,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
