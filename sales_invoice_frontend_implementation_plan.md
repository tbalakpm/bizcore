# Goal Description
Implement the frontend UI and logic for managing Sales Invoices. This will closely mirror the existing `Stock Invoices` implementation but will be adapted for sales (referencing Customers instead of Suppliers, and deducting stock). The requirements include a list page with pagination/filters/sorting, a create/edit form, and the ability to seamlessly create a new customer directly from the invoice creation form via a dropdown option/button.

## Proposed Changes

### Application Routes & Navigation
- [MODIFY] [src/app/app.routes.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/app.routes.ts)
  - Add routes for `sales-invoices` (list), `sales-invoices/new` (create), and `sales-invoices/:id/edit` (edit).
- [MODIFY] [src/app/app.html](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/app.html)
  - Add a navigation link to "Sales Invoices" in the sidebar menu (likely under "TRANSACTIONS").

### Services
- [NEW] `src/app/sales-invoice/sales-invoice-service.ts`
  - Implement the service to fetch ([getAll](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/stock-invoice/stock-invoice-service.ts#58-69), [getById](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/stock-invoice/stock-invoice-service.ts#70-73)), create ([create](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/stock-invoice/stock-invoice-service.ts#74-77)), update ([update](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/stock-invoice/stock-invoice-service.ts#78-81)), and delete ([delete](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/stock-invoice/stock-invoice-service.ts#82-85)) sales invoices by calling the `/api/sales-invoices` backend API.
  - Implement PDF preview generator ([getBarcodePdfUrl](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/stock-invoice/stock-invoice-service.ts#93-99) equivalent for sales invoice PDFs).

### Components

#### Sales Invoice Listing
- [NEW] `src/app/sales-invoice/sales-invoices.ts` & `sales-invoices.html`
  - **Pagination**: Implement page controls seamlessly requesting data from the backend.
  - **Filtering**: Add input fields for `invoiceNumber`, `invoiceDate`, `minAmount`, and `maxAmount` to filter the table.
  - **Sorting**: Allow column headers to toggle sorting state (e.g., date, total amount).
  - **Actions**: Add Create, Edit, Delete, and Print (PDF) buttons.

#### Sales Invoice Form
- [NEW] `src/app/sales-invoice/sales-invoice-form.ts` & `sales-invoice-form.html`
  - **Structure**: Header details (Customer, Invoice Number, Date) and tabular list of product items (Product, Qty, Unit Price, Line Total).
  - **Dynamic Item Lines**: Ability to add multiple rows of products using `ng-select` with searchable dropdowns.
  - **Automatic Calculations**: Dynamically compute Subtotals, Tax, Discounts, and Net Amounts.
  - **Inline Customer Creation (Goal)**: Implement an "Add Customer" button next to the customer `<ng-select>` dropdown. When clicked, present a sleek inline form or modal to capture a new customer's `name`, [code](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/stock-invoice/stock-invoice-service.ts#86-92), and `email/phone`, instantly save it to the DB via `CustomerService`, and seamlessly auto-select it in the dropdown.

## Verification Plan
1. Launch the frontend and verify the "Sales Invoices" navigation link appears.
2. Ensure the Sales Invoice Listing displays correctly, and test filtering and sorting actions.
3. Click "Create" and attempt to create a New Customer inline from the form. Ensure the customer list refreshes and selects the new customer.
4. Add line items, verify calculations, and save the invoice.
5. Print the generic Sales Invoice to test the PDF stream capability.
