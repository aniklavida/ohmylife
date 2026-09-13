import { Plate } from "../primitives/plate";
import { Script } from "../primitives/script";
import { Body, Display, Label } from "../primitives/prose";

/**
 * "Nothing needs you today" — the most-seen screen in the product
 * (docs/SPEC.md §4), and the one docs/ROADMAP.md step 4 asks to be
 * designed first, not last. This is deliberately not an empty state: there
 * is no dimmed illustration, no "you're all caught up!" toast, and the
 * photographic hero and margin annotation below are exactly as considered
 * as any other screen would get. Two failed attempts at this exact screen
 * are recorded in DESIGN_BRIEF.md §10 — both mistook austerity for calm and
 * stripped things away. This one stays warm and full instead: a photograph,
 * a handwritten note, real sentences.
 */
export function QuietState() {
  return (
    <section className="quiet-state" aria-labelledby="quiet-state-heading">
      <Plate
        variant="hero"
        image={{
          alt:
            "A drawn scene of a quiet room at dusk: warm lamplight glowing " +
            "beside a tall window, with two leafy plants in silhouette.",
        }}
      >
        <Label>Today</Label>
        <Display id="quiet-state-heading">Nothing needs you today.</Display>
        <Body>
          Everything you have told your life about is already filed. Come
          back whenever you like — there is nothing waiting on you here.
        </Body>
      </Plate>

      <Script rotate={-2} className="quiet-state__margin-note">
        Same life. Brighter days.
      </Script>

      <Body className="quiet-state__closing">
        A well-lived life lives here — you do not have to visit it to keep
        it true.
      </Body>
    </section>
  );
}
