import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, QueryList, signal, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { type Product, ProductService } from '../product/product-service';
import { ProductFormComponent } from '../product/product-form.component';
import { type StockInvoiceItem, StockInvoiceService } from './stock-invoice-service';

import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzCardModule } from 'ng-zorro-antd/card';

type EditableStockInvoiceItem = {
  id?: number;
  inventoryId?: number;
  productId?: number;
  gtn?: string;
  hsnSac?: string;
  taxRate?: number;
  qty: number;
  unitPrice: number;
  marginType: string;
  marginPct: number;
  marginAmount: number;
  sellingPrice: number;
  lineTotal: number;
};

type EditableStockInvoice = {
  id?: number;
  invoiceNumber: string;
  invoiceDate: string;
  items: EditableStockInvoiceItem[];
};

@Component({
  selector: 'app-stock-invoice-form',
  imports: [
    CommonModule, FormsModule, RouterLink, ProductFormComponent,
    NzSelectModule, NzInputModule, NzInputNumberModule, NzDatePickerModule,
    NzButtonModule, NzIconModule, NzTableModule, NzAlertModule,
    NzTooltipModule, NzCardModule,
  ],
  templateUrl: './stock-invoice-form.html',
})
export class StockInvoiceForm implements OnInit {
  private stockInvoiceService = inject(StockInvoiceService);
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  @ViewChildren('itemRowSelect') itemRowSelects!: QueryList<NzSelectComponent>;

  products = signal<Product[]>([]);

  editingInvoice: EditableStockInvoice = this.defaultInvoice();
  selectedRowItem: EditableStockInvoiceItem | null = null;

  // Date binding for nz-date-picker
  invoiceDateValue: Date | null = null;

  showNewProductForm = false;

  loading = false;
  submitting = false;
  error: string | null = null;

  get isEditMode() {
    return !!this.editingInvoice.id;
  }

