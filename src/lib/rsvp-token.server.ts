// HMAC-SHA256 signed tokens for guest RSVP edit links.
// Format: base64url(guestId).base64url(expMs).base64url(sig)
// sig = HMAC_SHA256(RSVP_EDIT_SECRET, `${guestId}|${expMs}`)

const DEFAULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function b64urlEncode(bytes: Uint8Array | ArrayBuffer): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
function textToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function bytesToText(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a[i] ^ b[i];
  return out === 0;
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.RSVP_EDIT_SECRET;
  if (!secret) throw new Error("RSVP_EDIT_SECRET not configured");
  return crypto.subtle.importKey(
    "raw",
    textToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signRsvpToken(guestId: string, ttlMs: number = DEFAULT_TTL_MS): Promise<string> {
  const exp = String(Date.now() + ttlMs);
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, textToBytes(`${guestId}|${exp}`));
  return `${b64urlEncode(textToBytes(guestId))}.${b64urlEncode(textToBytes(exp))}.${b64urlEncode(sig)}`;
}

export type TokenVerifyResult =
  | { ok: true; guestId: string; expMs: number }
  | { ok: false; reason: "malformed" | "invalid" | "expired" };

export async function verifyRsvpToken(token: string): Promise<TokenVerifyResult> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  let guestId: string;
  let expStr: string;
  let sig: Uint8Array;
  try {
    guestId = bytesToText(b64urlDecode(parts[0]));
    expStr = bytesToText(b64urlDecode(parts[1]));
    sig = b64urlDecode(parts[2]);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!/^[0-9a-f-]{20,64}$/i.test(guestId)) return { ok: false, reason: "malformed" };
  const expMs = Number(expStr);
  if (!Number.isFinite(expMs)) return { ok: false, reason: "malformed" };
  const key = await getKey();
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, textToBytes(`${guestId}|${expStr}`)),
  );
  if (!timingSafeEqual(sig, expected)) return { ok: false, reason: "invalid" };
  if (Date.now() > expMs) return { ok: false, reason: "expired" };
  return { ok: true, guestId, expMs };
}
