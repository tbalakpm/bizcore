# GTN Implementation Plan

## Overview
Implement Goods Tracking Number (GTN) functionality for precise inventory tracking. Based on user feedback, GTN generation will be configured per product with types: `CODE`, `BATCH`, and `TAG`. The generation logic for `BATCH` and `TAG` will leverage the existing `product_serial_number` schema to manage prefixes and sequences.

Definitions:
- **CODE**: Uses the product's code (or similar static generation) for all quantities.
- **BATCH**: Each line item in a Stock invoice receives the *same* generated GTN value irrespective of quantity.
- **TAG**: Each quantity in a line item receives a *separate, newly generated* value while creating a Stock invoice.

---

### Database Schema Updates
No schema changes strictly required for the products table or serial tables, but we will ensure GTN tracking spans the correct relationships.

#### [MODIFY] `backend/src/db/schema/sales-invoice-items.schema.ts`
- Add `inventoryId: integer('inventory_id').references(() => inventories.id)` to explicitly track which exact GTN (batch/tag) was sold.

---

### Backend API Updates

#### [MODIFY] `backend/src/routes/products.ts`
- **POST / PUT**: Update the payload to accept `gtnGeneration` (`CODE`, `BATCH`, `TAG`, or empty) and configuration fields: `gtnPrefix` and `gtnStartPos`.
- When creating or updating a product with `BATCH` or `TAG`, we will concurrently `insert`/`update` a record in the `product_serial_numbers` table for this `productId`. 
  - `serialType` = `'batch_number'` or `'tag_number'`
  - `mode` = `'each_product'`
  - `prefix` = `gtnPrefix`
  - `current` = `gtnStartPos` (on insert)

#### [MODIFY] `backend/src/routes/stock-invoices.ts`
- Update `processInvoiceItems`:
  - If a manual GTN is provided in the payload, use it directly.
  - If auto-generating:
    - `gtnGeneration === 'CODE'`: Generate 1 `inventories` row with `unitsInStock = qty` using the product's code or static generation logic.
    - `gtnGeneration === 'BATCH'`: Call `productSerialNumberService.generateBatchNumber(productId, 'each_product', tx)` once. Create 1 `inventories` row with `unitsInStock = qty` and the generated Batch GTN.
    - `gtnGeneration === 'TAG'`: Loop `qty` times. In each iteration, call `productSerialNumberService.generateTagNumber(productId, 'each_product', tx)` and create 1 `inventories` row with `unitsInStock = 1` and the newly generated Tag GTN.

#### [MODIFY] `backend/src/routes/sales-invoices.ts`
- Update logic to deduplicate sales from specific inventory IDs.
- During deletion/updates, restore the `unitsInStock` correctly to the exact `inventoryId` linked on the invoice items.

---

### Frontend UI Updates

#### [MODIFY] `frontend/src/app/products/product-form.html` & `.ts`
- Add a dropdown for GTN Type: "CODE", "BATCH", "TAG".
- If "BATCH" or "TAG" is selected, dynamically show `Prefix` and `Starting Number` inputs.
- Read these values when fetching the product and save them using the Products API payload.

#### [MODIFY] `frontend/src/app/stock-invoice/stock-invoice-form.html` & `.ts`
- Add a manual `GTN Number` input column for each line item. Empty indicates auto-generation.

#### [MODIFY] `frontend/src/app/sales-invoice/sales-invoice-form.html` & `.ts`
- Require selecting a specific `inventoryId` (Batch/Tag/Code bucket) for products that utilize GTN. Adjust the autocomplete/dropdown or items logic to pick specific inventory references instead of just generic products.

---

## Verification Plan
1. **Product Configuration**: Create product setting GTN type to `BATCH` with prefix `BAT-24-` and start `100`. Verify `product_serial_numbers` is inserted correctly.
2. **Stock Entry (BATCH)**: Receive a quantity of 15. Verify 1 inventory row is made with GTN `BAT-24-000100` and `unitsInStock = 15`. Verify serial counter rises to `101`.
3. **Stock Entry (TAG)**: Change GTN type to `TAG` with prefix `TAG-` start `1`. Receive a quantity of 3. Verify exactly 3 inventory rows are made `TAG-000001`, `TAG-000002`, `TAG-000003` each with `unitsInStock = 1`.
4. **Sales Sales**: Open Sales invoice, pick the exact Tag `TAG-000002`. Verify inventory drops to 0.
