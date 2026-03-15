# 🔐 UI Permission System — Implementation Plan

**Project:** BizCore | **Stack:** Angular 20 + Express/Drizzle | **Scope:** Frontend UI restrictions only

---

## Overview

Introduce a **per-module, per-action permission system** stored on the user record. When a user is created or edited by an admin, permissions are assigned per module (e.g. `products: read | write | none`). These are embedded in the JWT, read by a frontend `PermissionService`, and enforced via Angular directives and route guards.

**Permission Levels:**
| Level | Description |
|-------|-------------|
| `none` | Module is hidden from nav; route redirects away |
| `read` | Can view list and detail pages; all edit/add/delete UI is hidden |
| `write` | Full access — view, add, edit, delete |

> **Note:** `write` implies `read`. Admin users bypass all permission checks (full access always).

---

## Modules Covered

| Module            | Route                |
| ----------------- | -------------------- |
| Categories        | `/categories`        |
| Products          | `/products`          |
| Customers         | `/customers`         |
| Suppliers         | `/suppliers`         |
| Sales Invoices    | `/sales-invoices`    |
| Purchase Invoices | `/purchase-invoices` |
| Stock Invoices    | `/stock-invoices`    |
| Users             | `/users`             |

---

## Phase 1 — Backend: Data Model

### Step 1.1 — Add `permissions` column to `users` table

**File:** `backend/src/db/schema/user.schema.ts`

Add a JSON text column to store permissions:

```ts
permissions: text('permissions').default('{}');
```

Stored as a JSON string:

```json
{
  "categories": "read",
  "products": "write",
  "customers": "read",
  "suppliers": "none",
  "sales-invoices": "write",
  "purchase-invoices": "read",
  "stock-invoices": "none",
  "users": "none"
}
```

### Step 1.2 — Create Drizzle Migration

Generate and run a new migration to add the `permissions` column to the `users` table.

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Step 1.3 — Embed Permissions in JWT

**File:** `backend/src/middleware/auth.ts` (token signing logic)

Include `permissions` in the JWT payload so the frontend can read it without an extra API call:

```ts
// When signing the JWT:
{
  sub: user.id,
  username: user.username,
  role: user.role,
  permissions: JSON.parse(user.permissions || '{}')  // ← add this
}
```

### Step 1.4 — Update User Create/Update Routes

**File:** `backend/src/routes/users.ts`

Accept `permissions` in the request body and persist it:

```ts
// In create and update handlers:
const permissions = JSON.stringify(req.body.permissions || {});
// Include in db.insert / db.update
```

---

## Phase 2 — Frontend: Permission Infrastructure

### Step 2.1 — Define Permission Model

**New file:** `frontend/src/app/models/permission.model.ts`

```ts
export type PermissionLevel = 'none' | 'read' | 'write';

export interface UserPermissions {
  categories: PermissionLevel;
  products: PermissionLevel;
  customers: PermissionLevel;
  suppliers: PermissionLevel;
  'sales-invoices': PermissionLevel;
  'purchase-invoices': PermissionLevel;
  'stock-invoices': PermissionLevel;
  users: PermissionLevel;
}

export const ALL_MODULES: (keyof UserPermissions)[] = [
  'categories',
  'products',
  'customers',
  'suppliers',
  'sales-invoices',
  'purchase-invoices',
  'stock-invoices',
  'users',
];

export const MODULE_LABELS: Record<keyof UserPermissions, string> = {
  categories: 'Categories',
  products: 'Products',
  customers: 'Customers',
  suppliers: 'Suppliers',
  'sales-invoices': 'Sales Invoices',
  'purchase-invoices': 'Purchase Invoices',
  'stock-invoices': 'Stock Invoices',
  users: 'Users',
};
```

### Step 2.2 — Create `PermissionService`

**New file:** `frontend/src/app/auth/permission.service.ts`

```ts
import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from './auth-service';
import { PermissionLevel, UserPermissions } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private auth = inject(AuthService);

  // Admin role bypasses all checks
  private isAdmin = computed(() => this.auth.currentUser()?.role === 'admin');

  private permissions = computed<UserPermissions>(() => this.auth.currentUser()?.permissions ?? {});

  canRead(module: keyof UserPermissions): boolean {
    if (this.isAdmin()) return true;
    const level = this.permissions()[module];
    return level === 'read' || level === 'write';
  }

  canWrite(module: keyof UserPermissions): boolean {
    if (this.isAdmin()) return true;
    return this.permissions()[module] === 'write';
  }
}
```

### Step 2.3 — Update `AuthService`

**File:** `frontend/src/app/auth/auth-service.ts`

