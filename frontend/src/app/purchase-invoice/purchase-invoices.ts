import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  type PurchaseInvoice,
  type PurchaseInvoiceList,
  PurchaseInvoiceService,
} from './purchase-invoice-service';

@Component({
  selector: 'app-purchase-invoices',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './purchase-invoices.html',
})
export class PurchaseInvoices implements OnInit {
  private purchaseInvoiceService = inject(PurchaseInvoiceService);

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

  goToPreviousPage() {
    if (this.filters.page <= 1) return;
    this.filters.page -= 1;
    this.loadInvoices();
  }

  goToNextPage() {
    if (this.filters.page >= this.pagination().totalPages) return;
    this.filters.page += 1;
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
    if (!confirm('Delete this purchase invoice?')) return;
    this.purchaseInvoiceService.delete(invoiceId).subscribe({
      next: () => this.loadInvoices(),
      error: (err) => this.error = err.error?.error || 'Failed to delete purchase invoice'
    });
  }
}
