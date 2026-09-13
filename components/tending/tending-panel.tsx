import type { WrittenTendingRecord } from "../../lib/tending/record";
import { BUCKET_LABEL } from "../../lib/tending/record";
import { Body, Heading, Label } from "../primitives/prose";

/**
 * What the agent filed, corrected, and deliberately left alone
 * (docs/SPEC.md §11) — the surface where trust is earned by showing the
 * restraint as plainly as the edits. Read-only: undoing a line from here is
 * a human action the website could offer, but that control does not exist
 * yet, so this panel only ever shows what happened, never a way to change
 * it — see docs/ARCHITECTURE.md §4 on why the interactive surface stays small.
 */
export function TendingPanel({ records }: { records: WrittenTendingRecord[] }) {
  return (
    <section className="tending-panel" aria-labelledby="tending-panel-heading">
      <Heading id="tending-panel-heading">While you were away</Heading>
      {records.length > 0 ? (
        <ul className="tending-panel__list">
          {records.map((record) => (
            <li key={`${record.relativePath}-${record.at}`} className="tending-panel__item">
              <Label className="tending-panel__bucket">{BUCKET_LABEL[record.bucket]}</Label>
              <Body as="span" className="tending-panel__summary">
                {record.summary}
              </Body>
            </li>
          ))}
        </ul>
      ) : null}
      <Body className="tending-panel__closing">All caught up for now.</Body>
    </section>
  );
}
