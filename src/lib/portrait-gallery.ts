// The standalone Portraits gallery (homepage section). These are the
// professional engagement-portrait session photos — deliberately separate from
// the Our Story clusters (which are still temporary placeholders) and from the
// Section 05 proposal photos, which are the only images from the actual
// proposal night. No image appears in both places.

import eng26 from "@/assets/engagement/Geo_AddiEngagement-26.jpg.asset.json";
import eng42 from "@/assets/engagement/Geo_AddiEngagement-42.jpg.asset.json";
import eng46 from "@/assets/engagement/Geo_AddiEngagement-46.jpg.asset.json";
import eng50 from "@/assets/engagement/Geo_AddiEngagement-50.jpg.asset.json";
import eng68 from "@/assets/engagement/Geo_AddiEngagement-68.jpg.asset.json";
import eng85 from "@/assets/engagement/Geo_AddiEngagement-85.jpg.asset.json";
import eng95 from "@/assets/engagement/Geo_AddiEngagement-95.jpg.asset.json";
import mor2 from "@/assets/engagement/MorenoEngagement-2.jpg.asset.json";
import mor15 from "@/assets/engagement/MorenoEngagement-15.jpg.asset.json";
import mor23 from "@/assets/engagement/MorenoEngagement-23.jpg.asset.json";
import mor77 from "@/assets/engagement/MorenoEngagement-77.jpg.asset.json";
import mor80 from "@/assets/engagement/MorenoEngagement-80.jpg.asset.json";

export type PortraitOrientation = "portrait" | "landscape" | "square";

export interface Portrait {
  key: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  orientation: PortraitOrientation;
}

const shape = (w: number, h: number): PortraitOrientation =>
  w === h ? "square" : w > h ? "landscape" : "portrait";

const p = (key: string, src: string, alt: string, width: number, height: number): Portrait => ({
  key,
  src,
  alt,
  width,
  height,
  orientation: shape(width, height),
});

export const PORTRAITS: Portrait[] = [
  p("mor23", mor23.url, "Addi and Geo close together in front of tall windows", 1280, 1920),
  p("eng85", eng85.url, "Addi and Geo holding hands walking down stone stairs", 1920, 1280),
  p("mor2", mor2.url, "Geo lifting Addi off her feet in a stone colonnade", 1280, 1920),
  p("eng50", eng50.url, "Geo kissing Addi on the forehead in a close embrace", 1280, 1920),
  p("mor80", mor80.url, "Addi and Geo standing together on a rooftop above the city", 1280, 1920),
  p("eng68", eng68.url, "Addi and Geo sitting together in a garden beside a fountain", 1280, 1920),
  p("mor15", mor15.url, "Addi and Geo laughing in a close portrait", 1920, 1920),
  p("eng46", eng46.url, "Addi and Geo walking arm in arm through a colonnade", 1280, 1920),
  p("eng95", eng95.url, "Addi resting her head on Geo's shoulder", 1920, 1440),
  p("mor77", mor77.url, "Black and white photo of Addi and Geo climbing wide stone stairs", 1280, 1920),
  p("eng42", eng42.url, "Addi and Geo sitting on a window sill looking at each other", 1280, 1920),
  p("eng26", eng26.url, "Addi and Geo smiling in a tight embrace", 1280, 1920),
];
