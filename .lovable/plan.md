## What's actually built today (verified this session)

- `src/routes/rsvp.tsx` is a three-stage flow: **lookup** (name or invite code) → **verify** → **form**. A personalized link (`?t=<token>` or `?g=<slug>`) skips lookup but still lands on verify.
- `lookupGuest` never returns the invite code — it returns a 10-minute `select` token plus household name and party size. Keep it.
- `verifyHouseholdAccess` is the single choke point. It only ever compares **the last 4 digits of `guests.phone`**, enforces 5 attempts then a 15-minute lockout, and on success mints a 2-hour `session` token that is the sole authorization for `updateGuestAddress` and `submitRsvp`.
- `guests.phone` is **NOT NULL** in the database. `postal_code` is nullable.
- The `guests` table currently holds **1 row** (a test household). The real import hasn't happened, so changing the data model now is nearly free.
- After verification the server returns `PublicGuest`, which includes `slug`, `phone`, and `email` alongside name/party/address. The page renders the party list, the mailing address with a confirm/edit control, and a prefilled email field.

## Recommendation

### 1. Verification: keep it, and make the challenge per-household

Not "both methods everywhere" — **one challenge per household, chosen by the server** based on what's on file:

- Household has a phone → ask for the **last 4 digits of the phone**.
- No phone → ask for the **household ZIP code**.

The guest never picks; they're asked one question. Same single screen, same single input, same lockout. The complexity you're worried about only appears if guests see a choice or a "try the other one" fallback — so don't build that.

Why not ZIP-only for everyone: ZIP is the weaker secret (guessable for anyone who knows roughly where a family lives). Downgrading everyone to the weakest available factor for uniformity isn't a good trade when the server can just pick the stronger one it has.

Why not remove verification: the invitation is the guest list. Without a check, anyone who guesses a surname can read who else was invited to that household and change their RSVP. Removing it is the one option I'd argue against.

Is ZIP reasonable for a private wedding site? Yes — with the existing lockout (5 tries, then 15 minutes) and the per-IP search rate limit, it's proportionate to the realistic threat (a nosy acquaintance, not an attacker). It's a lower bar than phone last-4, which is exactly why it's the fallback rather than the default.

### 2. TextMyWedding links

Unchanged from today: the link carries the household so the guest lands directly on their own invitation, then still answers the verification question. A forwarded or intercepted text doesn't hand over the household.

### 3. What guests should see

**Before verification:** household name only ("The Moreno Household") plus the prompt. Already correct.

**After verification:** household name, the invited members' names, and the RSVP questions. That's it.

Removed entirely: the mailing address block and its confirm/edit control. You already have the addresses; asking guests to re-confirm data you're confident in adds a step, invites typos into a clean dataset, and puts a full street address on screen for no benefit. If someone has genuinely moved, they'll tell you directly — and you can fix it in the admin dashboard, which remains the single place addresses are edited.

Also stop sending `slug`, `phone`, and the address to the browser. None of them will be rendered once the address block is gone, and shipping them anyway leaves them visible in devtools and in any error report. Email stays — it's the field the guest fills in to receive their confirmation — and becomes the only contact field on the page.

### 4. Data-model and privacy notes worth fixing now

- **`guests.phone` must become nullable.** Right now you can't import a household without a phone number — you'd be forced to type a fake one, which then becomes a valid last-4 answer nobody can guess. This has to happen before import.
- **A household must have at least one usable factor.** Enforce "phone OR postal_code present" at the database level so an import can't silently create a household nobody can ever verify into.
- **Address columns stay as-is.** They're still your source of truth for mailing invitations and thank-you notes — they just stop being guest-writable.
- **Reuse the existing lockout columns.** They're named `phone_verify_*` but they really mean "verification attempt". Renaming is cosmetic churn; leave them and document the meaning.
- **Admin visibility.** The dashboard should show which factor each household will be challenged on, so you can spot "no phone, no ZIP" rows before invitations go out rather than after a guest emails you.
- **ZIP normalization.** Compare the first 5 digits only, ignoring `-1234` extensions and whitespace, so `92078-1234` isn't rejected.

## Technical shape of the change (for reference)

- Migration: `guests.phone` drop NOT NULL; add a check constraint requiring phone or postal_code. No new tables, so no new grants or policies.
- `src/lib/rsvp.functions.ts`: add a server-side `verifyFactorFor(guest)` helper returning `"phone_last4" | "zip"`; `getVerifyTargetLabel` returns that factor alongside the name; `verifyHouseholdAccess` branches on it and validates a 4-digit or 5-digit input accordingly. Lockout and session-token minting stay untouched.
- `PublicGuest` loses `slug`, `phone`, and `address`. `PublicRsvp` keeps `address_confirmed` for historical rows but the guest flow stops writing it.
- Remove the `updateGuestAddress` server function and its call site — with no guest-facing address editor, leaving a session-token-authorized address writer on the server is an endpoint with no caller.
- `src/routes/rsvp.tsx`: delete the address confirm/edit block and its state; the verify input's label, placeholder, length, and inputMode come from the factor the server reported. Copy strings go through `src/i18n/dictionaries.ts` rather than being inlined.
- Admin dashboard: a small "verifies by" indicator per household; addresses remain editable there.
- Docs: `ONBOARDING.md`, `HANDOFF.md`, `.lovable/plan.md` updated in the same change, plus a memory note that guest-facing address editing was deliberately removed.
- Verification: `bun run build:dev`, then Playwright at 440 and 1280 through both a phone-factor and a ZIP-factor household.
