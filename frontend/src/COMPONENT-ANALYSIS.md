# BizCore Frontend — Complete Component Analysis for NG-ZORRO Migration

## 1. GLOBAL STYLES & DESIGN SYSTEM (`src/styles.css`)

### Imports
- `tailwindcss` (via `@import 'tailwindcss'`)
- `@ng-select/ng-select/themes/default.theme.css`
- `@custom-variant dark (&:where(.dark, .dark *))` — dark mode variant

### CSS Custom Properties (Design Tokens) — LIGHT THEME

| Token | Value | Category |
|---|---|---|
| `--color-surface` | `#ffffff` | Surface |
| `--color-surface-alt` | `#f8fafc` | Surface |
| `--color-surface-muted` | `#f1f5f9` | Surface |
| `--color-surface-raised` | `#ffffff` | Surface |
| `--color-chrome` | `#1e293b` | Sidebar/chrome |
| `--color-chrome-hover` | `#334155` | Sidebar/chrome |
| `--color-chrome-active` | `#475569` | Sidebar/chrome |
| `--color-chrome-border` | `#334155` | Sidebar/chrome |
| `--color-chrome-text` | `#cbd5e1` | Sidebar/chrome |
| `--color-chrome-text-bright` | `#f1f5f9` | Sidebar/chrome |
| `--color-chrome-muted` | `#94a3b8` | Sidebar/chrome |
| `--color-border` | `#e2e8f0` | Borders |
| `--color-border-strong` | `#cbd5e1` | Borders |
| `--color-text` | `#1e293b` | Text |
| `--color-text-muted` | `#64748b` | Text |
| `--color-text-heading` | `#0f172a` | Text |
| `--color-primary` | `#1e3a5fea` | Primary (deep navy) |
| `--color-primary-hover` | `#1e3a5f` | Primary |
| `--color-primary-light` | `#e8eef6` | Primary |
| `--color-accent` | `#2563eb` | Accent (blue) |
| `--color-accent-hover` | `#1d4ed8` | Accent |
| `--color-accent-light` | `#dbeafe` | Accent |
| `--color-success` | `#059669` | Semantic |
| `--color-success-light` | `#d1fae5` | Semantic |
| `--color-danger` | `#dc2626` | Semantic |
| `--color-danger-light` | `#fee2e2` | Semantic |
| `--color-warning` | `#d97706` | Semantic |
| `--color-warning-light` | `#fef3c7` | Semantic |
| `--color-info` | `#0284c7` | Semantic |
| `--radius-sm` | `0.25rem` | Radii |
| `--radius-md` | `0.375rem` | Radii |
| `--radius-lg` | `0.5rem` | Radii |

### CSS Custom Properties — DARK THEME (`.dark` class)

| Token | Value |
|---|---|
| `--color-surface` | `#0f172a` |
| `--color-surface-alt` | `#0c1322` |
| `--color-surface-muted` | `#2d3e58` |
| `--color-surface-raised` | `#1e293b` |
| `--color-chrome` | `#020617` |
| `--color-chrome-hover` | `#1e293b` |
| `--color-chrome-active` | `#334155` |
| `--color-chrome-border` | `#1e293b` |
| `--color-border` | `#334155` |
| `--color-border-strong` | `#475569` |
| `--color-text` | `#e2e8f0` |
| `--color-text-muted` | `#94a3b8` |
| `--color-text-heading` | `#f1f5f9` |
| `--color-primary` | `#165baba2` |
| `--color-primary-hover` | `#004da6` |
| `--color-primary-light` | `#1e3a5f` |
| `--color-accent` | `#60a5fa` |
| `--color-accent-hover` | `#93c5fd` |
| `--color-accent-light` | `#1e3a5f` |
| `--color-success` | `#34d399` |
| `--color-success-light` | `#064e3b` |
| `--color-danger` | `#f87171` |
| `--color-danger-light` | `#7f1d1d` |
| `--color-warning` | `#fbbf24` |
| `--color-warning-light` | `#78350f` |

### @utility Directives (Custom Tailwind Utilities)

