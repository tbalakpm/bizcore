import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import JsBarcode from 'jsbarcode';
import { type PurchaseInvoice, type PurchaseInvoiceList, PurchaseInvoiceService } from './purchase-invoice-service';
import { SettingsService } from '../settings/settings.service';
import { PermissionService } from '../auth/permission.service';
import { SupplierService, Supplier } from '../supplier/supplier-service';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAlertModule } from 'ng-zorro-antd/alert';

type PrintableBarcodeLabel = {
  title: string;
  code: string;
  subtitle: string;
};

@Component({
  selector: 'app-purchase-invoices',
  imports: [
    CommonModule, DatePipe, CurrencyPipe, FormsModule, RouterLink,
    NzTableModule, NzInputModule, NzInputNumberModule, NzDatePickerModule, NzSelectModule,
    NzButtonModule, NzIconModule, NzPaginationModule, NzTooltipModule,
    NzPopconfirmModule, NzCardModule, NzAlertModule,
  ],
  templateUrl: './purchase-invoices.html',
})
export class PurchaseInvoices implements OnInit {
  private purchaseInvoiceService = inject(PurchaseInvoiceService);
  private settingsService = inject(SettingsService);
  private supplierService = inject(SupplierService);
  permissionService = inject(PermissionService);

  invoices = signal<any[]>([]);
  suppliers = signal<Supplier[]>([]);
  pagination = signal({ limit: 10, offset: 0, total: 0, page: 1, totalPages: 0 });

  filters = {
    invoiceNumber: '',
    invoiceDate: '',
    supplierId: null as number | null,
    minAmount: null as number | null,
    maxAmount: null as number | null,
    limit: 10,
    page: 1,
    sortField: 'id',
    sortDirection: 'desc' as 'asc' | 'desc',
  };

  // For nz-date-picker binding
  filterInvoiceDate: Date | null = null;

  loading = false;
  printingInvoiceId: number | null = null;
  error: string | null = null;

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadInvoices();
  }

  loadSuppliers() {
    this.supplierService.getAll({ limit: 1000 }).subscribe((res) => {
      this.suppliers.set(res.data);
    });
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
        supplierId: this.filters.supplierId ?? undefined,
        minAmount: this.filters.minAmount ?? undefined,
        maxAmount: this.filters.maxAmount ?? undefined,
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

  get hasFilters(): boolean {
    return !!(this.filters.invoiceNumber || this.filters.invoiceDate || this.filters.supplierId || this.filters.minAmount || this.filters.maxAmount);
  }

  clearFilters() {
    this.filters.invoiceNumber = '';
    this.filters.invoiceDate = '';
    this.filters.supplierId = null;
    this.filters.minAmount = null;
    this.filters.maxAmount = null;
    this.filterInvoiceDate = null;
    this.applyFilters();
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

  printBarcodes(invoiceId: number) {
    this.printingInvoiceId = invoiceId;
    this.error = null;

    forkJoin({
      invoice: this.purchaseInvoiceService.getById(invoiceId),
      settings: this.settingsService.getAllSettings(),
    }).subscribe({
      next: ({ invoice, settings }) => {
        const width = Number(settings.data.find((s) => s.key === 'barcode_width')?.value || 2);
        const height = Number(settings.data.find((s) => s.key === 'barcode_height')?.value || 1.2);
        const columns = Number(settings.data.find((s) => s.key === 'barcode_columns')?.value || 1);

        this.openBarcodePrintWindow(this.buildBarcodeLabels(invoice), width, height, columns);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load purchase invoice for barcode printing';
      },
      complete: () => {
        this.printingInvoiceId = null;
      },
    });
  }

  private buildBarcodeLabels(invoice: PurchaseInvoice): PrintableBarcodeLabel[] {
    const labels: PrintableBarcodeLabel[] = [];

    for (const item of invoice.items ?? []) {
      const barcodeValue = String(item.gtn ?? item.productCode ?? '').trim();
      if (!barcodeValue) {
        continue;
      }

      const qty = Math.max(1, Math.round(Number(item.qty ?? 1)));
      const title = String(item.productName ?? item.productCode ?? 'Product');
      const subtitle = `Rs. ${Number(item.sellingPrice ?? item.unitPrice ?? 0).toFixed(2) ?? '0.00'}`;

      for (let i = 0; i < qty; i += 1) {
        labels.push({ title, code: barcodeValue, subtitle });
      }
    }

    return labels;
  }

  private openBarcodePrintWindow(labels: PrintableBarcodeLabel[], width: number, height: number, columns: number) {
    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) {
      this.error = 'Popup blocked. Please allow popups and try again.';
      return;
    }

    const labelsHtml = labels
      .map((label) => {
        const barcodeSvg = this.generateBarcodeSvg(label.code);
        return `<section class="label">
            <div class="title">${this.escapeHtml(label.title)}</div>
            <div class="barcode">${barcodeSvg}</div>
            <div class="code">${this.escapeHtml(label.code)}</div>
            <div class="subtitle">${this.escapeHtml(label.subtitle)}</div>
          </section>`;
      })
      .join('');

    const isGrid = columns > 1;

    const htmlContent = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Barcode Print</title>
    <style>
      @page {
        ${isGrid ? 'margin: 0;' : `size: ${width}in ${height}in; margin: 0;`}
      }
  
      * {
        box-sizing: border-box;
      }
  
      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        ${isGrid ? `display: grid; grid-template-columns: repeat(${columns}, ${width}in); gap: 0; justify-content: start; align-content: start;` : ''}
      }
  
      .label {
        width: ${width}in;
        height: ${height}in;
        padding: 0.1in;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        ${isGrid ? 'page-break-inside: avoid; break-inside: avoid;' : 'page-break-after: always; break-after: page;'}
      }
  
      .title {
        font-size: 9px;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
  
      .barcode {
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 0;
        margin: 2px 0;
      }
      .barcode svg {
        max-width: 100%;
        max-height: 100%;
        display: block;
      }
  
      .code {
        margin-top: 1px;
        font-size: 9px;
        text-align: center;
        letter-spacing: 0.5px;
      }
  
      .subtitle {
        font-size: 8px;
        color: #444;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    </style>
  </head>
  <body>${labelsHtml}</body>
  </html>`;

    printWindow.document.open();
    printWindow.document.close();
    printWindow.document.documentElement.innerHTML = htmlContent;
    printWindow.focus();
    setTimeout(() => printWindow.print(), 100);
  }

  private generateBarcodeSvg(value: string) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svg, value, {
      format: 'CODE128',
      displayValue: false,
      margin: 0,
      width: 1.5,
      height: 44,
    });
    return svg.outerHTML;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
