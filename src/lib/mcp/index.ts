import { defineMcp } from "@lovable.dev/mcp-js";
import weddingInfoTool from "./tools/wedding-info";
import countdownTool from "./tools/countdown";
import scheduleTool from "./tools/schedule";
import dressCodeTool from "./tools/dress-code";
import travelTool from "./tools/travel";
import weatherTool from "./tools/weather";
import faqTool from "./tools/faq";
import weddingPartyTool from "./tools/wedding-party";
import registryTool from "./tools/registry";
import approvedPhotosTool from "./tools/approved-photos";

export default defineMcp({
  name: "geo-addi-wedding-mcp",
  title: "Geovanni & Addison Wedding",
  version: "0.2.0",
  instructions:
    "Tools for the Geovanni & Addison wedding site. Use get_wedding_info and get_countdown for the basics; get_schedule, get_dress_code, get_travel_info, and get_weather_forecast for day-of planning; get_faq to answer guest questions; get_wedding_party and get_registry_links for people and gifts; get_approved_photos for the public gallery.",
  tools: [
    weddingInfoTool,
    countdownTool,
    scheduleTool,
    dressCodeTool,
    travelTool,
    weatherTool,
    faqTool,
    weddingPartyTool,
    registryTool,
    approvedPhotosTool,
  ],
});
