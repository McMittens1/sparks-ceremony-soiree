import { defineMcp, auth } from "@lovable.dev/mcp-js";

// Supabase Auth issues the JWTs we accept. Requiring OAuth here means every
// tools/list and tools/call request must present a valid signed-in user token
// (aud: "authenticated"); unauthenticated MCP clients get a 401 with the
// protected-resource metadata pointer instead of tool payloads. Guest data
// (approved photos with uploader names, venue address, party details, etc.)
// stays behind sign-in.
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is required to configure MCP OAuth");
}
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
  auth: auth.oauth.issuer({
    issuer: `${SUPABASE_URL}/auth/v1`,
    acceptedAudiences: "authenticated",
    resourceName: "Geovanni & Addison Wedding MCP",
  }),
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
