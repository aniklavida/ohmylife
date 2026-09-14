"use server";

// The one write path the website owns, expressed as a Server Action rather
// than a hand-written API route: a plain <form> (components/tending/undo-
// button.tsx) posts straight to this function, with no client-side network
// call of our own to write, audit, or keep working when JavaScript is off.
// Every other mutation in this product goes through the MCP write path with
// a required `reason`; this exists only because docs/ARCHITECTURE.md §4
// names undoing a tending line as one of the small set of human actions the
// website may offer directly (docs/STRUCTURE.md's api/ folder, by contrast,
// stays empty). Lives in `lib/` rather than `app/`, the same as every other
// function that touches a life, so `components/` can call it directly
// without reaching upward into a layer it may not import.
import { revalidatePath } from "next/cache";
import { resolveLifeRoot } from "../index/runtime";
import { undoTendingRecord, type UndoResult } from "./undo";

export async function undoTendingLine(relativePath: string, at: string): Promise<UndoResult> {
  const lifeRoot = resolveLifeRoot();
  const result = undoTendingRecord(lifeRoot, relativePath, at);
  if (result.ok) {
    // Whatever changed (an archive or a restored field) can affect what the
    // home page and an area page show too, not only this one.
    revalidatePath("/tended");
    revalidatePath("/");
  }
  return result;
}
