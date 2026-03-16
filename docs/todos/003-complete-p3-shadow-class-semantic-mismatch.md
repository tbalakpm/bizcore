---
status: complete
priority: p3
issue_id: "003"
tags: [code-review, performance, quality, frontend, css]
dependencies: []
---

## Problem Statement
Dark mode currently applies `border: 1px solid` through `.dark .shadow`, which changes the semantic meaning of the `shadow` utility and can affect many elements broadly.

## Findings
- Evidence: `frontend/src/styles.css` contains `.dark .shadow { border: 1px solid #475569; }`.
- Impact: Potential visual inconsistency and avoidable wide selector matching on theme toggle.
- Source: architecture-strategist + performance fallback review.

## Proposed Solutions
### Option 1: Introduce dedicated class (e.g., `.card-border-dark`) and apply only where needed
- Pros: explicit intent, minimal side effects
- Cons: template touch points needed
- Effort: Small
- Risk: Low

### Option 2: Keep shadow semantics and adjust shadow token in dark mode
- Pros: utility naming remains correct
- Cons: may need careful visual tuning
- Effort: Small
- Risk: Low

### Option 3: Keep current rule
- Pros: no immediate work
- Cons: ongoing maintainability/perf ambiguity
- Effort: None
- Risk: Medium

## Recommended Action


## Technical Details
- Affected file: `frontend/src/styles.css`
- Related components: dashboard cards and any surface using `shadow` utility.

## Acceptance Criteria
- [ ] Card/surface borders are visible in dark mode.
- [ ] `shadow` class preserves expected semantics or replacement is explicit.
- [ ] No broad unintended border application in dark mode.

## Work Log
- 2026-03-03: Created from synthesized P3 findings.

## Resources
- Review target: current branch uncommitted diff
