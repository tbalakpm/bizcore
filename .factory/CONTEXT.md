# Project Context: BizCore

BizCore is a comprehensive business management system designed for small to medium-sized enterprises (SMEs). It provides a full-stack solution for managing inventory, sales, purchases, customers, and suppliers.

## Business Objectives
- **Inventory Management**: Track products, categories, serial numbers, and stock levels.
- **Financial Transactions**: Manage Sales Invoices, Purchase Invoices, and Stock Invoices.
- **Relationship Management**: Maintain records for Customers and Suppliers.
- **Multilingual Support**: Provide a localized experience (currently English and Tamil).
- **Modern Infrastructure**: Use high-performance, edge-ready technologies (Turso/libSQL).

## Technology Stack
- **Backend**:
  - Node.js & Express (TypeScript)
  - Drizzle ORM (Type-safe SQL)
  - libSQL / Turso (SQLite-compatible edge database)
  - JWT for Authentication
  - Custom i18n middleware
- **Frontend**:
  - Angular 20 (Standalone components, Signals)
  - TailwindCSS 4.x (Modern styling)
  - ngx-translate (Internationalization)
  - ng2-charts (Data visualization)

## Project Structure
- `backend/`: Express server, database schema, migrations, and API routes.
- `frontend/`: Angular application with feature-based module structure.
- `.factory/`: Knowledge base for AI agents (this folder).
