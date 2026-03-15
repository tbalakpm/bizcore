# PDF Page Break — Fix Implementation Plan

## Observed Problem

From the generated PDF:

- Page 1: all 27 item rows render correctly, then totals start at the bottom
- Pages 2–5: each totals line (`IGST`, `NET AMOUNT`) and footer lines render on a **separate page**

The root cause is that `renderTotals` and `renderFooter` use PDFKit's internal `doc.y`
cursor (via `doc.text()` without an explicit `y` argument). When content reaches the bottom
of page 1, PDFKit auto-advances to page 2 **silently** — the engine's `pdf.y` doesn't
follow, so every subsequent section also overflows, each line spilling onto its own page.

---

## Root Cause in `pdf-document.ts`

`pdf.y` and PDFKit's internal `doc.y` are separate. After `renderItemsTable()` finishes,
`pdf.y` reflects the last row drawn. But `renderTotals` and `renderFooter` call
`doc.text()` / `doc.moveTo()` without an explicit `y`, so PDFKit picks up from its own
internal cursor — which may already be near the page bottom.

---

## Fix 1 — `pdf-document.ts`: sync `pdf.y` with PDFKit after every operation

Add a `syncY()` method and call it after every draw that uses PDFKit's auto-flow:

```ts
export class PdfDocument {
  // ... existing properties

  /** Call after any doc.text() that uses PDFKit auto-flow (no explicit y arg) */
  syncY(): void {
    this.y = this.raw.y;
  }

  /** Move PDFKit's cursor to match engine's tracked y before explicit-y drawing */
  applyY(): void {
    // PDFKit doesn't expose a direct cursor setter, so we use a zero-height text call
    // as a no-op to force internal cursor alignment when needed.
    // In practice, just always pass explicit y coords — see Fix 2.
  }
}
```

The real fix is **Fix 2** — always use explicit `y` coordinates.

---

## Fix 2 — `pdf-sections.ts`: always pass explicit `y` to every PDFKit call

**Rule: no PDFKit call in the engine may omit the `y` argument.** All positioning must go
through `pdf.y`, and `pdf.y` must be incremented manually after each draw.

### `renderTotals()` — rewrite with explicit y

```ts
export function renderTotals(
  pdf: PdfDocument,
  totals: TotalsData,
  company: CompanyInfo,
): void {
  const RIGHT_LABEL_X = 340;
  const RIGHT_VALUE_X = pdf.marginLeft + pdf.usableWidth; // 555
  const LINE_H = 16;

  // Check if totals + footer fit on current page; if not, start new page
  const estimatedHeight = 120; // approx height of totals + footer block
  if (pdf.y + estimatedHeight > pdf.pageHeight - pdf.marginBottom) {
    pdf.raw.addPage();
    pdf.y = pdf.marginTop;
  }

  pdf.y += 8; // gap after table

  // Helper — draw one row
  const row = (label: string, value: string, bold = false) => {
    const font = bold ? "Helvetica-Bold" : "Helvetica";
    const size = bold ? 10 : 9;
    pdf.raw
      .fontSize(size)
      .font(font)
      .text(label, RIGHT_LABEL_X, pdf.y, { width: 120, align: "right" })
      .text(value, RIGHT_VALUE_X - 80, pdf.y, { width: 80, align: "right" });
    pdf.y += LINE_H;
  };

  row("Subtotal:", fmt(totals.subtotal));

  if (totals.discountAmount > 0) {
    row("Discount:", `-${fmt(totals.discountAmount)}`);
  }

  row("Taxable Amount:", fmt(totals.subtotal - totals.discountAmount));

  // CGST / SGST or IGST
  const igst = company.igstSharingRate === 100;
  if (igst) {
    row(`IGST (${totals.taxPct}%):`, fmt(totals.taxAmount));
  } else {
    const half = totals.taxAmount / 2;
    const halfPct = totals.taxPct / 2;
    row(`CGST (${halfPct}%):`, fmt(half));
    row(`SGST (${halfPct}%):`, fmt(half));
  }

  if (totals.roundOff !== 0) {
    row("Round Off:", fmt(totals.roundOff));
  }

  // Divider line
  pdf.raw
    .moveTo(RIGHT_LABEL_X, pdf.y)
    .lineTo(RIGHT_VALUE_X, pdf.y)
    .lineWidth(0.5)
    .stroke();
  pdf.y += 4;

  row("NET AMOUNT:", fmt(totals.netAmount), true); // bold
}
```

### `renderFooter()` — rewrite with explicit y