| Utility Name | NG-ZORRO Equivalent | Description |
|---|---|---|
| `input-base` | `nz-input` | Full-width bordered input with focus ring |
| `select-base` | `nz-select` | Full-width bordered select with cursor pointer |
| `btn-primary` | `nz-button[nzType="primary"]` | Primary button (navy bg, white text) |
| `btn-accent` | `nz-button[nzType="primary"]` (custom color) | Accent button (blue bg, shadow) |
| `btn-outline` | `nz-button[nzType="default"]` | Outlined button |
| `btn-link-edit` | `nz-button[nzType="link"]` | Link-style edit button (accent color) |
| `btn-link-danger` | `nz-button[nzType="link"][nzDanger]` | Link-style danger button |
| `btn-link-warning` | `nz-button[nzType="link"]` (custom) | Link-style warning button |
| `card` | `nz-card` | Card with shadow, border, padding |
| `table-base` | `nz-table` | Full-width table |
| `table-head` | `<thead>` in nz-table | Table header with muted bg |
| `th-cell` | `<th>` in nz-table | Header cell with padding |
| `td-cell` | `<td>` in nz-table | Data cell with padding |
| `table-row` | `<tr>` in nz-table | Row with hover and border-bottom |
| `table-row-selected` | nz-table `[nzChecked]` row highlight | Selected row highlight |
| `page-title` | Typography | Flex heading with icon + gap |
| `section-title` | Typography | Section heading |
| `label-base` | `<nz-form-label>` | Form label |
| `error-banner` | `nz-alert[nzType="error"]` | Error banner |
| `badge` | `nz-tag` / `nz-badge` | Small colored badge |
| `toggle-btn` | `nz-switch` | Active/inactive toggle |
| `pagination-btn` | `nz-pagination` | Pagination prev/next buttons |

### Special CSS Classes

- **Permission Radio Controls** (`.permission-radio-label`, `.permission-radio-none-active`, `.permission-radio-read-active`, `.permission-radio-write-active`): Custom styled radio circles for the permission matrix on the Users page → Replaceable with `nz-radio-group` with custom styling
- **App Shell Layout** (`.app-shell-main`, `.app-shell-sidebar`, `.app-shell-content`): Responsive sidebar layout with media queries → Replaceable with `nz-layout` + `nz-sider` + `nz-content`
- **ng-select overrides**: Heavy theming of `.ng-select` container, dropdown panel, options → **All removed** when switching to `nz-select`

---

## 2. APP SHELL (`app.ts` + `app.html`)

### Component: `App`
- **Path**: `src/app/app.ts` + `src/app/app.html`
- **Selector**: `app-root`
- **Imports**: `RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, DatePipe, LucideAngularModule`

### Structure
1. **Top Header Bar** (`<header>`)
   - Sidebar toggle button (hamburger `<i-lucide name="menu">`)
   - Logo/brand link to "/"
   - Theme toggle button (`<i-lucide name="sun">` / `<i-lucide name="moon">`)
   - Logout button with `<i-lucide name="log-out">`
   - → **NG-ZORRO**: `nz-layout > nz-header` with `nz-icon`

2. **Sidebar** (`<aside>`)
   - Collapsible (signal `isSidebarCollapsed`)
   - Resizable via mouse drag (min 200px, max 400px, stored in localStorage)
   - Two menu modes: `'main'` and `'reports'`
   - **Main Menu** nav items (with permission checks):
     - Dashboard (`layout-dashboard`)
     - Sales (`inline SVG icon`)
     - Opening Stock (`package`)
     - Purchase (`inline SVG icon`)
     - Products (`layers`)
     - Customers (`inline SVG icon`)
     - Suppliers (`inline SVG icon`)
     - Categories (`tag`)
     - Users (`user-round`)
     - Reports submenu button (`file-bar-chart` + `chevron-right`)
     - Settings (`inline SVG icon`)
   - **Reports Submenu**:
     - Back button (`arrow-left`)
     - Sales Report, Stock Report, Tax Output (all inline SVG icons)
   - → **NG-ZORRO**: `nz-sider` with `nz-menu[nzMode="inline"]`, `nz-menu-item`, `nz-sub-menu`, `nz-icon`

3. **Content Area** (`<div class="app-shell-content">`)
   - `<router-outlet>` renders page components
   - → **NG-ZORRO**: `nz-content`

4. **Footer** (`<footer>`)
   - Copyright with date pipe, link to FandaTech
   - → **NG-ZORRO**: `nz-footer`

### Theme System
- Three modes: `'system'`, `'light'`, `'dark'`
- Toggles `.dark` class on `<html>` documentElement
- Stored in `localStorage` under key `theme_mode`
- System listener via `matchMedia('prefers-color-scheme: dark')`

### Lucide Icons Used in App Shell
`menu`, `sun`, `moon`, `log-out`, `layout-dashboard`, `package`, `layers`, `tag`, `user-round`, `file-bar-chart`, `chevron-right`, `arrow-left`

### Inline SVGs Used in App Shell
- Sales invoice icon (document with arrow)
- Purchase invoice icon (same document icon)
- Customer icon (pen/edit icon)
- Supplier icon (same pen/edit icon)
- Settings icon (gear/cog)
- Report sub-items (document with lines)

