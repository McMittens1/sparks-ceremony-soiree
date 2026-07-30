// Single source of truth for how a *test* household is marked.
//
// Lovable's preview and the published site share one database, so test
// households are live rows on the real site for as long as they exist. The
// prefix convention is what makes them identifiable at a glance in the admin
// list and purgeable in one action before invitations go out.
export const TEST_HOUSEHOLD_PREFIX = "ZZTEST";

export function isTestHousehold(primaryName: string): boolean {
  return primaryName.trim().toUpperCase().startsWith(TEST_HOUSEHOLD_PREFIX);
}
