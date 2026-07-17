import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { hasAdminRole } from "@/lib/admin.functions";

// Uses the caller's own RLS-scoped client (attached by requireSupabaseAuth), not
// the service-role client — enforced both here and by the matching
// "has_role(auth.uid(), 'admin')" RLS policy on feature_flags.
async function ensureAdmin(sb: SupabaseClient<Database>, userId: string) {
  if (!(await hasAdminRole(sb, userId))) throw new Error("Forbidden");
  return sb;
}

export interface FeatureFlag {
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  updated_at: string;
}

// Shared single-flag lookup for server-side gating (submitRsvp,
// uploadGuestPhotos, etc.) — not a createServerFn, just a plain helper so
// callers don't each hand-roll the same "select enabled where key = ..."
// query under a differently-named wrapper.
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("feature_flags")
    .select("enabled")
    .eq("key", key)
    .maybeSingle();
  return data?.enabled ?? false;
}

export const getFeatureFlags = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeatureFlag[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("feature_flags")
      .select("key, label, description, enabled, updated_at")
      .order("label", { ascending: true });
    return data ?? [];
  },
);

export const setFeatureFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { changes: { key: string; enabled: boolean }[] }) =>
    z
      .object({
        changes: z
          .array(
            z.object({
              key: z.string().min(1).max(100),
              enabled: z.boolean(),
            }),
          )
          .min(1)
          .max(50),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    for (const change of data.changes) {
      const { error } = await sb
        .from("feature_flags")
        .update({ enabled: change.enabled })
        .eq("key", change.key);
      if (error) {
        console.error("setFeatureFlags update failed", error);
        throw new Error("Couldn't save that change. Please try again.");
      }
    }
    return { ok: true };
  });
