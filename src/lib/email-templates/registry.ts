import type { ComponentType } from "react";
import { template as rsvpConfirmation } from "./rsvp-confirmation";
import { template as photoReceived } from "./photo-received";
import { template as adminNotification } from "./admin-notification";

export interface TemplateEntry {
  // Each template's own prop interface is more specific than this (e.g.
  // RsvpConfirmationProps) — component is necessarily loosely typed here
  // since the registry is heterogeneous (every template has different
  // props) and the actual props always come from runtime JSON request
  // data anyway (see transactional/send.ts), never from statically-known
  // call sites.
  component: ComponentType<any>;
  subject: string | ((data: Record<string, unknown>) => string);
  displayName?: string;
  previewData?: Record<string, unknown>;
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string;
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  "rsvp-confirmation": rsvpConfirmation,
  "photo-received": photoReceived,
  "admin-notification": adminNotification,
};
