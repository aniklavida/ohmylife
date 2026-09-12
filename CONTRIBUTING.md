# Contributing

OhMyLife is pre-implementation. The specification, architecture and structure exist; working code does not yet.

**Implementation contributions are not being accepted until the foundation is complete.** Issues and discussion about the specification are welcome now, and the most useful thing you can bring today is an argument about the product rather than a patch.

## When contributions open

1. Read [`AGENTS.md`](AGENTS.md) first — it is the contract for humans and agents alike.
2. **Measure your change against the one rule: the AI maintains it, the user visits.** A change that asks the user to fill something in will not be merged, however well it is built.
3. The MCP server is the write path. The website reads. A new route that lets the website edit a life needs a reason in the pull request.
4. The guilt constraints — no counts, badges, streaks, scores, rings or red — are structural. Do not add a component that makes one possible.
5. Every write carries a required reason, and the reason becomes the visible tending line. Do not add a write path that bypasses it.
6. Every new dependency needs its licence stated in the pull request.
7. **Every photograph needs its own licence line in `theme.json`.** An image is not covered by this repository's MIT licence, and an image without a licence line will not be merged.

## Privacy is not a review nicety here

This project holds health and money data. Two things will be sent back:

- A read path that widens what an agent can see without going through the single access policy.
- **A privacy claim that is not true under every configuration** — most of all any wording implying data never leaves the machine, which is untrue the moment someone connects a hosted model.

Describe the server's guarantee and the connected agent's behaviour separately, always.

## Bug reports with real data

Redact before you post. Replace real names, account numbers, document numbers and photographs. A reproduction with plausible invented content is more useful than one we have to ask you to take down.

## Commit messages

Describe what changed and why. If the change touches a promise the product makes — storage durability, the absence of a delete path, the guilt constraints, or privacy — say so explicitly.
