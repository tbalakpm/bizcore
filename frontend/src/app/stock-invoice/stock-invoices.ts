import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { type StockInvoice, type StockInvoiceList, StockInvoiceService } from './stock-invoice-service';

@Component({
  selector: 'app-stock-invoices',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stock-invoices.html',
})
export class StockInvoices implements OnInit {
  private stockInvoiceService = inject(StockInvoiceService);

  invoices = signal<StockInvoice[]>([]);

  pagination = signal({ limit: 10, offset: 0, total: 0, page: 1, totalPages: 0 });

  filters = {
    invoiceNumber: '',
    invoiceDate: '',
    minAmount: undefined as number | undefined,
    maxAmount: undefined as number | undefined,
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

    this.stockInvoiceService
      .getAll({
        page: this.filters.page,
        limit: this.filters.limit,
        invoiceNumber: this.filters.invoiceNumber,
        invoiceDate: this.filters.invoiceDate,
        minAmount: this.filters.minAmount,
        maxAmount: this.filters.maxAmount,
        sort: this.sortValue,
      })
      .subscribe({
        next: (res: StockInvoiceList) => {
          this.invoices.set(
            res.data.map((invoice) => ({
              ...invoice,
              totalQty: Number(invoice.totalQty ?? 0),
              totalAmount: Number(invoice.totalAmount ?? 0),
            })),
          );
          this.pagination.set(res.pagination);
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to load stock invoices';
          this.loading = false;
        },
      });
  }

  applyFilters() {
    this.filters.page = 1;
    this.loadInvoices();
  }

  goToPreviousPage() {
    if (this.filters.page <= 1) {
      return;
    }

    this.filters.page -= 1;
    this.loadInvoices();
  }

  goToNextPage() {
    if (this.filters.page >= this.pagination().totalPages) {
      return;
    }

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
    if (!confirm('Delete this stock invoice?')) {
      return;
    }

    this.stockInvoiceService.delete(invoiceId).subscribe({
      next: () => {
        this.loadInvoices();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to delete stock invoice';
      },
    });
  }
}
