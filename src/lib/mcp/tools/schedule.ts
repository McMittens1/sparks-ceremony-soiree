import { defineTool } from "@lovable.dev/mcp-js";
import { DAY_SCHEDULE } from "@/lib/wedding-data";

export default defineTool({
  name: "get_schedule",
  title: "Day-of schedule",
  description:
    "Timeline of the wedding day (ceremony, reception, dancing), grouped by ceremony/reception/evening.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const schedule = DAY_SCHEDULE.flatMap((group) =>
      group.items.map((item) => ({ ...item, group: group.title })),
    );
    return {
      content: [{ type: "text", text: JSON.stringify(schedule) }],
      structuredContent: { schedule },
    };
  },
});
