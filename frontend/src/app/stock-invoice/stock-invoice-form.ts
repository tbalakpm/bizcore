import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { type Category, CategoryService } from '../category/category-service';
import { type Product, ProductService } from '../product/product-service';
import { type StockInvoiceItem, StockInvoiceService } from './stock-invoice-service';

type EditableStockInvoiceItem = {
  id?: number;
  inventoryId?: number;
  productId?: number;
  gtn?: string;
  hsnSac?: string;
  taxRate?: number;
  qty: number;
  unitPrice: number;
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
  imports: [CommonModule, FormsModule, RouterLink, NgSelectModule],
  templateUrl: './stock-invoice-form.html',
})
export class StockInvoiceForm implements OnInit {
  private stockInvoiceService = inject(StockInvoiceService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);

  editingInvoice: EditableStockInvoice = this.defaultInvoice();
  productSearch = '';
  selectedRowIndex = 0;

  showNewProductForm = false;
  newProduct: Partial<Product> = {
    code: '',
    name: '',
    categoryId: undefined,
    qtyPerUnit: '',
    unitPrice: undefined,
    hsnSac: undefined,
    taxRate: undefined,
    gtnGeneration: undefined,
    gtnPrefix: undefined,
    gtnStartPos: undefined,
    isActive: true,
  };

  loading = false;
  submitting = false;
  error: string | null = null;

  get isEditMode() {
    return !!this.editingInvoice.id;
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();

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
      items: [{ qty: 1, unitPrice: 0, lineTotal: 0, gtn: '' }],
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

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: (res) => this.categories.set(res.data),
      error: () => {
        this.error = 'Failed to load categories';
      },
    });
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
          lineTotal: Number(item.lineTotal ?? 0),
        }));

        if (this.editingInvoice.items.length === 0) {
          this.editingInvoice.items = [{ qty: 1, unitPrice: 0, lineTotal: 0, gtn: '' }];
        }

        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load stock invoice';
        this.loading = false;
      },
    });
  }

  get filteredProducts() {
    const search = this.productSearch.trim().toLowerCase();
    if (!search) {
      return this.products();
    }

    return this.products().filter(
      (p) => p.code.toLowerCase().includes(search) || p.name.toLowerCase().includes(search),
    );
  }

  addItemRow() {
    this.editingInvoice.items.push({ qty: 1, unitPrice: 0, lineTotal: 0, gtn: '' });
  }

  removeItemRow(index: number) {
    if (this.editingInvoice.items.length <= 1) {
      return;
    }

    this.editingInvoice.items.splice(index, 1);
    this.selectedRowIndex = Math.max(0, this.selectedRowIndex - 1);
  }

  onItemChanged(item: EditableStockInvoiceItem) {
    const qty = Number(item.qty || 0);
    const unitPrice = Number(item.unitPrice || 0);
    item.qty = qty;
    item.unitPrice = unitPrice;
    item.lineTotal = Number((qty * unitPrice).toFixed(2));
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

  createProductFromInvoice() {
    if (!this.newProduct.code || !this.newProduct.name || !this.newProduct.categoryId) {
      this.error = 'Code, name and category are required to create product';
      return;
    }

    this.productService.create(this.newProduct).subscribe({
      next: (product) => {
        this.products.set([product, ...this.products()]);

        const item = this.editingInvoice.items[this.selectedRowIndex];
        if (item) {
          item.productId = product.id;
          item.unitPrice = Number(product.unitPrice ?? 0);
          this.onItemChanged(item);
        }

        this.showNewProductForm = false;
        this.newProduct = {
          code: '',
          name: '',
          categoryId: undefined,
          qtyPerUnit: '',
          unitPrice: undefined,
          hsnSac: undefined,
          taxRate: undefined,
          gtnGeneration: undefined,
          gtnPrefix: undefined,
          gtnStartPos: undefined,
          isActive: true,
        };
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to create product';
      },
    });
  }
}
