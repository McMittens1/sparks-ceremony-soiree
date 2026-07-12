// Single source of truth for registry, wedding party, and travel data.
// Used by both the site routes and the MCP tools so external AI assistants
// and the site can never drift out of sync.

export type RegistryItem = {
  name: string;
  /** External URL, or null when the item has no link yet. */
  href: string | null;
  note: string;
  /** True for the lead (Zola) card — gets the lavender-wash treatment. */
  lead?: boolean;
  cta?: string;
};

export const REGISTRY: RegistryItem[] = [
  {
    name: "Zola",
    href: "https://www.zola.com/registry/addisonandgeovanni",
    note: "Our main registry, most up to date, and where the honeymoon fund lives too.",
    lead: true,
    cta: "Visit registry",
  },
  {
    name: "The Knot",
    href: "https://www.theknot.com/addisonandgeovanni/registry",
    note: "Used for the wedding shower. Still active, but Zola is more current.",
    cta: "Visit registry",
  },
  {
    name: "Venmo · Geo",
    href: "https://venmo.com/u/Geo-Moreno-1",
    note: "Prefer to send something directly, fee-free? @Geo-Moreno-1 on Venmo.",
    cta: "Open Venmo",
  },
  {
    name: "Venmo · Addi",
    href: "https://venmo.com/u/addihillman",
    note: "Or send to @addihillman, same idea, direct and no fees.",
    cta: "Open Venmo",
  },
];

export type PartyMember = {
  name: string;
  role: string;
  /** True for Maid of Honor + Best Man — the "standing closest" featured pair. */
  featured?: boolean;
  /** Optional per-person note revealed when the avatar is clicked. */
  note?: string;
  /** Optional portrait. Drop a file in src/assets/party/ and import it, or use a URL. */
  photo?: string;
};

export const PARTY: PartyMember[] = [
  { name: "Olyvia Hillman", role: "Maid of Honor", featured: true },
  { name: "Melinda Reinke", role: "Bridesmaid" },
  { name: "Lesly Moreno", role: "Bridesmaid" },
  { name: "Bryce Marker", role: "Bridesmaid" },
  { name: "Dru Brown", role: "Bridesmaid" },
  { name: "Ryane Needles", role: "Bridesmaid" },
  { name: "Jetta Tegeler", role: "Bridesmaid" },
  { name: "Ivy Smith", role: "Flower Girl" },
  { name: "Andres Moreno", role: "Best Man", featured: true },
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

export type HotelGroup = {
  area: string;
  drive: string;
  items: { name: string; city: string }[];
};

export const HOTELS: HotelGroup[] = [
  {
    area: "Plattsmouth",
    drive: "Closest to the venue · ~15 min drive",
    items: [
      { name: "Cobblestone Inn & Suites", city: "Plattsmouth, NE" },
      { name: "American Inn", city: "Plattsmouth, NE" },
    ],
  },
  {
    area: "Lincoln",
    drive: "~40 min drive",
    items: [
      { name: "Graduate by Hilton Lincoln", city: "Downtown Lincoln" },
      { name: "Hilton Garden Inn Lincoln Downtown / Haymarket", city: "Haymarket, Lincoln" },
      { name: "Hyatt Place Lincoln / Haymarket", city: "Haymarket, Lincoln" },
      { name: "Hampton Inn Lincoln South", city: "South Lincoln, near I-80" },
    ],
  },
  {
    area: "Omaha",
    drive: "Near the airport (OMA) · ~30–40 min drive",
    items: [
      { name: "Hilton Omaha Downtown", city: "Downtown Omaha" },
      { name: "Hyatt Place Omaha / Downtown · Old Market", city: "Old Market, Omaha" },
      { name: "Hampton Inn & Suites Omaha · Downtown", city: "Downtown Omaha" },
      { name: "Courtyard by Marriott Omaha East", city: "Near OMA airport, Council Bluffs" },
    ],
  },
];

export const FAQ_LOGISTICS: { q: string; a: string; open?: boolean }[] = [
  { q: "Where is the wedding?", a: "Sparks' Barn, 13817 108th St, Louisville, NE 68037. About 25 minutes south of Omaha and 40 minutes east of Lincoln.", open: true },
  { q: "What time should I arrive?", a: "Doors open at 4:30 PM. The ceremony starts at 5:00 PM sharp — please be seated by 4:55." },
  { q: "Is it indoors or outdoors?", a: "The ceremony is outdoors on the lawn (weather permitting). Cocktails, dinner, and dancing are inside the barn." },
  { q: "Where should I stay?", a: "We haven't blocked rooms. The Getting There section lists well-known hotels in Plattsmouth (closest), Lincoln, and Omaha — pick whatever's easiest for you." },
];

export const FAQ_GUESTS: { q: string; a: string; open?: boolean }[] = [
  { q: "Can I bring a plus-one?", a: "Only if your invitation names a plus-one or the RSVP page lets you add more than one guest. If you're not sure, RSVP with the names listed on your invite and reach out if something's missing." },
  { q: "Are kids welcome?", a: "Yes. Add them to your party on the RSVP page and mark them as a child so we can plan headcount and meals." },
  { q: "What's the dress code?", a: "Cocktail attire in warm neutrals, lavender, or plum. Skip stilettos — the barn floor is uneven and the ceremony is on grass. Flats or block heels work great.", open: true },
];
