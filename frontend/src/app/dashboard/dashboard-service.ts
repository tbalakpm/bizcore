import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardSummary {
  masters: {
    customers: { total: number; active: number };
    suppliers: { total: number; active: number };
    products: { total: number; active: number };
  };
  sales: {
    today: { count: number; total: number; profit: number };
    week: { count: number; total: number; profit: number };
    month: { count: number; total: number; profit: number };
    year: { count: number; total: number; profit: number };
  };
  purchases: {
    today: { count: number; total: number; tax: number };
    week: { count: number; total: number; tax: number };
    month: { count: number; total: number; tax: number };
    year: { count: number; total: number; tax: number };
  };
  stock: {
    total: { qty: number; cost: number };
    reorderLevel: number;
    outOfStock: number;
  };
  topProducts: { name: string; amount: number }[];
  topCustomers: { name: string; amount: number }[];
  topSuppliers: { name: string; amount: number }[];
  aging: {
    stock: { range: string; qty: number; value: number }[];
    receivables: { range: string; amount: number }[];
    payables: { range: string; amount: number }[];
  };
  finance: {
    income: { today: number; week: number; month: number; year: number };
    expenses: { today: number; week: number; month: number; year: number };
    profit: { today: number; week: number; month: number; year: number };
  };
  dailyTrends: { date: string; income: number; expenses: number }[];
  recentActivities: { id: number; date: string; description: string; amount: number; type: string }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${environment.apiUrl}/dashboard/summary`);
  }
}
