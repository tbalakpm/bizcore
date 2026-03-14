# GTN (Goods Tracking Number) — Implementation Walkthrough

## What Was Implemented

Full-stack implementation of Goods Tracking Number (GTN) generation and tracking across Products, Stock Invoices, and Sales Invoices.

---

## GTN Types

| Mode | Behaviour |
|------|-----------|
| **Default / CODE** | Uses the product's own code as GTN (no serial setup needed) |
| **BATCH** | All units in a stock line item share the **same auto-generated GTN** |
| **TAG** | Each unit in a stock line item gets its **own unique GTN** |

---

## Bug Fixes (March 14)

### 1. TAG/BATCH Generation Casing & Mode
- Fixed a bug where `gtnGeneration` casing mismatch (lowercase vs uppercase) caused generation to fallback to Default.
- Fixed the service call mode: changed from `product_code_as_tag_batch` (short-circuits) to `each_product` (properly increments counter).

### 2. Alphanumeric Prefix Rollover
- Implemented advanced logic to increment prefix alphabets when the numeric sequence is exhausted.
- **Example**: `AA-BB-CC-9999999999` rolls over to `AA-BB-CD-0000000001`.

### 3. Prefix Application Fix
- Resolved an issue where user-provided prefixes were not being applied because they weren't being correctly persisted or retrieved.
- Added `gtnPrefix` and `gtnStartPos` to the main `products` table and synchronized them with `product_serial_numbers`.
- Increased prefix storage length to 50 characters to support longer custom patterns.

### 4. TAG GTN Consolidation (Single Row with Range)
- Modified TAG product generation to keep Stock Invoice items as a **single row** even for multiple quantities.
- GTN is now stored as a range string (e.g., `TAG-000001 - TAG-000010`) in the `inventories` table.
- Implemented **read-only protection** in the frontend for these consolidated rows to ensure data integrity.

---

## Database Changes

### `products` table
- `gtn_generation TEXT(20)` — stores `'BATCH'`, `'TAG'`, or `NULL` (default = CODE)
- `gtn_prefix TEXT(50)` — optional prefix for auto-generated GTNs
- `gtn_start_pos INTEGER DEFAULT 1` — starting counter value for the serial

### `product_serial_numbers` table (new)
- Stores per-product serial number counters for BATCH and TAG modes
- Fields: `key`, `serialType` (tag_number | batch_number), `mode`, `productId`, `prefix`, `current`, `length`

### `inventories` table
- `gtn TEXT(20)` — the actual generated or manual tracking number per inventory row
- For TAG mode: one row per unit, each with a unique GTN
- For BATCH mode: one row for total qty with shared GTN

### `sales_invoice_items` table
- `inventory_id INTEGER NOT NULL` — replaced `product_id`; links sale line to the exact inventory batch/tag

---

## Backend Changes

### `routes/products.ts`
- Accepts `gtnGeneration`, `gtnPrefix`, `gtnStartPos` in POST / PUT body
- Creates/updates the corresponding `product_serial_numbers` entry for BATCH and TAG products

### `routes/stock-invoices.ts`
- `processInvoiceItems` handles three GTN flows:
  - **Manual**: passes `gtn` from request as-is
  - **TAG**: calls `productSerialNumberService.generate()` once **per unit** → individual inventory rows
  - **BATCH**: calls `productSerialNumberService.generate()` once for the **lot** → single inventory row
- Updates `unitsInStock` on inventory accordingly

### `routes/sales-invoices.ts`
- Uses `inventoryId` on sale items to deduct from the exact inventory row
- Rollback/delete restores stock from the exact same inventory row

### `routes/inventories.ts` (new)
- `GET /inventories` — returns available inventory rows (where `units_in_stock > 0`) joined with product name/code

---

## Frontend Changes

### Products Form (`products.html` / `products.ts`)
- Added **GTN Mode** select: Default / Batch Level / Tag Level
- Conditionally shows **Batch/Tag Prefix** and **Start Sequence** inputs when BATCH or TAG is selected
- Product list table now shows a **GTN Mode** badge column per product

### Stock Invoice Form (`stock-invoice-form.html` / `stock-invoice-form.ts`)
- Items table has a **GTN** input column with placeholder `"Auto-generate"`
- The quick-add product form also has GTN Mode dropdown (Default / Batch / Tag) with conditional prefix / start-seq fields

### Sales Invoice Form (`sales-invoice-form.html` / `sales-invoice-form.ts`)
- Item selection dropdown changed from product list to **inventory list** (GTN-tracked items)
- Dropdown shows: `GTN value — Product Name · Stock: qty`
- On selection, auto-fills `productId`, `gtn`, `unitPrice`, `taxPct`
- Validates that selected inventory has sufficient stock before save

### `inventory/inventory-service.ts` (new Angular service)
- Calls `GET /inventories` to fetch available stock items

---

## DB Schema Verification

```
sqlite3 bizcore.db .schema sales_invoice_items
```
Output confirms:
- `inventory_id INTEGER NOT NULL` — product_id removed ✅
- FK references `inventories(id)` ✅

```
sqlite3 bizcore.db .schema products
```
Output confirms:
- `gtn_generation text(20)` ✅
- `gtn_prefix TEXT(50)` ✅
- `gtn_start_pos INTEGER DEFAULT 1` ✅

---

## How to Test

1. **Create a product** with GTN Mode = `Batch Level`, prefix = `BATCH-`, start = 1
2. **Create a stock invoice** with that product, qty = 10 — GTN auto-generates as `BATCH-000001`
3. Check `inventories` table — should have 1 row for that product with `gtn = BATCH-000001`, `units_in_stock = 10`
4. **Create a sales invoice** — the GTN dropdown shows `BATCH-000001 - Product Name · Stock: 10`
5. Sell 5 units → `units_in_stock` drops to 5 on that inventory row
6. Delete the sales invoice → `units_in_stock` restored back to 10
