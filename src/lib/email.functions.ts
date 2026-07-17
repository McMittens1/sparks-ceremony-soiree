import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { hasAdminRole } from "@/lib/admin.functions";

// Uses the caller's own RLS-scoped client (attached by requireSupabaseAuth), not
// the service-role client — enforced both here and by the matching
// "has_role(auth.uid(), 'admin')" read-only RLS policies on email_send_log/
// suppressed_emails/email_send_state.
async function ensureAdmin(sb: SupabaseClient<Database>, userId: string) {
  if (!(await hasAdminRole(sb, userId))) throw new Error("Forbidden");
  return sb;
}

// status/reason are plain `string` columns at the generated-types level (the
// database enforces the value set via a CHECK constraint, not a Postgres
// enum) — normalize to these closed unions with a fallback bucket so the UI
// never breaks on an unrecognized value.
export const EMAIL_STATUSES = [
  "pending",
  "sent",
  "suppressed",
  "failed",
  "bounced",
  "complained",
  "dlq",
] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];
const KNOWN_STATUSES = new Set<string>(EMAIL_STATUSES);
export function normalizeEmailStatus(raw: string): EmailStatus | "unknown" {
  return KNOWN_STATUSES.has(raw) ? (raw as EmailStatus) : "unknown";
}

export const SUPPRESSION_REASONS = ["unsubscribe", "bounce", "complaint"] as const;
export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number];
const KNOWN_REASONS = new Set<string>(SUPPRESSION_REASONS);
export function normalizeSuppressionReason(raw: string): SuppressionReason | "other" {
  return KNOWN_REASONS.has(raw) ? (raw as SuppressionReason) : "other";
}

export interface EmailLogRow {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: EmailStatus | "unknown";
  error_message: string | null;
  created_at: string;
}

export const SEND_LOG_LIMIT = 200;

export const getEmailSendLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmailLogRow[]> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await sb
      .from("email_send_log")
      .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(SEND_LOG_LIMIT);
    if (error) {
      console.error("getEmailSendLog failed", error);
      throw new Error("Couldn't load the email send log. Please try again.");
    }
    return (data ?? []).map((row) => ({ ...row, status: normalizeEmailStatus(row.status) }));
  });

export interface SuppressedEmailRow {
  id: string;
  email: string;
  reason: SuppressionReason | "other";
  created_at: string;
}

export const getSuppressedEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SuppressedEmailRow[]> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await sb
      .from("suppressed_emails")
      .select("id, email, reason, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getSuppressedEmails failed", error);
      throw new Error("Couldn't load suppressed emails. Please try again.");
    }
    return (data ?? []).map((row) => ({ ...row, reason: normalizeSuppressionReason(row.reason) }));
  });

export interface EmailSendState {
  retry_after_until: string | null;
  batch_size: number;
  send_delay_ms: number;
  auth_email_ttl_minutes: number;
  transactional_email_ttl_minutes: number;
  updated_at: string;
}

export const getEmailSendState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmailSendState | null> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await sb
      .from("email_send_state")
      .select(
        "retry_after_until, batch_size, send_delay_ms, auth_email_ttl_minutes, transactional_email_ttl_minutes, updated_at",
      )
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      console.error("getEmailSendState failed", error);
      throw new Error("Couldn't load email send state. Please try again.");
    }
    return data ?? null;
  });
