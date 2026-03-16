---
status: complete
priority: p2
issue_id: "010"
tags: [code-review, backend, operations, deployment]
dependencies: []
---

## Problem Statement
Database migrations run as part of normal app startup, increasing deployment risk and startup coupling.

## Findings
- `backend/src/app.ts` triggers DB initialization/migrations at runtime boot.

## Proposed Solutions
### Option 1: Move migrations to deployment pipeline only
- Pros: predictable operations
- Cons: process change required
- Effort: Small
- Risk: Low

### Option 2: Gate runtime migration by explicit env flag + lock
- Pros: safer fallback
- Cons: extra complexity
- Effort: Medium
- Risk: Medium

## Recommended Action


## Technical Details
- Affected: `backend/src/app.ts`, CI/deploy scripts

## Acceptance Criteria
- [ ] App startup does not auto-run migrations by default.
- [ ] Migration execution is explicit and observable in deployment flow.

## Work Log
- 2026-03-03: Added from backend multi-agent review.

## Resources
- Review target: entire `backend/`
