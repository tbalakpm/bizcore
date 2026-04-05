# BizCore Frontend — NG-ZORRO UI Audit Report

**Date:** 2026-03-16
**Scope:** All Angular component templates, global styles, theme files

---

## 1. SIZE & COMPACTNESS ISSUES

### 1.1 — nz-table `nzSize` inconsistency

| File                              | Current           | Recommended                                                      |
| --------------------------------- | ----------------- | ---------------------------------------------------------------- |
| `categories.html`                 | `nzSize="middle"` | Change to `nzSize="small"` for consistency with all other tables |
| `dashboard.html` (recent entries) | `nzSize="small"`  | ✅ OK                                                            |
| `products.html`                   | `nzSize="small"`  | ✅ OK                                                            |
| `customers.html`                  | `nzSize="small"`  | ✅ OK                                                            |
| `suppliers.html`                  | `nzSize="small"`  | ✅ OK                                                            |
| `users.html` (both tables)        | `nzSize="small"`  | ✅ OK                                                            |
| `sales-invoices.html`             | `nzSize="small"`  | ✅ OK                                                            |
| `sales-invoice-form.html`         | `nzSize="small"`  | ✅ OK                                                            |
| `purchase-invoices.html`          | `nzSize="small"`  | ✅ OK                                                            |
| `purchase-invoice-form.html`      | `nzSize="small"`  | ✅ OK                                                            |
| `stock-invoices.html`             | `nzSize="small"`  | ✅ OK                                                            |
| `stock-invoice-form.html`         | `nzSize="small"`  | ✅ OK                                                            |
| `entries.html`                    | `nzSize="small"`  | ✅ OK                                                            |
| `registers.html`                  | `nzSize="small"`  | ✅ OK                                                            |

**Action:** `categories.html` — change `nzSize="middle"` → `nzSize="small"` on the `<nz-table>`.

### 1.2 — nz-button missing `nzSize="small"` in action columns

| File              | Issue                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `categories.html` | Action buttons (`edit`, `delete`, `save`, `cancel`) do NOT have `nzSize="small"` — all other list pages use `nzSize="small"`           |
| `categories.html` | The "Add" submit button is full-width but doesn't have `nzSize` — it's fine as a form submit, but add `nzSize="small"` for consistency |
| `login.html`      | Login button — OK as full-width primary, no size needed                                                                                |
| `dashboard.html`  | No action buttons — OK                                                                                                                 |
| `customers.html`  | Form "Save" button — missing `nzSize="small"` (though as form submit, this is debatable — see 1.3)                                     |
| `suppliers.html`  | Form "Save" button — missing `nzSize="small"` (same note)                                                                              |
| `users.html`      | Form "Save" button — missing `nzSize="small"`                                                                                          |
| `entries.html`    | Form "Save" button — no nzSize, OK as form submit                                                                                      |

**Action:**

- `categories.html`: Add `nzSize="small"` to ALL action column buttons (edit, delete, save, cancel) — align with products, customers, suppliers, users, entries, registers which all use `nzSize="small"` in action columns.

### 1.3 — Form submit buttons sizing inconsistency

Across pages, form submit buttons have inconsistent sizing:

- `customers.html`, `suppliers.html`, `users.html`: Submit buttons have NO `nzSize` (defaults to "default" = medium)
- `product-form.component.html`: Submit/Cancel buttons have NO `nzSize`
- `entries.html`, `registers.html`: Submit buttons have NO `nzSize`
- `sales-invoice-form.html`, `purchase-invoice-form.html`, `stock-invoice-form.html`: Header action buttons have NO `nzSize`

**Recommendation:** Form submit buttons at "default" size is actually fine for primary actions — keep them as-is. The compactness concern is only for table action columns, which should always be `nzSize="small"`.

### 1.4 — nz-switch missing `nzSize="small"` in categories.html

| File              | Issue                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `categories.html` | `<nz-switch>` has NO `nzSize` attribute — all other pages (products, customers, suppliers, users, registers) use `nzSize="small"` |

