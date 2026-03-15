# Agent.md

This file provides guidance to Agent (Agent.dev) when working with code in this repository.

## Project Overview

BizCore is a full-stack business management application with:

- **Backend**: Node.js + Express + TypeScript + Drizzle ORM + libSQL/Turso
- **Frontend**: Angular 20 + TailwindCSS + ngx-translate (i18n)
- **Database**: SQLite (local development) or Turso (production)

The frontend is served as static files from the backend's `/public` directory after building.

## Development Commands

### Backend (Node/Express/TypeScript)

Navigate to `backend/` for these commands:

```bash
# Install dependencies
npm install

# Development (watch mode with hot reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server (requires build first)
npm start

# Generate Drizzle migrations from schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate
```

### Frontend (Angular)

Navigate to `frontend/` for these commands:

```bash
# Install dependencies
npm install

# Development server (http://localhost:4200)
npm start

# Build for production
npm run build

# Build and copy to backend/src/public (required for backend to serve frontend)
npm run build && npm run postbuild

# Run tests
npm test
```

### Full Stack Development Workflow

1. **Terminal 1**: Start backend dev server from `backend/`:

   ```bash
   npm run dev
   ```

2. **Terminal 2**: Start frontend dev server from `frontend/`:

   ```bash
   npm start
   ```

3. **Before deploying**: Build frontend and copy to backend:
   ```bash
   cd frontend && npm run build && cd ../backend && npm run build
   ```

## Architecture

### Backend Architecture

**Entry Point**: `backend/src/index.ts` → initializes Express app from `app.ts`

**Core Structure**:

- **Database Layer** (`src/db/`):
  - `index.ts`: Initializes libSQL client, exports `db` instance
  - `schema/`: Drizzle ORM table definitions (users, categories, products, customers)
  - Uses snake_case column naming convention
  - Migrations stored in `backend/drizzle/`

- **Configuration** (`src/config.ts`):
  - Environment-specific config loaded from `.env/.env.local` (dev) or `.env/.env.production` (prod)
  - Required env vars: `PORT`, `JWT_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CORS_ORIGINS`

- **Middleware** (`src/middleware/`):
  - `auth.ts`: JWT-based authentication, adds `req.user` to authenticated requests
  - `i18n.ts`: Multi-language support (en, ta), reads `Accept-Language` header, adds `req.i18n.t()` translator

- **Routes** (`src/routes/`):
  - All API routes mounted under `/api/*`
  - `auth.ts`: `/api/auth/login`, `/api/auth/register` (public)
  - `users.ts`: `/api/users/*` (protected)
  - `categories.ts`: `/api/categories/*` (protected)
  - `products.ts`: `/api/products/*` (protected)
  - Protected routes require `authRequired` middleware

- **Type Extensions** (`src/@types/express.d.ts`):
  - Extends Express Request type with `user` and `i18n` properties

- **Internationalization** (`src/i18n/`):
  - JSON translation files: `en.json`, `ta.json`
  - Loaded at startup and cached in memory

### Frontend Architecture

**Entry Point**: `frontend/src/main.ts` → bootstraps Angular app

**Core Structure**:

- **App Configuration** (`src/app/app.config.ts`):
  - HTTP interceptor (`authInterceptor`) adds JWT token and `Accept-Language` header to all API requests
  - ngx-translate configured for i18n with translations in `/assets/i18n/*.json`
  - Chart.js integration via ng2-charts

- **Routing** (`src/app/app.routes.ts`):
  - `/login` - public authentication page
  - `/` - protected routes (dashboard, categories, registers, entries)
  - `AuthGuard` protects all routes except login

- **Feature Modules** (`src/app/*/`):
  - `auth/`: Login, AuthService (JWT token management), AuthGuard, auth interceptor
  - `dashboard/`: Main landing page after login
  - `category/`: Category management (list, create, edit)
  - `register/`: Register management
  - `entry/`: Entry management
  - Each feature typically contains: component.ts, template.html, service.ts

- **Services**:
  - `AuthService`: Handles login/register, stores JWT in localStorage as 'et_token'
  - Feature services: Make HTTP calls to backend API endpoints
  - All services use `environment.apiUrl` for base URL (`/api`)

- **Styling**:
  - TailwindCSS 4.x configured via postcss
  - Global styles in `src/styles.css`

### Database Schema Patterns

All tables follow this pattern:

- Primary key: `id` (auto-increment integer)
- Unique identifiers: `code`, `username`, etc.
- Soft deletes: `isActive` boolean column
- Audit fields: `createdAt`, `updatedAt` (CURRENT_TIMESTAMP)
- Foreign keys use snake_case: `category_id` references `categories.id`

