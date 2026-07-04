import { defineTool } from "@lovable.dev/mcp-js";
import { dictionaries } from "@/i18n/dictionaries";

export default defineTool({
  name: "get_dress_code",
  title: "Dress code",
  description: "Attire guidance for guests.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const d = dictionaries.en.details;
    return {
      content: [{ type: "text", text: d.dressBody }],
      structuredContent: { title: d.dressTitle, body: d.dressBody },
    };
  },
});
