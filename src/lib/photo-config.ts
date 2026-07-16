// Shared between photos.functions.ts (guest upload/public gallery),
// admin.functions.ts (moderation), the MCP approved-photos tool, and the
// admin caption-editing UI — kept in one place so the signed-URL lifetime
// and caption length limit can't silently drift out of sync between them.

// Long enough that a signed thumbnail URL embedded in a page a visitor
// keeps open for a while (the public gallery, an admin's browser tab)
// doesn't expire mid-visit.
export const PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 60 * 6; // 6 hours

// Matches what a guest can enter on upload — an admin editing that same
// caption later must be able to keep the whole thing, not have it
// silently truncated/rejected by a stricter server-side limit.
export const PHOTO_CAPTION_MAX_LENGTH = 400;
