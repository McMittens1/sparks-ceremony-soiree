import { defineTool } from "@lovable.dev/mcp-js";

const PARTY = [
  { name: "Maria S.", role: "Maid of Honor" },
  { name: "Jordan T.", role: "Best Man" },
  { name: "Ashley R.", role: "Bridesmaid" },
  { name: "Sam L.", role: "Groomsman" },
  { name: "Priya N.", role: "Bridesmaid" },
  { name: "Diego M.", role: "Groomsman" },
];

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
