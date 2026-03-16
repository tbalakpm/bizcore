---
status: complete
priority: p1
issue_id: "009"
tags: [code-review, security, backend, auth]
dependencies: []
---

## Problem Statement
JWT secret falls back to a hardcoded default, enabling token forgery if env config is missing.

## Findings
- `backend/src/config.ts` defines a default JWT secret value.

## Proposed Solutions
### Option 1: Fail startup when `JWT_SECRET` is missing
- Pros: strong guarantee
- Cons: stricter env requirements
- Effort: Small
- Risk: Low

### Option 2: Allow default only in explicit local-dev mode
- Pros: safer local ergonomics
- Cons: conditional complexity
- Effort: Small
- Risk: Medium

## Recommended Action


## Technical Details
- Affected: `backend/src/config.ts`

## Acceptance Criteria
- [ ] Production cannot start without secure JWT secret.
- [ ] Secret policy documented in env validation.

## Work Log
- 2026-03-03: Added from backend multi-agent review.

## Resources
- Review target: entire `backend/`
