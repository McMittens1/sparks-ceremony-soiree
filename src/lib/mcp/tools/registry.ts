import { defineTool } from "@lovable.dev/mcp-js";

const REGISTRY = [
  { name: "Zola", url: "https://zola.com", note: "Main registry — dishes, linens, the boring good stuff." },
  { name: "Honeymoon Fund", url: null, note: "A weekend somewhere warm after the barn cools down." },
  { name: "Local charity", url: null, note: "In lieu of a gift, a Lincoln food bank we care about." },
];

export default defineTool({
  name: "get_registry_links",
  title: "Registry",
  description: "Where the couple is registered, including honeymoon fund and charity options.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(REGISTRY) }],
    structuredContent: { items: REGISTRY },
  }),
});
