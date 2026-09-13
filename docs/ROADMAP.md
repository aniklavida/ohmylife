# Roadmap to v1.0

One useful, complete release, then maintenance driven by real issues and real demand. There will be no disposable early release.

## 0 · Lock

Positioning, the area set, the constraints, the folder structure and the visual direction are agreed and recorded.

**Two questions must be answered before step 3 can finish:** the privacy model, and whether an AI ships with the product. Both are marked open in the [specification](SPEC.md). Neither blocks steps 1 and 2.

**Done:** no unresolved product contradiction remains.

## 1 · The file format and the core

The entry envelope, the per-kind fields, reading and writing markdown on disk, the link graph, and the rebuildable index.

The constraints go in here, as types rather than conventions: `someday` cannot hold a date, habits have no streak field, and there is no delete path.

**Done:** a life folder can be written, read and searched, and deleting the index and restarting rebuilds it with no loss.

## 2 · The MCP server

The full tool surface, with `reason` required on every write, `leave_alone` as a real tool, and the tending record written as a by-product.

**Done:** a real agent — not a test harness — connects, is handed the schema, and files a memory, a person, a document and an appointment without anyone typing into a website.

## 3 · Access and privacy

The single access gate, per-area grants and revocation, and whatever the privacy decision turns out to require.

**Done:** an agent that has not been granted an area cannot read it and discovers that from the schema rather than by error; with no in-site provider key configured the server makes zero outbound calls, and with one the only outbound calls go to that provider — both asserted by tests.

## 4 · The design system and the quiet state

Tokens, the photographic primitives, the script accents, light and dark as two designed surfaces — and **"Nothing needs you today" built first**, because it is the screen people will see most.

**Done:** the quiet state is reviewed and approved as a designed screen, and the component library contains no badge, ring or content-state red.

## 5 · The place

Home with the life summary, the area cards, the tending panel, an area browsed, an entry in depth, and the movement between them.

Memories is the hardest of the areas and is built first for that reason — it is the least like a task list, so it is the honest test of whether this is a place rather than a tool.

**Done:** someone can wander in with no task, move between areas, and come out having read something they had forgotten.

## 6 · The theme layer

The manifest format, the default theme, per-image licences, and a second theme built only from the folder to prove the layer is real.

**Done:** swapping the theme folder changes every photograph and colour, and moves no layout.

## 7 · The rest of the areas

People, Money, Body, Papers, Decisions, Someday and the ordinary five, each to the depth the specification describes — not further.

**Done:** every area holds real content in the worked example, and none of them needs a person to maintain it.

## 8 · Self-hosting and release

The container, the volume, the one-command install, the skill, the documentation, a demo, and clean-install proof.

**Done:** someone who has never read the documentation can install it, connect their own agent, and have it file something on the first try.

## After v1.0

Maintain compatibility with the file format above everything else — people's lives will be in it. Fix reproducible bugs and security issues. Add areas or depth only from repeated user evidence.

The directions most likely to be next, none of them committed: household mode, richer memory media, and importers for the places a life already sits.
