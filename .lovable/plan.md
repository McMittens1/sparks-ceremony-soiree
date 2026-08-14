# Verify every household ZIP against its street address

## Why this matters right now

Verified live this session: 157 households, 136 with a street address, 21 with no ZIP at all, and **107 households that verify by ZIP** (no phone on file). For those 107, a wrong ZIP in the database is not a cosmetic data issue — it is a locked door. The guest types the ZIP they actually live at, the server compares it to the stored value, and after 5 mismatches the household is locked out for 15 minutes. So a bad ZIP is worth catching before those guests try.

12 RSVPs are already in. Nothing in this plan touches RSVPs.

## Approach: batch-validate addresses, review, then correct

No typing addresses in one at a time. Every address gets checked by a geocoder, and you only look at the rows that disagree.

**Step 1 — Export and validate (no key needed)**
Pull every household's `address_line1`, `city`, `state`, `postal_code` and run them through the **US Census Bureau batch geocoder**, which is free, needs no API key, and accepts up to 10,000 addresses per request. It returns the canonical matched address including the official ZIP.

**Step 2 — Classify each row**
- **Match** — geocoder ZIP equals stored ZIP. Nothing to do.
- **Mismatch** — geocoder found the address but returned a different ZIP. This is the pile you care about.
- **No ZIP on file** — the 21 rows with a blank ZIP; the geocoder can fill these in.
- **Not found / ambiguous** — bad or incomplete street line, PO boxes, apartment-only lines, the 1 Mexico address. These get flagged for you to eyeball, not auto-corrected.

For anything the Census geocoder can't resolve, fall back to Google's Geocoding API for a second opinion — that step needs a Google Maps API key, so I'd only wire it in if you want it and can supply one.

**Step 3 — You review before anything is written**
The result is a report you read, not a silent update:
- a CSV saved for you with one row per household: name, stored address, stored ZIP, suggested ZIP, and why it was flagged
- a chat summary of the counts (how many match, how many differ, how many unresolvable)

**Step 4 — Apply only the corrections you approve**
Once you say which suggestions to accept, the ZIPs are updated. Two safeguards:
- a snapshot of the affected rows is written to `guest_import_snapshots` first, so any change is reversible
- only `postal_code` changes; street, city, state, phone, party sizes, and RSVPs are untouched

Also worth flagging in the same pass: households whose ZIP correction would change what an already-RSVP'd guest was asked. Harmless (they're already through), but you should see the list.

## What I need from you

1. Confirm you want the free Census geocoder as the primary check (yes = I can start immediately, no key needed).
2. Say whether you want the Google Geocoding fallback for hard cases — if yes, I'll need a Google Maps API key stored as a secret.
3. Confirm the review-before-write flow, or tell me to auto-apply high-confidence exact matches and only surface the ambiguous ones.

## Technical notes

- Validation runs as a one-off script in the sandbox against the live `guests` table (read-only), not as new app code. No new routes, server functions, or UI unless you want this to become a recurring admin tool later.
- ZIPs are compared on the first 5 digits, matching `normalizeZip()` in `src/lib/rsvp.functions.ts`, so `68522-1234` and `68522` are treated as equal and will not appear as mismatches.
- Corrections are applied as a migration (updates require one), preceded by a snapshot insert.
- The 1 Mexico address is excluded from the US geocoder and reviewed manually.
- Docs: `ONBOARDING.md` and `HANDOFF.md` get a short note about the ZIP audit and its date, per the docs-are-code rule.
