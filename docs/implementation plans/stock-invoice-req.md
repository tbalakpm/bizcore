# Stock Invoice Route

### Stock Invoice

## 1. Goal

     Create a route to do the C-R(get single and get all with pagination, filter, sorting)-U-D for the StockInvoice in the backend
     Create a page for the same in the frontend with list including pagination, filtering, and sorting options. Create, Edit, and Delete options are also to be added

## 2. Scope

     - In scope:
       - backend - @backend/sr/routes/stock-invoice.route
       - generate "stock-invoice" route which should be inserted/updated in stock-invoice.schema using stock-invoice.model.
       - generate inventory.model from the product input, generate gtn based on gtnGeneration value in product
     - Out of scope:
       - None

## 3. Functional Requirements

     - A List page with pagination, filtering, and sorting options
     - A Create/Update page
     - Delete with confirmation in the list page itself
     - Edge cases:
       - List, Search product, create a new product in product dropdown

## 4. Data / Database (if applicable)

     - Schema changes:
       - Already created for db schema and model, please review once
     - Migration requirements:
       - Already implemented, please review once

## 5. API Contract (if applicable)

     - Endpoint: `[GET] /api/stock-invoices`
     - Auth: auth
     - Request body/query:

## 6. UI / UX (if applicable)

        • Screens/components:
        • [list]
        • Behavior:
        • [button actions, form validation, loading/empty/error states]
        • Theming:
        • [light/dark expectations]
        • Design refs:
        • [Figma/screenshot/link]

## 7. Non-Functional Requirements

    • Performance: [limits/targets]
    • Security: [RBAC, validation, secrets, audit]
    • Reliability: [retry, idempotency, transaction needs]
    • Logging/monitoring: [what to log, what not to log]

## 8. Constraints

    • Must use:
    • [library/pattern]
    • Must not use:
    • [library/pattern]
    • Backward compatibility:
    • [required? how long?]

## 9. Acceptance Criteria

    [ ] [clear testable outcome 1]
    [ ] [clear testable outcome 2]
    [ ] Build/tests/lint pass:

## 10. Deliverables

    • Code changes in:
    • [paths]
    • Migration files:
    • [yes/no + names]
    • Notes:
    • [anything you want summarized]