**Action:** `categories.html`: Add `nzSize="small"` to the `<nz-switch>`.

### 1.5 — nz-input, nz-select, nz-date-picker, nz-input-number sizing

None of the form controls across the app use `nzSize="small"`. They all default to "default" size. For data-dense invoice forms, `nzSize="small"` could improve compactness, but this is a global decision. Currently they're uniform — all at default size.

**Recommendation:** Consider adding `nzSize="small"` to all form controls in the invoice form pages (sales-invoice-form, purchase-invoice-form, stock-invoice-form) for compactness, since these are data-dense. Leave master data forms (customers, suppliers, products, users, entries, registers, categories) at default size.

### 1.6 — Inline items table cells have custom compact padding

In `sales-invoice-form.html`, `purchase-invoice-form.html`, `stock-invoice-form.html` — item table cells use `class="!px-2 !py-2"` for compact padding. This is good and consistent across all three invoice forms.

---

## 2. SPACING & PADDING ISSUES

### 2.1 — Page-level wrapper spacing

The `app.html` content area uses `class="m-2 md:m-4 p-3 md:p-4"` — this is already compact.

### 2.2 — Page title bottom margin inconsistency

| File                     | Pattern                                                 | Gap                               |
| ------------------------ | ------------------------------------------------------- | --------------------------------- |
| `dashboard.html`         | `<div class="flex flex-col gap-4">` (wraps entire page) | `gap-4` between title and content |
| `categories.html`        | `<div class="space-y-4">`                               | `space-y-4`                       |
| `products.html`          | Title has `mb-4`                                        | `mb-4`                            |
| `customers.html`         | Title has `mb-4`                                        | `mb-4`                            |
| `suppliers.html`         | Title has `mb-4`                                        | `mb-4`                            |
| `users.html`             | Title has `mb-4`                                        | `mb-4`                            |
| `sales-invoices.html`    | Title has `mb-4`                                        | `mb-4`                            |
| `purchase-invoices.html` | Title has `mb-4`                                        | `mb-4`                            |
| `stock-invoices.html`    | Title has `mb-4`                                        | `mb-4`                            |
| `entries.html`           | Title has `mb-3`                                        | `mb-3` ← different                |
| `registers.html`         | Title has `mb-4`                                        | `mb-4`                            |
| Invoice forms (all)      | Title has `mb-4`                                        | `mb-4`                            |

**Action:** `entries.html`: Change title wrapper `mb-3` → `mb-4` for consistency.

### 2.3 — Grid gap inconsistency across pages

| File                                       | Layout       | Gap     |
| ------------------------------------------ | ------------ | ------- |
| `dashboard.html` (summary cards)           | `grid gap-4` | `gap-4` |
| `dashboard.html` (charts row)              | `grid gap-4` | `gap-4` |
| `categories.html` (list+form)              | `grid gap-4` | `gap-4` |
| `products.html`                            | `grid gap-4` | `gap-4` |
| `customers.html`                           | `grid gap-4` | `gap-4` |
| `suppliers.html`                           | `grid gap-4` | `gap-4` |
| `users.html`                               | `grid gap-4` | `gap-4` |
| `entries.html`                             | `grid gap-4` | `gap-4` |
| `registers.html`                           | `grid gap-4` | `gap-4` |
| `sales-invoice-form.html` (header form)    | `grid gap-4` | `gap-4` |
| `purchase-invoice-form.html` (header form) | `grid gap-4` | `gap-4` |
| `stock-invoice-form.html` (header form)    | `grid gap-4` | `gap-4` |

✅ Grid gaps are consistent at `gap-4` across all pages.

### 2.4 — Form vertical spacing patterns

