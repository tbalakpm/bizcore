# Validation Contract — CRUD Pages (NG-ZORRO Migration)

> **Scope**: All CRUD page components migrated from Tailwind + lucide-angular + ng-select to NG-ZORRO.
> **Source analysis**: `COMPONENT-ANALYSIS.md`
> **ID range**: VAL-CRUD-001 through VAL-CRUD-080

---

## Login Page (`src/app/auth/login.ts` + `login.html`)

### VAL-CRUD-001: Login card renders with nz-card
The login page displays a centered card containing the login form. The card **must** use `<nz-card>` (or an NG-ZORRO card wrapper) instead of the Tailwind `card` utility class for structural presentation.
**Evidence**: Inspect the rendered DOM — confirm `<nz-card>` or `nz-card` attribute is present; no element relies solely on the `.card` CSS class for card structure.

### VAL-CRUD-002: Login form uses nz-form and nz-input
Username and password fields render inside an `<nz-form-item>` / `<nz-form-label>` / `<nz-form-control>` structure. Inputs use `nz-input` directive instead of the Tailwind `input-base` utility.
**Evidence**: DOM contains `<nz-form-item>`, `<input nz-input>` for both username and password fields.

### VAL-CRUD-003: Login submit button uses nz-button
The submit button renders as `<button nz-button nzType="primary">` instead of the Tailwind `btn-primary` class.
**Evidence**: Submit button element has `nz-button` attribute and `nzType="primary"`.

### VAL-CRUD-004: Login icons replaced with nz-icon
The title icon (previously `<i-lucide name="user-circle-2">`) and submit icon (previously `<i-lucide name="circle-check">`) are replaced with `<span nz-icon nzType="..." nzTheme="outline"></span>` or equivalent NG-ZORRO icon markup.
**Evidence**: No `<i-lucide>` elements in the login template. All icons use `nz-icon`.

### VAL-CRUD-005: Login error message displays correctly
When authentication fails, an error message appears below the form. It should use `<nz-alert nzType="error">` or a styled `<span>` / `<p>` with NG-ZORRO tokens — not the Tailwind `text-danger` utility alone.
**Evidence**: Trigger a failed login; confirm error text is visible and uses NG-ZORRO component or token-based styling.

### VAL-CRUD-006: Login form submits and authenticates
Entering valid credentials and clicking Submit sends `POST /auth/login`, stores the JWT token, and navigates to `/dashboard`. Entering invalid credentials shows the error message without navigation.
**Evidence**: Network tab shows POST request; successful login redirects; failed login shows error.

### VAL-CRUD-007: No Tailwind component utility classes on Login
The login template contains no references to `card`, `input-base`, `btn-primary`, `label-base`, or `error-banner` Tailwind utility classes for structural UI components.
**Evidence**: Search login template source for these class names — zero hits.

---

## Categories Page (`src/app/category/categories.ts` + `categories.html`)

### VAL-CRUD-008: Categories page title renders with nz-icon
The page heading displays the translated "Categories" title with an NG-ZORRO icon replacing `<i-lucide name="tag">`.
**Evidence**: Heading contains `<span nz-icon>` (or equivalent), no `<i-lucide>` element.

### VAL-CRUD-009: Categories table uses nz-table
The category list renders inside `<nz-table>` with proper `<thead>`/`<tbody>` structure, including columns: Code, Name, Description, Active, Actions.
**Evidence**: DOM contains `<nz-table>` element; table headers match expected columns.

### VAL-CRUD-010: Categories two-column layout preserved
The page renders a two-column layout on large screens: table on the left (≈2/3 width), add form on the right (≈1/3 width). Permission-gated: form column only visible when user `canWrite('categories')`.
**Evidence**: Resize viewport to ≥1024px — two columns visible for write-permissioned user; single column for read-only user.

### VAL-CRUD-011: Categories inline editing works
Clicking the edit button on a row transforms Code, Name, and Description cells into editable inputs (using `nz-input`). Save and Cancel buttons appear. Saving persists changes via `PUT /categories/:id`; cancelling reverts to display mode.
**Evidence**: Click edit → cells become inputs; modify values → click save → API call succeeds and row updates; click cancel → original values restored.

