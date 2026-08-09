# Live headcount summary in the admin portal

## What's true today (verified this session)

- 155 households, 246 named people, 473 total invitation capacity (sum of explicit `max_party_size`, falling back to `named + 1`).
- 6 RSVPs so far: 5 attending, 1 not attending. RSVP status can also be `partial`.
- The dashboard already computes `totals` in the RSVPs tab, but it counts **households** for attending / declined / pending and only counts **people** for adults / children. There is no capacity number, no "still possible" number, and no people-level declined count.
- `AdminGuestRow` already carries everything needed: `party_limit` (effective cap), `party_members`, and `rsvp.attendees` with `attending`, `is_child`, `added_by_guest`, `name_pending`. No schema change is needed.

## Calculation logic

Every household falls into exactly one bucket, so nothing is double-counted. For each household let `cap = party_limit` (the effective limit already computed server-side).

- **Not yet responded** (`rsvp == null`): contributes `cap` to *still possible*, `cap` to *pending capacity*, 0 to confirmed.
- **Responded** (any status, including `not_attending` and `partial`): the RSVP is the source of truth. Count only `attendees` rows:
  - `yes = attendees.filter(a => a.attending).length`
  - `no  = attendees.filter(a => !a.attending).length`
  - A `not_attending` household with an empty attendee list counts its named members as declined so the declined number stays meaningful.
  - Guest-added rows are just attendees — counted once, no separate pass.
  - Because a responded household's leftover slots can still be filled if they re-open their edit link, they contribute `max(0, cap - attendees.length)` to *remaining open slots* — reported separately, never folded into "confirmed".

Top-line numbers:

| Number | Formula |
|---|---|
| Maximum possible attendance | `sum(cap)` across all households |
| Confirmed attending | `sum(yes)` |
| Confirmed not attending | `sum(no)` |
| Awaiting response (people) | `sum(cap)` for households with no RSVP |
| Still possible to attend | `confirmed attending + awaiting response + remaining open slots` |
| Remaining open slots | `sum(max(0, cap - attendees.length))` for responded households |

Identity that always holds: `maximum possible = confirmed attending + confirmed not attending + awaiting response + remaining open slots`. That identity is what prevents double-counting, and the UI shows it as a single stacked bar so a mismatch would be visible immediately.

Alongside, household-level counts stay as they are today (households attending / declined / pending), plus adults vs. children among confirmed attending, and a count of names still pending (`name_pending`).

## How it appears

A new **Headcount** panel above the existing tiles on the RSVPs tab:

- One wide row: `Confirmed attending` as the hero number, with `of 473 possible` beneath it, and a horizontal stacked bar segmented attending / declined / awaiting / open slots, using existing semantic tokens.
- A row of small tiles underneath: Confirmed attending, Confirmed not attending, Awaiting response, Remaining open slots, Still possible to attend, Adults, Children, Names pending.
- Existing household tiles (attending / declined / pending / can't-verify / has-email) stay, relabeled "Households" so it's obvious which tiles count people and which count invitations.
- The panel respects the **test-household filter** only: a "Real households only" selection excludes ZZT rows from the headcount. Search and status filters do not change it — the totals are always the whole list, so the number never lies depending on a filter you forgot you set. A small caption states this.
- Everything derives from the same `rows` array the table already loads, inside a `useMemo`, so it updates the moment the dashboard refetches after an edit, import, or restore. No new fetch, no cache to invalidate.

## Technical notes

- Calculation lives in a new pure helper `computeHeadcount(rows)` in `src/lib/rsvp-party.ts` (already the home for shared party math), so it can be unit-tested and reused by the CSV export later.
- Dashboard imports it and replaces the ad-hoc `totals` `useMemo` with `{ households, headcount }`, keeping existing tile labels wired to the household half.
- New copy goes in `src/i18n/dictionaries.ts` (EN + ES) next to the existing `admin.totals*` keys — no inline strings.
- No migration, no server-function change, no new columns.
- Verification: `bun run build:dev`, plus a Playwright pass on the dashboard at 440 and 1280 confirming the stacked bar segments sum to the maximum-possible number against a direct DB query.
- `ONBOARDING.md` and `HANDOFF.md` get the new panel documented and their "Last verified" dates bumped in the same turn.

## One decision for you

Should a responded household's unused slots (`cap - attendees.length`) count toward "still possible to attend"? I recommend yes but shown as its own number, since a household that said "2 of our 4" can still add the other two before the deadline. If you'd rather treat a submitted RSVP as final, I'll drop that segment and "still possible" becomes attending + awaiting only.
