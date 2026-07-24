import type { CSSProperties } from "react";

// Shared CSS-variable shorthands and style helpers for the RSVP flow
// (src/routes/rsvp.tsx and src/routes/rsvp/edit.$token.tsx), which render
// the same prototype-matched look independently. Centralized here so a
// future palette/typography tweak only needs to change one place instead
// of two files that previously redeclared the exact same tokens.
export const INK = "var(--color-ink)";
export const IVORY = "var(--color-ivory)";
export const HAIRLINE = "var(--color-hairline)";
export const LAV = "var(--color-lavender)";
export const LAV_DEEP = "var(--color-lavender-deep)";
export const TAN = "var(--color-tan)";
export const TAN_DEEP = "var(--color-tan-deep)";
export const BODY = "var(--color-ink-body)";
export const SOFT = "var(--color-ink-soft)";
export const DANGER = "var(--color-destructive)";

// Styled input (Cormorant italic on a hairline underline) matching the prototype.
export const inputStyle: CSSProperties = {
  fontFamily: "Cormorant, serif",
  fontStyle: "italic",
  fontSize: 19,
  color: INK,
  border: "none",
  borderBottom: `1px solid ${TAN_DEEP}`,
  background: "transparent",
  width: "100%",
  padding: "0 0 10px",
  boxSizing: "border-box",
};

// Small uppercase link/button label (10px, 0.2em tracking) — repeated with
// only the color varying across both RSVP pages. Callers spread the result
// and add any per-instance properties (borderBottom, padding, etc.).
export function smallLabelStyle(color: string): CSSProperties {
  return { fontSize: 10, letterSpacing: "0.2em", color };
}

// Section/field-label style (11px, 0.3em tracking, lavender-deep) used above
// each form section and field on both RSVP pages. `margin` is required
// (pass `undefined` explicitly) so every call site states its own spacing
// instead of relying on an implicit default that could silently drift.
export function sectionLabelStyle(margin: string | number | undefined): CSSProperties {
  return {
    fontFamily: "Work Sans, sans-serif",
    fontSize: 11,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: LAV_DEEP,
    ...(margin !== undefined ? { margin } : {}),
  };
}
