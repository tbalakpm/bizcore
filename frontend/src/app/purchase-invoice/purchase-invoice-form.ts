import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { type Product, ProductService } from '../product/product-service';
import { type Supplier, SupplierService } from '../supplier/supplier-service';
import { type PurchaseInvoiceItem, PurchaseInvoiceService } from './purchase-invoice-service';
import { AddressForm } from '../shared/components/address-form';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductFormComponent } from '../product/product-form.component';

type EditablePurchaseInvoiceItem = {
  id?: number;
  inventoryId?: number;
  productId?: number;
  gtn?: string;
  hsnSac?: string;
  taxPct: number;
  qty: number;
  unitPrice: number;
  discountType: string;
  discountPct: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
};

type EditablePurchaseInvoice = {
  id?: number;
  invoiceNumber: string;
  invoiceDate: string;
  supplierId?: number;
  refNumber: string;
  refDate: string;
  items: EditablePurchaseInvoiceItem[];
  subtotal: number;
  totalQty: number;
  discountType: string;
  discountPct: number;
  discountAmount: number;
  taxPct: number;
  taxAmount: number;
  roundOff: number;
  netAmount: number;
};

@Component({
  selector: 'app-purchase-invoice-form',
  imports: [CommonModule, FormsModule, RouterLink, NgSelectModule, AddressForm, ProductFormComponent],
  templateUrl: './purchase-invoice-form.html',
})
export class PurchaseInvoiceForm implements OnInit {
  private purchaseInvoiceService = inject(PurchaseInvoiceService);
  private productService = inject(ProductService);
  private supplierService = inject(SupplierService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  products = signal<Product[]>([]);
  suppliers = signal<Supplier[]>([]);

  editingInvoice: EditablePurchaseInvoice = this.defaultInvoice();
  selectedRowIndex = 0;

  // Inline Supplier Creation
  showNewSupplierForm = false;
  newSupplier: any = {
    code: '',
    name: '',
    gstin: '',
    billingAddress: {},
    shippingAddress: {},
    isActive: true,
  };
  supplierSubmitting = false;
  supplierError: string | null = null;
  sameAsBilling = false;

  // Inline Product Creation
  showNewProductForm = false;
  productSubmitting = false;
  productError: string | null = null;

  loading = false;
  submitting = false;
  error: string | null = null;

  get isEditMode() {
    return !!this.editingInvoice.id;
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadSuppliers();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isNaN(id)) {
        this.loadInvoice(id);
      }
    }
  }

  defaultInvoice(): EditablePurchaseInvoice {
    return {
      id: undefined,
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      supplierId: undefined,
      refNumber: '',
      refDate: '',
      items: [{ qty: 1, unitPrice: 0, lineTotal: 0, taxPct: 0, taxAmount: 0, discountType: 'none', discountPct: 0, discountAmount: 0 }],
      subtotal: 0,
      totalQty: 0,
      discountType: 'none',
      discountPct: 0,
      discountAmount: 0,
      taxPct: 0,
      taxAmount: 0,
      roundOff: 0,
      netAmount: 0,
    };
  }

  loadProducts() {
    this.productService.getAll().subscribe({
      next: (res) => this.products.set(res.data),
      error: () => this.error = 'Failed to load products',
    });
  }

  loadSuppliers() {
    this.supplierService.getAll().subscribe({
      next: (res) => this.suppliers.set(res.data),
      error: () => this.error = 'Failed to load suppliers',
    });
  }

  loadInvoice(invoiceId: number) {
    this.loading = true;
    this.purchaseInvoiceService.getById(invoiceId).subscribe({
      next: (invoice) => {
        this.editingInvoice = {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber ?? '',
          invoiceDate: invoice.invoiceDate,
          supplierId: invoice.supplierId,
          refNumber: invoice.refNumber ?? '',
          refDate: invoice.refDate ?? '',
          subtotal: Number(invoice.subtotal || 0),
          totalQty: Number(invoice.totalQty || 0),
          discountType: invoice.discountType || 'none',
          discountPct: Number(invoice.discountPct || 0),
          discountAmount: Number(invoice.discountAmount || 0),
          taxPct: Number(invoice.taxPct || 0),
          taxAmount: Number(invoice.taxAmount || 0),
          roundOff: Number(invoice.roundOff || 0),
          netAmount: Number(invoice.netAmount || 0),
          items: (invoice.items ?? []).map((item: PurchaseInvoiceItem) => ({
            id: item.id,
            inventoryId: item.inventoryId,
            productId: item.productId,
            gtn: item.gtn,
            hsnSac: item.hsnSac,
            taxPct: Number(item.taxPct || 0),
            qty: Number(item.qty || 0),
            unitPrice: Number(item.unitPrice || 0),
            discountType: item.discountType || 'none',
            discountPct: Number(item.discountPct || 0),
            discountAmount: Number(item.discountAmount || 0),
            taxAmount: Number(item.taxAmount || 0),
            lineTotal: Number(item.lineTotal || 0),
          })),
        };

        if (this.editingInvoice.items.length === 0) {
          this.editingInvoice.items = [{ qty: 1, unitPrice: 0, lineTotal: 0, taxPct: 0, taxAmount: 0, discountType: 'none', discountPct: 0, discountAmount: 0 }];
        }
        this.recalculateAll();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load purchase invoice';
        this.loading = false;
      },
    });
  }

  addItemRow() {
    this.editingInvoice.items.push({ qty: 1, unitPrice: 0, lineTotal: 0, taxPct: 0, taxAmount: 0, discountType: 'none', discountPct: 0, discountAmount: 0 });
  }

  removeItemRow(index: number) {
    if (this.editingInvoice.items.length <= 1) return;
    this.editingInvoice.items.splice(index, 1);
    this.recalculateAll();
  }

  onProductSelect(item: EditablePurchaseInvoiceItem) {
    const product = this.products().find((p) => p.id === item.productId);
    if (!product) return;

    item.unitPrice = Number(product.unitPrice ?? 0);
    item.hsnSac = product.hsnSac;
    item.taxPct = Number(product.taxRate ?? 0);
    this.onItemChanged(item);
  }

  onItemChanged(item: EditablePurchaseInvoiceItem) {
    const qty = Number(item.qty || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const taxPct = Number(item.taxPct || 0);

    const grossTotal = qty * unitPrice;

    if (item.discountType === 'percent') {
      item.discountAmount = Number(((grossTotal * item.discountPct) / 100).toFixed(2));
    } else if (item.discountType === 'amount') {
      item.discountPct = Number(((item.discountAmount / grossTotal) * 100).toFixed(2)) || 0;
    } else if (item.discountType === 'none') {
      item.discountPct = 0;
      item.discountAmount = 0;
    }

    const amountAfterDiscount = grossTotal - item.discountAmount;
    item.taxAmount = Number((amountAfterDiscount * taxPct / 100).toFixed(2));
    item.lineTotal = Number((amountAfterDiscount + item.taxAmount).toFixed(2));

    this.recalculateAll();
  }

  recalculateAll() {
    let subtotal = 0;
    let totalQty = 0;

    for (const item of this.editingInvoice.items) {
      subtotal += (item.qty * item.unitPrice);
      totalQty += Number(item.qty || 0);
    }

    this.editingInvoice.subtotal = Number(subtotal.toFixed(2));
    this.editingInvoice.totalQty = totalQty;

    // Header discount
    if (this.editingInvoice.discountType === 'percent') {
      this.editingInvoice.discountAmount = Number(((subtotal * this.editingInvoice.discountPct) / 100).toFixed(2));
    } else if (this.editingInvoice.discountType === 'amount') {
      this.editingInvoice.discountPct = Number(((this.editingInvoice.discountAmount / subtotal) * 100).toFixed(2)) || 0;
    } else if (this.editingInvoice.discountType === 'none') {
      this.editingInvoice.discountPct = 0;
      this.editingInvoice.discountAmount = 0;
    }

    // Header tax
    const taxableAmount = subtotal - this.editingInvoice.discountAmount;
    this.editingInvoice.taxAmount = Number((taxableAmount * this.editingInvoice.taxPct / 100).toFixed(2));

    // Net
    const netBeforeRound = taxableAmount + this.editingInvoice.taxAmount;
    this.editingInvoice.netAmount = Number((netBeforeRound + this.editingInvoice.roundOff).toFixed(2));
  }

  // --- Inline Supplier Logic ---
  toggleNewSupplierForm() {
    this.showNewSupplierForm = !this.showNewSupplierForm;
    this.supplierError = null;
    if (this.showNewSupplierForm) {
      const currentCount = this.suppliers().length;
      this.newSupplier.code = `SUPP-${(currentCount + 1).toString().padStart(4, '0')}`;
    }
  }

  createSupplierInline() {
    if (!this.newSupplier.code || !this.newSupplier.name) {
      this.supplierError = 'Code and Name are required.';
      return;
    }
    if (this.sameAsBilling) {
      this.newSupplier.shippingAddress = { ...this.newSupplier.billingAddress };
    }

    this.supplierSubmitting = true;
    this.supplierService.create(this.newSupplier).subscribe({
      next: (created) => {
        this.loadSuppliers();
        this.editingInvoice.supplierId = created.id;
        this.showNewSupplierForm = false;
        this.supplierSubmitting = false;
        this.newSupplier = { code: '', name: '', gstin: '', billingAddress: {}, shippingAddress: {}, isActive: true };
      },
      error: (err) => {
        this.supplierError = err.error?.error || 'Failed to create supplier';
        this.supplierSubmitting = false;
      }
    });
  }

  // --- Inline Product Logic ---
  toggleNewProductForm(index: number) {
    this.selectedRowIndex = index;
    this.showNewProductForm = !this.showNewProductForm;
  }

  onProductSaved(product: Product) {
    this.loadProducts();
    const item = this.editingInvoice.items[this.selectedRowIndex];
    item.productId = product.id;
    this.onProductSelect(item);
    this.showNewProductForm = false;
  }

  buildPayload() {
    const items = this.editingInvoice.items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        inventoryId: item.inventoryId,
        gtn: item.gtn,
        hsnSac: item.hsnSac,
        taxPct: item.taxPct,
        qty: item.qty,
        unitPrice: item.unitPrice,
        discountType: item.discountType,
        discountPct: item.discountPct,
        discountAmount: item.discountAmount,
      }));

    return {
      ...this.editingInvoice,
      items,
    };
  }

  onSubmit() {
    this.recalculateAll();
    const payload = this.buildPayload();

    if (payload.items.length === 0) {
      this.error = 'Please select at least one product';
      return;
    }

    if (!payload.supplierId) {
      this.error = 'Please select a supplier';
      return;
    }

    this.submitting = true;
    this.error = null;

    const request$ = this.editingInvoice.id
      ? this.purchaseInvoiceService.update(this.editingInvoice.id, payload)
      : this.purchaseInvoiceService.create(payload);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/purchase-invoices']);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.error || 'Failed to save purchase invoice';
      },
    });
  }
}
