import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import heroPortrait from "@/assets/engagement/hero-portrait.png.asset.json";
import { SITE } from "@/lib/site";
import { buildMeta } from "@/lib/seo";
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
  head: () => {
    const base = buildMeta({
      title: "The Wedding of Geovanni & Addison · October 10, 2026",
      description:
        "The wedding website for Geovanni Moreno & Addison Hillman. Schedule, travel, registry, and RSVP for October 10, 2026 at Sparks' Barn, Louisville, NE.",
      image: `${SITE.siteUrl}${heroPortrait.url}`,
      url: `${SITE.siteUrl}/`,
    });
    return {
      meta: [
        ...base.meta,
        {
          property: "og:image:alt",
          content: "Pencil illustration of Geovanni Moreno and Addison Hillman.",
        },
      ],
      links: [
        ...base.links,
        { rel: "preload", as: "image", href: "/images/hero-portrait-1200.webp", fetchpriority: "high" },
      ],
    };
  },
  component: Home,
});

function Home() {
  const location = useLocation();
  const hasMountedRef = useRef(false);

  useEffect(() => {
    // On first mount, always land at the top of the hero. Ignore any hash the
    // browser restored from a prior visit. Only in-session hash changes (from
    // header nav) should smooth-scroll to a section.
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
      }
      return;
    }
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

