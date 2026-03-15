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

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'categories', component: Categories },
      { path: 'products', component: Products },
      { path: 'customers', component: Customers },
      { path: 'suppliers', component: Suppliers },
      {
        path: 'stock-invoices',
        children: [
          { path: '', component: StockInvoices },
          { path: 'new', component: StockInvoiceForm },
          { path: ':id/edit', component: StockInvoiceForm },
        ],
      },
      {
        path: 'sales-invoices',
        children: [
          { path: '', component: SalesInvoices },
          { path: 'new', component: SalesInvoiceForm },
          { path: ':id/edit', component: SalesInvoiceForm },
        ],
      },
      { path: 'users', component: Users },
      // { path: 'customers', component: Entries },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
