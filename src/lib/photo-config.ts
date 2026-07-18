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

// Upload caps — enforced both client-side (PhotosSection.tsx, for instant
// feedback before a slow upload starts) and server-side (photos.functions.ts,
// the real boundary). Also interpolated into the upload form's own copy so
// the displayed limit can't drift from what's actually enforced.
export const PHOTO_MAX_FILES = 5;
export const PHOTO_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// Base64 inflates size by ~4/3 over the raw byte count, plus a small
// allowance for the "data:image/xxx;base64," prefix — derived from
// PHOTO_MAX_FILE_BYTES rather than chosen independently, so the two caps
// can't silently stop agreeing with each other.
export const PHOTO_MAX_DATA_URL_LENGTH = Math.ceil((PHOTO_MAX_FILE_BYTES * 4) / 3) + 1024;