Decode the JWT on login and expose `permissions` as part of the current user signal:

```ts
// After decoding JWT, the currentUser signal should include:
interface DecodedToken {
  sub: number;
  username: string;
  role: string;
  permissions: UserPermissions; // ← add this
}

// Update currentUser signal type to include permissions
```

### Step 2.4 — Create `HasPermissionDirective` (Structural)

**New file:** `frontend/src/app/shared/directives/has-permission.directive.ts`

Removes the element from the DOM entirely if the user lacks the required permission.

```ts
@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private permissions = inject(PermissionService);
  private vcr = inject(ViewContainerRef);
  private templateRef = inject(TemplateRef);

  @Input() set appHasPermission(value: string) {
    // value format: 'module:action' e.g. 'products:write'
    const [module, action] = value.split(':');
    const allowed =
      action === 'write' ? this.permissions.canWrite(module as any) : this.permissions.canRead(module as any);

    this.vcr.clear();
    if (allowed) {
      this.vcr.createEmbeddedView(this.templateRef);
    }
  }
}
```

**Usage in templates:**

```html
<!-- Only show Add button if user has write access -->
<button *appHasPermission="'products:write'" (click)="openForm()">Add Product</button>

<!-- Only show edit/delete actions in table row -->
<td *appHasPermission="'products:write'">
  <button (click)="edit(row)">Edit</button>
  <button (click)="delete(row)">Delete</button>
</td>
```

### Step 2.5 — Create `ReadonlyIfDirective` (Attribute)

**New file:** `frontend/src/app/shared/directives/readonly-if.directive.ts`

Disables form inputs when the user only has read-level access.

```ts
@Directive({
  selector: '[appReadonlyIf]',
  standalone: true,
})
export class ReadonlyIfDirective {
  private permissions = inject(PermissionService);
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input() set appReadonlyIf(module: string) {
    if (!this.permissions.canWrite(module as any)) {
      this.renderer.setAttribute(this.el.nativeElement, 'disabled', 'true');
      this.renderer.addClass(this.el.nativeElement, 'opacity-50');
      this.renderer.addClass(this.el.nativeElement, 'cursor-not-allowed');
    }
  }
}
```

**Usage in templates:**

```html
<input [appReadonlyIf]="'products'" [(ngModel)]="form.name" class="input-base" />
<select [appReadonlyIf]="'products'" [(ngModel)]="form.category" class="select-base"></select>
```

---

## Phase 3 — Route Guard Update

### Step 3.1 — Add `module` data to Routes

**File:** `frontend/src/app/app.routes.ts`

Tag each route with its module name:

```ts
{ path: 'products', component: Products, data: { module: 'products' } },
{ path: 'categories', component: Categories, data: { module: 'categories' } },
{
  path: 'sales-invoices',
  data: { module: 'sales-invoices' },
  children: [
    { path: '', component: SalesInvoices },
    { path: 'new', component: SalesInvoiceForm },
    { path: ':id/edit', component: SalesInvoiceForm },
  ],
},
// ...repeat for all modules
```

### Step 3.2 — Update `AuthGuard` or Create `PermissionGuard`

**File:** `frontend/src/app/auth/auth-guard.ts`

Extend the existing guard to also check module-level permissions:

```ts
canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
  const module = route.data?.['module'];
  if (module && !this.permissionService.canRead(module)) {
    return this.router.createUrlTree(['/dashboard']);
  }
  return true;
}
```

---

## Phase 4 — Apply Restrictions to Each Page

For every module page, make the following changes:

### 4a. List Pages (e.g. `products.html`)

```html
<!-- Hide the Add button -->
<button *appHasPermission="'products:write'" (click)="openAdd()">Add Product</button>

<!-- Hide the Actions column header when read-only -->
@if (permissionService.canWrite('products')) {
<th>Actions</th>
}

<!-- Hide edit/delete per row -->
@if (permissionService.canWrite('products')) {
<td>
  <button (click)="edit(row)">Edit</button>
  <button (click)="delete(row)">Delete</button>
</td>
}
```

### 4b. Form Pages / Inline Forms (e.g. `products.html` add/edit form)

```html
<!-- Disable all form inputs when read-only -->
<input [appReadonlyIf]="'products'" [(ngModel)]="form.name" class="input-base" />
<select [appReadonlyIf]="'products'" [(ngModel)]="form.categoryId" class="select-base"></select>

<!-- Hide the Save button -->
<button *appHasPermission="'products:write'" type="submit" class="btn-primary">Save</button>
```

### Pages Checklist

