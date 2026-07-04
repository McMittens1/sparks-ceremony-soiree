import { defineTool } from "@lovable.dev/mcp-js";
import { dictionaries } from "@/i18n/dictionaries";

export default defineTool({
  name: "get_schedule",
  title: "Day-of schedule",
  description: "Timeline of the wedding day (ceremony, cocktail hour, dinner, dancing, send-off).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const schedule = dictionaries.en.details.schedule;
    return {
      content: [{ type: "text", text: JSON.stringify(schedule) }],
      structuredContent: { schedule },
    };
  },
});
