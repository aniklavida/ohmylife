import Link from "next/link";
import type { AreaSummary } from "../../lib/summary/compose";
import { Plate } from "../primitives/plate";
import { Body, Heading } from "../primitives/prose";

const AREA_LABEL: Record<string, string> = {
  memories: "Memories",
  people: "People",
  money: "Money",
  body: "Body",
  papers: "Papers",
  decisions: "Decisions",
  someday: "Someday",
};

/**
 * One area, as a photograph and a human sentence — never a count
 * (docs/SPEC.md §6). The sentence comes from `lib/summary/compose.ts`,
 * composed from that area's own entries, not written here.
 */
export function AreaCard({ area, sentence }: AreaSummary) {
  const label = AREA_LABEL[area] ?? area;
  return (
    <Link href={`/areas/${area}`} className="area-card">
      <Plate
        variant="card"
        image={{
          alt: `A drawn scene standing in for ${label.toLowerCase()}, until a photograph is chosen.`,
        }}
      >
        <Heading as="h3">{label}</Heading>
        <Body>{sentence}</Body>
      </Plate>
    </Link>
  );
}

export function AreaCardGrid({ cards }: { cards: AreaSummary[] }) {
  return (
    <div className="area-card-grid" role="list" aria-label="Areas of your life">
      {cards.map((card) => (
        <div role="listitem" key={card.area}>
          <AreaCard {...card} />
        </div>
      ))}
    </div>
  );
}
