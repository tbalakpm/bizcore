# Sales Invoice PDF — Improvement Plan

## Goal

Upgrade the existing `GET /api/sales-invoices/:id/pdf` route from a bare-bones layout into a
complete, GST-compliant A4 invoice. No new libraries needed — PDFKit and bwip-js are already
installed.

---

## Current State (what already exists)

- `backend/src/routes/sales-invoices.ts` — PDF logic is **inline** in the route handler.
- `backend/src/services/print-sales-invoice.service.ts` — skeleton service exists but writes to
  a **file path** instead of streaming to `res`, and has **import-time side effects** (todo #012).
- IRN + QR code rendering already works but uses a **hardcoded seller GSTIN** (`'07AAGFF2194N1Z1'`).
- Items query fetches: `qty`, `unitPrice`, `taxAmount`, `lineTotal`, `productName` — missing
  `hsnSac`, `discountAmount`, `taxPct`.
- No company header, no customer address block, no CGST/SGST split, no footer.

---

## Files to Change

| File                                                     | Action                                                               |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| `backend/src/services/print-sales-invoice.service.ts`    | Rewrite — stream to `Response`, no side effects                      |
| `backend/src/routes/sales-invoices.ts`                   | Slim down PDF route to data-fetch + service call; expand items query |
| `frontend/src/app/sales-invoice/sales-invoice-form.html` | Add "Preview PDF" button                                             |

---

## Phase 1 — Fix the Service (prerequisite for everything else)

**File:** `backend/src/services/print-sales-invoice.service.ts`

### 1.1 Change signature

```ts
// Before
generateInvoicePDF(invoice: Invoice, filePath: string): void  // writes to disk

// After
generatePDF(data: SalesInvoicePdfData, res: Response): void   // pipes to Express response
```

Remove the `fs.createWriteStream` and `import * as fs`. Pipe `doc` directly to `res`.

### 1.2 Remove import-time side effects

The file currently instantiates the service and calls `generateInvoicePDF` at module load,
writing `./tmp/invoice.pdf`. Delete all code outside the class body. (Resolves todo #012.)

### 1.3 Define `SalesInvoicePdfData` interface

```ts
interface SalesInvoicePdfData {
  invoice: {
    invoiceNumber: string;
    invoiceDate: string;
    refNumber?: string | null;
    subtotal: string | number;
    discountAmount: string | number;
    taxAmount: string | number;
    roundOff: string | number;
    netAmount: string | number;
    // E-Invoice fields
    irn?: string | null;
    ackNo?: string | null;
    ackDate?: string | null;
    signedQrCode?: string | null;
  };
  company: {
    // fetched from settings table
    name: string;
    gstin: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
  };
  customer: {
    name: string;
    gstin?: string | null;
    billingAddress?: Address | null;
    shippingAddress?: Address | null;
  } | null;
  items: {
    productName: string;
    hsnSac?: string | null;
    qty: string | number;
    unitPrice: string | number;
    discountAmount: string | number;
    taxPct: string | number;
    taxAmount: string | number;
    lineTotal: string | number;
  }[];
}
```

---

## Phase 2 — Expand the Route's Data Fetch

**File:** `backend/src/routes/sales-invoices.ts` — `GET /:id/pdf` handler

### 2.1 Fetch company settings

```ts
const settingRows = await db.select().from(settings).all();
const s = Object.fromEntries(settingRows.map((r) => [r.key, r.value]));
// Keys expected: company_name, company_gstin, company_address_line1,
//                company_city, company_state, company_postal_code, company_phone
```

These keys need to exist in the `settings` table. If missing, fall back to empty strings.

### 2.2 Fetch customer with addresses

```ts
const customer = await db
  .select({
    name: customers.name,
    gstin: customers.gstin,
    billingAddressId: customers.billingAddressId,
    shippingAddressId: customers.shippingAddressId,
  })
  .from(customers)
  .where(eq(customers.id, invoice.customerId))
  .get();

// Then fetch addresses separately if IDs exist
```

### 2.3 Expand items query — add missing columns

```ts
const items = await db
  .select({
    qty: salesInvoiceItems.qty,
    unitPrice: salesInvoiceItems.unitPrice,
    discountAmount: salesInvoiceItems.discountAmount,   // ADD
    taxPct: salesInvoiceItems.taxPct,                   // ADD (for CGST/SGST split display)
    taxAmount: salesInvoiceItems.taxAmount,
    lineTotal: salesInvoiceItems.lineTotal,
    productName: products.name,
    hsnSac: inventories.hsnSac,                        // ADD
  })
  ...
```

### 2.4 Call the service

```ts
res.setHeader("Content-Type", "application/pdf");
res.setHeader(
  "Content-Disposition",
  `inline; filename=sales_invoice_${invoice.invoiceNumber}.pdf`,
);
new PrintSalesInvoiceService().generatePDF(
  { invoice, company, customer, items },
  res,
);
```

---

## Phase 3 — PDF Layout (inside `PrintSalesInvoiceService.generatePDF`)

Build the document in this top-to-bottom order on a single pass using `currentY` tracking.
Use `doc.addPage()` when `currentY > 720` (leave 122px bottom margin for footer).

### 3.1 Company header (top-centre)

```
[Company Name — 18pt Bold, centred]
[Address Line 1, City, State PIN — 9pt, centred]
[GSTIN: XXXXX  |  Phone: XXXXX — 9pt, centred]
[Horizontal rule]
```

### 3.2 Title + invoice meta (two-column)

```
Left:  "TAX INVOICE" — 14pt Bold
Right: Invoice No: SI-2025-0001
       Invoice Date: 01-Jan-2025
       Ref No / Ref Date (if present)
```

### 3.3 E-Invoice block (only if `invoice.irn` is present)

```
IRN:     <64-char hash — 7pt, wrapping>
Ack No:  <15 digits>     Ack Date: <ISO date>
[QR code image — 65×65px, top-right corner via bwip-js — already works, keep as-is]
```

Fix: replace hardcoded seller GSTIN in `generate-irn` route with `company.gstin` from settings.

### 3.4 Customer block (two-column)

```
Left:                        Right:
BILL TO                      SHIP TO
[customer.name]              [customer.name]
[GSTIN if present]           [shippingAddress if different]
[billingAddress lines]
```

If billing === shipping, only render the left column spanning full width.

### 3.5 Items table

Column layout (A4 width = 515pt usable with 40pt margins):

| #   | Product | HSN/SAC | Qty | Rate | Disc | Tax% | Tax Amt | Total |
| --- | ------- | ------- | --- | ---- | ---- | ---- | ------- | ----- |
| 20  | 170     | 55      | 40  | 55   | 40   | 35   | 50      | 50    |

- Header row: grey fill (`#CCCCCC`), bold, 9pt.
- Data rows: alternating white / very light grey (`#F7F7F7`), 9pt.
- On `currentY > 720`: call `doc.addPage()`, reset `currentY = 40`, re-draw the table header.

### 3.6 Totals block (right-aligned, after table)

```
Subtotal:                  X,XXX.XX
Discount:                 -  XXX.XX   (only if discountAmount > 0)
Taxable Amount:            X,XXX.XX
CGST (taxPct/2 %):            XX.XX
SGST (taxPct/2 %):            XX.XX
Round Off:                     X.XX   (only if roundOff != 0)
──────────────────────────────────
NET AMOUNT:               XX,XXX.XX
```

### 3.7 Footer (bottom of last page, y ≈ 750)

```
[Left]                                        [Right]
Bank: <bank_name from settings>               For <company_name>
A/c: <bank_account from settings>
IFSC: <bank_ifsc from settings>
                                              Authorised Signatory
Terms: <terms from settings, if any>
```

Draw a thin horizontal rule above the footer.

---

## Phase 4 — Settings Keys Required

The following keys must exist in the `settings` table (add via the settings UI or seed script):

| Key                     | Example Value                           |
| ----------------------- | --------------------------------------- |
| `company_name`          | Acme Traders                            |
| `company_gstin`         | 33AABCT1332L1ZQ                         |
| `company_address_line1` | 12, Gandhi Road                         |
| `company_city`          | Chennai                                 |
| `company_state`         | Tamil Nadu                              |
| `company_postal_code`   | 600001                                  |
| `company_phone`         | 9876543210                              |
| `bank_name`             | HDFC Bank                               |
| `bank_account`          | 5020012345678                           |
| `bank_ifsc`             | HDFC0001234                             |
| `invoice_terms`         | Goods once sold will not be taken back. |

---

## Phase 5 — Frontend: "Preview PDF" Button

**File:** `frontend/src/app/sales-invoice/sales-invoice-form.html`

Add next to the existing Save button (only shown in edit mode when `editingInvoice.id` exists):

```html
@if (editingInvoice.id) {
<button type="button" class="btn-secondary" (click)="previewPdf()">
  Preview PDF
</button>
}
```

**File:** `frontend/src/app/sales-invoice/sales-invoice-form.ts`

```ts
previewPdf() {
  window.open(this.service.getPdfUrl(this.editingInvoice.id!), '_blank');
}
```

`getPdfUrl` already exists on the service — no new service method needed.

---

## Acceptance Criteria

- [ ] `GET /api/sales-invoices/:id/pdf` returns a valid PDF with all 7 sections rendered.
- [ ] Importing `print-sales-invoice.service.ts` causes no filesystem side effects.
- [ ] Seller GSTIN on the PDF comes from `settings.company_gstin`, not a hardcode.
- [ ] QR code renders only when `irn` is present on the invoice.
- [ ] Items table overflows correctly to page 2+ with header repeated.
- [ ] "Preview PDF" button appears on the sales invoice edit form.
