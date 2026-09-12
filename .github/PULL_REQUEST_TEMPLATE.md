## What changed


## Why


## The one rule

- [ ] This change does not ask the user to enter, tidy, reconcile or review anything
- [ ] It does — and here is why that is unavoidable:

## The constraints

- [ ] No count, badge, streak, score, progress ring or content-state red was added
- [ ] `someday` still cannot hold a due date
- [ ] Nothing computes a habit streak
- [ ] A task past its date still renders in the same weight as any other

## Storage and agent safety

- [ ] The plain files remain the store; nothing was added that lives only in the index
- [ ] The index still rebuilds from the files
- [ ] No delete path was added for an agent
- [ ] Every new write carries a required reason, and it reaches the tending record

## Privacy

- [ ] No read path was widened outside the single access policy
- [ ] No privacy claim was added that would be untrue under any supported configuration
- [ ] Not applicable

## Dependencies and assets

- [ ] No new dependency
- [ ] New dependency declared with its licence
- [ ] No new image
- [ ] New image declared with its own licence in the theme manifest

## Verification

- [ ] Tests added or updated
- [ ] Structural tests still pass
- [ ] Documentation updated where behaviour changed

## Truthfulness

- [ ] Nothing in this change describes a planned capability as working

## Provenance

- [ ] No copied or adapted code
- [ ] Copied or adapted code is declared with its source, commit and licence
