# PDF Report Engine — Generalisation Plan

## Problem

Every new report (sales invoice, purchase invoice, stock report, ledger, etc.) currently
needs its own service with duplicated logic for: page setup, company header, address blocks,
item tables, totals, footer, multi-page overflow, and company settings fetch.

At 10–15 reports this becomes unmaintainable. One change to the company header means editing
15 files.

---

## Solution: A Shared PDF Engine

Build a thin engine in `backend/src/services/pdf/` with three layers:

```
backend/src/services/pdf/
├── engine/
│   ├── pdf-document.ts          # wraps PDFKit, owns page lifecycle & currentY
│   ├── pdf-sections.ts          # reusable section renderers (header, table, totals, footer)
│   └── pdf-types.ts             # shared interfaces (CompanyInfo, Address, TableColumn, etc.)
├── reports/
│   ├── sales-invoice.report.ts  # data-fetch + calls engine sections
│   ├── purchase-invoice.report.ts
│   ├── stock-invoice.report.ts
│   └── ...                      # each new report is ~50 lines
└── index.ts                     # re-exports all reports
```

Each report is responsible for **only**:

1. Fetching its own data from the DB.
2. Calling the shared section renderers in the right order.

Every report gets for free: company header, footer, multi-page overflow, CGST/SGST split.

---

## Layer 1 — `pdf-types.ts` (shared interfaces)

```ts
export interface CompanyInfo {
  name: string;
  gstin: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  terms?: string;
  sgstSharingRate: number; // default 50
  igstSharingRate: number; // default 100
}

export interface Address {
  name?: string;
  gstin?: string;
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
}

export interface TableColumn {
  header: string;
  width: number; // pt
  align?: "left" | "right" | "center";
  key: string; // key into row object
  format?: (val: unknown) => string;
}

export interface ReportMeta {
  title: string; // e.g. "TAX INVOICE", "PURCHASE ORDER", "STOCK REPORT"
  number: string; // invoice / report number
  date: string;
  extraMeta?: { label: string; value: string }[]; // Ref No, Ref Date, etc.
}
```

---

## Layer 2 — `pdf-document.ts` (page lifecycle)

```ts
export class PdfDocument {
  private doc: PDFKit.PDFDocument;
  public y: number;
  readonly marginLeft = 40;
  readonly marginRight = 40;
  readonly marginTop = 40;
  readonly marginBottom = 60;
  readonly pageWidth = 595; // A4 pt
  readonly usableWidth: number; // pageWidth - marginLeft - marginRight = 515

  constructor(res: Response) {
    this.doc = new PDFDocument({ margin: this.marginTop, size: "A4" });
    this.doc.pipe(res);
    this.y = this.marginTop;
    this.usableWidth = this.pageWidth - this.marginLeft - this.marginRight;
  }

  /** Advance Y, auto-add page if needed. Calls onNewPage (for repeating headers). */
  advance(height: number, onNewPage?: () => void): void {
    if (this.y + height > this.pageHeight - this.marginBottom) {
      this.doc.addPage();
      this.y = this.marginTop;
      onNewPage?.();
    }
    this.y += height;
  }

  end(): void {
    this.doc.end();
  }

  // Expose doc for sections that need raw PDFKit calls
  get raw(): PDFKit.PDFDocument {
    return this.doc;
  }
}
```

---

## Layer 3 — `pdf-sections.ts` (reusable renderers)

Each function takes `(pdf: PdfDocument, data: ..., company: CompanyInfo)` and draws its section.
All use `pdf.advance()` so overflow is handled automatically.

### Sections available to every report

