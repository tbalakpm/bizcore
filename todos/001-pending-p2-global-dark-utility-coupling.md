---
status: pending
priority: p2
issue_id: "001"
tags: [code-review, architecture, quality, frontend, theming]
dependencies: []
---

## Problem Statement
Dark mode is implemented by globally overriding common utility classes (for example `.dark .bg-white`, `.dark .bg-slate-*`, `.dark .text-*`). This creates implicit cross-page coupling and increases regression risk when new screens reuse these utilities.

## Findings
- Evidence: `frontend/src/styles.css` contains broad global selectors for utility classes.
- Impact: Any component using these utilities is restyled even when not intended by feature scope.
- Source: architecture-strategist + code-simplicity-reviewer.

## Proposed Solutions
### Option 1: Move to template-level `dark:` classes
- Pros: explicit, predictable, component-local behavior
- Cons: requires touching multiple templates
- Effort: Medium
- Risk: Low

### Option 2: Introduce semantic component classes (e.g., `.card-surface`, `.muted-text`)
- Pros: central control with clearer intent
- Cons: refactor effort upfront
- Effort: Medium
- Risk: Low

### Option 3: Keep global overrides but scope under app shell class
- Pros: quickest containment
- Cons: still global inside shell
- Effort: Small
- Risk: Medium

## Recommended Action


## Technical Details
- Affected file: `frontend/src/styles.css`
- Related areas: dashboard cards, tables, icons, action labels across modules.

## Acceptance Criteria
- [ ] Dark-mode visuals remain correct on all touched pages.
- [ ] No new page gets unintended dark-mode style changes from generic utility usage.
- [ ] Styling intent is explicit (component-level or semantic classes).

## Work Log
- 2026-03-03: Created from multi-agent review synthesis.

## Resources
- Review target: current branch uncommitted diff
- Files: `frontend/src/styles.css`, `backend/src/public/index.html`
