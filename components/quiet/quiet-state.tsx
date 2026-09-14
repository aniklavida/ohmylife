import { Plate } from "../primitives/plate";
import { Script } from "../primitives/script";
import { Body, Display, Label } from "../primitives/prose";
import { SCENE_DESCRIPTION } from "../scenes/scenes";

/**
 * "Nothing needs you today" — the most-seen screen in the product
 * (docs/SPEC.md §4), and the one docs/ROADMAP.md step 4 asks to be
 * designed first, not last. This is deliberately not an empty state: the
 * same lamplit room as a busy day, the same note pinned to its wall, and on
 * that note, in plain words, that nothing is on the table. The failure mode
 * this screen is designed against is austerity mistaken for calm —
 * stripping away until what is left reads as absence, which is how a quiet
 * day ends up looking like a page that failed to load (docs/SPEC.md §4). It
 * stays warm and full instead: a picture, a handwritten note, real sentences.
 */
export function QuietState() {
  return (
    <section className="today quiet-state" aria-labelledby="quiet-state-heading">
      <Plate variant="hero" scene="room" image={{ alt: SCENE_DESCRIPTION.room }} className="today__plate">
        <Label>Today</Label>
        <Display id="quiet-state-heading">Nothing needs you today.</Display>
        <Body>
          Everything you have told your life about is already filed. Come
          back whenever you like — there is nothing waiting on you here.
        </Body>
      </Plate>

      <aside className="today__note today__note--quiet" aria-label="On the table today">
        <Label as="p" className="today__note-label">
          On the table
        </Label>
        <p className="today__nothing">Nothing, today.</p>
        <Body className="quiet-state__closing">
          A well-lived life lives here — you do not have to visit it to keep
          it true.
        </Body>
        <Script rotate={-2} className="quiet-state__margin-note">
          Same life. Brighter days.
        </Script>
      </aside>
    </section>
  );
}
