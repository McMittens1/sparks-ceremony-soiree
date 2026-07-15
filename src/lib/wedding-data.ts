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
  { q: "What time should I arrive?", a: "Doors open at 4:30 PM. The ceremony starts at 5:00 PM sharp — please be seated by 4:55." },
  { q: "Is it indoors or outdoors?", a: "The ceremony is outdoors on the lawn (weather permitting). Cocktails, dinner, and dancing are inside the barn." },
  { q: "Where should I stay?", a: "We haven't blocked rooms. The Getting There section lists well-known hotels in Plattsmouth (closest), Lincoln, and Omaha — pick whatever's easiest for you." },
];

export const FAQ_GUESTS: { q: string; a: string; open?: boolean }[] = [
  { q: "Can I bring a plus-one?", a: "Only if your invitation names a plus-one or the RSVP page lets you add more than one guest. If you're not sure, RSVP with the names listed on your invite and reach out if something's missing." },
  { q: "Are kids welcome?", a: "Yes. Add them to your party on the RSVP page and mark them as a child so we can plan headcount and meals." },
  { q: "What's the dress code?", a: "Cocktail attire in warm neutrals, lavender, or plum. Skip stilettos — the barn floor is uneven and the ceremony is on grass. Flats or block heels work great.", open: true },
];

// ---------- Story timeline ----------
// Text content for the Our Story section. Image assignment lives in
// StoryTimeline.tsx (photoStart/photoCount index into its local PHOTOS array).

type DatedStoryEntry = {
  kind: "dated";
  date: string;
  place: string;
  title: string;
  body: string;
  photoStart: number;
  photoCount: number;
};
type MontageStoryEntry = {
  kind: "montage";
  label: string;
  title: string;
  body: string;
  photoStart: number;
  photoCount: number;
};
export type StoryEntry = DatedStoryEntry | MontageStoryEntry;

export const STORY_ENTRIES: StoryEntry[] = [
  { kind: "dated", date: "October 3, 2022", place: "Kinkaider Brewery · The Haymarket", title: "The first date", body: "We met on Hinge and our first date almost didn't happen — Addi had literally moved into a new house that day and probably should have been unpacking. We met at Kinkaider anyway, and right as we sat down at the outdoor patio her glasses snapped clean in half. We laughed about it, grabbed Canes on the way back to her place, and spent the night watching a scary movie surrounded by moving boxes while her dog Odin barked at me the entire time like he hadn't decided if I was allowed to be there.", photoStart: 0, photoCount: 3 },
  { kind: "dated", date: "Mid-October 2022", place: "Copper meets Odin", title: "The dogs approve", body: "We were only about two weeks into dating when we decided it was time to introduce the dogs, half expecting it to go badly. It didn't. Copper and Odin got along right away — no growling, no standoff, just two dogs that seemed to already know they'd be seeing a lot more of each other. It felt like a good sign for the rest of us too.", photoStart: 1, photoCount: 2 },
  { kind: "dated", date: "March 2023", place: "Odin comes around", title: "From her dog to ours", body: "He liked me pretty much from the start, but somewhere along the way, without either of us really noticing it happening, he stopped being just Addi's dog and started being mine too. By that spring he was waiting by the door when I showed up, the same way he did for her.", photoStart: 2, photoCount: 3 },
  { kind: "montage", label: "The years in between", title: "A lot of good ones, stacked", body: "No single story covers this part — just a lot of good ones stacked on top of each other. Trips we took, holidays with both families, random Tuesdays that didn't need a reason to be good. We got better at being a team without really talking about it. Somewhere in the middle of it all, Odin and Copper went from dogs that tolerated each other to actual brothers.", photoStart: 3, photoCount: 9 },
  { kind: "dated", date: "May 15, 2025", place: "The Joyo Theater", title: "The proposal", body: "I told her we were going to see a movie, which was technically true — except I'd rented out the whole theater first. She sat through a video I made and then a string of movie trailers that kept getting stranger, some real, some completely made up. When it ended I walked her outside, and the marquee out front read \u201CAddi, will you marry me?\u201D She said yes — and she'll be the first to tell you she saw it coming.", photoStart: 4, photoCount: 4 },
  { kind: "montage", label: "Getting ready for forever", title: "The months after the yes", body: "Telling everyone the news, watching family get just as excited as we were, starting to actually picture what our place together would look like. It didn't feel like planning so much as looking forward to something we already knew was coming.", photoStart: 5, photoCount: 6 },
  { kind: "dated", date: "October 2025", place: "Moved in together", title: "One roof, four of us", body: "We were surrounded by boxes again — except this time they weren't going anywhere. It took a minute to feel like our place instead of just her place with my stuff in it, but it did. Odin and Copper have been under one roof together ever since, and neither of them seems to remember a time it was any other way.", photoStart: 6, photoCount: 3 },
  { kind: "montage", label: "Settling in", title: "Ordinary, in the best way", body: "Since then it's mostly been us figuring out what a real life together looks like — Odin and Copper included, the two of them fully inseparable now. Ordinary as it sounds, it's been our favorite part so far, and it's all been building toward something a lot bigger.", photoStart: 7, photoCount: 6 },
  { kind: "dated", date: "October 10, 2026", place: "Sparks' Barn", title: "The next chapter starts here", body: "With everyone we love in one place to celebrate it with us.", photoStart: 0, photoCount: 2 },
];

// ---------- Day-of ----------

export const DATE_CARDS: { n: string; cap: string }[] = [
  { n: "10", cap: "Sat" },
  { n: "10", cap: "Oct" },
  { n: "26", cap: "2026" },
];

export const DAY_SCHEDULE: { time: string; label: string }[] = [
  { time: "4:30", label: "Guests arrive" },
  { time: "5:00", label: "Ceremony" },
  { time: "5:45", label: "Cocktail hour" },
  { time: "7:00", label: "Dinner & toasts" },
  { time: "8:30", label: "First dance & open floor" },
  { time: "11:30", label: "Send-off" },
];
