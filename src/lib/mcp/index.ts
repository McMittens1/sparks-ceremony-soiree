import { defineMcp } from "@lovable.dev/mcp-js";
import weddingInfoTool from "./tools/wedding-info";
import countdownTool from "./tools/countdown";

export default defineMcp({
  name: "geo-addi-wedding-mcp",
  title: "Geovanni & Addison Wedding",
  version: "0.1.0",
  instructions:
    "Tools for the Geovanni & Addison wedding site. Use get_wedding_info for couple, date, and venue details, and get_countdown for days remaining.",
  tools: [weddingInfoTool, countdownTool],
});
