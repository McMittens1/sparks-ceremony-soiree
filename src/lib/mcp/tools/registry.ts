import { defineTool } from "@lovable.dev/mcp-js";
import { REGISTRY } from "@/lib/wedding-data";

// Shape adapter: MCP consumers expect `url` (not `href`).
const items = REGISTRY.map((r) => ({ name: r.name, url: r.href, note: r.note }));

export default defineTool({
  name: "get_registry_links",
  title: "Registry",
  description: "Where the couple is registered, including honeymoon fund and charity options.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(items) }],
    structuredContent: { items },
  }),
});
