import { notFound } from "next/navigation";
import { Plate } from "../../../components/primitives/plate";
import { Body, Display, Heading, Label } from "../../../components/primitives/prose";
import { SCENE_DESCRIPTION, sceneForArea } from "../../../components/scenes/scenes";
import { AREAS, type Area } from "../../../lib/entry/schema";
import { ensureFreshIndex, resolveDbPath, resolveLifeRoot } from "../../../lib/index/runtime";
import { listIndexedEntries } from "../../../lib/index/query";
import { sentenceForArea } from "../../../lib/summary/compose";

const AREA_LABEL: Record<string, string> = {
  memories: "Memories",
  people: "People",
  money: "Money",
  body: "Body",
  papers: "Papers",
  decisions: "Decisions",
  someday: "Someday",
  tasks: "Tasks",
  projects: "Projects",
  goals: "Goals",
  habits: "Habits",
  areas: "Areas",
};

// Read live, the same reason app/page.tsx is force-dynamic: an area is
// something the connected agent keeps changing, and a build-time snapshot
// of it would go stale the moment the AI files the next thing.
export const dynamic = "force-dynamic";

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  if (!AREAS.includes(area as Area)) notFound();
  const typedArea = area as Area;
  const label = AREA_LABEL[typedArea] ?? typedArea;
  const scene = sceneForArea(typedArea);

  const lifeRoot = resolveLifeRoot();
  const dbPath = ensureFreshIndex(lifeRoot, resolveDbPath());
  const rows = listIndexedEntries(dbPath)
    .filter((row) => row.area === typedArea && !row.entry.archived_at)
    .sort((a, b) => a.title.localeCompare(b.title));
  const sentence = sentenceForArea(dbPath, typedArea);

  return (
    <section className="area-page" aria-labelledby="area-page-heading">
      <Plate variant="hero" scene={scene} image={{ alt: SCENE_DESCRIPTION[scene] }}>
        <Label>Area</Label>
        <Display id="area-page-heading">{label}</Display>
        <Body>{sentence}</Body>
      </Plate>

      {rows.length > 0 ? (
        <ul className="area-page__list">
          {rows.map((row) => (
            <li key={row.id} className="area-page__item">
              <Heading as="h2">{row.title}</Heading>
              {row.entry.body ? <Body className="area-page__body">{row.entry.body}</Body> : null}
            </li>
          ))}
        </ul>
      ) : (
        <Body className="area-page__empty">Nothing filed here yet.</Body>
      )}
    </section>
  );
}
