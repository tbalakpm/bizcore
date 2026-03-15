# System Architecture

BizCore follows a decoupled client-server architecture with a clear separation of concerns.

## Backend Architecture (Node/Express)
The backend is a RESTful API built with Express and TypeScript.

- **Entry Point**: `src/app.ts` initializes the server, middleware, and routes.
- **Middleware**:
  - `auth.ts`: JWT verification and role-based access control.
  - `i18n.ts`: Dynamic translation loading based on `Accept-Language`.
  - `logger.ts`: Request logging.
- **Data Access (Drizzle ORM)**:
  - `src/db/schema/`: Schema definitions for SQLite/Turso.
  - `src/db/index.ts`: Database client and migration runner.
- **Routes**:
  - Modular routers for each entity (Users, Products, Invoices, etc.).
  - API endpoints follow the `/api/[resource]` pattern.

## Frontend Architecture (Angular 20)
The frontend is a modern SPA (Single Page Application).

- **Core Structure**:
  - `app.routes.ts`: Centralized routing with `AuthGuard`.
  - `app.config.ts`: Dependency injection and global providers.
- **Feature-Based Modules**:
  - Each feature (e.g., `sales-invoice`, `inventory`) is isolated in its own directory containing:
    - `*.ts`: Component logic using Signals and `inject()`.
    - `*.html`: Declarative templates with TailwindCSS.
    - `*.service.ts`: API interaction layer.
- **Shared Layer**:
  - `shared/`: Reusable UI components, interceptors, and utility functions.
  - `models/`: Centralized interfaces for API and data structures.

## Data Flow
1. **Request**: Frontend service makes HTTP call with JWT and language headers.
2. **Middleware**: Backend validates JWT and sets the locale.
3. **Route**: Router handles the request using Drizzle ORM to interact with Turso/SQLite.
4. **Response**: Backend returns JSON which is consumed by Angular Signals to update the UI reactively.