---

## 3. ROUTING (`app.routes.ts`)

| Route | Component | Auth | Module Permission |
|---|---|---|---|
| `/login` | `Login` | No | - |
| `/dashboard` | `Dashboard` | Yes | - |
| `/categories` | `Categories` | Yes | `categories` |
| `/products` | `Products` | Yes | `products` |
| `/customers` | `Customers` | Yes | `customers` |
| `/suppliers` | `Suppliers` | Yes | `suppliers` |
| `/stock-invoices` | `StockInvoices` | Yes | `stock-invoices` |
| `/stock-invoices/new` | `StockInvoiceForm` | Yes | `stock-invoices` |
| `/stock-invoices/:id/edit` | `StockInvoiceForm` | Yes | `stock-invoices` |
| `/sales-invoices` | `SalesInvoices` | Yes | `sales-invoices` |
| `/sales-invoices/new` | `SalesInvoiceForm` | Yes | `sales-invoices` |
| `/sales-invoices/:id/edit` | `SalesInvoiceForm` | Yes | `sales-invoices` |
| `/purchase-invoices` | `PurchaseInvoices` | Yes | `purchase-invoices` |
| `/purchase-invoices/new` | `PurchaseInvoiceForm` | Yes | `purchase-invoices` |
| `/purchase-invoices/:id/edit` | `PurchaseInvoiceForm` | Yes | `purchase-invoices` |
| `/users` | `Users` | Yes | `users` |
| `''` → redirect to `dashboard` | | | |
| `**` → redirect to `''` | | | |

**Note**: Reports routes (`/reports/sales`, `/reports/stock`, `/reports/tax`) are referenced in sidebar HTML but not defined in routes — likely not yet implemented.

---

## 4. APP CONFIG (`app.config.ts`)

### Providers
- `provideZoneChangeDetection({ eventCoalescing: true })`
- `provideRouter(routes)`
- `provideTranslateService` (ngx-translate with HTTP loader, `/assets/i18n/`, fallback `en`)
- `LOCALE_ID` → `'en-IN'`
- `provideHttpClient(withInterceptors([authInterceptor]))`
- `provideCharts(withDefaultRegisterables())` — ng2-charts
- `LUCIDE_ICONS` provider with all icons

### Registered Lucide Icons
`Pencil`, `Trash2`, `Printer`, `FileCheck`, `FilterX`, `Plus`, `ArrowLeft`, `Check`, `X`, `Save`, `ScanBarcode`, `Eye`, `Copy`, `ToggleLeft`, `ToggleRight`, `Menu`, `Sun`, `Moon`, `LogOut`, `LayoutDashboard`, `ReceiptText`, `Package`, `Users`, `Truck`, `Layers`, `UserRound`, `FileBarChart`, `ChevronRight`, `Settings`, `User`, `Wallet`, `Calendar`, `Search`, `Building2`, `Tag`

---

## 5. PAGE COMPONENTS — DETAILED ANALYSIS

### 5.1 Login (`src/app/auth/login.ts` + `login.html`)
- **Selector**: `app-login`
- **Imports**: `TranslatePipe, FormsModule, ReactiveFormsModule, LucideAngularModule`
- **Tailwind utilities used**: `card`, `input-base`, `btn-primary`, `label-base`
- **Lucide icons**: `user-circle-2` (in title), `circle-check` (submit button) — *Note: `user-circle-2` not in registered icons list*
- **ng-select**: ❌ No
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**: Simple centered login card with form (username/password), error message display
- **NG-ZORRO mapping**: `nz-card`, `nz-form`, `nz-input`, `nz-button`, `nz-icon`

