# docs/ — index

> Status: evergreen — the map of every document under `docs/`. Each line says
> what question that document answers, so an agent can pick the right one
> without opening five. `CLAUDE.md` § Task router says which ones a task needs.

<!--
HOW TO BUILD THIS FILE
- One row per document. The right-hand column is the QUESTION the document
  answers, not its title or a summary.
- A document that cannot be described as one question is two documents.
- `scripts/check-docs.mjs` fails when a doc is missing from this index, a link
  here is dead, or a spec row's status disagrees with the spec.
-->

Every `.md` below carries a `> Status:` header: **evergreen** (binding today)
or **historical** (a snapshot, context only). Specs use `draft` / `approved` /
`implemented` / `superseded`.

Four kinds of document, so you know what you are opening:

- **Process** — how work is run. Same in every project.
- **Rules** — what good looks like in one domain, with sources.
- **Project record** — this product's decisions and inventory. Filled as you go.
- **Playbook** — the steps for one task type.

## Process (`design/`)

| Document | The question it answers |
| --- | --- |
| [design/WORKFLOW.md](design/WORKFLOW.md) | Which steps does a design task go through, in what order, and when is each task type done? |
| [design/SESSIONS.md](design/SESSIONS.md) | Which session does what, how much may it consume, and how is unfinished work handed over? |
| [design/HITL.md](design/HITL.md) | When must I stop for the owner, what do I bring, and what may I decide alone? |
| [design/REVIEW.md](design/REVIEW.md) | Who reviews, what do they check for this task, and how are findings closed? |
| [design/GOVERNANCE.md](design/GOVERNANCE.md) | May I add this token or component — and how is the system kept small? |

## Rules (`design/`, `design/stacks/`)

| Document | The question it answers |
| --- | --- |
| [design/TOKENS.md](design/TOKENS.md) | How are tokens tiered, named, expanded from base values and switched per mode — and which colour pairings are allowed? |
| [design/RESPONSIVE.md](design/RESPONSIVE.md) | How must this adapt to screen size and text size, and which unit does this value take? |
| [design/ACCESSIBILITY.md](design/ACCESSIBILITY.md) | What is the accessibility bar, where does each number come from, and what must each component expose? |
| [design/FIGMA-SYNC.md](design/FIGMA-SYNC.md) | Which side owns what between code and Figma, what is mirrored and when, in what order, and how is drift found? — **not in use in this project (D-04)** |
| [design/stacks/react-web.md](design/stacks/react-web.md) | How are the rules met in React on the web — units, tokens, accessibility APIs, kits? |
| [design/stacks/react-native.md](design/stacks/react-native.md) | How are the rules met in React Native — units, font scaling, safe areas, accessibility APIs, kits, platform conventions? |

## Project record (`design/`)

| Document | The question it answers |
| --- | --- |
| [design/FOUNDATIONS.md](design/FOUNDATIONS.md) | What is this product built on — platforms, UI kit, base values, IA map, verification matrix, commands? |
| [design/IA-MAP.md](design/IA-MAP.md) | Which screens and modules exist, with what id, under which parent, and of which screen type? |
| [design/COMPONENTS.md](design/COMPONENTS.md) | What contract does every component meet, where does component code live, which family file holds a component's row, and which kit files are patched or not used? |
| [design/DECISIONS.md](design/DECISIONS.md) | Has the owner already answered this, and what did real packages cost? |
| [design/figma-file-map.md](design/figma-file-map.md) | Which Figma node is the page, variable collection, component or screen I need? — **not in use in this project (D-04)** |
| [design/UI-PITFALLS.md](design/UI-PITFALLS.md) | I see this symptom — what silently went wrong, and what is the rule? |

## Component registry (`design/components/`)

Project record, split by family; the contract, the conventions and the index
are in `design/COMPONENTS.md`. Each file has one writer — the package that
builds the family.