| File                          | Form spacing                        |
| ----------------------------- | ----------------------------------- |
| `categories.html` (add form)  | `space-y-3`                         |
| `entries.html` (edit form)    | `space-y-3`                         |
| `registers.html` (edit form)  | `space-y-3`                         |
| `login.html`                  | `space-y-4` ← different             |
| `suppliers.html` form         | No `space-y-*` — uses CSS grid gap  |
| `customers.html` form         | No `space-y-*` — uses nz-row gutter |
| `users.html` form             | No `space-y-*` — uses nz-row gutter |
| `product-form.component.html` | No `space-y-*` — uses nz-row gutter |

**Observation:** Some forms use `space-y-3`, some use `nz-row [nzGutter]="16"`, and the login uses `space-y-4`. The nz-row gutter approach is the NG-ZORRO-idiomatic way. The inconsistency is minor because the approaches are different (vertical list vs grid).

**Recommendation:** For consistency, consider making `login.html` use `space-y-3` instead of `space-y-4` to match categories/entries/registers.

### 2.5 — Summary section spacing in invoice forms

| File                         | Gap                                               |
| ---------------------------- | ------------------------------------------------- |
| `sales-invoice-form.html`    | `gap-6` between summary help text and totals card |
| `purchase-invoice-form.html` | `gap-6` between additional terms and totals card  |

**Recommendation:** Reduce `gap-6` to `gap-4` in the summary sections of both `sales-invoice-form.html` and `purchase-invoice-form.html` for tighter spacing consistent with the rest of the app.

### 2.6 — IRN alert in sales-invoice-form has `mb-6`

In `sales-invoice-form.html`, the IRN success alert has `class="mb-6"`. All other alerts use `mb-4`.

**Action:** `sales-invoice-form.html`: Change IRN alert `mb-6` → `mb-4` for consistency.

### 2.7 — Invoice form header form has `mb-6`

In `sales-invoice-form.html` and `purchase-invoice-form.html`, the header form section uses `mb-6`. This is fine for visual separation before the items table.

---

## 3. BORDER RADIUS CONSISTENCY

### 3.1 — Theme token values

- `@border-radius-base: 8px` — inputs, selects
- `@border-radius-sm: 6px` — small variants
- `@btn-border-radius-base: 8px` — buttons
- `@btn-border-radius-sm: 6px` — small buttons
- `@card-radius: 12px` — cards
- `@table-border-radius-base: 8px` — tables

✅ All radii are defined consistently in both light and dark themes. The CSS custom properties define `--radius-sm: 0.25rem`, `--radius-md: 0.375rem`, `--radius-lg: 0.5rem` but these are not used by NG-ZORRO — the LESS variables are what matter.

### 3.2 — Visual consistency concerns

The card radius (12px) is intentionally larger than input/button radius (8px) which creates a visual hierarchy. This is **correct** and good design.

✅ No border radius issues found.

---

## 4. COLOR CONSISTENCY ISSUES

### 4.1 — Hardcoded Tailwind color classes (should use design tokens or NG-ZORRO theme)

