---
status: complete
priority: p2
issue_id: "012"
tags: [code-review, backend, quality, performance]
dependencies: []
---

## Problem Statement
PDF service has import-time sample execution that writes files (`./tmp/invoice.pdf`) as a side effect.

## Findings
- `backend/src/services/print-sales-invoice.service.ts` instantiates service and generates PDF at module load.

## Proposed Solutions
### Option 1: Remove sample execution from service file
- Pros: pure service module
- Cons: sample usage moved elsewhere
- Effort: Small
- Risk: Low

### Option 2: Move sample code to isolated script/test file
- Pros: keeps example
- Cons: extra script maintenance
- Effort: Small
- Risk: Low

## Recommended Action


## Technical Details
- Affected: `backend/src/services/print-sales-invoice.service.ts`

## Acceptance Criteria
- [ ] Importing service causes no filesystem side effects.
- [ ] PDF generation occurs only via explicit call path.

## Work Log
- 2026-03-03: Added from backend multi-agent review.

## Resources
- Review target: entire `backend/`
