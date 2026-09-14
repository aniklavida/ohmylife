import Link from "next/link";
import type { WrittenTendingRecord } from "../../lib/tending/record";
import { BUCKET_LABEL } from "../../lib/tending/record";
import { Body, Heading, Label } from "../primitives/prose";
import { Script } from "../primitives/script";

/**
 * What the agent filed, corrected, and deliberately left alone
 * (docs/SPEC.md §11) — the surface where trust is earned by showing the
 * restraint as plainly as the edits. A note pinned to the page, and
 * read-only: reversing a line is done from the full record at /tended,
 * which this note links to, never from here — see docs/ARCHITECTURE.md §4
 * on why the interactive surface stays small.
 */
export function TendingPanel({ records }: { records: WrittenTendingRecord[] }) {
  return (
    <section className="tending-panel" aria-labelledby="tending-panel-heading">
      <header className="tending-panel__head">
        <svg className="tending-panel__leaf" viewBox="0 0 40 40" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path className="tending-panel__stem" d="M8 34 C18 26 26 16 32 6" />
          <path className="tending-panel__blade" d="M14 28 C8 22 9 14 15 11 C19 17 19 23 14 28 Z" />
          <path className="tending-panel__blade" d="M22 19 C29 19 33 14 34 9 C28 9 24 13 22 19 Z" />
        </svg>
        <Heading id="tending-panel-heading">While you were away</Heading>
      </header>
      <Script rotate={-1.5} className="tending-panel__voice">
        kept, and sometimes left be
      </Script>
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
      <footer className="tending-panel__foot">
        <Body className="tending-panel__closing">All caught up for now.</Body>
        <Link href="/tended" className="tending-panel__more">
          The full record
        </Link>
      </footer>
    </section>
  );
}
