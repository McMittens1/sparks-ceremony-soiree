// Single source of truth for registry, wedding party, and travel data.
// Used by both the site routes and the MCP tools so external AI assistants
// and the site can never drift out of sync.

export type RegistryItem = {
  name: string;
  /** External URL, or null when the item has no link yet. */
  href: string | null;
  note: string;
  /** True for the lead registry card — gets the lavender-wash treatment. */
  lead?: boolean;
  cta?: string;
};

export const REGISTRY: RegistryItem[] = [
  {
    name: "The Knot",
    href: "https://www.theknot.com/addisonandgeovanni/registry",
    note: "Our main registry and the most up to date. Start here if you're not sure where to look.",
    lead: true,
    cta: "Visit registry",
  },
  {
    name: "Amazon",
    href: "https://www.amazon.com/wedding/guest-view/1YLU6E2G4SSFK",
    note: "A few everyday things, easy to ship straight to us.",
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
  /** Optional per-person note revealed when the avatar is clicked. */
  note?: string;
  /** Optional portrait. Drop a file in src/assets/party/ and use it here. Ratio 3:4, background removed. */
  photo?: string;
  /**
   * Groomsman trading-card fields (role === "Groomsman" only). All optional —
   * falls back to placeholder copy so cards render before these are written.
   */
  /** Short tier label, e.g. "Legendary". Defaults to "Groomsman" if unset. */
  cardRarity?: string;
  /** 3–4 short stat lines shown on the card back, e.g. { label: "Specialty", value: "Emergency best-man speech, no notes" }. */
  cardAttributes?: { label: string; value: string }[];
  /** One signature move shown on the card back, styled like a TCG attack box. */
  cardAbility?: { name: string; body: string };
  /**
   * Magazine-cover fields (role "Bridesmaid" or "Maid of Honor" only). Both
   * optional — falls back to placeholder copy so covers render before these
   * are written.
   */
  /** Main cover line, e.g. "The One Who Always Says Yes to a Road Trip". */
  coverHeadline?: string;
  /** Short line under the headline, e.g. a one-sentence personal note. */
  coverSubline?: string;
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
  { name: "Andres Moreno", role: "Best Man", cardRarity: "Legendary" },
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
  { q: "What time should I arrive?", a: "Arrive 15–30 minutes before the 3:00 PM ceremony to park and find your seat — it starts sharp." },
  { q: "Is it indoors or outdoors?", a: "The ceremony is outdoors on the lawn (weather permitting). Cocktails, dinner, and dancing are inside the barn." },
  { q: "Where should I stay?", a: "We haven't blocked rooms. The Travel section lists well-known hotels in Plattsmouth (closest), Lincoln, and Omaha — pick whatever's easiest for you." },
];

export const FAQ_GUESTS: { q: string; a: string; open?: boolean }[] = [
  { q: "Can I bring a plus-one?", a: "Only if your invitation names a plus-one or the RSVP page lets you add more than one guest. If you're not sure, RSVP with the names listed on your invite and reach out if something's missing." },
  { q: "Are kids welcome?", a: "Yes. Add them to your party on the RSVP page and mark them as a child so we can plan headcount and meals." },
  { q: "What's the dress code?", a: "Cocktail attire in warm neutrals, lavender, or plum. Skip stilettos — the barn floor is uneven and the ceremony is on grass. Flats or block heels work great.", open: true },
];

// ---------- Story timeline ----------
// Text content for the Our Story section. Each entry names its own photo
// slots; StoryTimeline.tsx maps those keys to image assets. The current
// images are PLACEHOLDERS — replacing one is a single key swap here.

export type StoryPhotoKey =
  | "fav"
  | "eng06"
  | "eng10"
  | "eng13"
  | "eng15"
  | "eng19"
  | "eng27"
  | "eng74"
  | "eng75"
  | "eng82"
  | "eng94"
  | "propKneel"
  | "propMarquee"
  | "propRing"
  | "propCouple";

export type StoryEntry = {
  n: string;
  date: string;
  place: string;
  title: string;
  body: string;
  photos: StoryPhotoKey[];
  /** Optional alt text, index-matched to `photos`. Omit for decorative placeholders. */
  photoAlts?: string[];
  layout: "split" | "finale";
};

export const STORY_ENTRIES: StoryEntry[] = [
  {
    n: "01",
    date: "October 3, 2022",
    place: "Kinkaider Brewery · The Haymarket",
    title: "The first date",
    body: "Our first date probably should not have happened that night. Addi had moved into a new house earlier that day and still had boxes everywhere, which is a fairly solid excuse to cancel plans with someone from Hinge. She went anyway. We met at Kinkaider in the Haymarket, and right after we sat down on the patio, Addi\u2019s glasses snapped clean in half. Instead of calling it a night, we laughed, grabbed Raising Cane\u2019s, and went back to her place to watch a scary movie among the moving boxes. Odin spent most of the movie barking at Geo like he was conducting a very thorough background check. Somehow, none of that was enough to scare either of us off.",
    photos: ["fav", "eng74", "eng06", "eng94"],
    layout: "split",
  },
  {
    n: "02",
    date: "Later that month",
    place: "Odin & Copper",
    title: "When the boys met",
    body: "A couple of weeks later, we decided it was time for Odin and Copper to meet. We were not sure how it would go because Odin has always been selective about which dogs he likes, and he was not going to lower his standards just because we had started dating. Luckily, he was open to having Copper around. The boys did not become best friends immediately, and honestly, they still fight. The difference is that now they fight like brothers. Watching the two of them figure each other out while we were doing the same made everything feel a little more real. Before long, the four of us were becoming a package deal.",
    photos: ["eng82", "eng75", "eng27"],
    layout: "split",
  },
  {
    n: "03",
    date: "2023 & 2024",
    place: "The years in between",
    title: "Trips, holidays, and random Tuesdays",
    body: "The next couple of years were not one perfect movie montage, despite what the photos beside this paragraph may suggest. They were filled with trips, holidays with both families, birthdays, celebrations, random Tuesdays, and plenty of regular days when nothing especially interesting happened. We became more comfortable, made a lot of memories, and got better at being on the same team without ever really stopping to announce it. There was not one dramatic moment when we suddenly knew this was it. At some point, the question simply stopped being whether this was serious and became what we were going to do next.",
    photos: ["eng19", "eng15", "eng13", "eng10"],
    layout: "split",
  },
  {
    n: "04",
    date: "Fall 2024",
    place: "Moved in together",
    title: "One roof, four of us",
    body: "By fall 2024, we were surrounded by moving boxes again, only this time the boxes belonged to both of us. The first time we sat together surrounded by boxes was our first date, when Addi\u2019s glasses had broken in half and Odin barked through most of the movie. This time, we were unpacking a home together. Addi\u2019s glasses survived the move, and Odin still barks during movies, mostly because Copper is always stealing his spot on the couch. Most days are pretty normal, but getting to share those normal days has been one of the best parts.",
    photos: ["eng06", "eng94", "eng82"],
    layout: "split",
  },
  {
    n: "05",
    date: "May 16, 2025",
    place: "The Joyo Theater · Havelock",
    title: "The proposal",
    body: "Geo told Addi they were going to see a movie at the Joyo, which was technically true. He just left out a few minor details, including that he had rented the entire theater, made a video for her, and created several increasingly strange fake movie trailers to mix in with the real ones. After the video and trailers finished, he walked her outside, where the marquee read, \u201CAddi, will you marry me?\u201D She said yes. Addi still insists she knew what was happening, but to her credit, she let Geo finish the entire production.",
    photos: ["propKneel", "propMarquee", "propRing", "propCouple"],
    photoAlts: [
      "Geo on one knee proposing to Addi outside the Joyo Theater",
      "The Joyo Theater marquee reading \u201CWill you marry me Addi\u201D",
      "Geo holding up the engagement ring in front of the Joyo marquee",
      "Addi and Geo together under the Joyo marquee after she said yes",
    ],
    layout: "split",
  },
  {
    n: "06",
    date: "October 10, 2026",
    place: "Sparks\u2019 Barn",
    title: "See you at the barn",
    body: "On October 10, we get to bring everyone we love together at Sparks\u2019 Barn to eat, drink, dance, and celebrate everything that brought us here. It is not the end of our story, obviously, but the website has to stop scrolling eventually. We cannot wait to celebrate with you.",
    photos: ["eng13", "eng10", "fav"],
    layout: "finale",
  },
];


// ---------- Day-of ----------

export const DATE_CARDS: { n: string; cap: string }[] = [
  { n: "10", cap: "Sat" },
  { n: "10", cap: "Oct" },
  { n: "26", cap: "2026" },
];

export type ScheduleItem = { time: string; label: string };

export const DAY_SCHEDULE: ScheduleItem[] = [
  { time: "3:00", label: "Wedding Ceremony" },
  { time: "3:30", label: "Cocktail Hour" },
  { time: "4:30", label: "Reception Begins" },
  { time: "5:00", label: "Dinner" },
  { time: "7:00", label: "Dancing and Celebration" },
  { time: "Midnight", label: "Celebration Concludes" },
];
