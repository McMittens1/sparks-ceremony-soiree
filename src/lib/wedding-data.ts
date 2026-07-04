// Single source of truth for registry and wedding party.
// Used by both the site routes and the MCP tools so external AI assistants
// and the site can never drift out of sync.

export type RegistryItem = {
  name: string;
  /** External URL, or null when the item has no link yet. */
  href: string | null;
  note: string;
};

export const REGISTRY: RegistryItem[] = [
  {
    name: "Zola",
    href: "https://zola.com",
    note: "Main registry — dishes, linens, the boring good stuff.",
  },
  {
    name: "Honeymoon Fund",
    href: null,
    note: "A weekend somewhere warm after the barn cools down.",
  },
  {
    name: "Local charity",
    href: null,
    note: "In lieu of a gift, a Lincoln food bank we care about.",
  },
];

export type PartyMember = {
  name: string;
  role: string;
};

export const PARTY: PartyMember[] = [
  { name: "Maria S.", role: "Maid of Honor" },
  { name: "Jordan T.", role: "Best Man" },
  { name: "Ashley R.", role: "Bridesmaid" },
  { name: "Sam L.", role: "Groomsman" },
  { name: "Priya N.", role: "Bridesmaid" },
  { name: "Diego M.", role: "Groomsman" },
];