### VAL-CRUD-012: Categories active toggle uses nz-switch or nz-icon button
Each row displays an active/inactive indicator. Clicking it toggles the category's `isActive` state via API. The toggle uses `<nz-switch>` or an `nz-icon`-based button — not `<i-lucide name="check">` / `<i-lucide name="x">`.
**Evidence**: Toggle element is `<nz-switch>` or a button with `nz-icon`; toggling sends PUT request; visual state updates.

### VAL-CRUD-013: Categories add form uses nz-form components
The "Add Category" form uses `<nz-form-item>`, `<nz-form-label>`, `<nz-form-control>`, `<input nz-input>`, `<textarea nz-input>`, and `<button nz-button nzType="primary">`.
**Evidence**: DOM inspection confirms NG-ZORRO form elements; no `input-base`, `label-base`, `btn-primary` utility classes.

### VAL-CRUD-014: Categories permission-gated delete
The delete button only appears for users with `canWrite('categories')`. Clicking delete removes the category via `DELETE /categories/:id`. A confirmation step (e.g., `<nz-popconfirm>`) should be present.
**Evidence**: Log in as read-only user → no delete button; log in as write user → delete button visible; clicking triggers confirmation then API call.

### VAL-CRUD-015: Categories selected row highlight
When editing a row, that row is visually highlighted (selected state) to indicate the active edit context.
**Evidence**: Click edit on a row → row background changes to highlight color; click cancel → highlight removed.

### VAL-CRUD-016: Categories error banner uses nz-alert
When an API error occurs, an error banner displays at the top of the page using `<nz-alert nzType="error">` instead of the `.error-banner` Tailwind class.
**Evidence**: Simulate API error → alert renders with `nz-alert`; no `.error-banner` class.

### VAL-CRUD-017: Categories empty state
When no categories exist, the table displays a "No categories yet" message spanning all columns.
**Evidence**: With empty dataset, single-row message visible in table body.

### VAL-CRUD-018: No lucide icons on Categories page
Zero `<i-lucide>` elements remain in the categories template. All icons (tag, check, x, pencil, trash-2) replaced with `nz-icon`.
**Evidence**: Search template for `i-lucide` — zero matches.

---

## Products Page (`src/app/product/products.ts` + `products.html`)

### VAL-CRUD-019: Products page renders with nz-table
The product list renders inside `<nz-table>` with columns: Code, Name, Description, Category, HSN/SAC, Tax Rate, GTN, Active, Actions.
**Evidence**: DOM contains `<nz-table>`; all 9 column headers present.

### VAL-CRUD-020: Product GTN badges use nz-tag
GTN mode badges (Manual/Auto) and GTN generation badges (Batch/Tag/Code) render as `<nz-tag>` components with appropriate colors — not the Tailwind `.badge` utility class.
**Evidence**: GTN cell contains `<nz-tag>` elements with color variants; no `.badge` class usage.

### VAL-CRUD-021: Products active toggle functional
Each product row has an active/inactive toggle (using `<nz-switch>` or `nz-icon` button). Clicking sends a PUT request and updates visual state.
**Evidence**: Click toggle → API call fires → icon/switch state changes.

### VAL-CRUD-022: Products edit loads ProductForm component
Clicking edit on a product row loads the `<app-product-form>` component above the table with the product's data pre-filled. The corresponding table row is highlighted.
**Evidence**: Click edit → form section appears populated with selected product data; row is highlighted.

### VAL-CRUD-023: Products delete with permission gate
Delete buttons only render for users with `canWrite('products')`. Clicking delete removes the product via API.
**Evidence**: Read-only user sees no delete button; write user can delete.

### VAL-CRUD-024: No lucide icons on Products page
Zero `<i-lucide>` elements remain. Icons (layers, check, x, pencil, trash-2) all replaced with `nz-icon`.
**Evidence**: Search template for `i-lucide` — zero matches.

