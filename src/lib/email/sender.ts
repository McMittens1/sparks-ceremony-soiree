// The verified sender subdomain FQDN for all outbound wedding-site email —
// app-triggered transactional sends (enqueue.server.ts), Supabase auth-hook
// emails (routes/lovable/email/auth/webhook.ts), and the generic
// transactional API endpoint (routes/lovable/email/transactional/send.ts).
// Kept in one place so it can't silently drift between the three send
// paths that each need it. This MUST match the subdomain delegated to
// Lovable's nameservers — deliberately NOT derived from SITE.siteUrl,
// which is the root domain, a different string.
export const SENDER_DOMAIN = "notify.morenowedding2026.com";
