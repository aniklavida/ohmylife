// The registration list — every tool this server exposes, in one place. If
// a tool exists in `mcp/tools/` but is not registered here, an agent cannot
// call it; the reverse should never happen. Keeping this file as a plain
// list (rather than an auto-discovered directory scan) means the product's
// entire agent-facing surface is readable without running anything.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerTools(_server: McpServer): void {
  // Tools are added here as they are built, one at a time:
  //   read tools     — get_life_schema, search_life, read_entry, list_area, whats_open
  //   write tools    — create_entry, update_entry, link_entries, attach_file, archive_entry
  //   trust tools    — leave_alone, propose, request_access
}
