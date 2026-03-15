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
