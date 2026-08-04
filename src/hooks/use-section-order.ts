import { useFeatureFlag } from "@/hooks/use-feature-flags";

/**
 * Canonical home-page section order. The Wedding Party section is gated by
 * the `show_wedding_party` feature flag (admin Features tab): while it's off,
 * the section, its nav link, its spine numeral, and the MCP wedding-party tool
 * are all hidden, and the remaining sections renumber so the roman numerals
 * stay contiguous instead of skipping IV.
 *
 * Nothing in wedding-data.ts or WeddingParty.tsx changes — flipping the flag
 * back on restores the section exactly as it was.
 */
export const SECTION_ORDER = [
  "countdown",
  "story",
  "day",
  "party",
  "travel",
  "photos",
  "registry",
  "faq",
] as const;

export type SectionId = (typeof SECTION_ORDER)[number];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export interface SectionOrder {
  /** Whether the Wedding Party section is currently published. */
  showParty: boolean;
  /** Visible section ids, in order. */
  ids: SectionId[];
  /** Roman numeral for a visible section; empty string if hidden. */
  numeral: (id: SectionId) => string;
}

export function useSectionOrder(): SectionOrder {
  const { enabled: showParty } = useFeatureFlag("show_wedding_party");
  const ids = SECTION_ORDER.filter((id) => id !== "party" || showParty);
  const numeral = (id: SectionId) => {
    const i = ids.indexOf(id);
    return i === -1 ? "" : (ROMAN[i] ?? "");
  };
  return { showParty, ids, numeral };
}
