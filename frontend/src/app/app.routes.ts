import type { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth-guard';
import { Login } from './auth/login';
import { Dashboard } from './dashboard/dashboard';
import { Categories } from './category/categories';
import { Registers } from './register/registers';
import { Entries } from './entry/entries';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'categories', component: Categories },
      { path: 'registers', component: Registers },
      { path: 'entries', component: Entries },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