**Key Entities**:

- `users`: Authentication and user management, has `role` (user/manager/admin)
- `categories`: Product categories
- `products`: Inventory items with `categoryId` FK
- `customers`: Customer master data

### Authentication Flow

1. Frontend: User enters credentials → `AuthService.login()`
2. Backend: POST `/api/auth/login` validates credentials, returns JWT
3. Frontend: JWT stored in localStorage, `authInterceptor` adds to all requests
4. Backend: `authRequired` middleware validates JWT, populates `req.user`

### Internationalization (i18n)

**Backend**:

- `i18nMiddleware` reads `Accept-Language` header
- Loads translations from `src/i18n/{lang}.json`
- Provides `req.i18n.t(key)` for translation in route handlers

**Frontend**:

- ngx-translate loads from `/assets/i18n/{lang}.json`
- `authInterceptor` sends current language in `Accept-Language` header
- Components use `TranslateService` or `translate` pipe

## Database Migrations

After changing schema files in `backend/src/db/schema/`:

```bash
cd backend
npm run db:generate  # Creates migration SQL in drizzle/
npm run db:migrate   # Applies migrations (also runs on server start)
```

## Environment Configuration

Create environment files:

- `backend/.env/.env.local` - for development
- `backend/.env/.env.production` - for production

Required variables:

```
NODE_ENV=development|production
PORT=4000
CORS_ORIGINS=http://localhost:4200
JWT_SECRET=your-secret-key
TURSO_DATABASE_URL=file:bizcore.db  # or turso://your-db.turso.io
TURSO_AUTH_TOKEN=  # required only for Turso cloud
```

For local development with SQLite, use:

```
TURSO_DATABASE_URL=file:bizcore.db
TURSO_AUTH_TOKEN=
```

## Drizzle ORM Patterns

**Query Examples**:

```typescript
// Select with condition
const user = await db.select({ id: users.id, username: users.username }).from(users).where(eq(users.id, userId)).get(); // .get() returns single row, .all() returns array

// Insert
await db.insert(users).values({ username, passwordHash });

// Update
await db.update(users).set({ isActive: false }).where(eq(users.id, userId));

// Joins
await db.select().from(products).leftJoin(categories, eq(products.categoryId, categories.id));
```

**Schema Definition Pattern**:

```typescript
export const tableName = sqliteTable('table_name', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  name: text('name', { length: 50 }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type TableName = typeof tableName.$inferSelect;
export type NewTableName = typeof tableName.$inferInsert;
```

## Angular Patterns

**Service Pattern**:

```typescript
@Injectable({ providedIn: 'root' })
export class FeatureService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<Type[]>(`${environment.apiUrl}/endpoint`);
  }
}
```

**Component Pattern**:

```typescript
export class FeatureComponent {
  private service = inject(FeatureService);
  items = signal<Type[]>([]);

  ngOnInit() {
    this.service.getAll().subscribe((data) => this.items.set(data));
  }
}
```

## Code Style and Conventions

- **Backend**:
  - Drizzle schema uses snake_case for column names
  - TypeScript/JavaScript uses camelCase
  - Express routes export Router instances
  - Async/await preferred over promises

- **Frontend**:
  - Angular 20 signals for state management
  - Standalone components (no NgModules)
  - inject() function for dependency injection
  - Prettier configured: 100 char width, single quotes

## Testing

No test framework is currently configured. To add tests:

- **Backend**: Consider adding Jest or Vitest
- **Frontend**: Karma + Jasmine already configured, use `npm test` in frontend/

## Common Tasks

### Adding a New Database Table

1. Create schema file: `backend/src/db/schema/table-name.schema.ts`
2. Export from `backend/src/db/schema/index.ts`
3. Generate migration: `cd backend && npm run db:generate`
4. Migration SQL created in `backend/drizzle/`
5. Restart backend (auto-migrates on startup)

### Adding a New API Endpoint

1. Create/update route file in `backend/src/routes/`
2. Register router in `backend/src/app.ts`
3. Add middleware (`authRequired`) if protected
4. Use `req.i18n.t()` for error messages

### Adding a New Frontend Feature

1. Create feature directory: `frontend/src/app/feature-name/`
2. Generate component: `ng generate component feature-name`
3. Create service if needed: `ng generate service feature-name/feature-name`
4. Add route to `frontend/src/app/app.routes.ts`
5. Update navigation in `frontend/src/app/app.html`

## Build and Deployment Notes

- Frontend build copies static files to `backend/src/public/`
- Backend build copies i18n, public, and package.json to `backend/dist/`
- Backend serves frontend on all routes except `/api/*`
- Production deployment: Build both, then run `node backend/dist/index.js`
