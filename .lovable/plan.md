# Remove instructional placeholders from party members

## What's actually in the database (queried this session)

- 78 households, 163 named members, 0 RSVPs submitted, 0 households with an explicit `max_party_size`.
- 38 of those 163 "members" are instructions, not people:
  - `Enter name if bringing a plus one` — 18
  - `Enter name if bringing plus one` — 1
  - `Enter all party names` — 19

## Recommendation: remove them, and set a real cap instead

The placeholders are doing real damage, because the RSVP system treats `party_members` as the authoritative invited list in four places:

1. **They inflate the cap twice over.** With no explicit `max_party_size`, the limit is `named + 1`. "Amy Sheldon" + placeholder = 2 named, so Amy may bring **two** extra people, not one.
2. **They inflate the headcount.** The placeholder row renders as a person card defaulting to attending. If the guest doesn't notice, the caterer count is one seat too high per invitation.
3. **A guest can't delete them.** Invited rows are locked (`isRemovable` is false for anything not guest-added) — the household can only mark "Enter all party names" as *not attending*, which reads as absurd.
4. **Overwriting the text can break the submit or mislabel the guest.** `writeRsvp` rejects any submission with fewer rows than `party_members` and stamps `added_by_guest` by comparing names to the invited list. Typing a real name over the placeholder produces a row correctly flagged as added — but only because the placeholder still occupies a slot that no longer corresponds to anyone.

The intent behind the placeholders is already a first-class feature. The form shows "Your invitation includes up to N guests… you may add M more", has **+ Add guest** and **Add guest (name to come)**, tags added rows, and enforces the cap server-side. The placeholders duplicate that in a channel that can't express it.

## The change

### 1. Clean the data

Strip the three placeholder strings from `party_members` on all 38 rows, in one reversible data operation. No schema change. Safe today: zero RSVPs exist, so nothing references those rows.

Take the master CSV export as a backup immediately before running it.

### 2. Give each cleaned household an explicit `max_party_size`

Removing a placeholder drops the fallback cap by one, so the cap must be set deliberately rather than inherited:

- **Plus-one invitations (19):** `max_party_size = named_after_cleanup + 1`. Identical allowance to what you intended; the open slot is now explicit.
- **"& Family" invitations (19):** these need a number from you. The unnamed-children case is exactly what the cap is for, and guessing it is the one thing I shouldn't do. Options: a blanket family default (e.g. 6) applied to all of them and adjusted per household in the dashboard, or you supply per-household numbers.

### 3. Frontend: nothing structural, one copy improvement

The plus-one and add-family flows already exist and already respect the cap. The only gap is that the counter states the number but not the intent. Add one line under the counter, EN + ES, in `src/i18n/dictionaries.ts`:

- Open slots remain: *"Bringing a guest we haven't listed? Add them below — including children."*
- No slots remain: the existing "your invitation is for N guests" message stands.

Nothing conditional beyond what's already there: the **Add guest** control already disappears at the cap, so a household with a cap equal to their named count sees no add affordance at all.

### 4. Admin portal and importer guardrails

So this can't recur through the same door:

- **Dashboard member editor:** reject a member name matching `enter …` / `plus one` / `all party names` with inline text pointing at the party-limit field instead.
- **CSV importer:** same check on the `members` column — warn and skip the placeholder token rather than importing it, using the existing per-row warning mechanism.
- **Dashboard:** the existing "DEFAULT LIMIT" badge already surfaces households still on the fallback; after this change, far fewer should carry it.
- **Exports:** unchanged in shape. `max_party_size` is already a column and already round-trips.

## Why not the alternatives

- **Keep them:** every problem above is live the moment the first guest opens their invitation, and the cap arithmetic is already wrong.
- **Special-case placeholder text in code** (detect and hide it at render): now two systems must agree on a magic string forever, exports stay dirty, and the cap arithmetic is still wrong unless the filter is applied identically in `verifyHouseholdAccess`, `writeRsvp`, the dashboard, and the CSV. Data cleanup is strictly cheaper.
- **Add a separate `notes_for_guest` field:** more schema for a message the counter already conveys.

## Technical notes

- Data operation only — no migration. Update `party_members` by filtering out the three exact strings, then set `max_party_size` per the rules above, in the same statement batch.
- `effectivePartyLimit` and the `validate_guest_max_party_size` trigger stay as they are; setting an explicit cap ≥ the named count satisfies the trigger.
- Placeholder rejection lives beside the existing member-name validation in `src/lib/rsvp.functions.ts` (`upsertGuest` schema and `importGuestsCsv`), so the dashboard and importer share one rule.
- Verification: re-query the 38 households for residual placeholder text and confirm each has a cap; Playwright at 440 and 1280 through one cleaned plus-one household and one cleaned family household, checking the counter text and the add-guest affordance; `bun run build:dev`.
- `ONBOARDING.md`, `HANDOFF.md`, and this file get updated in the same turn.

## Question before I start

For the 19 "& Family" invitations — apply one default cap to all of them (tell me the number) and let you tune individuals in the dashboard, or do you want to give me per-household numbers now?
