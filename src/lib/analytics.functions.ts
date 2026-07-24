import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const ALLOWED_EVENTS = [
  "rsvp_submit",
  "photo_upload",
  "calendar_click",
  "registry_click",
] as const;

const eventSchema = z.union(
  ALLOWED_EVENTS.map((v) => z.literal(v)) as [
    z.ZodLiteral<"rsvp_submit">,
    z.ZodLiteral<"photo_upload">,
    z.ZodLiteral<"calendar_click">,
    z.ZodLiteral<"registry_click">,
  ],
);

const trackSchema = z.object({
  event: eventSchema,
  data: z.record(z.unknown()).default({}),
});

export type AnalyticsEvent = (typeof ALLOWED_EVENTS)[number];

/**
 * Fire-and-forget event tracking. Validated on the server and inserted via
 * the service-role client so guests never need auth to record anonymous
 * interactions (RSVP submit, photo upload, calendar/registry clicks).
 */
export const trackEvent = createServerFn({ method: "POST" })
  .validator((data: unknown) => trackSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const request = getRequest();
    const sourceUrl = request?.headers.get("referer") ?? null;

    // The generated Supabase types lag behind new migrations; cast until the
    // schema is refreshed.
    await (supabaseAdmin as any).from("analytics_events").insert({
      event_name: data.event,
      event_data: data.data,
      source_url: sourceUrl,
    });

    return { ok: true };
  });
