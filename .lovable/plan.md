## Plan: Center hero content on mobile

### Goal
On mobile viewports, center-align the hero text block (names, date, venue line, buttons, and mobile countdown) so the section feels balanced. Keep the current left-aligned desktop layout unchanged.

### Changes
1. **HeroSection.tsx**
   - Add responsive alignment classes to the text container so text is centered on mobile and left-aligned at `md` and up.
   - Center the CTA button row on mobile while keeping its current left alignment on desktop.
   - Ensure the existing mobile countdown grid inherits the centered layout.

2. **styles.css (mobile breakpoint)**
   - Add an override under `@media (max-width: 767px)` for `.rs-hero-text` to `text-align: center` and the button row to `justify-content: center`.
   - Leave desktop rules untouched.

### Verification
- Preview the site at mobile width and confirm the hero text, buttons, and countdown are centered.
- Preview at desktop width and confirm the text remains left-aligned.
- Run the dev build to catch any class or style errors.