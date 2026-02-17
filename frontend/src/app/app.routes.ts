import type { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth-guard';
import { Login } from './auth/login';
import { Dashboard } from './dashboard/dashboard';
import { Categories } from './category/categories';
import { Products } from './product/products';
import { Customers } from './customer/customers';
import { Users } from './user/users';

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
      { path: 'users', component: Users },
      // { path: 'customers', component: Entries },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
