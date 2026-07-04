import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SITE } from "@/lib/site";

export default defineTool({
  name: "get_wedding_info",
  title: "Get wedding info",
  description: "Get the couple, wedding date, venue, and location details.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify({
          couple: SITE.couple,
          partnerA: SITE.partnerA,
          partnerB: SITE.partnerB,
          date: SITE.eventDatePretty.en,
          isoDate: SITE.eventDate,
          venue: SITE.venue,
          city: SITE.city,
        }),
      },
    ],
    structuredContent: {
      couple: SITE.couple,
      date: SITE.eventDatePretty.en,
      venue: SITE.venue,
      city: SITE.city,
    },
  }),
});

export const _z = z;
