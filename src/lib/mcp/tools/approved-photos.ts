import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { PHOTO_SIGNED_URL_TTL_SECONDS } from "@/lib/photo-config";

export default defineTool({
  name: "get_approved_photos",
  title: "Approved guest photos",
  description:
    "List approved guest photos with signed image URLs and captions. Limit defaults to 12 (max 30).",
  inputSchema: {
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("How many photos to return (default 12, max 30)."),
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
      return {
        content: [{ type: "text", text: `Could not load photos: ${error.message}` }],
        isError: true,
      };
    }
    const signedRows = await Promise.all(
      (data ?? []).map(async (row) => {
        const { data: signed } = await sb.storage
          .from("guest-photos")
          .createSignedUrl(row.storage_path, PHOTO_SIGNED_URL_TTL_SECONDS);
        return signed?.signedUrl
          ? {
              id: row.id,
              url: signed.signedUrl,
              caption: row.caption,
              uploader: row.uploader_name,
              createdAt: row.created_at,
            }
          : null;
      }),
    );
    const items = signedRows.filter((r): r is NonNullable<typeof r> => r !== null);
    return {
      content: [{ type: "text", text: JSON.stringify(items) }],
      structuredContent: { items, count: items.length },
    };
  },
});
