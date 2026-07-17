import * as React from "react";
import { Hr, Text } from "@react-email/components";
import { EMAIL_COLORS } from "./tokens";

// Shared masthead for guest-facing app emails — mirrors the "G ◆ A"
// monogram used at the top of every page on the site (see the site header
// in src/routes/rsvp.tsx) so these emails read as part of the same brand
// instead of a generic transactional template. Deliberately built from
// plain Text/Hr (no flexbox, no absolute positioning) — email clients
// (Outlook especially) don't render those reliably.
export function EmailMasthead({ eyebrow }: { eyebrow: string }) {
  return (
    <>
      <Text style={monogram}>
        G <span style={monogramDiamond}>&#9670;</span> A
      </Text>
      <Text style={eyebrowStyle}>{eyebrow}</Text>
      <Hr style={mastheadRule} />
    </>
  );
}

// Shared sign-off — a hairline rule, "With love," signature, and a quiet
// link back to the site, matching the closing mark a piece of real wedding
// stationery would have rather than just trailing off after the content.
export function EmailFooter() {
  return (
    <>
      <Hr style={footerRule} />
      <Text style={footerSignature}>
        With love,
        <br />
        Geo &amp; Addi
      </Text>
      <Text style={footerSite}>morenowedding2026.com</Text>
    </>
  );
}

const monogram = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontStyle: "italic" as const,
  fontSize: "22px",
  color: EMAIL_COLORS.ink,
  textAlign: "center" as const,
  letterSpacing: "0.02em",
  margin: "0 0 6px",
};
const monogramDiamond = { color: EMAIL_COLORS.lavenderDeep, fontSize: "11px" };
const eyebrowStyle = {
  fontFamily: "Arial, sans-serif",
  fontSize: "10px",
  letterSpacing: "0.24em",
  textTransform: "uppercase" as const,
  color: EMAIL_COLORS.tanDeep,
  textAlign: "center" as const,
  margin: "0 0 28px",
};
const mastheadRule = { borderColor: EMAIL_COLORS.hairline, margin: "0 0 28px" };
const footerRule = { borderColor: EMAIL_COLORS.hairline, margin: "36px 0 24px" };
const footerSignature = {
  fontFamily: "Georgia, serif",
  fontStyle: "italic" as const,
  fontSize: "16px",
  color: EMAIL_COLORS.ink,
  textAlign: "center" as const,
  margin: "0 0 12px",
};
const footerSite = {
  fontFamily: "Arial, sans-serif",
  fontSize: "10px",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: EMAIL_COLORS.inkSoft,
  textAlign: "center" as const,
  margin: 0,
};
