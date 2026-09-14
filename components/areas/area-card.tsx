import Link from "next/link";
import type { AreaSummary } from "../../lib/summary/compose";
import { Plate, type PlateImage } from "../primitives/plate";
import { Body, Heading } from "../primitives/prose";
import { Script } from "../primitives/script";
import { SCENE_DESCRIPTION, sceneForArea } from "../scenes/scenes";

const AREA_LABEL: Record<string, string> = {
  memories: "Memories",
  people: "People",
  money: "Money",
  body: "Body",
  papers: "Papers",
  decisions: "Decisions",
  someday: "Someday",
};

/** What each area holds, in a hand-written line under its picture. */
const AREA_NOTE: Record<string, string> = {
  memories: "what happened, kept",
  people: "the people in it",
  money: "where it is, where it's going",
  body: "sleep, and the appointments",
  papers: "found in a hurry, at any hour",
  decisions: "so nothing is argued twice",
  someday: "no date, no guilt",
};

export interface AreaCardProps extends AreaSummary {
  /** This area's photograph, when there is one — the person's own photo, or
   * else the default image for the area. Without one, its drawn scene. */
  photo?: PlateImage;
}

/**
 * One area, as a print pinned to the page: its picture, a hand-written note
 * of what it holds, and a human sentence — never a count (docs/SPEC.md §6).
 * The sentence comes from `lib/summary/compose.ts`, composed from that
 * area's own entries, not written here.
 */
export function AreaCard({ area, sentence, photo }: AreaCardProps) {
  const label = AREA_LABEL[area] ?? area;
  const scene = sceneForArea(area);
  const note = AREA_NOTE[area];
  const image: PlateImage = photo?.src ? photo : { alt: SCENE_DESCRIPTION[scene] };
  return (
    <Link href={`/areas/${area}`} className={`area-card area-card--${area}`}>
      <Plate variant="print" scene={scene} image={image} />
      <div className="area-card__caption">
        <Heading as="h3" className="area-card__title">
          {label}
        </Heading>
        {note ? (
          <Script rotate={-1.5} className="area-card__note">
            {note}
          </Script>
        ) : null}
        <Body className="area-card__sentence">{sentence}</Body>
      </div>
    </Link>
  );
}

export function AreaCardGrid({ cards }: { cards: AreaCardProps[] }) {
  return (
    <div className="area-card-grid" role="list" aria-label="Areas of your life">
      {cards.map((card) => (
        <div role="listitem" key={card.area} className={`area-card-grid__item area-card-grid__item--${card.area}`}>
          <AreaCard {...card} />
        </div>
      ))}
    </div>
  );
}
