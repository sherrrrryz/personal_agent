# CLAUDE.md — Personal Agent design system

> Primary instruction set for every AI agent doing design work in this repo.
> Standing rules and pointers only — details live under `docs/design/`,
> progress lives in `.orchestration/` (runtime). There is no external issue
> tracker yet.

## What this is

Personal Agent is a **web prototype** of a personal AI agent — one person's
assistant for their own tasks and information, built in React for the
browser. There is no native app target for now. The owner is axue, who
reviews every stage on the running prototype. **Figma is not used in this
project (D-04):** the mirror stage, gate `G-MIRROR` and the Figma docs and
skill are kept in the repo but switched off; every stage closes at the
owner's review of the running code.
The product brief, IA map and base values are collected in task 0 and live
in `docs/design/FOUNDATIONS.md`; until gate `G-0` passes, no UI code is written.

**Stack:** web → React 19 + TypeScript, built with Vite · no app target ·
UI kit, styling system, token tooling and running prototype:
`docs/design/FOUNDATIONS.md`

## Task router — read these before starting

Load only the row for the task at hand. Every row also assumes this file.

| If the task is… | Playbook | Read first | Load skills |
| --- | --- | --- | --- |
| 0 · Collect inputs, choose platform and UI kit | `docs/design/tasks/0-foundations.md` | `WORKFLOW.md`, `FOUNDATIONS.md`, `HITL.md`, `DECISIONS.md`, `TOKENS.md` § One source, ~~`FIGMA-SYNC.md` § Before the first mirror~~ (D-04), the stack doc | — |
| 1 · Low-fi prototype from the IA map | `tasks/1-lofi-prototype.md` | `FOUNDATIONS.md`, `COMPONENTS.md`, `RESPONSIVE.md`, `ACCESSIBILITY.md`, `TOKENS.md` § Placeholder theme, `GOVERNANCE.md`, the stack doc | `/responsive` `/accessibility` `/design-tokens` |
| 2 · Expand base values into tokens | `tasks/2-design-tokens.md` | `FOUNDATIONS.md` § Base values, `TOKENS.md`, `GOVERNANCE.md`, `ACCESSIBILITY.md` § Contrast, `RESPONSIVE.md` § Unit policy, the stack doc § Tokens | `/design-tokens` `/accessibility` |
| 3 · Apply tokens to components | `tasks/3-apply-tokens.md` | `FOUNDATIONS.md` § Verification matrix, `COMPONENTS.md`, `TOKENS.md`, `RESPONSIVE.md` § Unit policy, `ACCESSIBILITY.md`, `GOVERNANCE.md`, the stack doc | `/design-tokens` `/responsive` `/accessibility` |
| ~~4 · Mirror an owner-approved stage in Figma~~ — **not in use in this project (D-04)** | ~~`tasks/4-figma-mirror.md`~~ | — | — (never load `/figma-mirror`) |
| 5 · Build on the existing system, no Figma | `tasks/5-extend-system.md` | `FOUNDATIONS.md`, `COMPONENTS.md`, `TOKENS.md`, `GOVERNANCE.md`, `UI-PITFALLS.md`, the stack doc | `/design-tokens` `/responsive` `/accessibility` |
| Writing a spec | `docs/specs/_TEMPLATE.md` | The task's playbook, `WORKFLOW.md`, `DECISIONS.md` | — |
| Reviewing a spec or a result | `REVIEW.md` | The spec; nothing from the author's session | `/design-review` |
| Leading an approved spec | `SESSIONS.md` | The spec, `WORKFLOW.md`, `HITL.md` | `/design-sessions` |
| Something looks wrong | `UI-PITFALLS.md` (by symptom) | — | — |
| About to ask the owner something | `HITL.md`, then `DECISIONS.md` | — | — |

Paths without a folder are under `docs/design/`. Stack doc =
`docs/design/stacks/react-web.md` (`react-native.md` is kept for a possible
future app target and is not in use). A `§ Name` reference matches the start
of a heading. Everything under `docs/`, one line per document: `docs/README.md`.

## Hard rules — design (never violate, any framework)

**Values**

1. No visual value outside the token source. No colour, size, spacing,
   radius, shadow, blur, opacity or duration literal in component or screen
   code — not "for now", not in low-fi.
2. One token source; every platform output is generated from it and never
   edited by hand (so would the Figma variables be, if Figma were in use — D-04).
3. Tokenise first, apply second. A new value enters the token source (through
   the admission test) before anything uses it.
4. Three tiers: primitive → semantic → component. Semantic tokens hold no raw
   value; components reference no primitive; modes exist on the semantic tier only.
