# API Documentation

All API endpoints are prefixed with `/api`. Most routes require a valid JWT in the `Authorization` header.

## Authentication
- `POST /auth/login`: Authenticate and receive a JWT.
- `POST /auth/register`: Create a new user account.
- `GET /health`: Verify server status (Public/Protected check).

## Master Data (Protected)
Endpoints for managing core business entities. All support standard CRUD:
- `/categories`: Manage product categories.
- `/products`: Manage inventory items.
- `/customers`: Manage customer data.
- `/suppliers`: Manage vendor data.
- `/users`: Admin-only user management.

## Transactions (Protected)
- `/sales-invoices`: Create, read, and list sales invoices.
  - Includes E-Invoice generation triggers.
- `/purchase-invoices`: Manage purchase records.
- `/stock-invoices`: Manage internal inventory movements.

## Inventory & Tracking (Protected)
- `/inventories`: Real-time stock level queries.
- `/serial-numbers`: Tracking for specifically identified items.

## Headers
- `Authorization: Bearer <token>`: Required for all protected routes.
- `Accept-Language: <lang>`: (en/ta) Used for localized error and status messages.

## Error Handling
The API returns standard HTTP status codes:
- `400 Bad Request`: Validation errors.
- `401 Unauthorized`: Missing or invalid JWT.
- `403 Forbidden`: Insufficient permissions (e.g., non-admin accessing user management).
- `404 Not Found`: Resource does not exist.