| File                          | Line/Element                  | Hardcoded Color                                   | Recommendation                                                                             |
| ----------------------------- | ----------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `products.html`               | Empty state text              | `text-gray-400`                                   | Use `text-text-muted` or `style="color: var(--color-text-muted)"`                          |
| `customers.html`              | Empty state text              | `text-gray-400`                                   | Use `text-text-muted`                                                                      |
| `suppliers.html`              | Empty state text              | `text-gray-400`                                   | Use `text-text-muted`                                                                      |
| `users.html`                  | Empty state text              | `text-gray-400`                                   | Use `text-text-muted`                                                                      |
| `users.html`                  | Permission help text          | `text-gray-400`                                   | Use `text-text-muted`                                                                      |
| `sales-invoices.html`         | Empty state                   | `text-gray-400 italic py-8`                       | Use `text-text-muted`                                                                      |
| `sales-invoices.html`         | Filter label                  | `text-gray-500`                                   | Use `text-text-muted`                                                                      |
| `sales-invoices.html`         | Rows label                    | `text-gray-500`                                   | Use `text-text-muted`                                                                      |
| `sales-invoices.html`         | Net amount                    | `text-green-600`                                  | Use `style="color: var(--color-success)"`                                                  |
| `purchase-invoices.html`      | Empty state                   | `text-gray-400 italic py-8`                       | Use `text-text-muted`                                                                      |
| `purchase-invoices.html`      | Filter/Sort labels            | `text-gray-500`                                   | Use `text-text-muted`                                                                      |
| `purchase-invoices.html`      | Net amount                    | `text-green-600`                                  | Use `style="color: var(--color-success)"`                                                  |
| `purchase-invoice-form.html`  | Various labels                | `text-gray-500`                                   | Use `text-text-muted`                                                                      |
| `purchase-invoice-form.html`  | Various option sublabels      | `text-gray-400`                                   | Use `text-text-muted`                                                                      |
| `purchase-invoice-form.html`  | Net amount                    | `text-green-600`                                  | Use `style="color: var(--color-success)"`                                                  |
| `stock-invoices.html`         | Empty state                   | `text-gray-400 italic py-8`                       | Use `text-text-muted`                                                                      |
| `stock-invoices.html`         | Filter/Sort/Rows labels       | `text-gray-500`                                   | Use `text-text-muted`                                                                      |
| `stock-invoices.html`         | Amount column                 | `text-green-600`                                  | Use `style="color: var(--color-success)"`                                                  |
| `stock-invoice-form.html`     | Product form hint             | `text-gray-500`                                   | Use `text-text-muted`                                                                      |
| `sales-invoice-form.html`     | Various labels                | `text-gray-500`                                   | Use `text-text-muted`                                                                      |
| `sales-invoice-form.html`     | Customer option sublabels     | `text-gray-400`                                   | Use `text-text-muted`                                                                      |
| `sales-invoice-form.html`     | Net amount                    | `text-green-600`                                  | Use `style="color: var(--color-success)"`                                                  |
| `sales-invoice-form.html`     | "Add Customer" link           | `text-blue-600 hover:text-blue-700`               | Use `class="text-accent!"`                                                                 |
| `purchase-invoice-form.html`  | "Add Supplier" link           | `text-blue-600 hover:text-blue-700`               | Use `class="text-accent!"`                                                                 |
| `sales-invoice-form.html`     | Inventory red/green stock     | `text-red-500` / `text-green-600`                 | Use `style="color: var(--color-danger)"` / `style="color: var(--color-success)"`           |
| `sales-invoice-form.html`     | Required asterisks            | `text-red-500`                                    | Use `style="color: var(--color-danger)"`                                                   |
| `purchase-invoice-form.html`  | Required asterisks            | `text-red-500`                                    | Use `style="color: var(--color-danger)"`                                                   |
| `product-form.component.html` | GTN mode help text            | `text-gray-400`                                   | Use `text-text-muted`                                                                      |
| `entries.html`                | Empty state text              | `text-gray-400`                                   | Use `text-text-muted`                                                                      |
| `entries.html`                | Total income/expenses/balance | `text-green-600`, `text-red-600`, `text-blue-600` | Use `style="color: var(--color-success)"` / `var(--color-danger)` / `var(--color-accent)"` |
| `registers.html`              | Empty state text              | `text-gray-400`                                   | Use `text-text-muted`                                                                      |
| `categories.html`             | Empty state text              | `text-text-muted`                                 | ✅ OK — uses token                                                                         |
| `dashboard.html`              | Summary labels                | `style="color: var(--color-text-muted)"`          | ✅ OK — uses token                                                                         |
| `dashboard.html`              | Icons                         | `style="color: var(--color-primary)"`             | ✅ OK                                                                                      |

**Critical Dark Mode Issue:** All `text-gray-400` and `text-gray-500` usages will NOT adapt properly in dark mode because they are hardcoded Tailwind colors. The custom design tokens (`text-text-muted`, `var(--color-text-muted)`) do adapt. This is the most impactful issue in the audit.

### 4.2 — Dashboard uses inline style tokens (good) vs other pages use Tailwind gray classes (bad)