### VAL-CRUD-025: No Tailwind component utilities on Products page
The products template contains no `card`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`, `table-row-selected`, `btn-link-edit`, `btn-link-danger`, `badge`, `page-title`, `section-title`, or `error-banner` utility classes.
**Evidence**: Search template source for these class names — zero hits.

---

## ProductForm Component (`src/app/product/product-form.component.ts` + `.html`)

### VAL-CRUD-026: ProductForm uses nz-form grid layout
The product form renders in a responsive multi-column grid (1 col mobile, 2 col tablet, 4 col desktop) using NG-ZORRO `nz-row` / `nz-col` or CSS grid — with `<nz-form-item>` wrappers.
**Evidence**: Form fields arranged in grid; at 1280px+ viewport 4 fields per row visible.

### VAL-CRUD-027: ProductForm inputs use nz-input and nz-select
All text/number inputs use `nz-input` directive. The category dropdown and GTN mode/generation dropdowns use `<nz-select>` instead of native `<select>` with `select-base` class.
**Evidence**: DOM shows `<input nz-input>`, `<nz-select>` elements; no `.input-base` or `.select-base` classes.

### VAL-CRUD-028: ProductForm GTN conditional fields
When GTN mode is "Auto" and generation is "Batch" or "Tag", additional fields appear: Batch/Tag Prefix, Start Sequence, GTN Length. When GTN mode is "Manual", these fields are hidden.
**Evidence**: Select "Auto" → "Batch" → three extra fields appear; select "Manual" → fields hidden.

### VAL-CRUD-029: ProductForm submit and cancel buttons use nz-button
The Save/Add and Cancel buttons use `<button nz-button nzType="primary">` and `<button nz-button nzType="default">` respectively.
**Evidence**: Button elements have `nz-button` attribute; no `.btn-primary` or `.btn-outline` classes.

### VAL-CRUD-030: ProductForm error banner uses nz-alert
When a form submission error occurs, an error message appears using `<nz-alert nzType="error">`.
**Evidence**: Trigger save with invalid data or simulate API error → `nz-alert` rendered.

### VAL-CRUD-031: ProductForm saves and emits event
Submitting the form with valid data sends POST (new) or PUT (edit) to `/products`. On success, the `(saved)` output event fires to refresh the parent products list.
**Evidence**: Fill form → submit → network request succeeds → product list refreshes.

### VAL-CRUD-032: No Tailwind component utilities in ProductForm
The product form template contains no `input-base`, `select-base`, `btn-primary`, `btn-outline`, `label-base`, or `error-banner` utility classes.
**Evidence**: Search template source — zero hits.

---

## Customers Page (`src/app/customer/customers.ts` + `customers.html`)

### VAL-CRUD-033: Customers page renders with nz-table and nz-form
Customer list renders in `<nz-table>` with columns: Code, Name, Type, Description, Active, Actions. The add/edit form above uses NG-ZORRO form components.
**Evidence**: DOM contains `<nz-table>` and `<nz-form-item>` elements.

### VAL-CRUD-034: Customers form multi-column layout
The customer form renders in a responsive grid (1/2/4 columns) with fields: Code, Name, Type (select), GSTIN, Description (textarea spanning full width).
**Evidence**: At ≥1280px, 4 fields per row; type field is `<nz-select>` with Retail/Wholesale options.

### VAL-CRUD-035: Customers "same as billing" checkbox works
A checkbox labeled "Same as billing" is present using `<label nz-checkbox>` or native checkbox. When checked, the shipping address form is hidden; when unchecked, both billing and shipping forms appear.
**Evidence**: Check the box → shipping address section disappears; uncheck → shipping section appears.

### VAL-CRUD-036: Customers billing address form renders as collapsible panel
The billing address sub-form renders inside a collapsible section (using `<nz-collapse>` / `<nz-collapse-panel>` or equivalent). Clicking the header expands/collapses the address fields.
**Evidence**: Click billing address header → fields expand with animation; click again → collapses.

### VAL-CRUD-037: Customers shipping address form renders as collapsible panel
Same as VAL-CRUD-036 but for shipping address. Only visible when "same as billing" is unchecked.
**Evidence**: Uncheck "same as billing" → shipping collapse panel appears; click to expand → 8 address fields visible.

### VAL-CRUD-038: Customers active toggle functional
Each customer row has an active/inactive toggle. Clicking sends PUT request to update `isActive`. Visual state updates accordingly.
**Evidence**: Toggle customer → API call → state changes.

### VAL-CRUD-039: Customers CRUD operations complete
Create: fill form + submit → POST `/customers` → row appears in table.
Edit: click edit → form populates → modify → submit → PUT → row updates.
Delete: click delete → confirmation → DELETE → row removed.
**Evidence**: Execute each operation; verify network calls and table state.

### VAL-CRUD-040: Customers table row selection highlight
When editing a customer, the corresponding table row is highlighted.
**Evidence**: Click edit → row background changes; cancel → highlight removed.

### VAL-CRUD-041: No lucide icons on Customers page
Zero `<i-lucide>` elements remain. Icons (users, check, x, pencil, trash-2) all replaced with `nz-icon`.
**Evidence**: Search template for `i-lucide` — zero matches.

### VAL-CRUD-042: No Tailwind component utilities on Customers page
No `card`, `input-base`, `select-base`, `btn-primary`, `btn-outline`, `btn-link-edit`, `btn-link-danger`, `label-base`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`, `table-row-selected`, `page-title`, `section-title`, or `error-banner` classes.
**Evidence**: Search template source — zero hits for all listed classes.

