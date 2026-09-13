// The home route — the glance and the start of the wander (docs/SPEC.md §4).
// Four things, in the order docs/STRUCTURE.md lays out for this file: the
// life summary, what needs you today, the areas, and the tending record. The
// middle one keeps its own branch: "Nothing needs you today" is not a
// separate route (docs/STRUCTURE.md — "a quiet state buried in an `if` block
// is a quiet state nobody designed"), so it is designed here, in full, as
// one of the states this same route can render.
import { AreaCardGrid } from "../components/areas/area-card";
import { LifeSummary } from "../components/summary/life-summary";
import { OpenToday } from "../components/today/open-today";
import { QuietState } from "../components/quiet/quiet-state";
import { TendingPanel } from "../components/tending/tending-panel";
import { ensureFreshIndex, resolveDbPath, resolveLifeRoot } from "../lib/index/runtime";
import { composeAreaCards, composeLifeSummary } from "../lib/summary/compose";
import { computeOpenItems } from "../lib/summary/whats-open";
import { readRecentTending } from "../lib/tending/record";

// Without this, Next has no reason to think this page is anything but
// static — nothing here reads a cookie or a header — and would happily
// prerender it once at build time and serve that same, increasingly stale
// answer forever. The whole product is "the AI keeps it current, and you
// visit" (docs/SPEC.md §2); a cached build-time snapshot of a life would
// quietly break that promise on the very first screen.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const lifeRoot = resolveLifeRoot();
  const dbPath = ensureFreshIndex(lifeRoot, resolveDbPath());

  const items = computeOpenItems(dbPath);
  const summaryLines = composeLifeSummary(dbPath);
  const areaCards = composeAreaCards(dbPath);
  const tending = readRecentTending(lifeRoot);

  return (
    <>
      <LifeSummary lines={summaryLines} />
      {items.length === 0 ? <QuietState /> : <OpenToday items={items} />}
      <AreaCardGrid cards={areaCards} />
      <TendingPanel records={tending} />
    </>
  );
}
