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
    href: "https://www.zola.com/registry/addisonandgeovanni",
    note: "Our main registry — most up to date, and where the honeymoon fund lives too.",
  },
  {
    name: "The Knot",
    href: "https://www.theknot.com/addisonandgeovanni/registry",
    note: "Used for the wedding shower. Still active, but Zola is more current.",
  },
  {
    name: "Venmo — Geo",
    href: "https://venmo.com/u/Geo-Moreno-1",
    note: "Prefer to send something directly, fee-free? @Geo-Moreno-1 on Venmo.",
  },
  {
    name: "Venmo — Addi",
    href: "https://venmo.com/u/addihillman",
    note: "Or send to @addihillman — same idea, direct and no fees.",
  },
];

export type PartyMember = {
  name: string;
  role: string;
  /** Optional portrait. Drop a file in src/assets/party/ and import it, or use a URL. */
  photo?: string;
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
