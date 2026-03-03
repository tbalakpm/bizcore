---
status: complete
priority: p1
issue_id: "006"
tags: [code-review, security, backend, privacy]
dependencies: []
---

## Problem Statement
User API responses expose `passwordHash`, leaking sensitive credential material to clients.

## Findings
- `backend/src/routes/users.ts` uses broad selects/returns of user rows including `passwordHash`.

## Proposed Solutions
### Option 1: Explicitly select safe columns for all user responses
- Pros: safest and clear
- Cons: repetitive unless helper added
- Effort: Small
- Risk: Low

### Option 2: Response serializer that strips sensitive fields
- Pros: reusable safeguard
- Cons: additional abstraction
- Effort: Small
- Risk: Low

## Recommended Action


## Technical Details
- Affected: `backend/src/routes/users.ts`

## Acceptance Criteria
- [ ] No user endpoint returns `passwordHash`.
- [ ] Type-level guard/helper prevents accidental leakage.

## Work Log
- 2026-03-03: Added from backend multi-agent review.

## Resources
- Review target: entire `backend/`
