---
status: pending
priority: p2
issue_id: "002"
tags: [code-review, architecture, quality, frontend, css]
dependencies: []
---

## Problem Statement
Global element selectors (`label`, `.dark label`, `.dark thead`, `.dark th`) apply dark/light styling to all tables and labels across the app, including future or third-party components.

## Findings
- Evidence: `frontend/src/styles.css` has element-level overrides without feature scoping.
- Impact: Reduced encapsulation and potential UI regressions in unrelated pages.
- Source: architecture-strategist.

## Proposed Solutions
### Option 1: Scope table/label rules to app container class
- Pros: immediate containment
- Cons: still broad within container
- Effort: Small
- Risk: Low

### Option 2: Replace element selectors with page/component classes
- Pros: strongest isolation, best long-term maintainability
- Cons: requires template updates
- Effort: Medium
- Risk: Low

### Option 3: Use CSS variables for theme tokens and inherit in components
- Pros: fewer hardcoded selectors/colors
- Cons: moderate refactor
- Effort: Medium
- Risk: Low

## Recommended Action


## Technical Details
- Affected file: `frontend/src/styles.css`
- Pattern: element/global selectors in shared stylesheet.

## Acceptance Criteria
- [ ] Label/table header contrast remains correct in both themes.
- [ ] Styles are scoped so unrelated components are not unintentionally modified.
- [ ] No regressions in existing pages after scoping.

## Work Log
- 2026-03-03: Created from architecture review findings.

## Resources
- Review target: current branch uncommitted diff
