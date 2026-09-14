import type { OpenItem } from "../../lib/summary/whats-open";
import { Plate } from "../primitives/plate";
import { Script } from "../primitives/script";
import { Body, Display, Label } from "../primitives/prose";
import { SCENE_DESCRIPTION } from "../scenes/scenes";
import { toComparableDate } from "../../lib/summary/whats-open";

const AREA_LABEL: Record<string, string> = {
  tasks: "Task",
  body: "Body",
  money: "Money",
  papers: "Papers",
};

function humanizeDue(item: OpenItem): string {
  const date = toComparableDate(item.due_value);
  if (!date) return item.due_value;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * A day when something is genuinely open — the glance. The room is the
 * hero, and what needs you is a note pinned to its wall, beside the
 * headline, so it is found at once without the page turning into a list.
 *
 * It holds every guilt constraint docs/SPEC.md §13 states: no count of
 * items appears anywhere, and every item is written the same way whatever
 * its date — only the date itself, read plainly, tells them apart.
 */
export function OpenToday({ items }: { items: OpenItem[] }) {
  return (
    <section className="today open-today" aria-labelledby="open-today-heading">
      <Plate variant="hero" scene="room" image={{ alt: SCENE_DESCRIPTION.room }} className="today__plate">
        <Label>Today</Label>
        <Display id="open-today-heading">A few things are waiting for you.</Display>
        <Body>Nothing urgent — just what is genuinely due, whenever you get to it.</Body>
      </Plate>

      <aside className="today__note" aria-label="On the table today">
        <Label as="p" className="today__note-label">
          On the table
        </Label>
        <ul className="open-today__list">
          {items.map((item) => (
            <li key={item.id} className="open-today__item">
              <Body as="span" className="open-today__title">
                {item.title}
              </Body>
              <Label className="open-today__area">{AREA_LABEL[item.area] ?? item.area}</Label>
              <Label className="open-today__due">{humanizeDue(item)}</Label>
            </li>
          ))}
        </ul>
        <Script rotate={-2} className="open-today__margin-note">
          Same life. Brighter days.
        </Script>
      </aside>
    </section>
  );
}
