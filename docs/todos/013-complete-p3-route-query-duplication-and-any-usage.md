---
status: complete
priority: p3
issue_id: "013"
tags: [code-review, backend, quality, maintainability]
dependencies: []
---

## Problem Statement
Route files duplicate pagination/filter/sort logic and rely on `any` casts, raising maintenance overhead.

## Findings
- Similar list-query logic appears in users/categories/products/customers routes.
- Multiple `any`/casting patterns reduce type safety.

## Proposed Solutions
### Option 1: Shared typed list-query utility
- Pros: less duplication, better consistency
- Cons: small refactor across routes
- Effort: Medium
- Risk: Low

### Option 2: Keep per-route logic but extract typed parser helpers
- Pros: incremental
- Cons: partial duplication remains
- Effort: Small
- Risk: Low

## Recommended Action


## Technical Details
- Affected: `backend/src/routes/users.ts`, `categories.ts`, `products.ts`, `customers.ts`

## Acceptance Criteria
- [ ] Shared typed helper(s) replace repeated query parsing.
- [ ] No unnecessary `any` casts in list endpoints.

## Work Log
- 2026-03-03: Added from backend multi-agent review.

## Resources
- Review target: entire `backend/`
