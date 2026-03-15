# Fix: `product_serial_numbers` Not Updated on Create/Update

Four bugs in [products.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/routes/products.ts) prevent the serial number record from being correctly created or updated.

## Bugs Found

| # | Location | Bug |
|---|---|---|
| 1 | POST & PUT — condition check | `gtnGeneration === 'BATCH'` should be `=== 'batch'` (schema uses lowercase: `code`, `batch`, `tag`, `manual`) |
| 2 | PUT — body destructuring | `gtnMode` is missing from the destructured `req.body`, so it's never read |
| 3 | PUT — `db.update()` | `gtnMode` is not included in the `.set({})` call, so it's never saved |
| 4 | PUT — serial cleanup | When a product is switched **away** from `batch`/`tag` to `code` or `manual`, the old `product_serial_numbers` row is never deleted |

## Proposed Changes

### Backend

#### [MODIFY] [products.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/routes/products.ts)

**POST handler:**
- Fix condition: `'BATCH'` → `'batch'`, `'TAG'` → `'tag'`

**PUT handler:**
- Add `gtnMode` to `req.body` destructuring
- Add `if (gtnMode !== undefined) product.gtnMode = gtnMode;` 
- Add `gtnMode: product.gtnMode` to `.set({})` 
- Fix condition: `'BATCH'` → `'batch'`, `'TAG'` → `'tag'`
- Add `else` branch: when `gtnGeneration` changes to `code`/`manual`, delete existing `product_serial_numbers` row for this product

## Verification Plan

### Manual Verification

1. **Create a product with `gtnGeneration = batch`**: POST body `{ ..., gtnMode: 'auto', gtnGeneration: 'batch', gtnPrefix: 'BAT-', gtnStartPos: 1 }`. Confirm a row appears in `product_serial_numbers` for that `productId`.
2. **Update to `gtnGeneration = tag`**: PUT same product. Confirm the `product_serial_numbers` row is updated (not duplicated).
3. **Switch to `gtnGeneration = code`**: PUT again. Confirm the `product_serial_numbers` row is deleted.
4. **Switch to `gtnMode = manual`**: PUT again. Confirm no `product_serial_numbers` row exists.
5. **Switch back to `batch`**: PUT again. Confirm a fresh row is inserted in `product_serial_numbers`.