5. Choose a token by its purpose, never because its value matches.
6. Every value is in the unit its role is assigned. Fixed units only for the
   allowlist in `RESPONSIVE.md` § Unit policy (hairlines, focus-ring, shadow
   and blur geometry, pill radius, intrinsic media).

**Components**

7. Use the chosen UI kit. Never hand-build a component the kit provides,
   never add a second kit.
8. Reuse before adding: use → compose → configure → extend → add. Anything
   new passes the admission test in `GOVERNANCE.md` and is registered in the
   same change. Near-duplicates are refused.
9. Every component implements all applicable states, every required mode,
   and its accessibility contract — at the moment it is created.
10. Components are theme-blind and carry no outer margin; nothing containing
    text has a fixed height.

**Kit-code exception (D-06):** files copied from shadcn/ui into
`src/components/ui/` are the kit, not our code. Rules 1, 6 and 10 and
`check:design-values` do not apply inside them (`design-values.config.json`
§ exclude). They are never edited to add literals. Everything we author —
wrappers, compositions, screens, tokens — follows every rule and is scanned.
Reviewers check every kit control in use for clipped text at 200% zoom.

**Responsive and accessible from the first commit**

11. Works across the whole verification matrix: every width, largest text
    size, every mode. No sideways page scroll, no clipped text, nothing lost
    at small sizes.
12. WCAG 2.2 AA: text contrast 4.5:1 (large 3:1), non-text 3:1; name, role
    and state on every interactive element; full keyboard operation; visible
    focus. Plus the platform target sizes: 44 pt on iOS, 48 dp on Android,
    44 CSS px on web where touch is possible (never under WCAG's 24 CSS px).
13. Colour is never the only carrier of meaning. Reduced motion is honoured.
14. Restyling never removes behaviour the kit provides.

**Figma — **not in use in this project (D-04)**; rules 15–16 bind only if Figma is enabled by a decision superseding D-04**

15. ~~Code first, Figma mirrors it. Code owns values and names. An edit made in
    Figma is a comment that returns to code, never the only home of a value.~~
16. ~~In Figma: bind variables, never paste values; themes are modes; screens
    are built from component instances; never a flattened image.~~

Stack-specific hard rules: `docs/design/stacks/react-web.md` § Hard rules.

## Hard rules — process

- **Big tasks need a spec** (`WORKFLOW.md` § Big task or small task). Never
  implement against a `draft` spec.
- **Three fresh sessions:** one writes the spec, another reviews it, and —
  after the owner approves — a third leads the execution. None inherits the
  previous one's conversation.
- **The lead delegates to child sessions** — real sessions, not background
  tasks or subagents — and writes no feature code itself.
- **400K tokens per session, hard cap.** Plan packages for 250K; at 300K stop
  and write the handoff (`SESSIONS.md`).
- **Every task gets an independent reviewer** that authored none of it. The
  reviewer does not fix; the author does not review.
- **Stop for the owner at every gate and for everything on the "Always ask"
  list in `HITL.md`.** A gate passes only on the owner's explicit word.
- **Check `DECISIONS.md` before asking.** Record every answer there the same day.
- **The owner's review of the running code closes every stage.** Every stage
  passes independent review, then the owner's review of the coded result
  (`G-1`, `G-2`, `G-3`, `G-5`); the next stage starts right after that gate.
  ~~After that, tasks 2 and 3 and every task-5 batch are mirrored in Figma,
  independently reviewed, and confirmed by the owner (`G-MIRROR`).~~ Mirroring
  is **not in use in this project (D-04)**.
- **Docs change in the same change as the behaviour.** Lessons go to
  `UI-PITFALLS.md` or the owning doc's Pitfalls section — never only to a
  session, a handoff or agent memory.
- Run `npm run check:docs` and `npm run check:design-values` green before any review.
- Never commit credentials. Never push the default branch or release a
  package without the owner (`G-PUB`).

## Agent memory

Memory is invisible to other agents. It may hold only how the owner likes to
work, an in-flight verbal decision until `DECISIONS.md` absorbs it, and facts
that must not enter the repo. Never task status.

## Common commands

```bash
npm run dev                  # run the prototype — http://localhost:5173
npm run tokens:build         # regenerate src/tokens/generated/ from tokens/ (Style Dictionary, scripts/build-tokens.mjs)
npm run check:design-values  # node scripts/check-design-values.mjs — no raw visual values under src/
npm run check:docs           # node scripts/check-docs.mjs — docs index and status headers
npm run verify               # both checks + lint + build
npm test                     # vitest run — component, token and registry-parity tests; also the last step of verify
```
