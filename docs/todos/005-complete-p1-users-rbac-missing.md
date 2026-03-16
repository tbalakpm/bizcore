---
status: complete
priority: p1
issue_id: "005"
tags: [code-review, security, backend, auth]
dependencies: []
---

## Problem Statement
User-management endpoints are protected only by authentication, not authorization, allowing non-admin users to create/update/delete users and roles.

## Findings
- `backend/src/app.ts` mounts `/api/users` with `authRequired` only.
- `backend/src/routes/users.ts` accepts role changes in create/update handlers.

## Proposed Solutions
### Option 1: Add RBAC middleware (admin-only for user management)
- Pros: clear, centralized policy
- Cons: route updates required
- Effort: Small
- Risk: Low

### Option 2: Enforce RBAC in service layer
- Pros: defense-in-depth
- Cons: more refactor
- Effort: Medium
- Risk: Low

## Recommended Action


## Technical Details
- Affected: `backend/src/app.ts`, `backend/src/routes/users.ts`, `backend/src/middleware/auth.ts`

## Acceptance Criteria
- [ ] Non-admin users cannot create/update/delete users.
- [ ] Role changes allowed only for authorized roles.
- [ ] Tests cover admin/non-admin behavior.

## Work Log
- 2026-03-03: Added from backend multi-agent review.

## Resources
- Review target: entire `backend/`