The dashboard correctly uses `style="color: var(--color-text-muted)"` and `style="color: var(--color-primary)"` etc. Other pages have not been fully migrated.

### 4.3 — Button variant consistency

- All primary actions consistently use `nzType="primary"` ✅
- All cancel actions consistently use `nzType="default"` ✅
- All table action buttons use `nzType="link"` ✅
- All delete buttons use `nzDanger` ✅
- "Add Line Item" buttons in invoice forms use `nzType="dashed"` ✅ (consistent pattern)
- "New Invoice" buttons use `nzType="primary"` ✅

✅ Button variants are consistent and correct.

### 4.4 — nz-alert nzType usage

All error alerts use `nzType="error"` ✅. The IRN success alert uses `nzType="success"` ✅. Consistent.

---

## 5. SIDEBAR CONSISTENCY

### 5.1 — Icon sizing

All sidebar icons use `class="w-6 h-6 shrink-0"` — consistent ✅.

Some icons are nz-icon (`<span nz-icon>`), some are inline SVGs. This is a mixed approach but the sizing is consistent.

### 5.2 — Menu item padding/spacing

All menu items use `class="flex px-4 py-2 rounded hover:bg-chrome-hover items-center overflow-hidden gap-2 transition-colors"` — consistent ✅.

### 5.3 — Active state

All items use `routerLinkActive="bg-chrome-hover font-semibold"` — consistent ✅.

### 5.4 — Section header spacing inconsistency

| Section Header | Top Margin  | Bottom Margin |
| -------------- | ----------- | ------------- |
| "Home"         | `mt-2 mb-2` |               |
| "Transactions" | `mt-4 mb-2` |               |
| "Masters"      | `mt-4 mb-2` |               |

The first section "Home" uses `mt-2` while others use `mt-4`. This is acceptable since it's the first section (close to top).

### 5.5 — Reports sub-menu

The reports sub-menu items use `class="ml-2 border-l-2 border-transparent hover:border-chrome-muted"` for indentation, which is a good visual pattern. However, they don't have the `routerLinkActive` font-semibold styling for active state differentiation.

**Observation:** The reports sub-menu links DO have `routerLinkActive="bg-chrome-hover font-semibold"` — they are consistent ✅.

---

## 6. TYPOGRAPHY ISSUES

### 6.1 — Heading hierarchy

| Level | Used For               | Class                                              | Consistent?                    |
| ----- | ---------------------- | -------------------------------------------------- | ------------------------------ |
| h1    | Page title             | `text-xl font-semibold`                            | ✅ consistent across all pages |
| h2    | Section/card title     | `text-base font-semibold` or `text-lg font-medium` | ⚠️ Inconsistent                |
| h3    | Sub-section            | `font-medium` or `text-sm font-semibold`           | Mixed                          |
| h4    | Quick-add form headers | `text-xs font-semibold uppercase text-gray-500`    | ✅ consistent                  |

**Issue:** `categories.html` uses `text-lg font-medium` for the list/form section headers while all other pages use `text-base font-semibold`.

**Action:** `categories.html`: Change the two `<h2 class="text-lg font-medium ...">` to `<h2 class="text-base font-semibold ...">` for consistency.

### 6.2 — Page title icon sizing

| File                     | Icon Size             |
| ------------------------ | --------------------- |
| `dashboard.html`         | `text-2xl`            |
| `categories.html`        | `text-2xl`            |
| `products.html`          | `text-xl` ← different |
| `customers.html`         | `text-2xl`            |
| `suppliers.html`         | `text-xl` ← different |
| `users.html`             | `text-2xl`            |
| `sales-invoices.html`    | `text-2xl`            |
| `purchase-invoices.html` | `text-2xl`            |
| `stock-invoices.html`    | `text-2xl`            |
| `entries.html`           | `text-xl` ← different |
| `registers.html`         | `text-xl` ← different |

**Action:** Standardize all page title icons to `text-2xl`:

- `products.html`: Change icon `text-xl` → `text-2xl`
- `suppliers.html`: Change icon `text-xl` → `text-2xl`
- `entries.html`: Change icon `text-xl` → `text-2xl`
- `registers.html`: Change icon `text-xl` → `text-2xl`

### 6.3 — Form label approach inconsistency

| File                          | Label Approach                                                            |
| ----------------------------- | ------------------------------------------------------------------------- |
| `categories.html`             | `<nz-form-label>` ✅                                                      |
| `product-form.component.html` | `<nz-form-label>` ✅                                                      |
| `customers.html`              | `<nz-form-label>` ✅                                                      |
| `suppliers.html`              | `<nz-form-label>` ✅                                                      |
| `users.html`                  | `<nz-form-label>` ✅                                                      |
| `entries.html`                | `<nz-form-label>` ✅                                                      |
| `registers.html`              | `<nz-form-label>` ✅                                                      |
| `login.html`                  | `<nz-form-label>` ✅                                                      |
| `address-form.html`           | `<nz-form-label>` ✅                                                      |
| `sales-invoice-form.html`     | `<label class="block text-sm font-medium mb-1">` ⚠️ **Plain HTML labels** |
| `purchase-invoice-form.html`  | `<label class="block text-sm font-medium mb-1">` ⚠️ **Plain HTML labels** |
| `stock-invoice-form.html`     | `<label class="block text-sm font-medium mb-1">` ⚠️ **Plain HTML labels** |

**Issue:** The three invoice form pages use plain `<label>` elements with Tailwind classes instead of `<nz-form-label>`. While functional, this creates inconsistency with all other pages.

**Recommendation:** Migrate invoice form header labels to `<nz-form-item>` / `<nz-form-label>` / `<nz-form-control>` pattern OR keep them as-is since the invoice forms intentionally use a grid layout rather than nz-form vertical layout. Low priority.

---

## 7. GENERAL ISSUES

### 7.1 — nz-card wrapper consistency

| Page                     | Uses nz-card?                         |
| ------------------------ | ------------------------------------- |
| `dashboard.html`         | ✅ Uses multiple nz-cards             |
| `categories.html`        | ❌ NO nz-card wrapper — table is bare |
| `products.html`          | ✅ Uses nz-card for form and list     |
| `customers.html`         | ✅ Uses nz-card for form and list     |
| `suppliers.html`         | ✅ Uses nz-card for form and list     |
| `users.html`             | ✅ Uses nz-card for form and list     |
| `sales-invoices.html`    | ✅ Uses nz-card                       |
| `purchase-invoices.html` | ✅ Uses nz-card                       |
| `stock-invoices.html`    | ✅ Uses nz-card                       |
| `entries.html`           | ✅ Uses nz-card for both panels       |
| `registers.html`         | ✅ Uses nz-card for both panels       |

**Action:** `categories.html` — The table and form are not wrapped in `<nz-card>`. Every other list page wraps its table in `<nz-card>`. Wrap the categories table in `<nz-card>` and the add form in `<nz-card>` for visual consistency.

### 7.2 — nzBordered inconsistency

| File               | nzBordered                    |
| ------------------ | ----------------------------- |
| `categories.html`  | Missing `[nzBordered]="true"` |
| `dashboard.html`   | `[nzBordered]="true"` ✅      |
| `products.html`    | `[nzBordered]="true"` ✅      |
| `customers.html`   | `[nzBordered]="true"` ✅      |
| `suppliers.html`   | `[nzBordered]="true"` ✅      |
| `users.html`       | `[nzBordered]="true"` ✅      |
| All invoice tables | `[nzBordered]="true"` ✅      |
| `entries.html`     | `[nzBordered]="true"` ✅      |
| `registers.html`   | `[nzBordered]="true"` ✅      |

**Action:** `categories.html` — Add `[nzBordered]="true"` to the nz-table.

### 7.3 — Empty state styling inconsistency

