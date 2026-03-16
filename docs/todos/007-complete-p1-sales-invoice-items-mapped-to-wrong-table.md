---
status: complete
priority: p1
issue_id: "007"
tags: [code-review, architecture, backend, schema, data-integrity]
dependencies: []
---

## Problem Statement
`salesInvoiceItems` schema is mapped to `stock_invoice_items` and references stock invoice FK, causing domain collision and data integrity risk.

## Findings
- `backend/src/db/schema/sales-invoice-items.schema.ts` uses `sqliteTable('stock_invoice_items', ...)` and FK to `stockInvoices.id`.

## Proposed Solutions
### Option 1: Correct schema to `sales_invoice_items` + FK to `sales_invoices.id`
- Pros: correct domain boundaries
- Cons: migration required
- Effort: Medium
- Risk: Medium

### Option 2: If intentional, rename schema/type to stock-specific and remove sales naming
- Pros: consistency
- Cons: likely not intended business behavior
- Effort: Small
- Risk: High

## Recommended Action


## Technical Details
- Affected: `backend/src/db/schema/sales-invoice-items.schema.ts`, migrations under `backend/drizzle/`

## Acceptance Criteria
- [ ] Sales invoice items persist in dedicated table.
- [ ] FK points to sales invoice parent.
- [ ] Migration safely handles existing data.

## Work Log
- 2026-03-03: Added from backend multi-agent review.

## Resources
- Review target: entire `backend/`
