import type { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth-guard';
import { Login } from './auth/login';
import { Dashboard } from './dashboard/dashboard';
import { Categories } from './category/categories';
import { Products } from './product/products';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'categories', component: Categories },
      { path: 'products', component: Products },
      // { path: 'users', component: Entries },
      // { path: 'customers', component: Entries },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
