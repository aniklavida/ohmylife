// The registration list — every tool this server exposes, in one place. If
// a tool exists in `mcp/tools/` but is not registered here, an agent cannot
// call it; the reverse should never happen. Keeping this file as a plain
// list (rather than an auto-discovered directory scan) means the product's
// entire agent-facing surface is readable without running anything.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as getLifeSchema from "./get-life-schema";
import * as searchLife from "./search-life";
import * as readEntry from "./read-entry";
import * as listArea from "./list-area";
import * as whatsOpen from "./whats-open";

export function registerTools(server: McpServer): void {
  // Read tools — see docs/SPEC.md §9.
  server.registerTool(getLifeSchema.name, getLifeSchema.config, getLifeSchema.handler);
  server.registerTool(searchLife.name, searchLife.config, searchLife.handler);
  server.registerTool(readEntry.name, readEntry.config, readEntry.handler);
  server.registerTool(listArea.name, listArea.config, listArea.handler);
  server.registerTool(whatsOpen.name, whatsOpen.config, whatsOpen.handler);

  // Write tools    — create_entry, update_entry, link_entries, attach_file, archive_entry
  // Trust tools    — leave_alone, propose, request_access
}
