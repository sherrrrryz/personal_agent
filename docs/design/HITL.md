# Human in the loop — when the owner decides

> Status: evergreen — every point where an agent must stop for the owner, what
> it must bring, and what it may decide alone. If a situation is not listed
> under a gate or under "Always ask", the agent decides and records it.

<!--
HOW TO BUILD THIS DOC
- Start with the gates below. Add an "Always ask" row only after an agent
  decided something the owner wished they had been asked about; add a "Never
  ask" row only after an agent asked something the owner found pointless.
- Name the owner (and a deputy, if any) once, here.
-->

**Owner:** axue (product owner; no deputy) · **Where review happens:** the running prototype (`FOUNDATIONS.md` § Running prototype); ~~the Figma file after it~~ — Figma is **not in use in this project (D-04)**

## Three kinds of stop

| Kind | The agent… | Used for |
| --- | --- | --- |
| **Decide** | stops completely until the owner answers | Choices only the owner can make |
| **Review** | stops the affected work, continues anything independent | Looking at a finished stage |
| **Notify** | continues, and reports at the next gate | Decisions the agent made that the owner would want to know |

## Scheduled gates

| Gate | When | Kind | The owner is asked | Evidence the agent brings |
| --- | --- | --- | --- | --- |
| `G-0` | End of task 0 | Decide | Platform(s), UI kit, base values, verification matrix | Kit comparison against the criteria in `tasks/0-foundations.md`; one recommendation |
| `G-SPEC` | After every spec review | Decide | Approve the spec | The spec, the review verdict, open disagreements stated plainly |
| `G-1` | Task 1 passed independent review | Review | Is the structure right: IA coverage, component inventory, layout behaviour — **in the running prototype; task 1 is never mirrored** | Running prototype + matrix screenshots |
| `G-2` | Task 2 passed independent review, **before the mirror** | Review | Are the expanded values right: ramps, dark mode, type scale, elevation | Running prototype with the real values + coded swatch/specimen page + contrast table |
| `G-3` | Task 3 passed independent review, **before the mirror** | Review | Do the styled components and screens look right in every mode | Running components and screens, both themes, largest font scale |
| `G-5` | A task-5 batch is ready, **before the mirror** | Review | Are the new components and screens right; was each addition necessary and consistent | Running result + the admission record (`GOVERNANCE.md`) for anything added + before/after |
| ~~`G-MIRROR`~~ **not in use in this project (D-04)** | ~~After every mirror run (tasks 2, 3, each task-5 batch)~~ | Review | Does Figma match what was approved in code | Figma page + side-by-side screenshots of Figma and running code + mirror review verdict |
| `G-PUB` | Before anything leaves the repo or the draft file | Decide | ~~Publish a Figma library~~ (D-04), push the default branch (task 1: the owner's standing word is D-42 — verified integration legs, fast-forward only), release a package | What will change for whom |

A gate is passed only by the owner's explicit word in the conversation or a
resolved comment thread in the design file. Silence, an emoji, or an approval
of a *different* stage is not a pass.

> **D-04 — Figma is not in use in this project.** The paragraph below and
> `G-MIRROR` bind only if Figma is enabled by a later decision.

**Code before Figma, always.** Nothing is mirrored until the owner has seen
the coded result working and passed `G-2`, `G-3` or `G-5`. A change the owner
asks for at that gate is made and re-shown in code first; only the approved
commit is mirrored. `G-MIRROR` asks one narrower question — is Figma faithful
to it — and is not a second chance to redesign: a new design wish raised
there goes back to code and through its own gate.

## Always ask (any task, any time)

Stop and ask before doing any of these, even mid-package:

- Adding a **primitive** value that cannot be derived from the base values by
  the documented scale (a new hue, a new font family, an off-scale size)
- Adding a component that neither the UI kit nor `COMPONENTS.md` provides
  (approved in the spec at `G-SPEC` before it is built; looked at again in
  running code at `G-5`, before it is mirrored)
- Changing or removing an existing token's name or value, or an existing
  component's public props — these break consumers
- Departing from the UI kit's built-in accessibility behaviour
- A brand colour that cannot meet contrast in a required pairing — the fix
  changes the brand
- Making an exception to a hard rule in `CLAUDE.md`
- Upgrading or replacing the UI kit, the token tooling, or a font
- Anything requiring a licence, a paid plan, a real credential or a new account
- A spec that turns out to be wrong in a way that changes scope

## Never ask (decide, then record)

- Which existing token or component fits — pick the closest semantic match
- How to compose existing components into a layout that the spec describes
- Fixes for review findings that stay inside the approved spec
- File and symbol names that follow the documented conventions
- Order of work inside a package
- Anything a rule in this kit already answers

Record non-obvious ones as a Notify line in the package's completion note.

## How to ask

One question at a time, in plain language, with:

1. **The decision**, in one sentence
2. **The options** — two or three, each with what it costs later
3. **The recommendation** and why
4. **The evidence** — screenshots or a link to the exact Figma node, never
   "see the file"
5. **What is blocked** while waiting, and what continues

Never bundle an approval into a status report. Never ask the owner to check
something a tool can check.

## Evidence packet for a Review gate

- How to open the running result (`FOUNDATIONS.md` § Running prototype) — and, for `G-MIRROR` only, the link to the Figma page and node
- Screenshots of the **running code** at every cell of the verification
  matrix in `FOUNDATIONS.md` that the stage affects (viewport × theme × font
  scale)
- The independent review verdict and how each finding was closed
- The list of Notify items since the last gate
- A short "what to look at" list — the three or four judgement calls where the
  owner's eye matters most

## After the owner answers

- **Decide** answers go to `DECISIONS.md` the same day: the question, the
  answer, the date, what it binds. A decision that is written down is never
  asked again.
- **Review** comments are triaged by the lead: each becomes a fix in the
  current task, an amendment to a spec, a new spec, or a recorded "won't do"
  with the owner's agreement. Fixes land in code and are shown again; Figma is
  updated only if the stage was already mirrored, then the thread is resolved.
- Feedback that states a general preference ("never centre body text") becomes
  a rule in the owning doc, not a one-off fix.
