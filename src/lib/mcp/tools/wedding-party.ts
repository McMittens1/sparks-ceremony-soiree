import { defineTool } from "@lovable.dev/mcp-js";
import { PARTY } from "@/lib/wedding-data";
import { isFeatureEnabled } from "@/lib/feature-flags.functions";

export default defineTool({
  name: "get_wedding_party",
  title: "Wedding party",
  description: "Members of the wedding party and their roles.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  // Gated by the same `show_wedding_party` flag as the site section, so the
  // party isn't readable through the assistant while it's unpublished.
  handler: async () => {
    if (!(await isFeatureEnabled("show_wedding_party"))) {
      const text = "The wedding party hasn't been announced yet.";
      return { content: [{ type: "text" as const, text }], structuredContent: { members: [] } };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(PARTY) }],
      structuredContent: { members: PARTY },
    };
  },
});
