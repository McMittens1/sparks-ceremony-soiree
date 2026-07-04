import { defineTool } from "@lovable.dev/mcp-js";
import { SITE } from "@/lib/site";

export default defineTool({
  name: "get_countdown",
  title: "Days until the wedding",
  description: "Returns how many days remain until the wedding date.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: () => {
    const now = Date.now();
    const then = new Date(SITE.eventDate).getTime();
    const days = Math.max(0, Math.ceil((then - now) / (1000 * 60 * 60 * 24)));
    return {
      content: [{ type: "text", text: `${days} days until ${SITE.eventDatePretty.en}` }],
      structuredContent: { days, eventDate: SITE.eventDate },
    };
  },
});