### 5.2 Dashboard (`src/app/dashboard/dashboard.ts` + `dashboard.html`)
- **Selector**: `app-dashboard`
- **Imports**: `TranslatePipe, DecimalPipe, BaseChartDirective, DatePipe, LucideAngularModule`
- **Tailwind utilities used**: `page-title`, `error-banner`, `card`, `section-title`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`
- **Lucide icons**: `layout-dashboard` (title), `wallet` (income card), `calendar` (month card)
- **ng-select**: ❌ No
- **ng2-charts**: ✅ YES
  - **Bar chart**: Daily income/expenses for current month
  - **Pie chart** (x2): Income by register, Expenses by category
- **jsbarcode**: ❌ No
- **UI patterns**: 4 summary stat cards (grid), 1 bar chart, 2 pie charts, recent entries table
- **NG-ZORRO mapping**: `nz-card`, `nz-statistic`, `nz-table`, charts can remain ng2-charts or switch to `@antv/g2`

### 5.3 Categories (`src/app/category/categories.ts` + `categories.html`)
- **Selector**: `app-categories`
- **Imports**: `TranslatePipe, FormsModule, CommonModule, LucideAngularModule, TooltipDirective`
- **Tailwind utilities used**: `page-title`, `error-banner`, `card`, `section-title`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`, `table-row-selected`, `input-base`, `btn-primary`, `btn-link-edit`, `btn-link-danger`, `label-base`
- **Lucide icons**: `tag` (title), `check` / `x` (active toggle), `pencil` (edit), `trash-2` (delete)
- **ng-select**: ❌ No
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**: Two-column layout (table + add form), inline editing in table rows, active toggle circle buttons, permission-gated actions
- **NG-ZORRO mapping**: `nz-table` with inline editing, `nz-form`, `nz-switch`, `nz-popconfirm` for delete, `nz-icon`

### 5.4 Products (`src/app/product/products.ts` + `products.html`)
- **Selector**: `app-products`
- **Imports**: `CommonModule, TranslatePipe, ProductFormComponent, LucideAngularModule, TooltipDirective`
- **Tailwind utilities used**: `page-title`, `error-banner`, `card`, `section-title`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`, `table-row-selected`, `btn-link-edit`, `btn-link-danger`, `badge`
- **Lucide icons**: `layers` (title), `check` / `x` (active toggle), `pencil` (edit), `trash-2` (delete)
- **ng-select**: ❌ No (uses `<select>` in ProductFormComponent)
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**: Product form component above table, table with badges for GTN modes (Manual/Auto, Batch/Tag/Code), active toggle
- **NG-ZORRO mapping**: `nz-table`, `nz-tag` for badges, `nz-form`, `nz-switch`

### 5.4.1 ProductFormComponent (`src/app/product/product-form.component.ts` + `.html`)
- **Selector**: `app-product-form`
- **Imports**: `FormsModule, CommonModule, TranslatePipe`
- **Tailwind utilities used**: `input-base`, `select-base`, `btn-primary`, `btn-outline`, `label-base`, `error-banner`
- **Lucide icons**: ❌ None
- **ng-select**: ❌ No (uses native `<select>`)
- **ng2-charts**: ❌ No
- **UI patterns**: Multi-column responsive grid form (1/2/4 cols), conditional GTN setup fields, category dropdown (native select)
- **NG-ZORRO mapping**: `nz-form`, `nz-input`, `nz-select`, `nz-button`, `nz-grid`

### 5.5 Customers (`src/app/customer/customers.ts` + `customers.html`)
- **Selector**: `app-customers`
- **Imports**: `FormsModule, ReactiveFormsModule, TranslatePipe, CommonModule, AddressForm, LucideAngularModule, TooltipDirective`
- **Tailwind utilities used**: `page-title`, `error-banner`, `card`, `section-title`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`, `table-row-selected`, `input-base`, `select-base`, `btn-primary`, `btn-outline`, `btn-link-edit`, `btn-link-danger`, `label-base`
- **Lucide icons**: `users` (title), `check` / `x` (active toggle), `pencil` (edit), `trash-2` (delete)
- **ng-select**: ❌ No
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**: Form above table, billing/shipping address sub-forms (AddressForm component), "same as billing" checkbox, type dropdown (retail/wholesale)
- **NG-ZORRO mapping**: `nz-form`, `nz-input`, `nz-select`, `nz-table`, `nz-checkbox`, `nz-collapse` for address sections

