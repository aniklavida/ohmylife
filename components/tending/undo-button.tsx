"use client";

// The one button in this product that reverses something, rather than only
// ever adding to the record (docs/SPEC.md §11, "every line is reversible
// from the line itself"). It submits a plain form bound to the server
// action in app/tended/actions.ts — no fetch call written by hand here, and
// the control still works the same way if JavaScript never loads.
import { useActionState } from "react";
import { undoTendingLine } from "../../lib/tending/actions";
import { Label } from "../primitives/prose";

interface UndoState {
  message: string | null;
}

const initialState: UndoState = { message: null };

export function UndoButton({ relativePath, at }: { relativePath: string; at: string }) {
  const [state, formAction, pending] = useActionState<UndoState>(async () => {
    const result = await undoTendingLine(relativePath, at);
    return { message: result.ok ? null : result.message };
  }, initialState);

  return (
    <form action={formAction} className="undo-button">
      <button type="submit" className="undo-button__control" disabled={pending}>
        {pending ? "Undoing…" : "Undo"}
      </button>
      {state.message ? (
        <Label as="span" className="undo-button__message">
          {state.message}
        </Label>
      ) : null}
    </form>
  );
}
