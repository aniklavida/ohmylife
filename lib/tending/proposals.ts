// Proposals — a suggested change that needs the person's yes before it
// touches anything (docs/SPEC.md §9, "propose"). Unlike the tending log
// (record.ts), a proposal is not a record of something the agent did; it is
// a record of something the agent is *asking* to do, so it does not belong
// in the filed/corrected/left_alone log of completed actions.
//
// A proposal is never applied by this file, or by anything in mcp/. There
// is no approve/reject tool in this version — reviewing and acting on a
// proposal is a human action through the website (docs/STRUCTURE.md,
// `api/tending/`), which does not exist yet. This is recorded as an open
// decision in this card's report rather than left silently unimplemented:
// v1 of `propose` guarantees the suggestion survives, in a plain file a
// person can read, edit or delete by hand; it does not yet guarantee a
// one-click accept.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface ProposalInput {
  /** The entry this proposes a change to, if any. Omitted for a proposal to
   * create a wholly new entry. */
  targetId?: string;
  /** The proposed fields — a patch against an existing entry, or the full
   * shape of a new one. Never validated or applied here. */
  patch: Record<string, unknown>;
  reason: string;
}

export interface WrittenProposal {
  id: string;
  relativePath: string;
  createdAt: string;
}

function slugFragment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Writes one proposal to `tended/proposals/<id>.md`, status "pending". */
export function recordProposal(lifeRoot: string, input: ProposalInput): WrittenProposal {
  const createdAt = new Date().toISOString();
  const stamp = createdAt.replace(/[:.]/g, "-");
  const id = `${input.targetId ? slugFragment(input.targetId) : "new-entry"}-${stamp}`;

  const frontMatter = {
    id,
    target: input.targetId,
    status: "pending" as const,
    created_at: createdAt,
    patch: input.patch,
  };
  const contents = matter.stringify(`Reason: ${input.reason}\n`, frontMatter);

  const relativePath = `tended/proposals/${id}.md`;
  const filePath = path.join(lifeRoot, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");

  return { id, relativePath, createdAt };
}
