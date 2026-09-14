// The home route — the glance and the start of the wander (docs/SPEC.md §4).
// In the order docs/STRUCTURE.md lays out for this file: the life summary,
// what needs you today, the areas, and the tending record — here closing
// beside a banner that says whose place this is. What needs you keeps its
// own branch: "Nothing needs you today" is not a separate route
// (docs/STRUCTURE.md — "a quiet state buried in an `if` block is a quiet
// state nobody designed"), so it is designed here, in full, as one of the
// states this same route can render.
import { AreaCardGrid } from "../components/areas/area-card";
import { ClosingBanner } from "../components/home/closing-banner";
import { Script } from "../components/primitives/script";
import { LifeSummary } from "../components/summary/life-summary";
import { OpenToday } from "../components/today/open-today";
import { QuietState } from "../components/quiet/quiet-state";
import { TendingPanel } from "../components/tending/tending-panel";
import { ensureFreshIndex, resolveDbPath, resolveLifeRoot } from "../lib/index/runtime";
import { composeAreaCards, composeObservations } from "../lib/summary/compose";
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
  const today = new Date();

  const items = computeOpenItems(dbPath, today);
  const observations = composeObservations(dbPath, today);
  const areaCards = composeAreaCards(dbPath, today);
  const tending = readRecentTending(lifeRoot);
  const quiet = items.length === 0;

  return (
    <>
      <LifeSummary observations={observations} today={today} />
      {quiet ? <QuietState /> : <OpenToday items={items} />}

      <section className="house" aria-labelledby="house-heading">
        <header className="section-head">
          <h2 id="house-heading" className="section-head__title">
            Around the house
          </h2>
          <Script rotate={-2} className="section-head__note">
            {quiet ? "a good day to wander" : "wander in when there's time"}
          </Script>
        </header>
        <AreaCardGrid cards={areaCards} />
      </section>

      <div className="home-close">
        <TendingPanel records={tending} />
        <ClosingBanner />
      </div>
    </>
  );
}