```ts
// 1. Company header — centred name, address, GSTIN
export function renderCompanyHeader(pdf, company: CompanyInfo): void;

// 2. Report title + meta block (two-column)
export function renderReportMeta(pdf, meta: ReportMeta): void;

// 3. E-Invoice block (IRN, Ack No, QR code) — skipped if no IRN
export function renderEInvoiceBlock(
  pdf,
  irn?: string,
  ackNo?: string,
  ackDate?: string,
  signedQrCode?: string,
): void;

// 4. Two-column address block (Bill To / Ship To, or Supplier / Delivery)
export function renderAddressBlock(
  pdf,
  left: Address,
  right?: Address,
  leftLabel?: string,
  rightLabel?: string,
): void;

// 5. Generic items table — columns driven by TableColumn[]
export function renderItemsTable(
  pdf,
  columns: TableColumn[],
  rows: Record<string, unknown>[],
  onNewPage: () => void,
): void;

// 6. Totals block (right-aligned, auto CGST/SGST or IGST based on settings)
export function renderTotals(
  pdf,
  totals: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    taxPct: number;
    roundOff: number;
    netAmount: number;
  },
  company: CompanyInfo,
): void;

// 7. Footer (bank details, terms, signatory)
export function renderFooter(pdf, company: CompanyInfo): void;

// 8. Horizontal rule
export function renderRule(pdf): void;
```

---

## Layer 4 — Individual Report Files

Each report file has exactly two responsibilities:

1. `fetchData(id, db)` — query the DB, return typed data.
2. `render(data, company, pdf)` — call sections in order.

### Example: `sales-invoice.report.ts`

```ts
export async function renderSalesInvoice(
  id: number,
  db: DB,
  res: Response,
): Promise<void> {
  const company = await fetchCompanyInfo(db); // shared helper, reads settings table
  const { invoice, customer, items } = await fetchSalesInvoiceData(id, db);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=sales_invoice_${invoice.invoiceNumber}.pdf`,
  );

  const pdf = new PdfDocument(res);

  renderCompanyHeader(pdf, company);
  renderReportMeta(pdf, {
    title: "TAX INVOICE",
    number: invoice.invoiceNumber,
    date: invoice.invoiceDate,
    extraMeta: invoice.refNumber
      ? [{ label: "Ref No", value: invoice.refNumber }]
      : [],
  });
  renderEInvoiceBlock(
    pdf,
    invoice.irn,
    invoice.ackNo,
    invoice.ackDate,
    invoice.signedQrCode,
  );
  renderRule(pdf);
  renderAddressBlock(
    pdf,
    billingAddress,
    shippingAddress,
    "BILL TO",
    "SHIP TO",
  );
  renderRule(pdf);

  const columns: TableColumn[] = [
    { header: "#", width: 20, align: "right", key: "index" },
    { header: "Product", width: 160, align: "left", key: "productName" },
    { header: "HSN/SAC", width: 55, align: "left", key: "hsnSac" },
    { header: "Qty", width: 40, align: "right", key: "qty" },
    {
      header: "Rate",
      width: 55,
      align: "right",
      key: "unitPrice",
      format: fmtCurrency,
    },
    {
      header: "Disc",
      width: 40,
      align: "right",
      key: "discountAmount",
      format: fmtCurrency,
    },
    { header: "Tax%", width: 35, align: "right", key: "taxPct" },
    {
      header: "Tax Amt",
      width: 50,
      align: "right",
      key: "taxAmount",
      format: fmtCurrency,
    },
    {
      header: "Total",
      width: 60,
      align: "right",
      key: "lineTotal",
      format: fmtCurrency,
    },
  ];

  renderItemsTable(pdf, columns, items, () => {
    renderCompanyHeader(pdf, company); // repeat on overflow page
  });

  renderTotals(
    pdf,
    {
      subtotal: Number(invoice.subtotal),
      discountAmount: Number(invoice.discountAmount),
      taxAmount: Number(invoice.taxAmount),
      taxPct: Number(invoice.taxPct),
      roundOff: Number(invoice.roundOff),
      netAmount: Number(invoice.netAmount),
    },
    company,
  );

  renderFooter(pdf, company);
  pdf.end();
}
```

### Example: `purchase-invoice.report.ts`

Same structure, different columns and labels:

```ts
renderAddressBlock(pdf, supplierAddress, undefined, "SUPPLIER", undefined);

