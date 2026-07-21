import { defineTool } from "@lovable.dev/mcp-js";
import { DAY_SCHEDULE } from "@/lib/wedding-data";

export default defineTool({
  name: "get_schedule",
  title: "Day-of schedule",
  description: "Timeline of the wedding day, from guest arrival through the end of the night.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const schedule = DAY_SCHEDULE.map((s) => ({ time: s.time, label: s.label }));
    return {
      content: [{ type: "text", text: JSON.stringify(schedule) }],
      structuredContent: { schedule },
    };
  },
});
