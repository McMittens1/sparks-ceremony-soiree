import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Cryptographically random 32-byte hex token — same generator used for
// unsubscribe links across every transactional email path.
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Every transactional email send requires an unsubscribe_token in its
// payload — the email API rejects sends without one. One token per email
// address, reused across sends. Returns null if the address's existing
// token is already used (meaning it should have already been caught by a
// suppressed_emails check upstream) or if a DB error prevents reading/
// writing the token.
export async function getOrCreateUnsubscribeToken(
  sb: SupabaseClient<Database>,
  email: string,
): Promise<string | null> {
  const normalized = email.toLowerCase();
  const { data: existing, error: lookupError } = await sb
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalized)
    .maybeSingle();
  if (lookupError) return null;
  if (existing) return existing.used_at ? null : existing.token;

  const token = generateToken();
  await sb
    .from("email_unsubscribe_tokens")
    .upsert({ token, email: normalized }, { onConflict: "email", ignoreDuplicates: true });

  // Another request may have raced us to create the row — re-read to get
  // whichever token actually got stored.
  const { data: stored } = await sb
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", normalized)
    .maybeSingle();
  return stored?.token ?? null;
}
