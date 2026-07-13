import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { FAQ_LOGISTICS, FAQ_GUESTS } from "@/lib/wedding-data";

export default defineTool({
  name: "get_faq",
  title: "Frequently asked questions",
  description: "List FAQ items about the wedding. Optional `search` filters by keyword (case-insensitive).",
  inputSchema: {
    search: z.string().optional().describe("Optional keyword to filter FAQ entries."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ search }) => {
    const all = [...FAQ_LOGISTICS, ...FAQ_GUESTS].map((it) => ({
      question: it.q,
      answer: it.a,
    }));
    const filtered = search
      ? all.filter((it) => {
          const q = search.toLowerCase();
          return it.question.toLowerCase().includes(q) || it.answer.toLowerCase().includes(q);
        })
      : all;
    return {
      content: [{ type: "text", text: JSON.stringify(filtered) }],
      structuredContent: { items: filtered, total: filtered.length },
    };
  },
});