### 5.6 Suppliers (`src/app/supplier/suppliers.ts` + `suppliers.html`)
- **Selector**: `app-suppliers`
- **Imports**: `FormsModule, ReactiveFormsModule, TranslatePipe, CommonModule, AddressForm, LucideAngularModule, TooltipDirective`
- **Tailwind utilities used**: `page-title`, `error-banner`, `card`, `section-title`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`, `table-row-selected`, `input-base`, `btn-primary`, `btn-outline`, `btn-link-edit`, `btn-link-danger`, `label-base`
- **Lucide icons**: `building-2` (title), `check` / `x` (active toggle), `pencil` (edit), `trash-2` (delete)
- **ng-select**: ❌ No
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**: Nearly identical to Customers — form above table, billing/shipping address sub-forms, "same as billing" checkbox
- **NG-ZORRO mapping**: Same as Customers

### 5.7 Users (`src/app/user/users.ts` + `users.html`)
- **Selector**: `app-users`
- **Imports**: `FormsModule, ReactiveFormsModule, TranslatePipe, CommonModule, LucideAngularModule, HasPermissionDirective, TooltipDirective`
- **Tailwind utilities used**: `page-title`, `error-banner`, `card`, `section-title`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`, `table-row-selected`, `input-base`, `select-base`, `btn-primary`, `btn-outline`, `btn-link-edit`, `btn-link-danger`, `label-base`, `permission-radio-label`, `permission-radio-none-active`, `permission-radio-read-active`, `permission-radio-write-active`
- **Lucide icons**: `user-round` (title), `check` / `x` (active toggle, permission radio), `pencil` (edit, write permission radio), `eye` (read permission radio), `trash-2` (delete)
- **ng-select**: ❌ No
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**: Form + table, **permission matrix table** (modules × permission levels with custom radio buttons styled as circles), uses `*appHasPermission` structural directive, admin-only section
- **Notable**: Custom radio button UI for permissions → could use `nz-radio-group` with custom render
- **NG-ZORRO mapping**: `nz-form`, `nz-table`, `nz-radio-group`, `nz-switch`, `nz-icon`

