import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export default defineTool({
  name: "get_approved_photos",
  title: "Approved guest photos",
  description: "List approved guest photos with signed image URLs and captions. Limit defaults to 12 (max 30).",
  inputSchema: {
    limit: z.number().int().positive().optional().describe("How many photos to return (default 12, max 30)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async ({ limit }) => {
    const capped = Math.min(Math.max(limit ?? 12, 1), 30);
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return { content: [{ type: "text", text: "Photo store not configured." }], isError: true };
    }
    const sb = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("guest_photos")
      .select("id, storage_path, caption, uploader_name, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(capped);
    if (error) {
      return { content: [{ type: "text", text: `Could not load photos: ${error.message}` }], isError: true };
    }
    const items: Array<{ id: string; url: string; caption: string | null; uploader: string; createdAt: string }> = [];
    for (const row of data ?? []) {
      const { data: signed } = await sb.storage
        .from("guest-photos")
        .createSignedUrl(row.storage_path, 60 * 60);
      if (signed?.signedUrl) {
        items.push({
          id: row.id,
          url: signed.signedUrl,
          caption: row.caption,
          uploader: row.uploader_name,
          createdAt: row.created_at,
        });
      }
    }
    return {
      content: [{ type: "text", text: JSON.stringify(items) }],
      structuredContent: { items, count: items.length },
    };
  },
});
