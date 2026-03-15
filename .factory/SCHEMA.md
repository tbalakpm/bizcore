# Database Schema

BizCore uses a relational schema managed by Drizzle ORM. Most tables share common `keyFields` and `auditFields`.

## Core Patterns
### Key Fields
- `id`: Primary Key (Auto-increment Integer)
- `code`: Unique identifier (String, 20 chars)
- `name`: Human-readable name (String, 50 chars)

### Audit Fields
- `is_active`: Boolean flag for soft deletes.
- `created_at`: Automatic timestamp (ISO string).
- `updated_at`: Automatic timestamp (ISO string).

## Primary Entities

### Products & Categories
- **`categories`**: Stores product categories (Hierarchy).
- **`products`**: Inventory items.
  - Links to `categories`.
  - Includes `unit_price`, `tax_rate`, `hsn_sac`.
  - Advanced tracking: `gtn_mode` (auto/manual), `gtn_generation` (code/batch/tag/manual).

### Business Partners
- **`customers`**: Client data for sales.
- **`suppliers`**: Vendor data for purchases.
- **`addresses`**: Polymorphic address storage for customers and suppliers.

### Invoices
- **`sales_invoices`**: Sales transactions.
  - Includes calculated fields: `tax_amount`, `net_amount` (generated columns).
  - E-Invoice fields: `irn`, `ack_no`, `ack_date`, `signed_qr_code`.
- **`purchase_invoices`**: Purchase transactions.
- **`stock_invoices`**: Internal stock movements.
- **`*_items`**: Line items for each invoice type, linking to products.

### Inventory & Serial Numbers
- **`inventories`**: Current stock levels and locations.
- **`serial_numbers`**: Global serial/GTN tracking.
- **`product_serial_numbers`**: Product-specific serial number configurations.

### System
- **`users`**: Account management, roles, and password hashes.
- **`settings`**: System-wide configurations (e.g., Company details).