### 5.8 Sales Invoices List (`src/app/sales-invoice/sales-invoices.ts` + `.html`)
- **Selector**: `app-sales-invoices`
- **Imports**: `ReactiveFormsModule, FormsModule, DatePipe, CurrencyPipe, RouterLink, NgSelectModule, LucideAngularModule, TooltipDirective`
- **Tailwind utilities used**: `page-title`, `card`, `input-base`, `btn-primary`, `btn-outline`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`, `badge`, `select-base`, `pagination-btn`
- **Lucide icons**: `receipt-text` (title), `filter-x` (clear filters), `file-check` (generate IRN), `pencil` (edit), `trash-2` (delete), `printer` (print)
- **ng-select**: ✅ YES — Customer filter dropdown with custom option template (name + code)
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**: Filter bar (invoice number input, customer ng-select, date, min/max amount), sortable column headers (click to toggle asc/desc with ↑↓ indicators), data table, pagination with rows-per-page selector and prev/next, IRN badge, action buttons (IRN generate, edit, delete, print)
- **Notable**: Uses `FormGroup` with `Subject` debounce (400ms) for filter auto-apply
- **NG-ZORRO mapping**: `nz-table` (with built-in sorting/pagination), `nz-select`, `nz-input`, `nz-date-picker`, `nz-button`, `nz-tag`, `nz-pagination`

### 5.9 Sales Invoice Form (`src/app/sales-invoice/sales-invoice-form.ts` + `.html`)
- **Selector**: `app-sales-invoice-form`
- **Imports**: `CommonModule, FormsModule, RouterLink, NgSelectModule, AddressForm, TranslatePipe, TooltipDirective, LucideAngularModule`
- **Tailwind utilities used**: `page-title`, `error-banner`, `card`, `label-base`, `input-base`, `select-base`, `btn-primary`, `btn-outline`, `btn-accent`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`
- **Lucide icons**: `printer` (print preview), `trash-2` (remove item), `plus` (add line item)
- **ng-select**: ✅ YES — **3 instances**:
  1. Customer selector (with `ng-label-tmp` and `ng-option-tmp` — shows code, name, type)
  2. Inventory/GTN selector per line item (with typeahead search via `inventoryInput$`, virtual scroll via `scrollToEnd`, disabled items, stock availability display)
  3. (implicit via `NgSelectComponent` ViewChildren ref for auto-focus)
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**: 
  - Master header form (customer, invoice#, date, ref#, ref date)
  - **Inline customer creation** form (quick-add with address forms)
  - Line items table with ng-select per row for inventory selection
  - Keyboard shortcut: Ctrl+N to add row
  - Auto-focus on newly added row's ng-select
  - Real-time line total calculation (qty × price - discount + tax)
  - Summary section (subtotal, discount, tax, net amount)
  - IRN e-invoice locked state display
  - Stock validation before save
- **NG-ZORRO mapping**: `nz-form`, `nz-select` (with `nzServerSearch`, `nzOnSearch`), `nz-table`, `nz-input-number`, `nz-button`, `nz-alert`, `nz-descriptions`, `nz-result` for IRN info

### 5.10 Purchase Invoices List (`src/app/purchase-invoice/purchase-invoices.ts` + `.html`)
- **Selector**: `app-purchase-invoices`
- **Imports**: `CommonModule, FormsModule, RouterLink, LucideAngularModule, TooltipDirective`
- **Tailwind utilities used**: `page-title`, `error-banner`, `card`, `input-base`, `select-base`, `btn-primary`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`, `pagination-btn`
- **Lucide icons**: `truck` (title), `pencil` (edit), `trash-2` (delete), `printer` (print)
- **ng-select**: ❌ No
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**: Filter bar (invoice number, date), sort dropdown, data table, pagination, action buttons
- **NG-ZORRO mapping**: `nz-table` (sorting, pagination), `nz-input`, `nz-date-picker`, `nz-select`, `nz-button`

### 5.11 Purchase Invoice Form (`src/app/purchase-invoice/purchase-invoice-form.ts` + `.html`)
- **Selector**: `app-purchase-invoice-form`
- **Imports**: `CommonModule, FormsModule, RouterLink, NgSelectModule, AddressForm, ProductFormComponent, TooltipDirective, LucideAngularModule`
- **Tailwind utilities used**: `page-title`, `error-banner`, `card`, `label-base`, `input-base`, `select-base`, `btn-primary`, `btn-outline`, `btn-accent`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`
- **Lucide icons**: `printer` (print), `trash-2` (remove item), `plus` (add line item)
- **ng-select**: ✅ YES — **2 instances**:
  1. Supplier selector (with option template showing code + name)
  2. Product selector per line item (with label and option templates)
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**:
  - Master header form (supplier, invoice#, date, ref#, ref date)
  - **Inline supplier creation** form (quick-add with address forms)
  - **Inline product creation** form (reuses ProductFormComponent)
  - Line items table with product ng-select per row
  - Per-line discount (none/percent/amount toggle dropdown + value input)
  - GTN input per line
  - Keyboard shortcut: Ctrl+N to add row
  - Header-level discount, tax override, round-off
  - Summary totals section
- **NG-ZORRO mapping**: `nz-form`, `nz-select`, `nz-table`, `nz-input-number`, `nz-button`, `nz-collapse` for inline forms

### 5.12 Stock Invoices List (`src/app/stock-invoice/stock-invoices.ts` + `.html`)
- **Selector**: `app-stock-invoices`
- **Imports**: `CommonModule, FormsModule, RouterLink, LucideAngularModule, TooltipDirective`
- **Tailwind utilities used**: `page-title`, `error-banner`, `card`, `input-base`, `select-base`, `btn-primary`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`, `pagination-btn`, `btn-link-edit`, `btn-link-danger`
- **Lucide icons**: `package` (title), `pencil` (edit), `scan-barcode` (print barcodes), `trash-2` (delete)
- **ng-select**: ❌ No
- **ng2-charts**: ❌ No
- **jsbarcode**: ✅ YES — Used in `printBarcodes()` method. Generates CODE128 barcode SVGs client-side via `JsBarcode(svg, value, { format: 'CODE128', ... })`. Opens a new print window with barcode labels (50mm × 30mm per label).
- **UI patterns**: Filter bar, sort dropdown, data table, pagination, barcode printing via popup window
- **NG-ZORRO mapping**: `nz-table`, `nz-input`, `nz-date-picker`, `nz-select`, `nz-pagination`, `nz-button`

### 5.13 Stock Invoice Form (`src/app/stock-invoice/stock-invoice-form.ts` + `.html`)
- **Selector**: `app-stock-invoice-form`
- **Imports**: `CommonModule, FormsModule, RouterLink, NgSelectModule, ProductFormComponent, TooltipDirective, LucideAngularModule`
- **Tailwind utilities used**: `page-title`, `error-banner`, `card`, `label-base`, `input-base`, `btn-primary`, `btn-outline`, `btn-link-danger`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`
- **Lucide icons**: `plus` (add line item), `trash-2` (remove item)
- **ng-select**: ✅ YES — Product selector per line item (with label and option templates showing code + name)
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**:
  - Simple header (invoice number, date)
  - **Inline product creation** form (reuses ProductFormComponent)
  - Line items table with product ng-select, GTN, HSN/SAC, tax rate, qty, unit price, line total
  - Keyboard shortcut: Ctrl+N to add row
  - Auto-focus on new row's ng-select
- **NG-ZORRO mapping**: `nz-form`, `nz-select`, `nz-table`, `nz-input-number`, `nz-button`

### 5.14 Entries (NOT IN ROUTES — `src/app/entry/entries.ts` + `.html`)
- **Selector**: `app-entries`
- **Imports**: `FormsModule, ReactiveFormsModule, DecimalPipe, TranslatePipe, DatePipe, LucideAngularModule, TooltipDirective`
- **Tailwind utilities used**: `page-title`, `card`, `section-title`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`, `input-base`, `select-base`, `btn-primary`, `btn-outline`, `btn-link-edit`, `btn-link-danger`, `label-base`
- **Lucide icons**: `book-open` (title), `pencil` (edit), `trash-2` (delete)
- **ng-select**: ❌ No
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**: Date range filter, two-column layout (table + edit form), income/expense/balance totals
- **Note**: Referenced in Dashboard but not in active routes

### 5.15 Registers (NOT IN ROUTES — `src/app/register/registers.ts` + `.html`)
- **Selector**: `app-registers`
- **Imports**: `FormsModule, ReactiveFormsModule, TranslatePipe, CommonModule, LucideAngularModule, TooltipDirective`
- **Tailwind utilities used**: `page-title`, `card`, `section-title`, `table-base`, `table-head`, `th-cell`, `td-cell`, `table-row`, `input-base`, `select-base`, `btn-primary`, `btn-outline`, `btn-link-edit`, `btn-link-danger`, `label-base`, `toggle-btn`
- **Lucide icons**: `notebook-pen` (title), `check` / `x` (active toggle), `pencil` (edit), `trash-2` (delete)
- **ng-select**: ❌ No
- **ng2-charts**: ❌ No
- **jsbarcode**: ❌ No
- **UI patterns**: Two-column layout (table + form), active toggle, category dropdown
- **Note**: Not in active routes

---

## 6. SHARED COMPONENTS

### 6.1 AddressForm (`src/app/shared/components/address-form.ts` + `.html`)
- **Selector**: `app-address-form`
- **Imports**: `CommonModule, FormsModule, TranslatePipe, LucideAngularModule`
- **Inputs**: `address` (Address object), `title` (string), `isExpandable` (boolean), `isOpen` (boolean), `disabled` (boolean)
- **Tailwind utilities used**: `input-base`, `label-base`
- **Lucide icons**: `chevron-down` (expand/collapse toggle)
- **UI patterns**: Collapsible address form with 8 fields (line1, line2, area, city, state, postal, mobile, email), 2-column grid
- **Used in**: Customers, Suppliers, SalesInvoiceForm (inline customer), PurchaseInvoiceForm (inline supplier)
- **NG-ZORRO mapping**: `nz-collapse` / `nz-collapse-panel` wrapping `nz-form` fields

---

## 7. SHARED DIRECTIVES

### 7.1 TooltipDirective (`src/app/shared/directives/tooltip.directive.ts`)
- **Selector**: `[appTooltip]`
- **Behavior**: Shows a fixed-position tooltip above (or below if clipped) the host element on mouseenter, hides on mouseleave
- **Styling**: Uses hardcoded Tailwind classes matching design tokens
- **Used in**: Nearly every page component
- **NG-ZORRO mapping**: `nz-tooltip` / `nzTooltipTitle` attribute directive — **direct replacement**

### 7.2 HasPermissionDirective (`src/app/shared/directives/has-permission.directive.ts`)
- **Selector**: `[appHasPermission]`
- **Behavior**: Structural directive (`*appHasPermission="'module:action'"`) that shows/hides template based on user permissions
- **Used in**: Users component (save button)
- **NG-ZORRO mapping**: Keep as-is (business logic directive, not UI)

### 7.3 ReadonlyIfDirective (`src/app/shared/directives/readonly-if.directive.ts`)
- **Selector**: `[appReadonlyIf]`
- **Behavior**: Disables element and adds opacity/cursor styles if user lacks write permission for given module
- **Used in**: Not observed in active templates
- **NG-ZORRO mapping**: Keep as-is (business logic directive, not UI)

---

## 8. SERVICES (Data Flow)

| Service | Path | API Endpoints | Used By |
|---|---|---|---|
| `AuthService` | `auth/auth-service.ts` | `POST /auth/login`, `POST /auth/register` | Login, App, Guards, Interceptor |
| `PermissionService` | `auth/permission.service.ts` | (reads from AuthService token) | All page components |
| `CategoryService` | `category/category-service.ts` | `GET/POST/PUT/DELETE /categories` | Categories, ProductForm, Registers |
| `ProductService` | `product/product-service.ts` | `GET/POST/PUT/DELETE /products` | Products, all invoice forms |
| `CustomerService` | `customer/customer-service.ts` | `GET/POST/PUT/DELETE /customers` | Customers, SalesInvoices, SalesInvoiceForm |
| `SupplierService` | `supplier/supplier-service.ts` | `GET/POST/PUT/DELETE /suppliers` | Suppliers, PurchaseInvoiceForm |
| `UserService` | `user/user-service.ts` | `GET/POST/PUT/DELETE /users` | Users |
| `SalesInvoiceService` | `sales-invoice/sales-invoice-service.ts` | `GET/POST/PUT/DELETE /sales-invoices`, `GET /:id/pdf`, `POST /:id/generate-irn` | SalesInvoices, SalesInvoiceForm |
| `PurchaseInvoiceService` | `purchase-invoice/purchase-invoice-service.ts` | `GET/POST/PUT/DELETE /purchase-invoices`, `GET /:id/pdf` | PurchaseInvoices, PurchaseInvoiceForm |
| `StockInvoiceService` | `stock-invoice/stock-invoice-service.ts` | `GET/POST/PUT/DELETE /stock-invoices`, `GET /:id/barcodes`, `GET /:id/barcodes/pdf` | StockInvoices, StockInvoiceForm |
| `InventoryService` | `inventory/inventory-service.ts` | `GET /inventories` (with search, pagination, inStock filter) | SalesInvoiceForm |
| `EntryService` | `entry/entry-service.ts` | `GET/POST/PUT/DELETE /entries` | Entries, Dashboard |
| `RegisterService` | `register/register-service.ts` | `GET/POST/PUT/DELETE /registers` | Registers, Entries |

### Common Patterns
- All services use `inject(HttpClient)` 
- All use `environment.apiUrl` base URL
- Most list endpoints return `{ data: T[], pagination }` format
- Auth token passed via `authInterceptor` (Bearer token from sessionStorage)
- Language passed via `Accept-Language` header

---

## 9. MODELS

### pagination (`models/pagination.ts`)
```typescript
interface pagination { limit, offset, total, page, totalPages }
```

### UserPermissions (`models/permission.model.ts`)
```typescript
type PermissionLevel = 'none' | 'read' | 'write';
interface UserPermissions {
  categories, products, customers, suppliers,
  'sales-invoices', 'purchase-invoices', 'stock-invoices', users
}
```

---

## 10. THIRD-PARTY LIBRARY USAGE SUMMARY

| Library | Usage | Components | NG-ZORRO Replacement |
|---|---|---|---|
| **Tailwind CSS** | All structural styling via custom @utility directives and token-based classes | Every component | NG-ZORRO component styles + remaining Tailwind for layout |
| **lucide-angular** | Icon system (`<i-lucide name="...">`) | Every component except ProductFormComponent | `nz-icon` with NG-ZORRO icon set or keep Lucide |
| **@ng-select/ng-select** | Searchable dropdown with custom templates, typeahead, virtual scroll | SalesInvoices, SalesInvoiceForm, PurchaseInvoiceForm, StockInvoiceForm | `nz-select` with `nzServerSearch`, `nzOptionTemplate` |
| **ng2-charts** (Chart.js) | Bar chart, Pie charts on Dashboard | Dashboard only | Keep ng2-charts or switch to `@antv/g2` |
| **jsbarcode** | CODE128 barcode SVG generation for printing | StockInvoices only | Keep jsbarcode (no NG-ZORRO equivalent) |
| **@ngx-translate/core** | i18n translations (en, ta) | Every component | Keep (orthogonal to UI library) |
| **jwt-decode** | JWT token decoding for auth | AuthService | Keep (not UI related) |

---

## 11. COMPLETE COLOR PALETTE

### Light Theme
```
Surface:    #ffffff, #f8fafc, #f1f5f9, #ffffff
Chrome:     #1e293b, #334155, #475569, #334155, #cbd5e1, #f1f5f9, #94a3b8
Borders:    #e2e8f0, #cbd5e1
Text:       #1e293b, #64748b, #0f172a
Primary:    #1e3a5fea, #1e3a5f, #e8eef6
Accent:     #2563eb, #1d4ed8, #dbeafe
Success:    #059669, #d1fae5
Danger:     #dc2626, #fee2e2
Warning:    #d97706, #fef3c7
Info:       #0284c7
```

### Dark Theme
```
Surface:    #0f172a, #0c1322, #2d3e58, #1e293b
Chrome:     #020617, #1e293b, #334155, #1e293b
Borders:    #334155, #475569
Text:       #e2e8f0, #94a3b8, #f1f5f9
Primary:    #165baba2, #004da6, #1e3a5f
Accent:     #60a5fa, #93c5fd, #1e3a5f
Success:    #34d399, #064e3b
Danger:     #f87171, #7f1d1d
Warning:    #fbbf24, #78350f
```

### Additional Colors Used in Templates (not in tokens)
- `purple-100`, `purple-800`, `purple-200` — GTN "tag" badge in Products table
- `white` (#ffffff) — used explicitly in some button text
