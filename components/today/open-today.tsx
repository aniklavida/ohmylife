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
 * A day when something is genuinely open. Deliberately minimal: the full
 * design for a normal day — the life summary, the area cards, the tending
 * panel — is docs/ROADMAP.md step 5, "The place." Step 4 designed the quiet
 * state (components/quiet/quiet-state.tsx); this branch exists only so the
 * home route has something truthful to render meanwhile, and it still holds
 * every guilt constraint docs/SPEC.md §13 states: no count of
 * items appears anywhere, and an overdue item is never styled differently
 * from an upcoming one — only the date itself, read plainly, tells them
 * apart.
 */
export function OpenToday({ items }: { items: OpenItem[] }) {
  return (
    <section className="open-today" aria-labelledby="open-today-heading">
      <Plate variant="hero" scene="room" image={{ alt: SCENE_DESCRIPTION.room }}>
        <Label>Today</Label>
        <Display id="open-today-heading">A few things are waiting for you.</Display>
        <Body>Nothing urgent — just what is genuinely due, whenever you get to it.</Body>
      </Plate>

      <Script rotate={2} className="open-today__margin-note">
        Same life. Brighter days.
      </Script>

      <ul className="open-today__list">
        {items.map((item) => (
          <li key={item.id} className="open-today__item">
            <Label className="open-today__area">{AREA_LABEL[item.area] ?? item.area}</Label>
            <Body as="span" className="open-today__title">
              {item.title}
            </Body>
            <Label className="open-today__due">{humanizeDue(item)}</Label>
          </li>
        ))}
      </ul>
    </section>
  );
}
