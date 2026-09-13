import { Body, Label } from "../primitives/prose";

/**
 * The life summary — a handful of true observations, presented like the
 * opening page of an almanac rather than a scoreboard (docs/SPEC.md §12).
 * `lines` is composed from the data itself (lib/summary/compose.ts) and can
 * be any length, including zero on a life with nothing yet to observe —
 * this component renders whatever it is given rather than assuming a fixed
 * count, and renders nothing at all when there is genuinely nothing true to
 * say yet.
 */
export function LifeSummary({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;

  return (
    <section className="life-summary" aria-labelledby="life-summary-heading">
      <Label id="life-summary-heading">Your life, lately</Label>
      <ul className="life-summary__list">
        {lines.map((line) => (
          <li key={line}>
            <Body as="span" className="life-summary__line">
              {line}
            </Body>
          </li>
        ))}
      </ul>
    </section>
  );
}
