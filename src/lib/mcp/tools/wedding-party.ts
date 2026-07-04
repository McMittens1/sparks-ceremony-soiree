import { defineTool } from "@lovable.dev/mcp-js";
import { PARTY } from "@/lib/wedding-data";

export default defineTool({
  name: "get_wedding_party",
  title: "Wedding party",
  description: "Members of the wedding party and their roles.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(PARTY) }],
    structuredContent: { members: PARTY },
  }),
});
