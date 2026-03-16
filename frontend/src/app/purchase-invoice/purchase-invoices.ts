import { DatePipe, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  type PurchaseInvoice,
  type PurchaseInvoiceList,
  PurchaseInvoiceService,
} from './purchase-invoice-service';
import { PermissionService } from '../auth/permission.service';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-purchase-invoices',
  imports: [
    DatePipe, CurrencyPipe, FormsModule, RouterLink,
    NzTableModule, NzInputModule, NzDatePickerModule, NzSelectModule,
    NzButtonModule, NzIconModule, NzPaginationModule, NzTooltipModule,
    NzPopconfirmModule, NzCardModule, NzAlertModule,
  ],
  templateUrl: './purchase-invoices.html',
})
export class PurchaseInvoices implements OnInit {
  private purchaseInvoiceService = inject(PurchaseInvoiceService);
  permissionService = inject(PermissionService);

  invoices = signal<PurchaseInvoice[]>([]);
  pagination = signal({ limit: 10, offset: 0, total: 0, page: 1, totalPages: 0 });

  filters = {
    invoiceNumber: '',
    invoiceDate: '',
    limit: 10,
    page: 1,
    sortField: 'id',
    sortDirection: 'desc' as 'asc' | 'desc',
  };

  // For nz-date-picker binding
  filterInvoiceDate: Date | null = null;

  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadInvoices();
  }

  get sortValue() {
    return `${this.filters.sortField}:${this.filters.sortDirection}`;
  }

  set sortValue(value: string) {
    const [field, direction] = value.split(':');
    this.filters.sortField = field || 'id';
    this.filters.sortDirection = direction === 'asc' ? 'asc' : 'desc';
  }

  loadInvoices() {
    this.loading = true;
    this.error = null;

    this.purchaseInvoiceService
      .getAll({
        page: this.filters.page,
        limit: this.filters.limit,
        invoiceNumber: this.filters.invoiceNumber,
        invoiceDate: this.filters.invoiceDate,
        sort: this.sortValue,
      })
      .subscribe({
        next: (res: PurchaseInvoiceList) => {
          this.invoices.set(res.data);
          this.pagination.set(res.pagination);
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to load purchase invoices';
          this.loading = false;
        },
      });
  }

  applyFilters() {
    this.filters.page = 1;
    this.loadInvoices();
  }

  onInvoiceDateChange(date: Date | null) {
    this.filterInvoiceDate = date;
    if (date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      this.filters.invoiceDate = `${yyyy}-${mm}-${dd}`;
    } else {
      this.filters.invoiceDate = '';
    }
    this.applyFilters();
  }

  onPageChange(page: number) {
    this.filters.page = page;
    this.loadInvoices();
  }

  onLimitChange() {
    this.filters.page = 1;
    this.loadInvoices();
  }

  onSortChange() {
    this.filters.page = 1;
    this.loadInvoices();
  }

  deleteInvoice(invoiceId: number) {
    this.purchaseInvoiceService.delete(invoiceId).subscribe({
      next: () => this.loadInvoices(),
      error: (err) => this.error = err.error?.error || 'Failed to delete purchase invoice'
    });
  }

  printInvoice(id: number) {
    const url = this.purchaseInvoiceService.getPdfUrl(id);
    window.open(url, '_blank');
  }
}
