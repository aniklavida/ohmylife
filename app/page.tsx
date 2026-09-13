// The home route. Not a separate quiet-state page and a separate normal-day
// page: docs/STRUCTURE.md is explicit that the quiet state "is not a
// separate route — it is what page.tsx renders when nothing needs anyone,"
// because that is the only way to guarantee it gets designed rather than
// stubbed behind an `if`. The life summary, the area cards and the tending
// panel that belong on a normal day in full are docs/ROADMAP.md step 5,
// "The place" — this route's job for this card was the quiet state, done
// first and properly; components/today/open-today.tsx is the honest,
// minimal placeholder for the other branch until that step lands.
import { computeOpenItems } from "../lib/summary/whats-open";
import { ensureFreshIndex, resolveDbPath, resolveLifeRoot } from "../lib/index/runtime";
import { QuietState } from "../components/quiet/quiet-state";
import { OpenToday } from "../components/today/open-today";

// Without this, Next has no reason to think this page is anything but
// static — nothing here reads a cookie or a header — and would happily
// prerender it once at build time and serve that same, increasingly stale
// answer forever. The whole product is "the AI keeps it current, and you
// visit" (docs/SPEC.md §2); a cached build-time snapshot of "what's open"
// would quietly break that promise on the very first screen.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const lifeRoot = resolveLifeRoot();
  const dbPath = ensureFreshIndex(lifeRoot, resolveDbPath());
  const items = computeOpenItems(dbPath);

  return items.length === 0 ? <QuietState /> : <OpenToday items={items} />;
}
