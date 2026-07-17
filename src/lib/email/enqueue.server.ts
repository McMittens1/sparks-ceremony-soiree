import * as React from "react";
import { render } from "@react-email/render";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SENDER_DOMAIN = "notify.morenowedding2026.com";
const FROM = `Geovanni & Addison <noreply@${SENDER_DOMAIN}>`;

/**
 * Server-only: renders a registered app email template and enqueues it into
 * the transactional_emails pgmq queue. The email queue processor picks it up
 * within a few seconds and delivers it via Mailgun.
 *
 * Silently no-ops (returning ok=false) on any recoverable error so a failed
 * notification never breaks the user-facing action (RSVP submit / photo upload).
 */
export async function enqueueAppEmail(opts: {
  templateName: keyof typeof TEMPLATES | string;
  to: string;
  data: Record<string, unknown>;
  idempotencyKey: string;
}): Promise<{ ok: boolean; error?: string }> {
  const entry = TEMPLATES[opts.templateName];
  if (!entry) return { ok: false, error: "Unknown template" };
  if (!opts.to || !opts.to.includes("@")) return { ok: false, error: "Invalid recipient" };

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Suppression check: if recipient bounced/complained/unsubscribed, skip send.
    const { data: suppressed } = await supabaseAdmin
      .from("suppressed_emails")
      .select("email")
      .eq("email", opts.to.toLowerCase())
      .maybeSingle();
    if (suppressed) return { ok: false, error: "Suppressed" };

    const element = React.createElement(entry.component, opts.data);
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject =
      typeof entry.subject === "function" ? entry.subject(opts.data) : entry.subject;

    const messageId = opts.idempotencyKey;

    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: opts.to,
      status: "pending",
    });

    const { error: enqueueError } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: opts.to,
        from: FROM,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: "transactional",
        label: opts.templateName,
        idempotency_key: opts.idempotencyKey,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: opts.templateName,
        recipient_email: opts.to,
        status: "failed",
        error_message: enqueueError.message,
      });
      return { ok: false, error: enqueueError.message };
    }
    return { ok: true };
  } catch (e) {
    console.error("enqueueAppEmail failed", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Parses ADMIN_NOTIFICATION_EMAILS env into a list of recipient addresses. */
export function getAdminNotificationEmails(): string[] {
  const raw = process.env.ADMIN_NOTIFICATION_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.includes("@"));
}
