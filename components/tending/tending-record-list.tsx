import { BUCKET_LABEL, type WrittenTendingRecord } from "../../lib/tending/record";
import { Body, Label } from "../primitives/prose";
import { UndoButton } from "./undo-button";

/**
 * The full tending record, one line at a time — distinct from the home
 * page's `TendingPanel` (components/tending/tending-panel.tsx), which is
 * read-only by that surface's own design. Here, a "filed" or "corrected"
 * line that has not already been undone gets an undo control; a
 * "left_alone" line never does, because nothing was changed for it to
 * reverse (lib/tending/undo.ts).
 */
export function TendingRecordList({ records }: { records: WrittenTendingRecord[] }) {
  return (
    <ul className="tending-record-list">
      {records.map((record) => (
        <li key={`${record.relativePath}-${record.at}`} className="tending-record-list__item">
          <Label as="span" className="tending-record-list__bucket">
            {BUCKET_LABEL[record.bucket]}
          </Label>
          <Body as="span" className="tending-record-list__summary">
            {record.summary}
          </Body>
          {record.undoneAt ? (
            <Label as="span" className="tending-record-list__undone">
              Undone
            </Label>
          ) : record.bucket !== "left_alone" ? (
            <UndoButton relativePath={record.relativePath} at={record.at} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
