export interface ModulePermissions {
  read: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  print: boolean;
}

export type PermissionLevel = 'none' | 'read' | 'write' | ModulePermissions;

export interface UserPermissions {
  categories: ModulePermissions;
  products: ModulePermissions;
  customers: ModulePermissions;
  suppliers: ModulePermissions;
  'sales-invoices': ModulePermissions;
  'purchase-invoices': ModulePermissions;
  'stock-invoices': ModulePermissions;
  users: ModulePermissions;
  dashboard: ModulePermissions;
  'settings-general': ModulePermissions;
  'settings-serial': ModulePermissions;
  'settings-pricing-categories': ModulePermissions;
}

export const ALL_MODULES: (keyof UserPermissions)[] = [
  'dashboard',
  'sales-invoices',
  'purchase-invoices',
  'stock-invoices',
  'products',
  'customers',
  'suppliers',
  'categories',
  'users',
  'settings-general',
  'settings-serial',
  'settings-pricing-categories',
];

export const MODULE_LABELS: Record<keyof UserPermissions, string> = {
  dashboard: 'Dashboard',
  'sales-invoices': 'Sales',
  'purchase-invoices': 'Purchase',
  'stock-invoices': 'Opening Stock',
  products: 'Products',
  customers: 'Customers',
  suppliers: 'Suppliers',
  categories: 'Categories',
  users: 'Users',
  'settings-general': 'Settings (General)',
  'settings-serial': 'Settings (Serials)',
  'settings-pricing-categories': 'Settings (Pricing Categories)',
};