  ngOnInit(): void {
    this.loadProducts();

    // Initialize date from default invoice
    this.invoiceDateValue = this.editingInvoice.invoiceDate
      ? new Date(this.editingInvoice.invoiceDate + 'T00:00:00')
      : null;

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isNaN(id)) {
        this.loadInvoice(id);
      }
    }
  }

  defaultInvoice(): EditableStockInvoice {
    return {
      id: undefined,
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      items: [{ qty: 1, unitPrice: 0, lineTotal: 0, gtn: '', marginType: 'none', marginPct: 0, marginAmount: 0, sellingPrice: 0 }],
    };
  }

  loadProducts() {
    this.productService.getAll().subscribe({
      next: (res) => this.products.set(res.data),
      error: () => {
        this.error = 'Failed to load products';
      },
    });
  }

  /** Called when the user saves a new product from the inline form */
  onNewProductSaved(product: Product) {
    // Add to local product list so nz-select shows it immediately
    this.products.set([product, ...this.products()]);

    // Auto-select in the active row
    const item = this.selectedRowItem || this.editingInvoice.items[this.editingInvoice.items.length - 1];
    if (item) {
      item.productId = product.id;
      item.unitPrice = Number(product.unitPrice ?? 0);
      item.hsnSac = product.hsnSac;
      item.taxRate = product.taxRate !== undefined ? Number(product.taxRate) : undefined;
      this.onItemChanged(item);
    }

    this.showNewProductForm = false;
  }

  loadInvoice(invoiceId: number) {
    this.loading = true;
    this.stockInvoiceService.getById(invoiceId).subscribe({
      next: (invoice) => {
        this.editingInvoice.id = invoice.id;
        this.editingInvoice.invoiceNumber = invoice.invoiceNumber ?? '';
        this.editingInvoice.invoiceDate = invoice.invoiceDate;
        this.editingInvoice.items = (invoice.items ?? []).map((item: StockInvoiceItem) => ({
          id: item.id,
          inventoryId: item.inventoryId,
          productId: item.productId,
          gtn: item.gtn,
          hsnSac: item.hsnSac,
          taxRate: item.taxRate !== undefined ? Number(item.taxRate) : undefined,
          qty: Number(item.qty ?? 0),
          unitPrice: Number(item.unitPrice ?? 0),
          marginType: item.marginType ?? 'none',
          marginPct: Number(item.marginPct ?? 0),
          marginAmount: Number(item.marginAmount ?? 0),
          sellingPrice: Number(item.sellingPrice ?? 0),
          lineTotal: Number(item.lineTotal ?? 0),
        }));

        if (this.editingInvoice.items.length === 0) {
          this.editingInvoice.items = [{ qty: 1, unitPrice: 0, lineTotal: 0, gtn: '', marginType: 'none', marginPct: 0, marginAmount: 0, sellingPrice: 0 }];
        }

        // Sync date picker
        this.invoiceDateValue = invoice.invoiceDate
          ? new Date(invoice.invoiceDate + 'T00:00:00')
          : null;

        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load stock invoice';
        this.loading = false;
      },
    });
  }

  onInvoiceDateChange(date: Date | null) {
    this.invoiceDateValue = date;
    if (date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      this.editingInvoice.invoiceDate = `${yyyy}-${mm}-${dd}`;
    } else {
      this.editingInvoice.invoiceDate = '';
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.code === 'KeyN') {
      event.preventDefault();
      this.addItemRow();
    }
  }

  addItemRow() {
    this.editingInvoice.items.push({ qty: 1, unitPrice: 0, lineTotal: 0, gtn: '', marginType: 'none', marginPct: 0, marginAmount: 0, sellingPrice: 0 });
    this.editingInvoice.items = [...this.editingInvoice.items];
    setTimeout(() => {
      const lastSelect = this.itemRowSelects.last;
      if (lastSelect) {
        lastSelect.focus();
      }
    });
  }

  removeItemRow(item: EditableStockInvoiceItem) {
    if (this.editingInvoice.items.length <= 1) {
      return;
    }

    const index = this.editingInvoice.items.indexOf(item);
    if (index > -1) {
      this.editingInvoice.items.splice(index, 1);
      this.editingInvoice.items = [...this.editingInvoice.items];
      if (this.selectedRowItem === item) {
        this.selectedRowItem = null;
      }
    }
  }

  isQtyDisabled(item: EditableStockInvoiceItem): boolean {
    if (!item.id) return false;
    const product = this.products().find((p) => p.id === item.productId);
    return product?.gtnGeneration?.toLowerCase() === 'tag';
  }

  onItemChanged(item: EditableStockInvoiceItem) {
    const qty = Number(item.qty || 0);
    const unitPrice = Number(item.unitPrice || 0);
    item.qty = qty;
    item.unitPrice = unitPrice;
    item.lineTotal = Number((qty * unitPrice).toFixed(2));
    this.recalculateMargin(item);
  }

  recalculateMargin(item: EditableStockInvoiceItem) {
    if (item.marginType === 'none') {
      item.marginPct = 0;
      item.marginAmount = 0;
      item.sellingPrice = item.unitPrice;
      return;
    }
    if (item.marginType === 'pct') {
      item.marginAmount = Number((item.unitPrice * (item.marginPct || 0) / 100).toFixed(2));
      item.sellingPrice = Number((item.unitPrice + item.marginAmount).toFixed(2));
    } else if (item.marginType === 'amount') {
      item.marginPct = item.unitPrice > 0 ? Number(((item.marginAmount || 0) / item.unitPrice * 100).toFixed(2)) : 0;
      item.sellingPrice = Number((item.unitPrice + (item.marginAmount || 0)).toFixed(2));
    }
  }

  onMarginChanged(item: EditableStockInvoiceItem) {
    this.recalculateMargin(item);
  }

  onSellingPriceChanged(item: EditableStockInvoiceItem) {
    const diff = (item.sellingPrice || 0) - item.unitPrice;
    if (diff === 0) {
      item.marginType = 'none';
      item.marginPct = 0;
      item.marginAmount = 0;
    } else {
      if (item.marginType === 'none') {
        item.marginType = 'amount';
      }
      if (item.marginType === 'amount') {
         item.marginAmount = Number(diff.toFixed(2));
         item.marginPct = item.unitPrice > 0 ? Number((diff / item.unitPrice * 100).toFixed(2)) : 0;
      } else if (item.marginType === 'pct') {
         item.marginPct = item.unitPrice > 0 ? Number((diff / item.unitPrice * 100).toFixed(2)) : 0;
         item.marginAmount = Number(diff.toFixed(2));
      }
    }
  }

  onProductSelect(item: EditableStockInvoiceItem) {
    const product = this.products().find((p) => p.id === item.productId);
    if (!product) {
      return;
    }

    item.unitPrice = Number(product.unitPrice ?? 0);
    item.hsnSac = product.hsnSac;
    item.taxRate = product.taxRate;
    this.onItemChanged(item);
  }

  recalculateFromItems() {
    for (const item of this.editingInvoice.items) {
      this.onItemChanged(item);
    }
  }

  buildPayload() {
    const items = this.editingInvoice.items
      .filter((item) => item.productId || item.inventoryId)
      .map((item) => ({
        inventoryId: item.inventoryId,
        productId: item.productId,
        gtn: item.gtn,
        hsnSac: item.hsnSac,
        taxRate: item.taxRate,
        qty: Number(item.qty || 0),
        unitPrice: Number(item.unitPrice || 0),
        marginType: item.marginType,
        marginPct: Number(item.marginPct || 0),
        marginAmount: Number(item.marginAmount || 0),
        sellingPrice: Number(item.sellingPrice || 0),
        lineTotal: Number(item.lineTotal || 0),
      }));

    const totalQty = items.reduce((acc, item) => acc + item.qty, 0);
    const totalAmount = items.reduce((acc, item) => acc + item.lineTotal, 0);

    return {
      invoiceNumber: this.editingInvoice.invoiceNumber.trim() || undefined,
      invoiceDate: this.editingInvoice.invoiceDate,
      totalQty,
      totalAmount: Number(totalAmount.toFixed(2)),
      items,
    };
  }

  onSubmit() {
    this.recalculateFromItems();
    const payload = this.buildPayload();

    if (payload.items.length === 0) {
      this.error = 'Please select at least one product';
      return;
    }

    this.submitting = true;
    this.error = null;

    const request$ = this.editingInvoice.id
      ? this.stockInvoiceService.update(this.editingInvoice.id, payload)
      : this.stockInvoiceService.create(payload);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/stock-invoices']);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.error || 'Failed to save stock invoice';
      },
    });
  }

}
