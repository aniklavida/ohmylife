# OhMyLife

**A self-hosted home for your whole life. Your AI keeps it current. You just visit.**

Memories, people, money, body, papers, decisions, someday — alongside the ordinary tasks, projects, goals, habits and areas. You host it. You connect whichever AI you already run over [MCP](https://modelcontextprotocol.io). It does the filing.

> **Pre-implementation.** This repository currently contains the product specification, architecture and structure. **There is no working release yet, and nothing described below is implemented.** Every capability is planned.

> **The name is not final.** `OhMyLife` is the working name and has not been trademark-cleared. It may change before v1.0.

## The one idea

> Every other life system: **you maintain it, and it shows you your data.**
> This one: **the AI maintains it, and you visit.**

That is not a feature. It is the test every design decision has to pass. If something asks you to fill in a field, tidy a database or sit through a weekly review, it does not belong here.

## Why these systems fail

The category tends to be honest about it in its own documentation. Guides to building one of these usually admit two things: completeness is a trap, because every database needs updating and every property needs filling — and the weekly review is the real investment, because without it everything slowly falls apart.

Both are rent you pay forever. You build the databases, you fill the properties for five weeks, you miss one review, and you never open it again. That is not a discipline problem — the system charged rent and stopped paying it.

An agent that reads, files and corrects removes both. But only if the product is built around the agent doing the work, rather than bolting an assistant onto a system that still expects you to type.

## What lives in it

The ordinary set — `Tasks` · `Projects` · `Goals` · `Habits` · `Areas` — and the seven that make it a life rather than a productivity system:

| Area | What it holds |
|---|---|
| **Memories** | What happened. Days, photographs, "four years ago this week" |
| **People** | Not contacts — when you last spoke, what they're waiting on, who you're drifting from |
| **Money** | What you have, what's coming, what you're saving toward |
| **Body** | Sleep, appointments, the things you keep rescheduling |
| **Papers** | Passport, insurance, transcripts — what you need at 2am |
| **Decisions** | What you chose and why, so you don't re-argue it in six months |
| **Someday** | Things with no date and no guilt attached |

## Two ways people use it

**Most days, a glance.** Open it, see what needs you, close it. Often the honest answer is *nothing* — which should make **"Nothing needs you today" the most-viewed screen in the product**, so it is the one being designed first and best. It is not an empty state and it should never look like a page that failed to load. A life system whose quiet days look broken has taught you that quiet is bad.

**Sometimes, a wander.** No task at all. Reading old memories, checking where the money is, noticing who has gone quiet. This is the mode that makes it a place rather than a tool.

## No guilt mechanics. Structurally.

**No counts. No badges. No streaks. No scores. No progress rings. Nothing red.**

Every one of those exists to manufacture guilt, and guilt is why people abandon these systems. They are not discouraged by a style guide here — they are absent from the schema and the component library:

- Habits store occurrences and **nothing computes a streak**. A streak you never calculate cannot be broken.
- `Someday` entries **cannot hold a due date**. The type does not have the field.
- A task past its date is *waiting*, in the same weight as everything else. **There is no visual escalation over time.**
- The design system has no badge, no ring, and no content-state red.

A design system that has no red badge cannot grow one by accident.

## Your AI's work is visible

Filed, corrected, and — the part that usually goes unrecorded — **deliberately left alone**.

> *"Added Thursday's dentist appointment from your message."*
> *"Your passport expiry said 2029; the scan says 2028. Changed it."*
> *"You've moved the dentist three times. I didn't reschedule it — that looked like a decision, not a slip."*

Every line is reversible from where you read it. An agent that only shows its edits looks like one that never holds back, and the most reassuring thing a system like this can say is *"I saw this and decided not to touch it."*

## A life is a directory

The store is plain files — markdown with front matter, and your original attachments beside them.

```
life/
├── memories/2019/2019-06-nani-house.md
├── people/rumi.md
├── papers/passport.md   +   passport.pdf
└── someday/learn-to-sail.md
```

SQLite is only an index. Delete it and it rebuilds from the files.

This matters more here than in most software. The product asks you to put your life in it. If the only copy lived in a schema that needed this app to read, it would have trapped the thing it promised to keep. Files survive the project being abandoned, survive a bad migration, and survive you changing your mind. Copy the folder and you have moved house. Put it in `git` and you have a backup strategy you already understand.

## Privacy, stated precisely

Health and money are in scope, so this has to be exact rather than reassuring. There are two boundaries, and only one of them is ours:

- **The OhMyLife server** stores everything on your own machine and makes no outbound network calls of its own. *(Planned. A v1 test will assert zero egress.)*
- **The AI you connect** is outside that boundary. If you connect a hosted model, whatever it reads travels to whoever runs that model. We can show you what was read. We cannot stop it leaving.

**So: "your data never leaves your machine" is not a claim this project makes**, because it would not be true under a cloud-hosted agent. What is true is that nothing leaves because of *us*, and that you choose what your agent is allowed to see.

The detailed access model — which areas an agent may read, what stays sealed, and what requires your explicit yes — is still being decided and is marked as open in the [specification](docs/SPEC.md).

## Bring your own AI

One protocol, any client — Claude, Codex, Gemini, or anything else that speaks MCP. No API key to paste into this app, no second subscription, and no decision by us about which model you are allowed to use.

The honest half of that: **the quality of the filing is your model's, not ours.** This app is a place and a protocol; what travels over it is whatever your agent produces. Nothing has been measured, because nothing is built yet.

## Themes are photographs you can swap

The design is warm and image-led — cream and parchment, deep forest green, terracotta, sage, lamplight throughout. The photographs are **data, not markup**: a theme is a folder with a manifest, a palette, and one image per slot. Drop in your own photographs and the mood changes while the structure stays put.

Light and dark are each designed, not inverted.

## Documentation

- [Product specification](docs/SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Folder structure](docs/STRUCTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)

## Licence

MIT. See [LICENSE](LICENSE).

Photographs shipped with a theme are licensed separately and individually, and each one's licence is recorded in its theme manifest. The MIT licence covers the code, not the images.
