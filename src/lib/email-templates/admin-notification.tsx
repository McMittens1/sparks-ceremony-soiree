import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface AdminNotificationProps {
  kind?: "rsvp" | "photo";
  headline?: string;
  summary?: string;
  details?: { label: string; value: string }[];
  adminUrl?: string;
}

const AdminNotificationEmail = ({
  kind = "rsvp",
  headline = "New activity",
  summary = "",
  details = [],
  adminUrl = "https://morenowedding2026.com/admin",
}: AdminNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{headline}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>
          Wedding site · {kind === "photo" ? "Photo upload" : "RSVP"}
        </Text>
        <Heading style={h1}>{headline}</Heading>
        {summary && <Text style={text}>{summary}</Text>}
        {details.length > 0 && (
          <Section style={block}>
            {details.map((d, i) => (
              <Text key={i} style={row}>
                <span style={rowLabel}>{d.label}: </span>
                <span style={rowValue}>{d.value}</span>
              </Text>
            ))}
          </Section>
        )}
        <Text style={text}>
          <Link href={adminUrl} style={link}>
            Open the admin dashboard →
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: AdminNotificationEmail,
  subject: (data: Record<string, unknown>) =>
    (data.headline as string) || "Wedding site — new activity",
  displayName: "Admin notification",
  previewData: {
    kind: "rsvp",
    headline: "New RSVP from Jane Doe (2 attending)",
    summary: "Jane Doe just submitted their RSVP.",
    details: [
      { label: "Status", value: "Attending" },
      { label: "Party size", value: "2" },
      { label: "Song request", value: "Vienna — Billy Joel" },
    ],
    adminUrl: "https://morenowedding2026.com/admin",
  },
} satisfies TemplateEntry;

export default AdminNotificationEmail;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "40px 32px", maxWidth: 560 };
const eyebrow = {
  fontSize: "10px",
  letterSpacing: "0.24em",
  textTransform: "uppercase" as const,
  color: "#8A7A5C",
  margin: "0 0 18px",
};
const h1 = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontStyle: "italic" as const,
  fontSize: "26px",
  color: "#2A2520",
  margin: "0 0 20px",
  lineHeight: 1.3,
};
const text = { fontSize: "14px", color: "#4A423A", lineHeight: 1.6, margin: "0 0 16px" };
const block = {
  margin: "20px 0",
  padding: "16px 20px",
  background: "#F8F4EC",
  border: "1px solid #E5DFD0",
};
const row = { fontSize: "14px", color: "#2A2520", margin: "4px 0" };
const rowLabel = { color: "#7A6F5F", fontWeight: "bold" as const };
const rowValue = { color: "#2A2520" };
const link = { color: "#6B5DAF", textDecoration: "underline" };
