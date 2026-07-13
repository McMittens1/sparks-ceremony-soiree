import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import favorite from "@/assets/engagement/Favorite.jpg.asset.json";
import { HeroSection } from "@/components/site/sections/HeroSection";
import { CountdownSection } from "@/components/site/sections/CountdownSection";
import { StorySection } from "@/components/site/sections/StorySection";
import { DaySection } from "@/components/site/sections/DaySection";
import { PartySection } from "@/components/site/sections/PartySection";
import { TravelSection } from "@/components/site/sections/TravelSection";
import { PhotosSection } from "@/components/site/sections/PhotosSection";
import { RegistrySection } from "@/components/site/sections/RegistrySection";
import { FaqSection } from "@/components/site/sections/FaqSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:image", content: `https://sparks-ceremony-soiree.lovable.app${favorite.url}` },
      { property: "og:image:alt", content: "Geovanni Moreno and Addison Hillman." },
      { property: "og:url", content: "https://sparks-ceremony-soiree.lovable.app/" },
      { name: "twitter:image", content: `https://sparks-ceremony-soiree.lovable.app${favorite.url}` },
    ],
    links: [
      { rel: "canonical", href: "https://sparks-ceremony-soiree.lovable.app/" },
      { rel: "preload", as: "image", href: favorite.url, fetchpriority: "high" },
    ],
  }),
  component: Home,
});

function Home() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace(/^#/, "");
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);

  return (
    <div>
      <HeroSection />
      <CountdownSection />
      <StorySection />
      <DaySection />
      <PartySection />
      <TravelSection />
      <PhotosSection />
      <RegistrySection />
      <FaqSection />
    </div>
  );
}
