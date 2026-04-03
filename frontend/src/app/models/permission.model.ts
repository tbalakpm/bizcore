export interface ModulePermissions {
  read: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  print: boolean;
}

export type PermissionLevel = 'none' | 'read' | 'write' | ModulePermissions;

export interface UserPermissions {
  dashboard: ModulePermissions;
  'sales-invoices': ModulePermissions;
  'purchase-invoices': ModulePermissions;
  'stock-invoices': ModulePermissions;
  products: ModulePermissions;
  customers: ModulePermissions;
  suppliers: ModulePermissions;
  users: ModulePermissions;
  'product-settings-categories': ModulePermissions;
  'product-settings-brands': ModulePermissions;
  'product-settings-attributes': ModulePermissions;
  'product-settings-templates': ModulePermissions;
  'settings-general': ModulePermissions;
  'settings-serial': ModulePermissions;
  'settings-pricing': ModulePermissions;
  'settings-tax': ModulePermissions;
}

export const ALL_MODULES: (keyof UserPermissions)[] = [
  'dashboard',
  'sales-invoices',
  'purchase-invoices',
  'stock-invoices',
  'products',
  'customers',
  'suppliers',
  'users',
  'product-settings-categories',
  'product-settings-brands',
  'product-settings-attributes',
  'product-settings-templates',
  'settings-general',
  'settings-serial',
  'settings-pricing',
  'settings-tax',
];

export const MODULE_LABELS: Record<keyof UserPermissions, string> = {
  dashboard: 'Dashboard',
  'sales-invoices': 'Sales',
  'purchase-invoices': 'Purchase',
  'stock-invoices': 'Opening Stock',
  products: 'Products',
  customers: 'Customers',
  suppliers: 'Suppliers',
  users: 'Users',
  'product-settings-categories': 'Product Settings (Categories)',
  'product-settings-brands': 'Product Settings (Brands)',
  'product-settings-attributes': 'Product Settings (Attributes)',
  'product-settings-templates': 'Product Settings (Templates)',
  'settings-general': 'Settings (General)',
  'settings-serial': 'Settings (Serials)',
  'settings-pricing': 'Settings (Pricing)',
  'settings-tax': 'Settings (Tax)',
};
