# Goal Description
Implement backend functionality for creating, reading, updating, deleting (CRUD), and printing Sales Invoices. This will mirror the robust functionality of `stock-invoices`, but will deduct stock instead of increasing it, and will reference `customers` instead of suppliers.

Since the `salesInvoices` and `salesInvoiceItems` schemas already exist, no database migrations are necessary. We will wire up the models and routing.

## Proposed Changes

### Models
- [NEW] `src/models/sales-invoice.model.ts`
  - Define TypeScript types for generating the payload types (`SalesInvoiceModel`, `SalesInvoiceItemModel`) aligning with the existing schemas.

### Routing Logic
- [NEW] `src/routes/sales-invoices.ts`
  - **`GET /`**: Fetch all sales invoices with pagination (`limit`, `offset`, `page`), filtering (`invoiceNumber`, `invoiceDate`, `minAmount`, `maxAmount` corresponding to `netAmount`), and column-based sorting.
  - **`GET /:id`**: Fetch a specific sales invoice along with its `items`, joined with `products`, `inventories`, and `customers` to get relevant names and product codes.
  - **`POST /`**: Process a new sales invoice. Wrap operations in a database transaction:
    - Automatically generate a sales invoice number via `serialNumberService`.
    - Create the invoice record.
    - Validate each incoming item, create `salesInvoiceItems`, and crucially, **decrease** `inventories.unitsInStock`.
  - **`PUT /:id`**: Update a sales invoice. 
    - Revert existing inventory deductions by restoring stock.
    - Delete old `salesInvoiceItems`.
    - Re-process the replacement items (insert them, decrease stock by new quantities). 
    - Update the main `salesInvoices` record.
  - **`DELETE /:id`**: 
    - Restore stock for all items associated with the invoice.
    - Delete `salesInvoiceItems`.
    - Delete the `salesInvoices` record.
  - **`GET /:id/pdf`**: Generate an A4 invoice PDF using `pdfkit`. The document will be neatly formatted with:
    - Company / Invoice Header.
    - Customer details.
    - Tabular display of items (Product, Qty, Unit Price, Tax, Line Total).
    - Summary section (Subtotal, Discount, Tax, Net Amount).

### App Registration
- [MODIFY] [src/app.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/app.ts)
  - Register `app.use('/api/sales-invoices', authRequired, salesInvoicesRouter);`

## Verification Plan
1. Create a Sales Invoice via the new API using tools like cURL or a local script.
2. Verify the `netAmount`, items, and `invoiceNumber` are accurately saved.
3. Validate that the product stock drops by the correct `qty` amount in the `inventories` table.
4. Call `GET /api/sales-invoices/:id/pdf` and ensure a PDF stream is successfully returned without errors.
