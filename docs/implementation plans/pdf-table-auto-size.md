# PDF Table — Auto-Size Columns Implementation Plan

## Goal

Remove manual `width` declarations from `TableColumn`. The engine measures actual content
at render time and distributes column widths automatically to fit `usableWidth` exactly.

---

## Change 1 — `pdf-types.ts`

Make `width` optional on `TableColumn`. Add `minWidth` and `maxWidth` for clamping.

```ts
export interface TableColumn {
  header: string;
  width?: number; // OPTIONAL — if omitted, engine auto-sizes
  minWidth?: number; // default: 28
  maxWidth?: number; // default: 240 (prevents one column eating the whole row)
  align?: "left" | "right" | "center";
  key: string;
  format?: (val: unknown) => string;
}
```

---

## Change 2 — `pdf-sections.ts`

Add `measureColumns()` and call it inside `renderItemsTable()` before drawing anything.

### `measureColumns()` function

```ts
function measureColumns(
  columns: TableColumn[],
  rows: Record<string, unknown>[],
  usableWidth: number,
): TableColumn[] {
  const CHAR_WIDTH = 6.5; // avg pt per char at 9pt Helvetica
  const H_PADDING = 14; // left + right cell padding combined

  // Pass 1: find natural width of each column from content
  const natural = columns.map((col) => {
    const headerLen = col.header.length;

    const maxRowLen = rows.reduce((max, row) => {
      const val = col.format
        ? col.format(row[col.key])
        : String(row[col.key] ?? "");
      return Math.max(max, val.length);
    }, 0);

    const raw =
      Math.ceil(Math.max(headerLen, maxRowLen) * CHAR_WIDTH) + H_PADDING;

    const min = col.minWidth ?? 28;
    const max = col.maxWidth ?? 240;

    return Math.min(max, Math.max(min, raw));
  });

  // Pass 2: scale proportionally so total == usableWidth
  const total = natural.reduce((a, b) => a + b, 0);
  const scale = total > usableWidth ? usableWidth / total : 1;

  return columns.map((col, i) => ({
    ...col,
    width: Math.floor(natural[i] * scale),
  }));
}
```

### Wire into `renderItemsTable()`

```ts
export function renderItemsTable(
  pdf: PdfDocument,
  columns: TableColumn[],
  rows: Record<string, unknown>[],
  onNewPage: () => void,
): void {
  // Auto-size before any drawing
  const sized = measureColumns(columns, rows, pdf.usableWidth);

  // All subsequent drawing uses `sized` not `columns`
  drawTableHeader(pdf, sized);
  for (const row of rows) {
    drawTableRow(pdf, sized, row, onNewPage);
  }
}
```

---

## Change 3 — Remove `width` from all report files

### `sales-invoice.report.ts`

```ts
// BEFORE
{ header: 'Product',  width: 160, key: 'productName' },
{ header: 'HSN/SAC',  width: 55,  key: 'hsnSac' },
{ header: 'Qty',      width: 40,  key: 'qty' },
{ header: 'Rate',     width: 55,  key: 'unitPrice',      format: fmtCurrency },
{ header: 'Disc',     width: 40,  key: 'discountAmount', format: fmtCurrency },
{ header: 'Tax%',     width: 35,  key: 'taxPct' },
{ header: 'Tax Amt',  width: 50,  key: 'taxAmount',      format: fmtCurrency },
{ header: 'Total',    width: 60,  key: 'lineTotal',      format: fmtCurrency },

// AFTER
{ header: '#',        key: 'index',          align: 'right', maxWidth: 32  },
{ header: 'Product',  key: 'productName',    align: 'left'                 },
{ header: 'HSN/SAC',  key: 'hsnSac',         align: 'left',  maxWidth: 70  },
{ header: 'Qty',      key: 'qty',            align: 'right', maxWidth: 50  },
{ header: 'Rate',     key: 'unitPrice',      align: 'right', maxWidth: 75,  format: fmtCurrency },
{ header: 'Disc',     key: 'discountAmount', align: 'right', maxWidth: 60,  format: fmtCurrency },
{ header: 'Tax%',     key: 'taxPct',         align: 'right', maxWidth: 45  },
{ header: 'Tax Amt',  key: 'taxAmount',      align: 'right', maxWidth: 70,  format: fmtCurrency },
{ header: 'Total',    key: 'lineTotal',      align: 'right', maxWidth: 80,  format: fmtCurrency },
```

### `purchase-invoice.report.ts`

```ts
{ header: '#',        key: 'index',          align: 'right', maxWidth: 32  },
{ header: 'Product',  key: 'productName',    align: 'left'                 },
{ header: 'HSN/SAC',  key: 'hsnSac',         align: 'left',  maxWidth: 70  },
{ header: 'GTN',      key: 'gtn',            align: 'left',  maxWidth: 90  },
{ header: 'Qty',      key: 'qty',            align: 'right', maxWidth: 50  },
{ header: 'Rate',     key: 'unitPrice',      align: 'right', maxWidth: 75,  format: fmtCurrency },
{ header: 'Tax%',     key: 'taxPct',         align: 'right', maxWidth: 45  },
{ header: 'Tax Amt',  key: 'taxAmount',      align: 'right', maxWidth: 70,  format: fmtCurrency },
{ header: 'Total',    key: 'lineTotal',      align: 'right', maxWidth: 80,  format: fmtCurrency },
```

---

## Tuning Constants

These live at the top of `pdf-sections.ts` and can be adjusted if the output looks off:

```ts
const CHAR_WIDTH = 6.5; // increase if text overflows cells, decrease if too much space
const H_PADDING = 14; // horizontal padding inside each cell (left + right)
const ROW_HEIGHT = 18; // pt per data row
const HEADER_HEIGHT = 22; // pt for the header row
```

`CHAR_WIDTH = 6.5` is calibrated for Helvetica 9pt. If you switch to a different font or
font size, adjust this value accordingly.

---

## Why `maxWidth` on numeric columns

Without `maxWidth`, a column like "Total" containing `3,75,000.00` (10 chars) would get
`10 × 6.5 + 14 = 79pt` naturally — fine on its own. But after proportional scaling when
there are 9 columns, some numeric columns may grow unnecessarily wide. `maxWidth` caps
them so the `Product` column gets the leftover space instead.

Rule of thumb:

- Text columns (`productName`, `description`): no `maxWidth` — let them absorb spare space
- Numeric columns: `maxWidth: 50–80` depending on expected value size
- Index column (`#`): `maxWidth: 32`

---

## Acceptance Criteria

- [ ] `TableColumn.width` is never set in any report file.
- [ ] All columns fit within `usableWidth` with no clipping on any report.
- [ ] The `Product` column absorbs leftover space when numeric columns are narrower than `maxWidth`.
- [ ] Adding a new column to any report requires zero width calculations.
