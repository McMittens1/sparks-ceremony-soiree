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
  { name: "Olyvia Hillman", role: "Maid of Honor" },
  { name: "Melinda Reinke", role: "Bridesmaid" },
  { name: "Lesly Moreno", role: "Bridesmaid" },
  { name: "Bryce Marker", role: "Bridesmaid" },
  { name: "Dru Brown", role: "Bridesmaid" },
  { name: "Ryane Needles", role: "Bridesmaid" },
  { name: "Jetta Tegeler", role: "Bridesmaid" },
  { name: "Ivy Smith", role: "Flower Girl" },
  { name: "Andres Moreno", role: "Best Man" },
  { name: "Nathan Asselin", role: "Groomsman" },
  { name: "Nathan Merritt", role: "Groomsman" },
  { name: "Joey Buresh", role: "Groomsman" },
  { name: "Alex Krause", role: "Groomsman" },
  { name: "Jonathan Houser", role: "Groomsman" },
  { name: "Jacob Laurell", role: "Groomsman" },
  { name: "Nick Gude", role: "Groomsman" },
  { name: "David Ramirez", role: "Groomsman" },
  { name: "Alan Meza", role: "Ring Bearer" },
  { name: "Matt Vu", role: "Usher" },
  { name: "Kollin Barnes", role: "Usher" },
  { name: "Kenny Nguyen", role: "Usher" },
  { name: "Zach Funk", role: "Usher" },
  { name: "Aaron Ramirez", role: "Usher" },
  { name: "Jose Barrios", role: "Usher" },
  { name: "Freddy Gonzalez", role: "Usher" },
  { name: "Jose Martinez", role: "Usher" },
  { name: "Mateo Meza", role: "Usher" },
];
