---
status: complete
priority: p2
issue_id: "014"
tags: [code-review, architecture, backend, agent-native]
dependencies: []
---

## Problem Statement
Several backend capabilities (schemas/services) are not exposed via API routes, limiting usability and agent-access parity.

## Findings
- `backend/src/app.ts` mounts only auth/users/categories/products/customers routes.
- Backend includes additional domains/services (serial generators, invoices, suppliers, inventories, settings) without route exposure.

## Proposed Solutions
### Option 1: Add REST endpoints for missing domains/services
- Pros: complete API surface
- Cons: additional route/auth work
- Effort: Medium
- Risk: Medium

### Option 2: Explicitly mark internal-only modules and remove dead paths
- Pros: clear boundaries
- Cons: feature scope reduction
- Effort: Medium
- Risk: Low

## Recommended Action


## Technical Details
- Affected: `backend/src/app.ts`, `backend/src/routes/*`, `backend/src/services/*`

## Acceptance Criteria
- [ ] Required backend capabilities are reachable through authenticated API endpoints.
- [ ] Internal-only modules are documented and not orphaned.

## Work Log
- 2026-03-03: Added from backend multi-agent review.

## Resources
- Review target: entire `backend/`