---

## Suppliers Page (`src/app/supplier/suppliers.ts` + `suppliers.html`)

### VAL-CRUD-043: Suppliers page renders with nz-table and nz-form
Supplier list renders in `<nz-table>` with columns: Code, Name, Description, Active, Actions. The add/edit form above uses NG-ZORRO form components.
**Evidence**: DOM contains `<nz-table>` and `<nz-form-item>` elements.

### VAL-CRUD-044: Suppliers form includes GSTIN field and description textarea
The form renders fields: Code, Name, GSTIN, Description (full-width textarea). All use `nz-input` / `nz-input[nzAutosize]`.
**Evidence**: Inspect form — 3 text inputs + 1 textarea, all with `nz-input`.

### VAL-CRUD-045: Suppliers "same as billing" checkbox and address forms
Identical pattern to Customers: a "Same as billing" checkbox controls visibility of the shipping address `<app-address-form>`. Both address sections use collapsible panels.
**Evidence**: Toggle checkbox → shipping form hides/shows; both address sections are collapsible.

### VAL-CRUD-046: Suppliers active toggle functional
Each supplier row has a toggle. Clicking sends PUT request and updates visual state.
**Evidence**: Click toggle → API call → icon/switch updates.

### VAL-CRUD-047: Suppliers CRUD operations complete
Create, edit, and delete operations work against `/suppliers` API endpoints. Form populates correctly on edit; table refreshes after operations.
**Evidence**: Execute each operation; verify network calls and table state.

### VAL-CRUD-048: Suppliers permission gating
Form and action buttons (edit, delete) only visible to users with `canWrite('suppliers')`. Read-only users see only the table without action columns.
**Evidence**: Login as read-only → no form, no action column; login as write → full UI.

### VAL-CRUD-049: No lucide icons on Suppliers page
Zero `<i-lucide>` elements. Icons (building-2, check, x, pencil, trash-2) replaced with `nz-icon`.
**Evidence**: Search template for `i-lucide` — zero matches.

### VAL-CRUD-050: No Tailwind component utilities on Suppliers page
No Tailwind component utility classes (same set as VAL-CRUD-042) present in the suppliers template.
**Evidence**: Search template source — zero hits.

---

## Users Page (`src/app/user/users.ts` + `users.html`)

### VAL-CRUD-051: Users page renders with nz-table
User list renders in `<nz-table>` with columns: Username, First Name, Last Name, Role, Active, Actions.
**Evidence**: DOM contains `<nz-table>`; all 6 column headers present.

### VAL-CRUD-052: Users form uses nz-form with multi-column grid
The user form renders fields (Username, First Name, Last Name, Role) in a responsive grid (1/2/4 columns). Role uses `<nz-select>` with options: user, manager, admin.
**Evidence**: At ≥1280px, 4 fields per row; role field is `<nz-select>`.

### VAL-CRUD-053: Users permission matrix renders with nz-radio-group
The admin-only permission matrix table displays all modules (categories, products, customers, suppliers, sales-invoices, purchase-invoices, stock-invoices, users) as rows, with columns: No Access, Read Only, Full Access. Each cell contains a radio button using `<nz-radio-group>` and `<label nz-radio>` (or `<nz-radio-button>`) — not the custom `.permission-radio-label` / `.permission-radio-*-active` Tailwind classes.
**Evidence**: DOM shows `nz-radio` elements; no `.permission-radio-*` CSS classes; selecting a radio updates the permission model.

