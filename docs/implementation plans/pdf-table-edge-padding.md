# PDF Table — Conditional Edge Padding

## Rule

| Position     | Align               | Padding applied?                                   |
| ------------ | ------------------- | -------------------------------------------------- |
| First column | `left`              | NO — text already sits at the left edge naturally  |
| First column | `right` or `center` | YES — needs breathing room from left border        |
| Last column  | `right`             | NO — text already sits at the right edge naturally |
| Last column  | `left` or `center`  | YES — needs breathing room from right border       |

Applies identically to both header row and every body row.

---

## Change — `pdf-sections.ts`

### Tuning constant

```ts
const EDGE_PADDING = 8; // pt
```

### Replace the edge-padding injection block inside `renderItemsTable()`

```ts
sized = sized.map((col, i) => {
  const isFirst = i === 0;
  const isLast = i === sized.length - 1;

  const extraLeft = isFirst && col.align !== "left" ? EDGE_PADDING : 0;
  const extraRight = isLast && col.align !== "right" ? EDGE_PADDING : 0;

  return {
    ...col,
    paddingLeft: (col.paddingLeft ?? 0) + extraLeft,
    paddingRight: (col.paddingRight ?? 0) + extraRight,
  };
});
```

### How padding is consumed when drawing a cell (both header and body)

```ts
function drawCell(
  pdf: PdfDocument,
  col: TableColumn,
  value: string,
  x: number,
  y: number,
  rowHeight: number,
): void {
  const pl = col.paddingLeft ?? 0;
  const pr = col.paddingRight ?? 0;

  const textX = x + pl;
  const textWidth = col.width - pl - pr;

  pdf.raw
    .fontSize(9)
    .font("Helvetica")
    .text(value, textX, y + (rowHeight - 9) / 2, {
      width: textWidth,
      align: col.align ?? "left",
      lineBreak: false,
    });
}
```

`drawCell` is called the same way for both `drawTableHeader()` and `drawTableRow()` —
no separate handling needed.

---

## Acceptance Criteria

- [ ] First column with `align: 'left'` — no extra left padding on header or any row.
- [ ] First column with `align: 'right'` or `'center'` — `EDGE_PADDING` added to left.
- [ ] Last column with `align: 'right'` — no extra right padding on header or any row.
- [ ] Last column with `align: 'left'` or `'center'` — `EDGE_PADDING` added to right.
- [ ] Middle columns are unaffected.
- [ ] Single constant `EDGE_PADDING` controls all four cases.