| Document | The question it answers |
| --- | --- |
| [design/components/layout.md](design/components/layout.md) | Which layout primitives exist, and what does each expose to assistive technology? |
| [design/components/actions.md](design/components/actions.md) | Which action controls exist, where does each come from, and what is its accessibility contract? |
| [design/components/inputs.md](design/components/inputs.md) | Which form controls exist, where does each come from, and what is its accessibility contract? |
| [design/components/navigation.md](design/components/navigation.md) | Which navigation components exist, where does each come from, and what is its accessibility contract? |
| [design/components/containers.md](design/components/containers.md) | Which containers and overlays exist, where does each come from, and what is its accessibility contract? |
| [design/components/feedback.md](design/components/feedback.md) | Which feedback and status components exist, where does each come from, and what is its accessibility contract? |
| [design/components/data-display.md](design/components/data-display.md) | Which data-display components exist, where does each come from, and what is its accessibility contract? |
| [design/components/chat.md](design/components/chat.md) | Which chat components exist, and what is the accessibility contract of each? |
| [design/components/blocks.md](design/components/blocks.md) | Which text, empty and proposal blocks may a workflow emit, what renders them, and what is the accessibility contract of each? |
| [design/components/data-blocks.md](design/components/data-blocks.md) | Which data blocks may a workflow emit, and what is the accessibility contract of each? |
| [design/components/module.md](design/components/module.md) | What is the module frame made of, and what is its accessibility contract? |
| [design/components/workflow.md](design/components/workflow.md) | Which components make up the workflow canvas, and what is the accessibility contract of each? |

## Playbooks (`design/tasks/`)

| Document | The question it answers |
| --- | --- |
| [design/tasks/0-foundations.md](design/tasks/0-foundations.md) | How do I collect the inputs and get the platform, UI kit and matrix decided? |
| [design/tasks/1-lofi-prototype.md](design/tasks/1-lofi-prototype.md) | How do I turn the IA map into a responsive, accessible low-fi prototype on the UI kit? |
| [design/tasks/2-design-tokens.md](design/tasks/2-design-tokens.md) | How do I expand the base values into a complete token set with every mode? |
| [design/tasks/3-apply-tokens.md](design/tasks/3-apply-tokens.md) | How do I style the components from tokens without breaking adaptive behaviour? |
| [design/tasks/4-figma-mirror.md](design/tasks/4-figma-mirror.md) | Once the owner approved the running code, how do I rebuild that stage in Figma and get the match confirmed? — **not in use in this project (D-04)** |
| [design/tasks/5-extend-system.md](design/tasks/5-extend-system.md) | How do I build something new from the existing system when there is no Figma? |

## Templates (`design/templates/`, `specs/`)

| Document | The question it answers |
| --- | --- |
| [specs/\_TEMPLATE.md](specs/_TEMPLATE.md) | What must a design spec contain before it can be reviewed and approved? |
| [design/templates/HANDOFF.md](design/templates/HANDOFF.md) | What must I write so the next session can continue without re-reading? |
| [design/templates/REVIEW-REPORT.md](design/templates/REVIEW-REPORT.md) | How does a reviewer report findings and a verdict? |

## Outside `docs/`

Not checked by `check:docs`; listed so nothing is invisible.

| File | What it is |
| --- | --- |
| `CLAUDE.md` | Hard rules and the task router — in context at the start of every session |
| `.claude/skills/responsive`, `accessibility`, `design-tokens` | Working rules loaded before any UI or token change |
| `.claude/skills/design-sessions`, `design-review` | Procedures for leading and reviewing |
| `.claude/skills/figma-mirror` | Procedure for mirroring — **not in use in this project (D-04)**; never loaded |
| `scripts/check-design-values.mjs` | Gate: no raw visual values outside the token source (config: `design-values.config.json`) |
| `scripts/check-docs.mjs` | Gate: this index and the status headers |
| `.oxlintrc.json` | Gate (`npm run lint`): only `src/components/` may import the kit files in `src/components/ui/` |
| `src/test/registry-parity.test.ts` | Gate (`npm test`): every component has a row in its family file and every row has its code |
| `tokens/README.md` | The layout of the token source and how it is built |
| `docs/design/figma-ledger.json` | Committed ids of everything created in Figma — **not in use in this project (D-04)**; does not exist |
| `.orchestration/` | Runtime state of the task in progress — untracked; add it to `.gitignore` |

## Design specs (`specs/`)

| Spec | Status | The question it answers |
| --- | --- | --- |
| [specs/lofi-prototype-system.md](specs/lofi-prototype-system.md) | `approved` | Task 1, part 1: which tooling, placeholder theme, base components and matrix harness does the prototype stand on, and in which waves is all of task 1 built? |
| [specs/lofi-prototype-shell.md](specs/lofi-prototype-shell.md) | `approved` | Task 1, part 2: how do the fake runtime, the app shell, the chat surfaces, the blocks and the module frame work, and who builds each? |
| [specs/lofi-prototype-screens.md](specs/lofi-prototype-screens.md) | `approved` | Task 1, part 3: what does every IA screen, the workflow editor and the memory view show, and how are the hero flow and the matrix accepted? |