```ts
export function renderFooter(pdf: PdfDocument, company: CompanyInfo): void {
  const FOOTER_HEIGHT = 80;

  // Always push footer to a fixed position near page bottom
  // If we're already past the threshold, just use current y with a gap
  const footerY = Math.max(
    pdf.y + 20,
    pdf.pageHeight - pdf.marginBottom - FOOTER_HEIGHT,
  );

  pdf.y = footerY;

  // Divider
  pdf.raw
    .moveTo(pdf.marginLeft, pdf.y)
    .lineTo(pdf.marginLeft + pdf.usableWidth, pdf.y)
    .lineWidth(0.5)
    .stroke();
  pdf.y += 10;

  // Three-column footer layout
  const col1X = pdf.marginLeft;
  const col2X = pdf.marginLeft + pdf.usableWidth / 3;
  const col3X = pdf.marginLeft + (pdf.usableWidth * 2) / 3;
  const startY = pdf.y;

  // Column 1: Bank details
  pdf.raw
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("Bank Details:", col1X, startY);
  pdf.raw
    .font("Helvetica")
    .text(`Bank: ${company.bankName}`, col1X, startY + 12)
    .text(`A/c: ${company.bankAccount}`, col1X, startY + 24)
    .text(`IFSC: ${company.bankIfsc}`, col1X, startY + 36);

  // Column 2: Terms
  pdf.raw
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("Terms & Conditions:", col2X, startY);
  pdf.raw
    .font("Helvetica")
    .text(company.terms ?? "", col2X, startY + 12, {
      width: pdf.usableWidth / 3 - 10,
    });

  // Column 3: Signatory
  pdf.raw
    .fontSize(9)
    .font("Helvetica-Bold")
    .text(`For ${company.name}`, col3X, startY, {
      width: pdf.usableWidth / 3,
      align: "right",
    });
  pdf.raw
    .font("Helvetica")
    .text("Authorised Signatory", col3X, startY + 48, {
      width: pdf.usableWidth / 3,
      align: "right",
    });
}
```

---

## Fix 3 — `renderItemsTable()`: update `pdf.y` after every row draw

The row loop must increment `pdf.y` explicitly so the engine always knows the true position:

```ts
function drawTableRow(
  pdf: PdfDocument,
  columns: TableColumn[],
  row: Record<string, unknown>,
  rowIndex: number,
  onNewPage: () => void,
): void {
  const ROW_HEIGHT = 18;

  // Page break check BEFORE drawing
  if (pdf.y + ROW_HEIGHT > pdf.pageHeight - pdf.marginBottom) {
    pdf.raw.addPage();
    pdf.y = pdf.marginTop;
    onNewPage(); // re-draw table header on new page
  }

  // Alternating row background
  if (rowIndex % 2 === 0) {
    pdf.raw
      .rect(pdf.marginLeft, pdf.y, pdf.usableWidth, ROW_HEIGHT)
      .fill("#F7F7F7");
  }

  // Draw each cell using explicit pdf.y
  let x = pdf.marginLeft;
  for (const col of columns) {
    drawCell(pdf, col, getCellValue(col, row), x, pdf.y, ROW_HEIGHT);
    x += col.width ?? 0;
  }

  pdf.y += ROW_HEIGHT; // ← explicit increment, not relying on PDFKit cursor
}
```

---

## Fix 4 — `renderItemsTable()`: page break check uses `pdf.y`, not `doc.y`

```ts
export function renderItemsTable(
  pdf: PdfDocument,
  columns: TableColumn[],
  rows: Record<string, unknown>[],
  onNewPage: () => void,
): void {
  const sized = measureColumns(columns, rows, pdf.usableWidth);
  // inject edge padding...

  drawTableHeader(pdf, sized); // drawTableHeader also increments pdf.y

  rows.forEach((row, i) => {
    drawTableRow(pdf, sized, row, i, () => {
      drawTableHeader(pdf, sized); // repeat header on overflow page
    });
  });
}
```

---

## Summary of all changes

| File                                    | Change                                                   |
| --------------------------------------- | -------------------------------------------------------- |
| `pdf-document.ts`                       | Add `pageHeight` as a public property (`842` for A4)     |
| `pdf-sections.ts` — `drawTableRow()`    | Explicit `pdf.y` increment; page break check before draw |
| `pdf-sections.ts` — `renderTotals()`    | Rewrite with explicit `y` on every PDFKit call           |
| `pdf-sections.ts` — `renderFooter()`    | Rewrite with explicit `y`; push to fixed bottom position |
| `pdf-sections.ts` — `drawTableHeader()` | Ensure it also increments `pdf.y` after drawing          |

---

## The one rule that prevents this class of bug

> **Every PDFKit draw call in the engine must pass an explicit `y` coordinate
> equal to `pdf.y`. After the call, increment `pdf.y` by the height consumed.
> Never call `doc.text()`, `doc.moveTo()`, or `doc.rect()` without a `y` argument.**

PDFKit's auto-flow cursor and the engine's `pdf.y` must always be in sync.
The simplest way to guarantee this is to never rely on PDFKit's auto-flow at all.

---

## Acceptance Criteria

- [ ] 27-item invoice renders entirely on page 1 with totals and footer on the same page.
- [ ] 50+ item invoice breaks correctly to page 2, repeats the table header, and renders totals + footer after the last row.
- [ ] Totals block never splits across pages.
- [ ] Footer always appears at the bottom of the last page.
- [ ] No empty pages between sections.
