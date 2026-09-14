import Link from "next/link";
import { Plate } from "../../components/primitives/plate";
import { Body, Display, Heading, Label } from "../../components/primitives/prose";
import { TendingRecordList } from "../../components/tending/tending-record-list";
import { resolveLifeRoot } from "../../lib/index/runtime";
import { groupTendingByDay, groupTendingByWeek } from "../../lib/tending/group";
import { readAllTending } from "../../lib/tending/record";

// Read live, the same reason app/page.tsx and app/areas/[area]/page.tsx are
// force-dynamic: this is the record of what an agent did most recently, and
// a build-time snapshot of it would go stale immediately.
export const dynamic = "force-dynamic";

export default async function TendedPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; entry?: string }>;
}) {
  const { view, entry } = await searchParams;
  const lifeRoot = resolveLifeRoot();
  const all = readAllTending(lifeRoot);
  const records = entry ? all.filter((record) => record.entryId === entry) : all;
  const groups = view === "week" ? groupTendingByWeek(records) : groupTendingByDay(records);

  return (
    <section className="tended-page" aria-labelledby="tended-page-heading">
      <Plate
        variant="hero"
        image={{ alt: "A drawn scene standing in for the tending record, until a photograph is chosen." }}
      >
        <Label>The record</Label>
        <Display id="tended-page-heading">While you were away</Display>
        <Body>
          {entry
            ? "Every line recorded about this one entry, oldest promise first."
            : "Everything filed, corrected, and deliberately left alone — every line reversible from here."}
        </Body>
      </Plate>

      {entry ? (
        <Link href="/tended">Back to the full record</Link>
      ) : (
        <nav className="tended-page__views" aria-label="Read as">
          <Link href="/tended" aria-current={view !== "week" ? "page" : undefined}>
            By day
          </Link>
          <Link href="/tended?view=week" aria-current={view === "week" ? "page" : undefined}>
            By week
          </Link>
        </nav>
      )}

      {groups.length > 0 ? (
        groups.map((group) => (
          <div key={group.key} className="tended-page__group">
            <Heading as="h2">{group.label}</Heading>
            <TendingRecordList records={group.records} />
          </div>
        ))
      ) : (
        <Body className="tended-page__empty">Nothing recorded yet.</Body>
      )}
    </section>
  );
}
