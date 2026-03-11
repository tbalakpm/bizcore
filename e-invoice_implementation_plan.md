# Goal Description
Enable Indian Government E-Invoicing norms for Sales Invoices. This involves storing specific GST-related metadata (Invoice Reference Number / IRN, Acknowledgment Number, Acknowledgment Date, and Signed QR Code Payload) and generating an E-Invoice payload. We will add a feature to securely generate these codes on demand and securely print the signed QR Code on the generated PDF invoice.

## Proposed Changes

### Database & Models
- [MODIFY] [src/db/schema/sales-invoice.schema.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/db/schema/sales-invoice.schema.ts)
  - Add `irn` (text, 64-char Hash)
  - Add `ackNo` (text, 15 digits)
  - Add `ackDate` (text, ISO timestamp)
  - Add `signedQrCode` (text)
- [MODIFY] [src/models/sales-invoice.model.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/models/sales-invoice.model.ts)
  - Update interfaces to represent the E-Invoice metadata fields.

*(Note: We will run `drizzle-kit push` to apply these schema updates without losing existing invoice data).*

### Backend APIs
- [NEW] `src/routes/e-invoice.ts` (or append to [sales-invoices.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/routes/sales-invoices.ts))
  - **`POST /api/sales-invoices/:id/generate-irn`**: An endpoint mimicking the IRP (Invoice Registration Portal) action.
    - Validates presence of customer GSTIN, HSN codes, and taxable amounts.
    - Generates a dummy/mock IRN hash (64 characters) and AckNo (since direct GSP integration requires authorized credentials).
    - Generates a mock `signedQrCode` string representing the encoded invoice.
    - Updates and saves these credentials onto the `salesInvoices` database record.
- [MODIFY] [src/routes/sales-invoices.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/routes/sales-invoices.ts) (`GET /:id/pdf`)
  - Utilize `bwip-js` or existing `pdfkit` logic to render a QR Code containing the `signedQrCode` string on the topmost area of the invoice.
  - Render the `IRN: ...` and `Ack No: ... / Ack Date: ...` visibly beside the QR Code as per Government stipulations.
  - Split `taxAmount` into CGST & SGST visually if the invoice doesn't specify IGST, providing GST-compliant breakdowns.

### Frontend UI
- [MODIFY] [src/app/sales-invoice/sales-invoice-service.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/sales-invoice/sales-invoice-service.ts)
  - Add the new `generateIrn(id: number)` API call interface.
- [MODIFY] [src/app/sales-invoice/sales-invoices.html](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/sales-invoice/sales-invoices.html) & [sales-invoices.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/routes/sales-invoices.ts)
  - In the Actions column, add a **"Generate IRN"** button that only displays if the invoice doesn't already possess an IRN.
  - Show the IRN / QRCode status visually on the list using badges.
- [MODIFY] [src/app/sales-invoice/sales-invoice-form.html](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/sales-invoice/sales-invoice-form.html)
  - Display the generated E-Invoice IRN details securely at the top if the document has been registered. Lock the document from further saving/editing if an IRN is already generated according to GST rules.

## Verification Plan
1. Apply database changes seamlessly using Native SQLite.
2. In the Sales Invoices frontend UI, identify an existing invoice (or create a new one).
3. Click the new "Generate IRN" button and ensure a "Success" message appears, populating the IRN details on the invoice.
4. Print the invoice, verifying the 64-char IRN and the generated QR Code are securely rendered at the top of the A4 layout.