| Page              | Hide Add Button | Disable Form Inputs | Hide Actions Column |
| ----------------- | :-------------: | :-----------------: | :-----------------: |
| Categories        |       ✅        |         ✅          |         ✅          |
| Products          |       ✅        |         ✅          |         ✅          |
| Customers         |       ✅        |         ✅          |         ✅          |
| Suppliers         |       ✅        |         ✅          |         ✅          |
| Sales Invoices    |       ✅        |         ✅          |         ✅          |
| Purchase Invoices |       ✅        |         ✅          |         ✅          |
| Stock Invoices    |       ✅        |         ✅          |         ✅          |
| Users             |       ✅        |         ✅          |         ✅          |

---

## Phase 5 — User Create/Edit Form (Admin UI)

### Step 5.1 — Update `users.html`

Add a permissions matrix below the existing user fields:

```html
<!-- Permissions Matrix — shown only to admin -->
@if (isAdmin) {
<div class="mt-4">
  <h3 class="section-title">Module Permissions</h3>
  <table class="table-base">
    <thead class="table-head">
      <tr>
        <th>Module</th>
        <th>No Access</th>
        <th>Read Only</th>
        <th>Full Access</th>
      </tr>
    </thead>
    <tbody>
      @for (module of allModules; track module) {
      <tr>
        <td>{{ moduleLabels[module] }}</td>
        <td>
          <input type="radio" [name]="module" value="none" [(ngModel)]="editingUser.permissions[module]" />
        </td>
        <td>
          <input type="radio" [name]="module" value="read" [(ngModel)]="editingUser.permissions[module]" />
        </td>
        <td>
          <input type="radio" [name]="module" value="write" [(ngModel)]="editingUser.permissions[module]" />
        </td>
      </tr>
      }
    </tbody>
  </table>
</div>
}
```

### Step 5.2 — Update `users.ts`

```ts
// Import model
import { ALL_MODULES, MODULE_LABELS, UserPermissions } from '../models/permission.model';

// Add to component
allModules = ALL_MODULES;
moduleLabels = MODULE_LABELS;

// Default permissions when creating a new user
defaultPermissions(): UserPermissions {
  return Object.fromEntries(ALL_MODULES.map(m => [m, 'none'])) as UserPermissions;
}

// Include permissions in editingUser initial state
editingUser = {
  id: null,
  username: '',
  firstName: '',
  lastName: '',
  role: 'user',
  permissions: this.defaultPermissions(),
};
```

---

## Phase 6 — Sidebar Navigation Update

Hide nav menu items when user has `none` access to a module.

**File:** `frontend/src/app/shared/sidebar/sidebar.html` (or equivalent layout component)

```html
@if (permissionService.canRead('products')) {
<a routerLink="/products">Products</a>
} @if (permissionService.canRead('categories')) {
<a routerLink="/categories">Categories</a>
}
<!-- ...repeat for each module -->
```

---

## Summary of New Files

| File                                                             | Purpose                               |
| ---------------------------------------------------------------- | ------------------------------------- |
| `frontend/src/app/models/permission.model.ts`                    | Type definitions for permissions      |
| `frontend/src/app/auth/permission.service.ts`                    | Central permission check service      |
| `frontend/src/app/shared/directives/has-permission.directive.ts` | Structural directive — hides elements |
| `frontend/src/app/shared/directives/readonly-if.directive.ts`    | Attribute directive — disables inputs |

## Summary of Modified Files

| File                                    | Change                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| `backend/src/db/schema/user.schema.ts`  | Add `permissions` JSON column                          |
| `backend/src/middleware/auth.ts`        | Include `permissions` in JWT payload                   |
| `backend/src/routes/users.ts`           | Accept and persist `permissions` field                 |
| `frontend/src/app/auth/auth-service.ts` | Decode & expose `permissions` from JWT                 |
| `frontend/src/app/auth/auth-guard.ts`   | Check module-level read permission on route activation |
| `frontend/src/app/app.routes.ts`        | Add `data: { module }` to each protected route         |
| `frontend/src/app/user/users.ts`        | Add permissions matrix logic                           |
| `frontend/src/app/user/users.html`      | Add permissions matrix UI                              |
| Each module `*.html`                    | Apply `*appHasPermission` and `[appReadonlyIf]`        |

---

## Execution Order for Factory Droid

1. **Phase 1** — Backend schema + migration + JWT + routes
2. **Phase 2** — Model + PermissionService + update AuthService + two directives
3. **Phase 3** — Route data tags + AuthGuard update
4. **Phase 5** — Users form permissions matrix (admin can now set permissions)
5. **Phase 4** — Apply directives to all 8 module pages
6. **Phase 6** — Sidebar nav filtering
