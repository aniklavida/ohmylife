// `propose` — suggest a change that needs the person's yes (docs/SPEC.md
// §8). Nothing this tool does ever touches an entry: it writes a pending
// proposal file (lib/tending/proposals.ts) and stops there. There is no
// approve/reject tool in this version of the server — accepting a proposal
// is a human action through the website, which does not exist yet
// (docs/STRUCTURE.md, `api/tending/`). That gap is stated here rather than
// silently implied by a tool that looks complete.
import { z } from "zod";
import { recordProposal } from "../../lib/tending/proposals";
import { resolveLifeRoot } from "../runtime";

export const name = "propose";

export const config = {
  title: "Propose",
  description:
    "Suggests a change without making it — for anything that needs the " +
    "person's yes rather than an agent's judgment (e.g. overwriting words " +
    "the person wrote themselves, correcting a document's recorded number " +
    "or expiry date, or any change with real consequences). Writes a pending " +
    "proposal file next to the life; does not modify any entry. There is " +
    "no approval tool yet in this version — a person currently reviews and " +
    "acts on proposals by reading the file directly.",
  inputSchema: {
    id: z.string().min(1).optional().describe("The entry this proposes a change to. Omit to propose a new entry."),
    patch: z
      .record(z.string(), z.unknown())
      .describe("The proposed fields — a patch, or a full new entry's fields."),
    reason: z.string().min(1),
  },
};

export async function handler(args: { id?: string; patch: Record<string, unknown>; reason: string }) {
  const lifeRoot = resolveLifeRoot();
  const written = recordProposal(lifeRoot, {
    targetId: args.id,
    patch: args.patch,
    reason: args.reason,
  });

  const body = {
    proposal_id: written.id,
    relative_path: written.relativePath,
    status: "pending",
    message:
      "Recorded, not applied. This proposal is pending a person's review — " +
      "there is no automatic approval path in this version.",
  };
  return { content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }] };
}
