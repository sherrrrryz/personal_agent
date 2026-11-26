# Review: <spec or task name>

> Status: evergreen — template. Copy to `.orchestration/reviews/<name>.md`;
> the copy is runtime state. The verdict and any dismissed finding are quoted
> in the change description when the task closes.

<!--
Findings first, most severe first. No praise section, no summary of what the
work does. Every finding must be reproducible from what is written here.
-->

- **Reviewed:** `<spec path | branch @ commit | Figma node>` · **Kind:** `<spec | result | light>`
- **Reviewer session:** `<id>` — authored none of the reviewed work
- **Verdict:** `<pass | pass with notes | changes requested>`

## What was run

| Check | Result |
| --- | --- |
| `check:docs` | `<ok / n problems>` |
| `check:design-values` | `<ok / n raw values>` |
| Verification matrix | `<cells checked> / <cells required>` — `<which failed>` |
| Contrast pairs recomputed | `<n> / <n>` |
| Keyboard and screen-reader pass | `<components covered>` |

## Findings

| # | Severity | Where | Rule broken | What was observed |
| --- | --- | --- | --- | --- |
| 1 | `blocking` | `<file:line or node>` | `<doc § rule>` | `<observation, with how to reproduce>` |
| 2 | `should-fix` | | | |
| 3 | `note` | | | |

## Not checked

<What the reviewer could not verify, and why. An unverified area is stated,
never implied to be fine.>

## Re-review

| # | Fixed in | Confirmed |
| --- | --- | --- |
| 1 | `<commit>` | `<yes / no — what remains>` |