| File                     | Empty State Pattern                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `categories.html`        | `class="text-center text-text-muted"` — ✅ uses design token                            |
| `products.html`          | `class="text-center text-gray-400"` — ❌ hardcoded                                      |
| `customers.html`         | `class="text-center text-gray-400"` — ❌ hardcoded                                      |
| `suppliers.html`         | `class="text-center text-gray-400"` — ❌ hardcoded                                      |
| `users.html`             | `class="text-center text-gray-400"` — ❌ hardcoded                                      |
| `sales-invoices.html`    | `class="text-center text-gray-400 italic py-8"` — ❌ hardcoded + italic + extra padding |
| `purchase-invoices.html` | `class="text-center text-gray-400 italic py-8"` — ❌ hardcoded + italic + extra padding |
| `stock-invoices.html`    | `class="text-center text-gray-400 italic py-8"` — ❌ hardcoded + italic + extra padding |
| `entries.html`           | `class="text-center text-gray-400"` — ❌ hardcoded                                      |
| `registers.html`         | `class="text-center text-gray-400"` — ❌ hardcoded                                      |
| `dashboard.html`         | `style="color: var(--color-text-muted); padding: 24px 0;"` — ✅ inline token            |

**Recommendation:** Standardize all empty states to: `class="text-center text-text-muted"` (matching categories.html which is the correct pattern). Remove `italic` and `py-8` from invoice list empty states for consistency.

### 7.4 — nzShowPagination inconsistency

Most tables use `[nzShowPagination]="false"` since they handle pagination manually. This is consistent ✅.

### 7.5 — Entries page filter form layout uses `gap-3 md:gap-5`

In `entries.html`, the date filter form uses `gap-3 md:gap-5` — this is slightly wider than the standard `gap-2` used in invoice list filter bars.

**Recommendation:** Change `entries.html` filter form gap from `gap-3 md:gap-5` to `gap-2` for consistency with sales/purchase/stock invoice filter bars.

### 7.6 — Purchase invoice filter bar vs Sales invoice filter bar

- `sales-invoices.html`: Uses `[formGroup]="filterForm"` (reactive forms) with immediate filtering
- `purchase-invoices.html`: Uses `[(ngModel)]` with an explicit "Apply" button
- `stock-invoices.html`: Uses `[(ngModel)]` with an explicit "Apply" button

This is an architectural inconsistency (reactive vs template-driven forms) but not a visual issue per se. The "Apply" button pattern in purchase/stock vs auto-filter in sales is a UX inconsistency.

### 7.7 — Sales invoice filter bar "Clear" button vs Purchase/Stock "Apply" button

- `sales-invoices.html` has a "Clear" filter button (`nzType="default"`) — good
- `purchase-invoices.html` has only "Apply" (`nzType="primary"`) — no clear button
- `stock-invoices.html` has only "Apply" (`nzType="primary"`) — no clear button

**Recommendation:** Add a "Clear" button to purchase-invoices.html and stock-invoices.html filter bars for feature parity.

### 7.8 — Sort control placement inconsistency

- `sales-invoices.html`: Sort is built into clickable table headers
- `purchase-invoices.html`: Sort is a separate nz-select dropdown in the filter bar
- `stock-invoices.html`: Sort is a separate nz-select dropdown in the filter bar

This is a UX pattern inconsistency but not strictly a visual spacing issue.

### 7.9 — `*ngIf` vs `@if` usage

In `sales-invoice-form.html`, the discount display uses `*ngIf="totalDiscount > 0"` and `*ngIf="totalDiscount <= 0"` (old syntax) while the rest of the app uses the new `@if () {}` control flow syntax.

**Action:** `sales-invoice-form.html`: Migrate `*ngIf` usages to `@if` for consistency.

### 7.10 — Missing `[nzLoading]` on some tables

