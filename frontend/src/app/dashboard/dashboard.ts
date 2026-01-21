/** biome-ignore-all lint/suspicious/noAssignInExpressions: Ignore */
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, type OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { type Entry, EntryService } from '../entry/entry-service';
import { getLocalYYYYMMDD } from '../utils/datefns';

@Component({
  selector: 'app-dashboard',
  imports: [TranslatePipe, DecimalPipe, BaseChartDirective, DatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  entryService = inject(EntryService);

  recentEntries = signal<Entry[]>([]);
  todayTotalIncome = 0;
  todayTotalExpenses = 0;
  monthTotalIncome = 0;
  monthTotalExpenses = 0;

  loading = false;
  error: string | null = null;

  // Keep month items for charts
  private monthEntries = signal<Entry[]>([]);
  // private monthExpenses = signal<Entry[]>([]);
  // private monthIncome = signal<Entry[]>([]);

  // ---- Chart data ----
  // Bar: daily totals in month
  dailyChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Daily Income',
        // Leave colors default or set here if you want
      },
      {
        data: [],
        label: 'Daily Expenses',
        // Leave colors default or set here if you want
      },
    ],
  };

  dailyChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {},
      y: {
        beginAtZero: true,
      },
    },
  };

  // Pie: totals by category
  incomeCategoryChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Income By Category',
      },
      {
        data: [],
        label: 'Expenses By Category',
      },
    ],
  };

  incomeCategoryChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  expenseCategoryChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Income By Category',
      },
      {
        data: [],
        label: 'Expenses By Category',
      },
    ],
  };

  expenseCategoryChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard() {
    this.loading = true;
    this.error = null;

    const today = new Date();
    const todayStr = getLocalYYYYMMDD(today);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = getLocalYYYYMMDD(monthStart);
    const last7Start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 9);
    const last7StartStr = getLocalYYYYMMDD(last7Start);

    // Today total expenses
    this.entryService.getEntries(todayStr, todayStr).subscribe({
      next: (res) => {
        this.todayTotalIncome = res.totalIncome;
        this.todayTotalExpenses = res.totalExpenses;
      },
      error: (err) => (this.error = err.error?.error || 'Failed to load today total'),
    });

    // Month total + chart data
    this.entryService.getEntries(monthStartStr, todayStr).subscribe({
      next: (res) => {
        // const income = res.items.filter((e) => e.register?.category?.type === 'I');
        // const expenses = res.items.filter((e) => e.register?.category?.type === 'E');

        this.monthEntries.set(res.items);
        this.monthTotalIncome = res.totalIncome;
        this.monthTotalExpenses = res.totalExpenses;
        // this.monthExpenses.set(expenses);
        // this.monthIncome.set(income);
        this.buildCharts();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load month total';
      },
    });

    // Recent 7 days
    this.entryService.getEntries(last7StartStr, todayStr).subscribe({
      next: (res) => {
        this.recentEntries.set(res.items); //.slice(0, 10)); // limit to 10 items
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load recent entries';
        this.loading = false;
      },
    });
  }

  private buildCharts() {
    this.buildDailyChart();
    this.buildCategoryChart();
  }

  private buildDailyChart() {
    // aggregate by date
    const totalEntriesByDate = new Map<string, number>();
    const totalIncomeByDate = new Map<string, number>();
    const totalExpensesByDate = new Map<string, number>();

    for (const e of this.monthEntries()) {
      const date = e.date; // already yyyy-MM-dd
      const amount = Number(e.amount || 0);

      totalEntriesByDate.set(date, (totalEntriesByDate.get(date) || 0) + amount);
      if (e.categoryType === 'I') {
        totalIncomeByDate.set(date, (totalIncomeByDate.get(date) || 0) + amount);
      } else if (e.categoryType === 'E') {
        totalExpensesByDate.set(date, (totalExpensesByDate.get(date) || 0) + amount);
      }
    }

    const sortedDates = Array.from(totalEntriesByDate.keys()).sort();
    const expenseData = sortedDates.map((d) => totalExpensesByDate.get(d) ?? 0);
    const incomeData = sortedDates.map((d) => totalIncomeByDate.get(d) ?? 0);

    this.dailyChartData = {
      labels: sortedDates,
      datasets: [
        {
          data: incomeData,
          label: 'Daily Income',
        },
        {
          data: expenseData,
          label: 'Daily Expenses',
        },
      ],
    };
  }

  private buildCategoryChart() {
    // aggregate by category name
    const incomeByRegister = new Map<string, number>();
    const expensesByCategory = new Map<string, number>();

    for (const e of this.monthEntries()) {
      const registerName = e.registerName || 'Uncategorized';
      const categoryName = e.categoryName || 'Uncategorized';
      const amount = Number(e.amount || 0);

      if (e.categoryType === 'I') {
        incomeByRegister.set(registerName, (incomeByRegister.get(registerName) || 0) + amount);
      } else {
        expensesByCategory.set(categoryName, (expensesByCategory.get(categoryName) || 0) + amount);
      }
    }

    const incomeLabels = Array.from(incomeByRegister.keys());
    const incomeData = incomeLabels.map((l) => incomeByRegister.get(l) ?? 0);

    const expenseLabels = Array.from(expensesByCategory.keys());
    const expenseData = expenseLabels.map((l) => expensesByCategory.get(l) ?? 0);

    this.incomeCategoryChartData = {
      labels: incomeLabels,
      datasets: [
        {
          data: incomeData,
        },
      ],
    };

    this.expenseCategoryChartData = {
      labels: expenseLabels,
      datasets: [
        {
          data: expenseData,
        },
      ],
    };
  }
}