const columns: TableColumn[] = [
  { header: "#", width: 20, key: "index" },
  { header: "Product", width: 170, key: "productName" },
  { header: "HSN/SAC", width: 55, key: "hsnSac" },
  { header: "GTN", width: 80, key: "gtn" },
  { header: "Qty", width: 40, key: "qty" },
  { header: "Rate", width: 55, key: "unitPrice", format: fmtCurrency },
  { header: "Tax%", width: 35, key: "taxPct" },
  { header: "Tax Amt", width: 50, key: "taxAmount", format: fmtCurrency },
  { header: "Total", width: 60, key: "lineTotal", format: fmtCurrency },
];
```

### Future reports — same pattern, ~50 lines each

| Report          | Unique parts                                             |
| --------------- | -------------------------------------------------------- |
| Stock invoice   | No address block; GTN column; no totals tax split        |
| Customer ledger | Date range meta; running-balance column                  |
| Stock summary   | No address block; group-by category; subtotals per group |
| Day book        | Date range; debit/credit columns                         |
| GST report      | Month meta; CGST/SGST/IGST breakdown rows                |
| Barcode labels  | Skip all standard sections; custom label layout          |

---

## `fetchCompanyInfo` — shared helper

```ts
// backend/src/services/pdf/engine/pdf-types.ts (or a separate file)
export async function fetchCompanyInfo(db: DB): Promise<CompanyInfo> {
  const rows = await db.select().from(settings).all();
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    name: s["company_name"] ?? "Your Company",
    gstin: s["company_gstin"] ?? "",
    addressLine1: s["company_address_line1"] ?? "",
    city: s["company_city"] ?? "",
    state: s["company_state"] ?? "",
    postalCode: s["company_postal_code"] ?? "",
    phone: s["company_phone"] ?? "",
    bankName: s["bank_name"] ?? "",
    bankAccount: s["bank_account"] ?? "",
    bankIfsc: s["bank_ifsc"] ?? "",
    terms: s["invoice_terms"] ?? "",
  };
}
```

This is called **once per PDF request** and passed down — no report file ever reads the
settings table directly.

---

## Route integration

Each route's PDF handler becomes identical in shape:

```ts
// sales-invoices.ts
salesInvoicesRouter.get("/:id/pdf", async (req, res) => {
  try {
    await renderSalesInvoice(parseInt(req.params.id), db, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// purchase-invoices.ts
purchaseInvoicesRouter.get("/:id/pdf", async (req, res) => {
  try {
    await renderPurchaseInvoice(parseInt(req.params.id), db, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});
```

---

## Files to Create

```
backend/src/services/pdf/
├── engine/
│   ├── pdf-types.ts          NEW — interfaces + fetchCompanyInfo
│   ├── pdf-document.ts       NEW — PdfDocument class (wraps PDFKit)
│   └── pdf-sections.ts       NEW — all 8 section renderers
├── reports/
│   ├── sales-invoice.report.ts     NEW
│   └── purchase-invoice.report.ts  NEW
└── index.ts                  NEW — re-exports

backend/src/services/print-sales-invoice.service.ts   DELETE (replaced)
```

---

## Rules for adding a new report

1. Create `backend/src/services/pdf/reports/<name>.report.ts`.
2. Write `fetchData` to query the DB.
3. Call sections in order: `renderCompanyHeader` → `renderReportMeta` → optional sections →
   `renderItemsTable` → `renderTotals` (if applicable) → `renderFooter`.
4. Define `columns: TableColumn[]` for the items table.
5. Wire up a one-liner route handler.
6. **Do not** add logic to `pdf-sections.ts` or `pdf-document.ts` — those are shared and stable.

---

## Acceptance Criteria

- [ ] `pdf-sections.ts` has no import from any route or schema file — it is purely a renderer.
- [ ] `fetchCompanyInfo` is the single source of company data for all reports.
- [ ] Adding a new report requires creating exactly 1 new file.
- [ ] Changing the company header layout requires editing exactly 1 function in `pdf-sections.ts`.
- [ ] Multi-page overflow works for all reports without per-report code.