### VAL-CRUD-054: Users permission matrix only visible for admins
The permission matrix section only renders when the logged-in user is an admin (`isAdmin` flag). Non-admin users with write access see the user form but not the permission table.
**Evidence**: Login as admin → permission matrix visible; login as manager with users:write → matrix hidden.

### VAL-CRUD-055: Users permission radio icons replaced
The permission radio labels previously used `<i-lucide name="x">` (none), `<i-lucide name="eye">` (read), `<i-lucide name="pencil">` (write). These are replaced with `nz-icon` equivalents or removed in favor of `nz-radio-group` text/styled labels.
**Evidence**: No `<i-lucide>` elements in the permission matrix; icons use `nz-icon` or radio buttons use text labels.

### VAL-CRUD-056: Users active toggle functional
Each user row has a toggle. Clicking sends PUT and updates visual state.
**Evidence**: Click toggle → API call → state changes.

### VAL-CRUD-057: Users CRUD operations complete
Create: submit form → POST `/users` → row appears.
Edit: click edit → form populates (including permissions) → modify → save → PUT → table updates.
Delete: click delete → confirmation → DELETE → row removed.
**Evidence**: Execute each operation; verify network calls and table state.

### VAL-CRUD-058: Users save button permission-gated with directive
The Save button is wrapped with `*appHasPermission="'users:write'"` structural directive. This business logic directive is preserved as-is (not replaced by NG-ZORRO).
**Evidence**: Inspect template — `*appHasPermission` directive present on save button.

### VAL-CRUD-059: Users table row selection highlight
Editing a user highlights the corresponding row in the table.
**Evidence**: Click edit → row highlighted; cancel → highlight removed.

### VAL-CRUD-060: No lucide icons on Users page
Zero `<i-lucide>` elements. All icons (user-round, check, x, pencil, eye, trash-2) replaced with `nz-icon`.
**Evidence**: Search template for `i-lucide` — zero matches.

### VAL-CRUD-061: No Tailwind component utilities on Users page
No Tailwind component utility classes present, including the custom permission radio classes (`permission-radio-label`, `permission-radio-none-active`, `permission-radio-read-active`, `permission-radio-write-active`).
**Evidence**: Search template source — zero hits for all listed classes.

---

## Dashboard Page (`src/app/dashboard/dashboard.ts` + `dashboard.html`)

### VAL-CRUD-062: Dashboard 4 stat cards render with nz-card or nz-statistic
Four summary cards (Income Today, Expenses Today, Income This Month, Expenses This Month) render using `<nz-card>` or `<nz-statistic>` components. Each displays a label, formatted numeric value, and an icon.
**Evidence**: DOM contains 4 `<nz-card>` (or `nz-statistic`) elements with correct labels and values.

### VAL-CRUD-063: Dashboard stat card icons use nz-icon
Card icons (wallet, calendar, and inline SVGs for expenses) are replaced with `<span nz-icon>` equivalents. No `<i-lucide>` elements and no inline `<svg>` elements for icons.
**Evidence**: Inspect card icon areas — `nz-icon` elements present; no `<i-lucide>` or raw `<svg>` icon markup.

### VAL-CRUD-064: Dashboard bar chart renders (ng2-charts preserved)
The "Daily entries (this month)" bar chart renders using `<canvas baseChart>` with ng2-charts. The chart displays daily income/expense bars for the current month.
**Evidence**: `<canvas>` element with `baseChart` directive renders; Chart.js bar chart is visible with data.

### VAL-CRUD-065: Dashboard pie charts render (ng2-charts preserved)
Two pie charts render: "Income By Register (this month)" and "Expenses By Category (this month)". Both use `<canvas baseChart>` with `[type]="'pie'"`.
**Evidence**: Two `<canvas>` elements with pie chart type; charts display with data segments.

### VAL-CRUD-066: Dashboard recent entries table uses nz-table
The "Recent Entries" table renders inside `<nz-table>` with columns: Date, Register, Description, Category, Income, Expenses.
**Evidence**: DOM contains `<nz-table>` for recent entries; 6 column headers present.

### VAL-CRUD-067: Dashboard empty state for recent entries
When no entries exist in the last 7 days, the table shows "No entries in the last 7 days" message.
**Evidence**: With no recent data, single-row message visible spanning all columns.

