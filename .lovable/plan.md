# Photo Manager decision

## Recommendation: do not build it before launch

For a curated wedding site launching within 24 hours, **hardcoded photos are the right call**. Most small-to-medium brochure sites ship this way, and it is not unprofessional — it is simple, fast, and version-controlled. The Photo Manager is a convenience feature, not a launch blocker.

Building it now introduces real risk:

- New storage bucket, new table, new RLS policies, new admin UI, and refactors of `StoryTimeline.tsx` and `PortraitsSection.tsx` right before guests start RSVPing.
- Any bug in the DB-overrides-code fallback could break the Our Story or Portraits sections on the live site.
- The current hardcoded assets are already optimized, CDN-hosted, and working.

## What to do instead

1. **Ship as-is.** Keep the current hardcoded photo architecture for launch.
2. **If you want flexibility later** (e.g., swapping a few photos after seeing them live), build the smaller "replace-only" version post-launch: keep the existing slots and order fixed in code, and let the admin portal swap the image behind any single slot. This is roughly one-third of the work and covers the most likely real need.
3. **Only consider the full reorder/add/remove Photo Manager** if you find yourself wanting to change photos frequently after the wedding — and even then, evaluate whether a simple code edit is faster than maintaining a CMS.

## Launch-day photo checklist (if you accept this recommendation)

- [ ] Verify Our Story photos render correctly at 440px and 1280px.
- [ ] Verify Portraits gallery grid and lightbox at 440px and 1280px.
- [ ] Confirm Section 05 (Proposal) photos are untouched.
- [ ] No code changes needed for photos before launch.

## If you still want the full Photo Manager

The implementation plan from the previous turn is preserved in the conversation history. It can be executed, but I recommend scheduling it for after the wedding or a quiet post-launch window, not the next 24 hours.
