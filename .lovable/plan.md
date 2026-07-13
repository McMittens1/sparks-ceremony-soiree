## Pre-publish checklist

Quick sweep before going live. Nothing here changes app behavior — it's polish + safety.

### 1. Metadata & SEO
- Verify `src/routes/__root.tsx` `head()` has a real title, meta description, og:title, og:description, og:type, twitter:card (not the "Lovable App" / "Lovable Generated Project" defaults).
- Add an og:image at a leaf route (e.g. the home route) using an absolute https URL if a hero image exists; otherwise omit and let hosting inject a screenshot.
- Confirm a single H1, semantic sections, and alt text on all images.

### 2. Responsive pass
- Spot-check hero, countdown, RSVP, and any gallery/day sections at 390px, 768px, 1280px.
- Confirm the hero fits within viewport on mobile without scroll on load.

### 3. Backend safety
- Run a security scan to catch missing RLS, missing GRANTs, or exposed data on any public tables before publishing.
- Address any critical findings, or explicitly acknowledge them.

### 4. Auth & flows
- If RSVP or any form writes to the DB, confirm it works end-to-end while signed in (and signed out, if that's expected).
- Confirm no broken links/routes in the nav.

### 5. Console hygiene
- Load the site and confirm no red console errors or failed network requests on the homepage.

### 6. Publish
- Once the above is clean, publish to the Lovable URL. Custom domain (if wanted) can be connected after in Project Settings → Domains.

---

Want me to run the security scan + a mobile/desktop screenshot pass now, then hand off to publish? Or is there a specific section (RSVP, gallery, registry, etc.) you want reviewed first?
