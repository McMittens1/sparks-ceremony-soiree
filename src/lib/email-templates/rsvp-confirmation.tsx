import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EMAIL_COLORS } from "./tokens";
import { EmailMasthead, EmailFooter } from "./masthead";

interface AttendeeLine {
  name: string;
  attending: boolean;
  is_child: boolean;
}

interface RsvpConfirmationProps {
  guestName?: string;
  status?: "attending" | "partial" | "not_attending";
  attendees?: AttendeeLine[];
  slug?: string;
  editUrl?: string;
  eventDate?: string;
  venue?: string;
  address?: string;
  rsvpDeadline?: string;
}

const RsvpConfirmationEmail = ({
  guestName = "Friend",
  status = "attending",
  attendees = [],
  editUrl = "https://morenowedding2026.com/rsvp",
  eventDate = "October 10, 2026",
  venue = "Sparks' Barn",
  address = "13817 108th St, Louisville, NE 68037",
  rsvpDeadline = "September 15, 2026",
}: RsvpConfirmationProps) => {
  const attendingList = attendees.filter((a) => a.attending);
  const declinedList = attendees.filter((a) => !a.attending);

  const headline =
    status === "attending"
      ? "You're coming — we can't wait."
      : status === "partial"
        ? "Thanks for letting us know."
        : "We'll miss you.";

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your RSVP for Geovanni &amp; Addison — {headline}</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailMasthead eyebrow={`The Wedding of Geovanni & Addison · ${eventDate}`} />
          <Heading style={h1}>{headline}</Heading>
          <Text style={text}>
            Hi {guestName}, we&rsquo;ve saved your RSVP. Here&rsquo;s a copy for your records.
          </Text>

          {attendingList.length > 0 && (
            <Section style={block}>
              <Text style={label}>Attending</Text>
              {attendingList.map((a, i) => (
                <Text key={i} style={item}>
                  · {a.name}
                  {a.is_child ? " (child)" : ""}
                </Text>
              ))}
            </Section>
          )}

          {declinedList.length > 0 && (
            <Section style={block}>
              <Text style={label}>Not attending</Text>
              {declinedList.map((a, i) => (
                <Text key={i} style={item}>
                  · {a.name}
                </Text>
              ))}
            </Section>
          )}

          {status !== "not_attending" && (
            <Section style={block}>
              <Text style={label}>Where</Text>
              <Text style={item}>{venue}</Text>
              <Text style={itemSoft}>{address}</Text>
            </Section>
          )}

          <Hr style={hr} />
          <Text style={text}>
            Need to change anything? You can update your RSVP anytime before {rsvpDeadline}:
          </Text>
          <Text style={text}>
            <Link href={editUrl} style={link}>
              {editUrl}
            </Link>
          </Text>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: RsvpConfirmationEmail,
  subject: "Your RSVP for Geovanni & Addison",
  displayName: "RSVP confirmation",
  previewData: {
    guestName: "Jane Doe",
    status: "attending",
    attendees: [
      { name: "Jane Doe", attending: true, is_child: false },
      { name: "John Doe", attending: true, is_child: false },
    ],
    slug: "ABC123",
    editUrl: "https://morenowedding2026.com/rsvp?g=ABC123",
    eventDate: "October 10, 2026",
    venue: "Sparks' Barn",
    address: "13817 108th St, Louisville, NE 68037",
    rsvpDeadline: "September 15, 2026",
  },
} satisfies TemplateEntry;

export default RsvpConfirmationEmail;

const main = {
  backgroundColor: EMAIL_COLORS.ivory,
  fontFamily: "Georgia, 'Times New Roman', serif",
};
const container = { padding: "48px 32px", maxWidth: 560 };
const h1 = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontStyle: "italic" as const,
  fontSize: "32px",
  color: EMAIL_COLORS.ink,
  margin: "0 0 24px",
  lineHeight: 1.2,
  textAlign: "center" as const,
};
const text = { fontSize: "15px", color: EMAIL_COLORS.inkBody, lineHeight: 1.7, margin: "0 0 16px" };
const block = {
  margin: "20px 0",
  padding: "18px 22px",
  background: EMAIL_COLORS.lavenderWash,
  border: `1px solid ${EMAIL_COLORS.hairline}`,
};
const label = {
  fontFamily: "Arial, sans-serif",
  fontSize: "10px",
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  color: EMAIL_COLORS.lavenderDeep,
  margin: "0 0 8px",
};
const item = { fontSize: "16px", color: EMAIL_COLORS.ink, margin: "4px 0" };
const itemSoft = { fontSize: "14px", color: EMAIL_COLORS.inkSoft, margin: "2px 0 0" };
const hr = { borderColor: EMAIL_COLORS.hairline, margin: "32px 0" };
const link = { color: EMAIL_COLORS.tanDeep, textDecoration: "underline" };
