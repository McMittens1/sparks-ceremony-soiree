import * as React from "react";
import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EMAIL_COLORS } from "./tokens";
import { EmailMasthead, EmailFooter } from "./masthead";

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
        <EmailMasthead eyebrow="The Wedding of Geovanni & Addison" />
        <Heading style={h1}>Thanks for the photos.</Heading>
        <Text style={text}>
          Hi {uploaderName}, we received your upload
          {count > 1 ? ` (${count} photos)` : ""}. We&rsquo;ll take a quick look, and once approved
          they&rsquo;ll join the shared gallery on our site.
        </Text>
        <Text style={text}>You don&rsquo;t need to do anything else. Send more anytime.</Text>
        <EmailFooter />
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

const main = {
  backgroundColor: EMAIL_COLORS.ivory,
  fontFamily: "Georgia, 'Times New Roman', serif",
};
const container = { padding: "48px 32px", maxWidth: 560 };
const h1 = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontStyle: "italic" as const,
  fontSize: "30px",
  color: EMAIL_COLORS.ink,
  margin: "0 0 24px",
  lineHeight: 1.2,
  textAlign: "center" as const,
};
const text = { fontSize: "15px", color: EMAIL_COLORS.inkBody, lineHeight: 1.7, margin: "0 0 16px" };
