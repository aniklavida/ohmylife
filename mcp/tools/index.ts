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
import * as createEntry from "./create-entry";
import * as updateEntry from "./update-entry";
import * as linkEntries from "./link-entries";
import * as attachFile from "./attach-file";
import * as archiveEntry from "./archive-entry";
import * as leaveAlone from "./leave-alone";
import * as propose from "./propose";
import * as requestAccess from "./request-access";

export function registerTools(server: McpServer): void {
  // Read tools — see docs/SPEC.md §8.
  server.registerTool(getLifeSchema.name, getLifeSchema.config, getLifeSchema.handler);
  server.registerTool(searchLife.name, searchLife.config, searchLife.handler);
  server.registerTool(readEntry.name, readEntry.config, readEntry.handler);
  server.registerTool(listArea.name, listArea.config, listArea.handler);
  server.registerTool(whatsOpen.name, whatsOpen.config, whatsOpen.handler);

  // Write tools — every one takes a required `reason`, which becomes the
  // visible tending line (docs/SPEC.md §8).
  server.registerTool(createEntry.name, createEntry.config, createEntry.handler);
  server.registerTool(updateEntry.name, updateEntry.config, updateEntry.handler);
  server.registerTool(linkEntries.name, linkEntries.config, linkEntries.handler);
  server.registerTool(attachFile.name, attachFile.config, attachFile.handler);
  server.registerTool(archiveEntry.name, archiveEntry.config, archiveEntry.handler);

  // Trust and permission tools.
  server.registerTool(leaveAlone.name, leaveAlone.config, leaveAlone.handler);
  server.registerTool(propose.name, propose.config, propose.handler);
  server.registerTool(requestAccess.name, requestAccess.config, requestAccess.handler);
}
