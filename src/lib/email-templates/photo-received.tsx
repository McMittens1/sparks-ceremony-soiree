import * as React from "react";
import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EMAIL_COLORS } from "./tokens";

interface PhotoReceivedProps {
  uploaderName?: string;
  count?: number;
}

const PhotoReceivedEmail = ({ uploaderName = "Friend", count = 1 }: PhotoReceivedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We got your {count === 1 ? "photo" : "photos"} — thank you!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Geovanni &amp; Addison</Text>
        <Heading style={h1}>Thanks for the photos.</Heading>
        <Text style={text}>
          Hi {uploaderName}, we received your upload
          {count > 1 ? ` (${count} photos)` : ""}. We&rsquo;ll take a quick look, and once
          approved they&rsquo;ll join the shared gallery on our site.
        </Text>
        <Text style={text}>
          You don&rsquo;t need to do anything else. Send more anytime.
        </Text>
        <Text style={footer}>
          With love,
          <br />
          Geo &amp; Addi
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: PhotoReceivedEmail,
  subject: "We got your photos",
  displayName: "Photo upload confirmation",
  previewData: { uploaderName: "Jane Doe", count: 3 },
} satisfies TemplateEntry;

export default PhotoReceivedEmail;

const main = { backgroundColor: EMAIL_COLORS.ivory, fontFamily: "Georgia, 'Times New Roman', serif" };
const container = { padding: "40px 32px", maxWidth: 560 };
const eyebrow = {
  fontFamily: "Arial, sans-serif",
  fontSize: "10px",
  letterSpacing: "0.24em",
  textTransform: "uppercase" as const,
  color: EMAIL_COLORS.tanDeep,
  margin: "0 0 18px",
};
const h1 = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontStyle: "italic" as const,
  fontSize: "30px",
  color: EMAIL_COLORS.ink,
  margin: "0 0 24px",
  lineHeight: 1.2,
};
const text = { fontSize: "15px", color: EMAIL_COLORS.inkBody, lineHeight: 1.7, margin: "0 0 16px" };
const footer = {
  fontFamily: "Georgia, serif",
  fontStyle: "italic" as const,
  fontSize: "16px",
  color: EMAIL_COLORS.ink,
  margin: "32px 0 0",
};
