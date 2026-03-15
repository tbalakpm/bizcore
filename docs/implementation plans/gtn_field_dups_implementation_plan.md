# Refactor: Remove Duplicate GTN Fields and Integrate `length`

## Proposed Changes

### Database Schema

#### [MODIFY] [product.schema.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/db/schema/product.schema.ts)
- Remove `gtnPrefix` and `gtnStartPos` fields from the `products` table definition.

### Backend Routes

#### [MODIFY] [products.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/routes/products.ts)
- Update `GET /:id` to include `gtnLength` from `product_serial_numbers`.
- Update `POST /` to:
    - Stop saving `gtnPrefix` and `gtnStartPos` to `products`.
    - Accept `gtnLength` from request body and save it to `product_serial_numbers`.
- Update `PUT /:id` to:
    - Stop saving `gtnPrefix` and `gtnStartPos` to `products`.
    - Accept `gtnLength` from request body and save/update it in `product_serial_numbers`.

### Frontend

#### [MODIFY] [product-service.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/product/product-service.ts)
- Add `gtnLength?: number` to `Product` interface.

#### [MODIFY] [product-form.component.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/product/product-form.component.ts)
- Add `gtnLength` to the `blankProduct()` default state.
- Update `loadProduct()` to handle `gtnLength`.

#### [MODIFY] [product-form.component.html](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/product/product-form.component.html)
- Add an input field for `GTN Length`.

## Verification Plan

### Manual Verification
1. Create a product with `batch` generation, specifying prefix, start sequence, and length.
2. Verify in DB (using `sqlite3` or checking via API) that the values are stored in `product_serial_numbers` and NOT in `products`.
3. Update the product's GTN settings and verify they are correctly updated in `product_serial_numbers`.
4. Verify that the product list and product details shows the correct GTN configuration.

## Verification Plan

### Manual Verification

1. **Create a product with `gtnGeneration = batch`**: POST body `{ ..., gtnMode: 'auto', gtnGeneration: 'batch', gtnPrefix: 'BAT-', gtnStartPos: 1 }`. Confirm a row appears in `product_serial_numbers` for that `productId`.
2. **Update to `gtnGeneration = tag`**: PUT same product. Confirm the `product_serial_numbers` row is updated (not duplicated).
3. **Switch to `gtnGeneration = code`**: PUT again. Confirm the `product_serial_numbers` row is deleted.
4. **Switch to `gtnMode = manual`**: PUT again. Confirm no `product_serial_numbers` row exists.
5. **Switch back to `batch`**: PUT again. Confirm a fresh row is inserted in `product_serial_numbers`.
