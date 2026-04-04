/** biome-ignore-all lint/suspicious/noAssignInExpressions: Ignore */
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, type OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
// import { getLocalYYYYMMDD } from '../utils/datefns';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { DashboardService, type DashboardSummary } from './dashboard-service';

@Component({
  selector: 'app-dashboard',
  imports: [TranslatePipe, DecimalPipe, DatePipe, NzCardModule, NzTableModule, NzIconModule, NzAlertModule, BaseChartDirective],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);
  today = new Date();

  // --- General ---
  mastersSummary = signal({
    customers: { total: 0, active: 0 },
    suppliers: { total: 0, active: 0 },
    products: { total: 0, active: 0 },
  });

  // --- Inventory ---
  salesSummary = signal({
    today: { count: 0, total: 0, profit: 0 },
    week: { count: 0, total: 0, profit: 0 },
    month: { count: 0, total: 0, profit: 0 },
    year: { count: 0, total: 0, profit: 0 },
  });

  purchasesSummary = signal({
    today: { count: 0, total: 0, tax: 0 },
    week: { count: 0, total: 0, tax: 0 },
    month: { count: 0, total: 0, tax: 0 },
    year: { count: 0, total: 0, tax: 0 },
  });

  stockSummary = signal({
    total: { qty: 0, cost: 0 },
    reorderLevel: 0,
    outOfStock: 0,
  });

  topProducts = signal<{ name: string; amount: number }[]>([]);

  topCustomers = signal<{ name: string; amount: number }[]>([]);

  topSuppliers = signal<{ name: string; amount: number }[]>([]);

  agingStock = signal<{ range: string; qty: number; value: number }[]>([]);

  // --- Financial Accounting ---
  expensesSummary = signal({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
  });

  incomeSummary = signal({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
  });

  profitAndLoss = signal({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
  });

  agingReceivables = signal<{ range: string; amount: number }[]>([]);

  agingPayables = signal<{ range: string; amount: number }[]>([]);

  recentActivities = signal<{ id: number; date: string; description: string; amount: number; type: string }[]>([]);

  loading = false;
  error: string | null = null;

  // ---- Chart data ----
  dailyChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Daily Income' },
      { data: [], label: 'Daily Expenses' },
    ],
  };

  dailyChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: {}, y: { beginAtZero: true } },
  };

  incomeCategoryChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{ data: [] }],
  };

  incomeCategoryChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } },
  };

  expenseCategoryChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{ data: [] }],
  };

  expenseCategoryChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } },
  };

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard() {
    this.loading = true;
    this.error = null;

    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.mastersSummary.set(summary.masters as any);
        this.salesSummary.set(summary.sales as any);
        this.purchasesSummary.set(summary.purchases as any);
        this.stockSummary.set(summary.stock as any);
        this.topProducts.set(summary.topProducts);
        this.topCustomers.set(summary.topCustomers);
        this.topSuppliers.set(summary.topSuppliers);
        this.agingStock.set(summary.aging.stock);
        this.agingReceivables.set(summary.aging.receivables);
        this.agingPayables.set(summary.aging.payables);
        this.incomeSummary.set(summary.finance.income);
        this.expensesSummary.set(summary.finance.expenses);
        this.profitAndLoss.set(summary.finance.profit);
        this.recentActivities.set(summary.recentActivities);

        this.buildCharts(summary);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load dashboard data';
        this.loading = false;
      },
    });
  }

  private buildCharts(summary: DashboardSummary) {
    this.buildDailyTrendsChart(summary);
  }

  private buildDailyTrendsChart(summary: DashboardSummary) {
    const dates = summary.dailyTrends.map((t) => t.date);
    const incomeData = summary.dailyTrends.map((t) => t.income);
    const expenseData = summary.dailyTrends.map((t) => t.expenses);

    this.dailyChartData = {
      labels: dates,
      datasets: [
        { data: incomeData, label: 'Daily Income', backgroundColor: '#3b82f6' },
        { data: expenseData, label: 'Daily Expenses', backgroundColor: '#ef4444' },
      ],
    };
  }
}
