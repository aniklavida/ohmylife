#!/usr/bin/env -S npx tsx
// The MCP server — the only write path into a life (docs/SPEC.md §8,
// docs/STRUCTURE.md "mcp/ — the only write path"). Stdio by default: no
// network, no token, the common case for a local agent. Streamable HTTP for
// a remote agent is deliberately not implemented here — it belongs with the
// access-and-privacy work in docs/ROADMAP.md step 3, once there is a token and a
// policy worth gating it with. Shipping it earlier would be a write path
// with no guard on it yet.
//
// Every tool file in `mcp/tools/` is registered here and nowhere else, so
// this file is the entire agent-facing surface of the product, readable in
// one screen (docs/STRUCTURE.md, "the registration list … has to stay
// small").
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/index";

const server = new McpServer({
  name: "ohmylife",
  version: "0.0.0",
});

registerTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("ohmylife MCP server failed to start:", error);
  process.exitCode = 1;
});
