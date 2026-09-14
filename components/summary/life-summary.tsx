import type { ReactNode } from "react";
import type { Observation, ObservationTheme } from "../../lib/summary/compose";
import { Script } from "../primitives/script";

const HEADING: Record<ObservationTheme, string> = {
  people: "Of people",
  thread: "Of threads",
  date: "Of the calendar",
  savings: "Of savings",
};

const ORDINAL = [
  "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth",
  "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth",
  "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth",
  "twentieth", "twenty-first", "twenty-second", "twenty-third",
  "twenty-fourth", "twenty-fifth", "twenty-sixth", "twenty-seventh",
  "twenty-eighth", "twenty-ninth", "thirtieth", "thirty-first",
];

/**
 * The day, written the way an almanac heads its page — in words, so the
 * only figures on the spread are the ones inside its sentences.
 */
export function almanacDateline(today: Date): string {
  const weekday = today.toLocaleDateString("en-GB", { weekday: "long" });
  const month = today.toLocaleDateString("en-GB", { month: "long" });
  return `${weekday}, the ${ORDINAL[today.getDate() - 1]} of ${month}`;
}

/**
 * Sets each figure in a sentence in the almanac's old-style numerals. The
 * figure stays exactly where it was in the sentence; it is never lifted out
 * into a number of its own.
 */
function withFigures(sentence: string): ReactNode[] {
  return sentence
    .split(/(\d[\d,.]*\d|\d)/)
    .map((part, index) =>
      index % 2 === 1 ? (
        <span key={index} className="almanac__figure">
          {part}
        </span>
      ) : (
        part
      ),
    );
}

/**
 * The life summary, set as the opening spread of an almanac (docs/SPEC.md
 * §12): a masthead and the day in words, the most personal observation set
 * large, and the rest beneath their own small headings. `observations` is
 * composed from the data itself (lib/summary/compose.ts) and can be any
 * length — the spread is laid out for one as carefully as for four — and
 * when there is nothing true to say yet, it renders nothing at all.
 */
export function LifeSummary({ observations, today }: { observations: Observation[]; today: Date }) {
  const [lead, ...rest] = observations;
  if (!lead) return null;

  return (
    <section className="almanac" aria-labelledby="almanac-heading">
      <header className="almanac__masthead">
        <h2 id="almanac-heading" className="almanac__title">
          Your life, lately
        </h2>
        <p className="almanac__dateline">{almanacDateline(today)}</p>
      </header>

      <div className={rest.length > 0 ? "almanac__spread" : "almanac__spread almanac__spread--single"}>
        <div className="almanac__opening">
          <p className="almanac__heading">{HEADING[lead.theme]}</p>
          <p className="almanac__lead">{withFigures(lead.sentence)}</p>
        </div>

        {rest.length > 0 ? (
          <ul className="almanac__notes">
            {rest.map((observation) => (
              <li key={observation.sentence} className={`almanac__note almanac__note--${observation.theme}`}>
                <p className="almanac__heading">{HEADING[observation.theme]}</p>
                <p className="almanac__sentence">{withFigures(observation.sentence)}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Script rotate={-3} className="almanac__margin">
        noticed, not measured
      </Script>
    </section>
  );
}