| File                     | Has nzLoading?             |
| ------------------------ | -------------------------- |
| `categories.html`        | ✅ `[nzLoading]="loading"` |
| `products.html`          | ✅ `[nzLoading]="loading"` |
| `customers.html`         | ✅                         |
| `suppliers.html`         | ✅                         |
| `users.html`             | ✅                         |
| `entries.html`           | ✅                         |
| `registers.html`         | ✅                         |
| `dashboard.html`         | ✅                         |
| `sales-invoices.html`    | ❌ Missing `[nzLoading]`   |
| `purchase-invoices.html` | ✅ `[nzLoading]="loading"` |
| `stock-invoices.html`    | ❌ Missing `[nzLoading]`   |

**Action:** Add `[nzLoading]="loading"` to the nz-table in:

- `sales-invoices.html`
- `stock-invoices.html`

---

## 8. PRIORITY SUMMARY

### High Priority (Dark Mode Breaking)

1. **Replace all `text-gray-400` / `text-gray-500` with `text-text-muted`** — these break in dark mode. Affects: products, customers, suppliers, users, entries, registers, all invoice pages, product-form.
2. **Replace all `text-green-600` / `text-red-600` / `text-red-500` / `text-blue-600` with design token equivalents** — these break in dark mode. Affects: invoice lists, invoice forms, entries.

### Medium Priority (Visual Consistency)

3. **`categories.html`**: Change `nzSize="middle"` → `nzSize="small"`, add `[nzBordered]="true"`, add `nzSize="small"` to action buttons, add `nzSize="small"` to switch, wrap in `<nz-card>`, change h2 from `text-lg font-medium` to `text-base font-semibold`.
4. **Standardize page title icon sizes** to `text-2xl` in: products, suppliers, entries, registers.
5. **Standardize empty state styling** to `text-center text-text-muted` (remove italic and py-8 from invoice lists).
6. **Add `[nzLoading]`** to sales-invoices.html and stock-invoices.html tables.

### Low Priority (Polish)

7. **`sales-invoice-form.html`**: Change `mb-6` → `mb-4` on IRN alert; migrate `*ngIf` to `@if`.
8. **`entries.html`**: Change title `mb-3` → `mb-4`, filter gap `gap-3 md:gap-5` → `gap-2`.
9. **Invoice form summary sections**: Reduce `gap-6` → `gap-4`.
10. Add "Clear" filter button to purchase-invoices.html and stock-invoices.html.

---

## 9. FILES REQUIRING CHANGES (Summary)

| File                          | Number of Issues                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `categories.html`             | 6 issues (nzSize, nzBordered, nz-card, button sizes, switch size, heading style) |
| `sales-invoice-form.html`     | 5 issues (hardcoded colors, \*ngIf, mb-6, gap-6, label approach)                 |
| `purchase-invoice-form.html`  | 4 issues (hardcoded colors, gap-6, label approach, add-supplier link color)      |
| `sales-invoices.html`         | 4 issues (hardcoded colors, empty state, missing nzLoading, filter labels)       |
| `purchase-invoices.html`      | 3 issues (hardcoded colors, empty state, filter labels)                          |
| `stock-invoices.html`         | 3 issues (hardcoded colors, empty state, missing nzLoading)                      |
| `stock-invoice-form.html`     | 2 issues (hardcoded colors)                                                      |
| `entries.html`                | 3 issues (hardcoded colors, gap, mb)                                             |
| `products.html`               | 2 issues (hardcoded empty state color, icon size)                                |
| `customers.html`              | 1 issue (hardcoded empty state color)                                            |
| `suppliers.html`              | 2 issues (hardcoded empty state color, icon size)                                |
| `users.html`                  | 2 issues (hardcoded colors)                                                      |
| `registers.html`              | 2 issues (hardcoded empty state color, icon size)                                |
| `product-form.component.html` | 1 issue (hardcoded gray text)                                                    |
| `login.html`                  | 0 issues ✅                                                                      |
| `dashboard.html`              | 0 issues ✅                                                                      |
| `address-form.html`           | 0 issues ✅                                                                      |
| `app.html`                    | 0 issues ✅                                                                      |
