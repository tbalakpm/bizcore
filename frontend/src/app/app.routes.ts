import type { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth-guard';
import { Login } from './auth/login';
import { Dashboard } from './dashboard/dashboard';
import { Categories } from './category/categories';
import { Products } from './product/products';
import { Customers } from './customer/customers';
import { Users } from './user/users';
import { StockInvoices } from './stock-invoice/stock-invoices';
import { StockInvoiceForm } from './stock-invoice/stock-invoice-form';
import { SalesInvoices } from './sales-invoice/sales-invoices';
import { SalesInvoiceForm } from './sales-invoice/sales-invoice-form';
import { Suppliers } from './supplier/suppliers';
import { PurchaseInvoices } from './purchase-invoice/purchase-invoices';
import { PurchaseInvoiceForm } from './purchase-invoice/purchase-invoice-form';
import { Settings } from './settings/settings';
import { PricingCategories } from './settings/pricing-categories';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'categories', component: Categories, data: { module: 'categories' } },
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
      {
        path: 'settings',
        component: Settings,
        children: [
          { path: '', redirectTo: 'pricing-categories', pathMatch: 'full' },
          { path: 'pricing-categories', component: PricingCategories },
        ],
      },
      // { path: 'customers', component: Entries },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
