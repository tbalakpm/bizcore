---
status: complete
priority: p1
issue_id: "008"
tags: [code-review, backend, schema, migrations, data-integrity]
dependencies: []
---

## Problem Statement
Schema definitions and migrations/snapshots are out of sync for invoice and product-serial tables/columns.

## Findings
- Drift in `stock_invoice_items` columns/FKs between `src/db/schema` and `drizzle/*.sql`.
- Missing migration/snapshot coverage for `sales_invoices` and `product_serial_numbers` despite schema files.

## Proposed Solutions
### Option 1: Generate reconciliation migrations from current TS schema and validate on staging DB copy
- Pros: single source of truth
- Cons: may require data transform scripts
- Effort: Large
- Risk: Medium

### Option 2: Align TS schema back to live DB and postpone structural changes
- Pros: quick runtime stability
- Cons: delays intended model
- Effort: Medium
- Risk: Medium

## Recommended Action


## Technical Details
- Affected: `backend/src/db/schema/*.ts`, `backend/drizzle/*.sql`, `backend/drizzle/meta/*`

## Acceptance Criteria
- [ ] All schema entities used by code exist in migration chain and snapshot.
- [ ] Column/FK names are consistent between TS schema and DB.
- [ ] `db:check` and migration apply cleanly on empty + existing DB.

## Work Log
- 2026-03-03: Added from backend multi-agent review.

## Resources
- Review target: entire `backend/`
