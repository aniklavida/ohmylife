// `request_access` — ask for an area this agent may not currently read
// (docs/SPEC.md §9). Honesty note, same as get-life-schema.ts: no access
// policy is implemented yet (ROADMAP.md step 3, DECISIONS.md "Pending
// Anik"), so every area is already readable. This tool still exists and
// still records the ask, because an agent should form the habit of asking
// before the day a policy exists to answer it — but the response says
// plainly that nothing is being gated in this version, rather than
// pretending a grant just happened.
import { z } from "zod";
import { AREAS } from "../../lib/entry/schema";
import { recordAccessRequest } from "../../lib/tending/access-requests";
import { resolveLifeRoot } from "../runtime";

export const name = "request_access";

export const config = {
  title: "Request access",
  description:
    "Records a request for access to an area, with a reason and an " +
    "optional duration. No access policy is implemented in this version " +
    "of the server — every area is already readable and writable (see " +
    "get_life_schema) — so this does not grant or deny anything yet. It " +
    "exists so the request is on record for when a policy does exist.",
  inputSchema: {
    area: z.enum(AREAS),
    reason: z.string().min(1),
    duration: z.string().min(1).optional().describe('e.g. "7d", "30d", "indefinite"'),
  },
};

export async function handler(args: { area: (typeof AREAS)[number]; reason: string; duration?: string }) {
  const lifeRoot = resolveLifeRoot();
  const written = recordAccessRequest(lifeRoot, args);

  const body = {
    relative_path: written.relativePath,
    granted: true,
    note:
      `No access policy is implemented yet, so "${args.area}" was already ` +
      "readable and writable before this request — nothing changes as a " +
      "result of it beyond the record being kept.",
  };
  return { content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }] };
}
