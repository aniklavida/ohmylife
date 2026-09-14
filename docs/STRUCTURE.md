# Folder structure

**Nothing here exists yet.** This is the shape the first commits build into.

## The naming rule

**Two vocabularies, kept apart.**

- **Life words** — `entry`, `area`, `kind`, `link`, `tending`. These appear in the MCP tool names, in the file format, in the interface and in the documentation. Learn five nouns and you know the whole product.
- **Engineering words** — ordinary ones. `app`, `lib`, `components`, `mcp`. No invented dialect; a structure nobody recognises is a structure nobody contributes to.

The rule that matters: **`entry` always means a markdown file on disk.** Never a database row, never an object in memory, never a rendered card. The moment it means two things, the plain-file promise has quietly stopped being true.

## Repository

```
weallhatelife/
├── README.md · LICENSE · CHANGELOG.md
├── CONTRIBUTING.md · SECURITY.md · CODE_OF_CONDUCT.md
├── AGENTS.md · CLAUDE.md · GEMINI.md
├── .github/
│   ├── ISSUE_TEMPLATE/ · PULL_REQUEST_TEMPLATE.md
│   └── workflows/validate.yml
├── docs/
│   └── SPEC.md · ARCHITECTURE.md · STRUCTURE.md · ROADMAP.md · RELEASE_CHECKLIST.md
│
├── app/            the place you visit — Next.js App Router
├── components/     the design system, then the surfaces
├── lib/            life core — the only code that touches a life
├── mcp/            the MCP server — the only write path
├── themes/         swappable photographs, palettes and type
├── skill/          tool-neutral instructions for whichever agent you run
├── examples/       one worked life folder, real content
└── tests/
```

## `app/` — the place you visit

```
app/
├── layout.tsx              sidebar, theme provider, type loading
├── page.tsx                HOME — summary, what needs you, areas, tending
├── areas/
│   ├── [area]/page.tsx       one area, browsed
│   └── [area]/[id]/page.tsx  one entry, in depth
├── tended/page.tsx         the full record of the AI's upkeep
├── settings/
│   ├── theme/page.tsx      pick a mood
│   ├── access/page.tsx     which areas an agent may read
│   └── connect/page.tsx    the MCP config to paste into your agent
└── api/
    └── tending/undo/       reverse one line, from where it is read
```

**Four screens carry the product:** home, an area browsed, an entry in depth, and the quiet state.

The quiet state is **not a separate route** — it is what `page.tsx` renders when nothing needs anyone. Keeping it on the main route is the only way to guarantee it gets designed rather than stubbed, because it is the screen you will see most often.

**`api/` is deliberately almost empty.** The website reads; the agent writes. Every route here is a human action that could not be an agent action. If this folder grows, the product is turning back into something you maintain.

## `components/`

```
components/
├── primitives/     the design system — the constraint layer
│   ├── plate.tsx        a photographic surface with text over it
│   ├── script.tsx       handwritten annotations, the voice
│   ├── prose.tsx        serif display and body
│   └── tokens.css       every colour, from the active theme
├── summary/        the life summary, composed
├── tending/        filed · corrected · left alone, each reversible
├── areas/          one card per area, photographic
└── quiet/          "Nothing needs you today"
```

**`primitives/` is where the constraints are enforced.** There is no badge component, no streak component, no progress ring, and no content-state red in `tokens.css`. A design system that has no red badge cannot grow one by accident — a stronger guarantee than a line in a contributing guide.

**`quiet/` is its own folder.** Separating it is what makes it reviewable as a screen; a quiet state buried in an `if` block is a quiet state nobody designed.

## `lib/` — life core

The only code allowed to touch a life.

