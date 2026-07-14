// Color tokens mirrored from src/styles.css for use in transactional emails.
// Email clients can't read CSS custom properties, so these are duplicated
// here as plain hex values — keep in sync with src/styles.css by hand.
export const EMAIL_COLORS = {
  ivory: "#F8F4EC",
  ink: "#2A2520",
  inkBody: "#4A4238",
  inkSoft: "#6E6255",
  lavenderDeep: "#4C4066",
  lavenderWash: "#EAE3F1",
  tanDeep: "#6B5F49",
  hairline: "#E1D6C3",
} as const;
