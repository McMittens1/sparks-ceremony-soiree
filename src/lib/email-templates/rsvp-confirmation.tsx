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
}

const RsvpConfirmationEmail = ({
  guestName = "Friend",
  status = "attending",
  attendees = [],
  editUrl = "https://morenowedding2026.com/rsvp",
  eventDate = "October 10, 2026",
  venue = "Sparks' Barn",
  address = "13817 108th St, Louisville, NE 68037",
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
          <Text style={eyebrow}>Geovanni &amp; Addison · {eventDate}</Text>
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
            Need to change anything? You can update your RSVP anytime before September 15, 2026:
          </Text>
          <Text style={text}>
            <Link href={editUrl} style={link}>
              {editUrl}
            </Link>
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
  },
} satisfies TemplateEntry;

export default RsvpConfirmationEmail;

const main = { backgroundColor: "#ffffff", fontFamily: "Georgia, 'Times New Roman', serif" };
const container = { padding: "40px 32px", maxWidth: 560 };
const eyebrow = {
  fontFamily: "Arial, sans-serif",
  fontSize: "10px",
  letterSpacing: "0.24em",
  textTransform: "uppercase" as const,
  color: "#8A7A5C",
  margin: "0 0 18px",
};
const h1 = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontStyle: "italic" as const,
  fontSize: "32px",
  color: "#2A2520",
  margin: "0 0 24px",
  lineHeight: 1.2,
};
const text = { fontSize: "15px", color: "#4A423A", lineHeight: 1.7, margin: "0 0 16px" };
const block = { margin: "24px 0" };
const label = {
  fontFamily: "Arial, sans-serif",
  fontSize: "10px",
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  color: "#6B5DAF",
  margin: "0 0 8px",
};
const item = { fontSize: "16px", color: "#2A2520", margin: "4px 0" };
const itemSoft = { fontSize: "14px", color: "#7A6F5F", margin: "2px 0 0" };
const hr = { borderColor: "#E5DFD0", margin: "32px 0" };
const link = { color: "#6B5DAF", textDecoration: "underline" };
const footer = {
  fontFamily: "Georgia, serif",
  fontStyle: "italic" as const,
  fontSize: "16px",
  color: "#2A2520",
  margin: "32px 0 0",
};