```
lib/
├── entry/
│   ├── schema.ts        one envelope, many kinds
│   ├── read.ts · write.ts   markdown + front matter, on disk
│   ├── archive.ts       reversible. THERE IS NO DELETE
│   └── links.ts         typed edges
├── index/
│   ├── build.ts         SQLite, rebuildable from files at any time
│   ├── search.ts        full-text
│   └── migrate.ts
├── tending/
│   ├── record.ts        written from the required reason on every write
│   └── undo.ts
├── summary/
│   └── compose.ts       true observations → the home page
├── access/
│   └── policy.ts        which areas this agent may read — one place
└── theme/
    └── load.ts          read the manifest, expose tokens and image slots
```

**One schema definition, three consumers.** The MCP tool inputs, the file writer and the website all validate against the same schemas in `entry/schema.ts`. A format described in three places breaks in two of them — and this is the format someone's life is stored in.

**`archive.ts` exists and `delete.ts` does not.** That is the enforcement, not a review rule.

**`access/policy.ts` is the single gate.** Every read path asks it. With per-tool checks, the tool whose check is forgotten is the one that leaks health data.

## `mcp/` — the only write path

```
mcp/
├── server.ts            stdio by default; HTTP behind a token, off by default
└── tools/
    ├── get-life-schema.ts   ← includes what this agent may currently read
    ├── search-life.ts · read-entry.ts · list-area.ts
    ├── whats-open.ts        ← returns "nothing" as a first-class answer
    ├── create-entry.ts · update-entry.ts
    ├── link-entries.ts · attach-file.ts · archive-entry.ts
    ├── leave-alone.ts       ← restraint, recorded
    ├── propose.ts           ← needs your yes
    └── request-access.ts
```

**One file per tool**, so the registration list in `server.ts` reads as the product's entire agent-facing surface — which is the list that has to stay small.

**`tools/` never touches disk.** Everything goes through `lib/`. Without that rule, a tool eventually writes a file that skipped validation, and the first `someday` entry with a due date appears.

## `themes/`

```
themes/
└── lamplight/              the default
    ├── theme.json          palette · type stack · image slots · LICENCE PER IMAGE
    └── images/
        ├── hero/           the rotation
        └── areas/          one photograph per area card
```

A theme is **a folder you can copy and edit** with your own photographs, no code involved. That is the difference between a theme layer and a skin.

**Every image's licence is recorded in `theme.json` beside the image** — not in a separate file that drifts, and never assumed from this repository's MIT licence, which does not cover images. A photograph without a licence line does not enter the repository.

## `skill/`

```
skill/
├── tend-a-life.md      the source — tool-neutral
└── pointers/           thin per-host files that read the same words
```

One set of instructions, several hosts, nothing duplicated to drift. It tells whichever agent you already run how to tend a life well: check what is open, file with a reason, correct rather than duplicate, and say when you deliberately left something alone.

## `examples/` — one worked life

A small, real, believable life folder: a handful of memories, three people, a passport with an expiry, one decision with its reasoning, two somedays. It is what a new contributor runs the app against and what the screenshots come from.

**Real content — not `Lorem ipsum`, not `Person 1`.** A photographic product demonstrated with placeholder text looks like a template, and a life system demonstrated with fake entries cannot be judged at all.

## A life on disk

```
life/
├── memories/2019/2019-06-nani-house.md
├── people/rumi.md
├── money/accounts/city-bank-savings.md
├── papers/passport.md  +  passport.pdf
├── decisions/left-the-agency.md
├── someday/learn-to-sail.md
└── tended/2026-09-13.md
```

Markdown, front matter, and your original files beside them. **A life is a directory.** Copy the folder and you have moved house; put it in `git` and you have a backup strategy you already understand; open any file in any editor in twenty years and it still reads.

## Boundaries, and the tests that enforce them

- **`lib/` is the only code that touches disk.** `app/` and `mcp/` go through it.
- **`lib/` imports neither `app/` nor `mcp/`.**
- **The schemas are defined once**, in `lib/entry/schema.ts`.
- **No delete path exists for an agent, anywhere.**
- **`primitives/tokens.css` has no content-state red**, and `components/` has no badge, streak or ring.

All five are checkable in CI, and all five are wired as tests rather than review rules — because every one of them protects a promise the product made to a person about their own life.
