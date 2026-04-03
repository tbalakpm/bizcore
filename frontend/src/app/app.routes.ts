import type { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth-guard';
import { Login } from './auth/login';
import { ChangePassword } from './auth/change-password';
import { Dashboard } from './dashboard/dashboard';
import { Categories } from './product-settings/categories/categories';
import { Products } from './product/products';
import { Customers } from './customer/customers';
import { Users } from './user/users';
import { Profile } from './user/profile';
import { StockInvoices } from './stock-invoice/stock-invoices';
import { StockInvoiceForm } from './stock-invoice/stock-invoice-form';
import { SalesInvoices } from './sales-invoice/sales-invoices';
import { SalesInvoiceForm } from './sales-invoice/sales-invoice-form';
import { Suppliers } from './supplier/suppliers';
import { PurchaseInvoices } from './purchase-invoice/purchase-invoices';
import { PurchaseInvoiceForm } from './purchase-invoice/purchase-invoice-form';
import { Settings } from './settings/settings';
import { PricingCategories } from './settings/pricing-categories/pricing-categories';
import { GeneralSettings } from './settings/general/general-settings';
import { SerialSettings } from './settings/serial/serial-settings';
import { Attributes } from './product-settings/attributes/attributes';
import { ProductTemplates } from './product-settings/product-templates/product-templates';
import { Brands } from './product-settings/brands/brands';
import { ProductSettings } from './product-settings/product-settings';
import { TaxSettings } from './settings/tax/tax-settings';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'change-password', component: ChangePassword, canActivate: [AuthGuard] },
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: 'dashboard', component: Dashboard, data: { module: 'dashboard' } },
      { path: 'products', component: Products, data: { module: 'products' } },
      { path: 'customers', component: Customers, data: { module: 'customers' } },
      { path: 'suppliers', component: Suppliers, data: { module: 'suppliers' } },
      {
        path: 'stock-invoices',
        data: { module: 'stock-invoices' },
        children: [
          { path: '', component: StockInvoices },
          { path: 'new', component: StockInvoiceForm },
          { path: ':id/edit', component: StockInvoiceForm },
        ],
      },
      {
        path: 'sales-invoices',
        data: { module: 'sales-invoices' },
        children: [
          { path: '', component: SalesInvoices },
          { path: 'new', component: SalesInvoiceForm },
          { path: ':id/edit', component: SalesInvoiceForm },
        ],
      },
      {
        path: 'purchase-invoices',
        data: { module: 'purchase-invoices' },
        children: [
          { path: '', component: PurchaseInvoices },
          { path: 'new', component: PurchaseInvoiceForm },
          { path: ':id/edit', component: PurchaseInvoiceForm },
        ],
      },
      { path: 'users', component: Users, data: { module: 'users' } },
      { path: 'profile', component: Profile },
      {
        path: 'settings',
        component: Settings,
        children: [
          { path: '', redirectTo: 'general', pathMatch: 'full' },
          { path: 'general', component: GeneralSettings, data: { module: 'settings-general' } },
          { path: 'pricing-categories', component: PricingCategories, data: { module: 'settings-pricing' } },
          { path: 'serial', component: SerialSettings, data: { module: 'settings-serial' } },
          { path: 'tax', component: TaxSettings, data: { module: 'settings-tax' } },
        ],
      },
      {
        path: 'product-settings',
        component: ProductSettings,
        children: [
          { path: '', redirectTo: 'categories', pathMatch: 'full' },
          { path: 'categories', component: Categories, data: { module: 'product-settings-categories' } },
          { path: 'brands', component: Brands, data: { module: 'product-settings-brands' } },
          { path: 'attributes', component: Attributes, data: { module: 'product-settings-attributes' } },
          { path: 'product-templates', component: ProductTemplates, data: { module: 'product-settings-templates' } },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
