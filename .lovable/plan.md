# Test household matrix before invitations go out

## Verified current state (queried this session)

- 86 households, 0 RSVPs submitted, 0 test households (`ZZTEST`/`ZZTST` prefix) currently in the database.
- 26 households verify by phone last-4, 60 by ZIP, 0 with no factor.
- 84 households have exactly 1 named member, 2 have more than 1, none have zero.
- 0 households have an explicit `max_party_size` — every real invitation is currently on the `named + 1` fallback.
- 1 household has an email on file.

So the party-cap feature has never been exercised against real-shaped data, and the most common real shape (1 named member, no cap, ZIP factor) is exactly the shape most likely to surprise us: those households can currently add exactly one extra person.

## Yes — and here's the matrix worth covering

Ten test households, all prefixed `ZZTEST` so they stay identifiable in the admin list and purgeable in one action. Each one isolates a single situation.

| # | Household | Named | Cap | Factor | What it proves |
|---|---|---|---|---|---|
| 1 | ZZTEST Phone Plus One | 1 | none | phone | Fallback cap of named+1; the common real shape |
| 2 | ZZTEST Zip Plus One | 1 | none | ZIP | Same, on the ZIP prompt path |
| 3 | ZZTEST Named Family | 4 | none | ZIP | Multi-member card list, no adds needed |
| 4 | ZZTEST Cap Exact | 2 | 2 | phone | Cap equals named count: add button never appears |
| 5 | ZZTEST Cap Two Open | 2 | 4 | ZIP | Two open slots, counter counts down correctly |
| 6 | ZZTEST Unknown Kids | 2 | 5 | ZIP | Family with unnamed children; multiple "name to come" rows |
| 7 | ZZTEST Solo No Cap | 1 | 1 | phone | Single guest who may bring no one |
| 8 | ZZTEST With Email | 1 | 2 | ZIP + email | Confirmation email actually sends and logs |
| 9 | ZZTEST No Email | 1 | 2 | phone | Blank email skips confirmation, admin notice still fires |
| 10 | ZZTEST Decline | 3 | 4 | ZIP | Full-household decline path and its recap/email |

## Scenarios run against them

For each household, through the browser at 440 and 1280:

1. Wrong verification value → error, no data leaked; repeated failures lock as designed.
2. Correct value → household loads with the right names and the right counter text.
3. Add a guest by name; add a guest as "name to come"; try to exceed the cap (button gone, and a direct submit past the cap rejected server-side).
4. Try to delete an invited row (must be impossible) and to mark it not attending (must work).
5. Submit; check the confirmation screen, the confirmation email (where an email exists), and the admin notification listing added / name-pending people.
6. Reopen the signed edit link, fill in a pending name, change an attendance answer, resubmit — confirm the row updates rather than duplicating.
7. Check the admin dashboard: party-size column, added/pending badges, the filters, "Add all to invite list" promotion, and the master CSV round-trip through the importer.

## What this is likely to surface

- Whether the `named + 1` fallback is the right default for 84 real invitations, or whether those should get explicit caps before invitations go out.
- Whether the counter copy reads correctly in Spanish as well as English for every cap shape, including the zero-open-slot case.
- Whether an added guest whose name later matches an invited member creates a duplicate on promotion.

## Technical notes

- Seed via a single migration-free data insert of ten `guests` rows with literal party members, caps, phone/ZIP factors, and one email address; no schema change is needed.
- Test emails go to an address you control; note that sends are real, so household 8 is the only one with an email.
- Purge at the end with a single delete on the `ZZTEST` prefix, cascading the RSVP rows.
- Verification runs with Playwright at 440 and 1280 plus direct database reads of `rsvps.attendees` to confirm the `added_by_guest` / `name_pending` stamps.
- `ONBOARDING.md`, `HANDOFF.md`, and this file get updated in the same turn with results and any behavior change that falls out.

## Question for you

Should the 84 single-name households keep the implicit `named + 1` allowance, or should I add an explicit cap of 1 (no plus-ones) as the default and let you raise it per invitation? That decision changes what "correct" means for tests 1 and 2.