### VAL-CRUD-068: Dashboard error banner uses nz-alert
When the dashboard API call fails, an error banner renders using `<nz-alert nzType="error">`.
**Evidence**: Simulate API failure → `nz-alert` element visible.

### VAL-CRUD-069: No lucide icons on Dashboard
Zero `<i-lucide>` elements. Icons (layout-dashboard, wallet, calendar) replaced with `nz-icon`.
**Evidence**: Search template for `i-lucide` — zero matches.

### VAL-CRUD-070: No Tailwind component utilities on Dashboard
No `card`, `page-title`, `section-title`, `error-banner`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row` classes.
**Evidence**: Search template source — zero hits.

---

## Entries Page (`src/app/entry/entries.ts` + `entries.html`)

### VAL-CRUD-071: Entries date range filter uses nz-date-picker
Start Date and End Date fields use `<nz-date-picker>` (or `<nz-range-picker>`) instead of native `<input type="date">` with `input-base` class. The Filter button uses `nz-button`.
**Evidence**: DOM shows `<nz-date-picker>` elements; filter button has `nz-button` attribute.

### VAL-CRUD-072: Entries table uses nz-table with totals displayed
The entries table renders in `<nz-table>` with columns: Date, Register, Description, Category, Income, Expenses, Actions. Above the table, three summary values display: Total Income (green), Total Expenses (red), Balance (accent).
**Evidence**: DOM contains `<nz-table>`; totals displayed with correct semantic colors.

### VAL-CRUD-073: Entries edit form uses nz-form components
The side edit form renders with fields: Date (`nz-date-picker`), Register (`nz-select`), Description (`nz-input` textarea), Amount (`nz-input-number` or `nz-input`). Save and Cancel buttons use `nz-button`.
**Evidence**: DOM contains NG-ZORRO form components; no `input-base`, `select-base`, `btn-primary`, `btn-outline` classes.

### VAL-CRUD-074: Entries CRUD operations complete
Create: fill form → submit → POST `/entries` → row appears, totals update.
Edit: click edit → form populates → modify → save → PUT → table and totals update.
Delete: click delete → confirmation → DELETE → row removed, totals update.
**Evidence**: Execute each operation; verify network calls, table, and total recalculations.

### VAL-CRUD-075: No lucide icons on Entries page
Zero `<i-lucide>` elements. Icons (book-open, pencil, trash-2) replaced with `nz-icon`.
**Evidence**: Search template for `i-lucide` — zero matches.

---

## Registers Page (`src/app/register/registers.ts` + `registers.html`)

### VAL-CRUD-076: Registers table uses nz-table
Register list renders in `<nz-table>` with columns: Name, Description, Category, Active, Actions.
**Evidence**: DOM contains `<nz-table>`; 5 column headers present.

### VAL-CRUD-077: Registers form uses nz-form components with category nz-select
The register form renders fields: Name (`nz-input`), Description (`nz-input` textarea), Category (`nz-select` populated from categories API), Balance Amount (`nz-input-number`, conditionally disabled), Balance Date (`nz-date-picker`, conditionally disabled), Active (`<label nz-checkbox>` or `<nz-switch>`). Save and Cancel use `nz-button`.
**Evidence**: DOM shows NG-ZORRO form components; category dropdown is `<nz-select>`.

### VAL-CRUD-078: Registers active toggle uses nz-switch
The active toggle in each table row uses `<nz-switch>` or an `nz-icon`-based button — replacing the Tailwind `.toggle-btn` utility class and `<i-lucide>` icons.
**Evidence**: Toggle element is `<nz-switch>` or `nz-icon` button; no `.toggle-btn` class.

### VAL-CRUD-079: Registers CRUD operations complete
Create, edit, delete operations work against `/registers` API. Category dropdown populates from `/categories`. Conditional fields (Balance Amount, Balance Date) enable only for asset/liability category types.
**Evidence**: Execute each operation; verify conditional fields toggle based on category type.

### VAL-CRUD-080: No lucide icons on Registers page
Zero `<i-lucide>` elements. Icons (notebook-pen, check, x, pencil, trash-2) replaced with `nz-icon`.
**Evidence**: Search template for `i-lucide` — zero matches.

---

## Shared AddressForm Component (`src/app/shared/components/address-form.ts` + `.html`)

### VAL-CRUD-081: AddressForm uses nz-collapse for expandable sections
When `isExpandable` is true, the address form renders inside `<nz-collapse>` / `<nz-collapse-panel>` with an animated expand/collapse toggle. The panel header shows the translated title.
**Evidence**: DOM contains `<nz-collapse-panel>` when `isExpandable=true`; clicking header toggles content visibility.

### VAL-CRUD-082: AddressForm expand/collapse icon uses nz-icon
The chevron indicator (previously `<i-lucide name="chevron-down">`) is replaced with an `nz-icon` or handled natively by `<nz-collapse-panel>`.
**Evidence**: No `<i-lucide>` in address form template; expand indicator uses NG-ZORRO styling.

### VAL-CRUD-083: AddressForm 8 fields render with nz-input
All 8 address fields (Address Line 1, Address Line 2, Area, City, State, Pincode, Mobile, Email) render using `<input nz-input>` inside `<nz-form-item>` wrappers arranged in a 2-column grid.
**Evidence**: DOM shows 8 `<input nz-input>` elements; fields arranged in 2-col layout on desktop.

### VAL-CRUD-084: AddressForm disabled state propagates
When `disabled` input is true, all 8 fields are disabled (not editable). This applies when used in "same as billing" mode for shipping addresses.
**Evidence**: Set `disabled=true` → all inputs have `disabled` attribute and are non-interactive.

### VAL-CRUD-085: AddressForm non-expandable mode works
When `isExpandable` is false, the address form renders without a collapse wrapper — fields are always visible.
**Evidence**: Set `isExpandable=false` → no collapse panel; all fields immediately visible.

### VAL-CRUD-086: No Tailwind component utilities in AddressForm
No `input-base` or `label-base` classes in the address form template.
**Evidence**: Search template source — zero hits.

---

## Cross-Cutting Assertions

### VAL-CRUD-087: Tooltip directive replaced with nz-tooltip
All `[appTooltip]` directive usages across CRUD pages are replaced with `nz-tooltip` / `nzTooltipTitle`. The custom `TooltipDirective` is no longer used in migrated templates.
**Evidence**: Search all CRUD page templates for `appTooltip` — zero matches; tooltips use `nz-tooltip`.

### VAL-CRUD-088: No lucide-angular imports in CRUD page components
All CRUD page TypeScript files (login.ts, categories.ts, products.ts, product-form.component.ts, customers.ts, suppliers.ts, users.ts, dashboard.ts, entries.ts, registers.ts, address-form.ts) no longer import `LucideAngularModule`.
**Evidence**: Search `imports:` arrays in all listed .ts files — no `LucideAngularModule` reference.

### VAL-CRUD-089: Translation pipe preserved
All CRUD pages continue to use `{{ 'KEY' | translate }}` for i18n. The `TranslatePipe` from `@ngx-translate/core` is preserved — not replaced.
**Evidence**: Templates still contain `| translate` pipe usage; translations render correctly.

### VAL-CRUD-090: Business logic directives preserved
The `*appHasPermission` structural directive and `[appReadonlyIf]` directive remain unchanged (they are business logic, not UI library). Only the tooltip directive is replaced.
**Evidence**: Template search confirms `*appHasPermission` still in use where applicable.

### VAL-CRUD-091: All nz-table instances support empty states
Every `<nz-table>` across all CRUD pages displays a proper empty-state message (using `nzNoResult` or conditional row) when no data is available.
**Evidence**: Load each page with empty datasets — all tables show meaningful empty messages.

### VAL-CRUD-092: Dark mode continues to work
All CRUD pages render correctly in both light and dark mode. NG-ZORRO components respect the theme system (CSS custom properties / `.dark` class). No hard-coded colors from Tailwind utilities that break in dark mode.
**Evidence**: Toggle theme to dark → all pages, tables, forms, cards, buttons render with appropriate dark palette.

### VAL-CRUD-093: Form validation feedback displays
All forms with required fields show validation state using NG-ZORRO's `nzValidateStatus` and `nzErrorTip` on `<nz-form-control>` — providing inline error messages when required fields are empty or invalid on submit.
**Evidence**: Submit empty forms → validation errors appear below invalid fields.
