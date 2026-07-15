import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden");
  return supabaseAdmin;
}

export interface FeatureFlag {
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  updated_at: string;
}

export const getFeatureFlags = createServerFn({ method: "GET" })
  .handler(async (): Promise<FeatureFlag[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("feature_flags")
      .select("key, label, description, enabled, updated_at")
      .order("label", { ascending: true });
    return data ?? [];
  });

export const setFeatureFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { changes: { key: string; enabled: boolean }[] }) =>
    z.object({
      changes: z.array(z.object({
        key: z.string().min(1).max(100),
        enabled: z.boolean(),
      })).min(1).max(50),
    }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const sb = await ensureAdmin(context.userId);
    for (const change of data.changes) {
      const { error } = await sb
        .from("feature_flags")
        .update({ enabled: change.enabled })
        .eq("key", change.key);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
