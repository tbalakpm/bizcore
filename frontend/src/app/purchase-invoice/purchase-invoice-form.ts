import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, QueryList, signal, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { type Product, ProductService } from '../product/product-service';
import { type Supplier, SupplierService } from '../supplier/supplier-service';
import { type PurchaseInvoiceItem, PurchaseInvoiceService } from './purchase-invoice-service';
import { AddressForm } from '../shared/components/address-form';
import { ProductFormComponent } from '../product/product-form.component';

import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzPopoverModule } from 'ng-zorro-antd/popover';

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
  marginType: string;
  marginPct: number;
  marginAmount: number;
  sellingPrice: number;
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
  imports: [
    CommonModule, FormsModule, RouterLink, AddressForm, ProductFormComponent,
    NzSelectModule, NzFormModule, NzInputModule, NzDatePickerModule,
    NzInputNumberModule, NzButtonModule, NzIconModule, NzTableModule,
    NzAlertModule, NzTooltipModule, NzCardModule, NzCheckboxModule,
    NzPopoverModule,
  ],
  templateUrl: './purchase-invoice-form.html',
})
export class PurchaseInvoiceForm implements OnInit {
  private purchaseInvoiceService = inject(PurchaseInvoiceService);
  private productService = inject(ProductService);
  private supplierService = inject(SupplierService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  @ViewChildren('itemRowSelect') itemRowSelects!: QueryList<NzSelectComponent>;

  products = signal<Product[]>([]);
  suppliers = signal<Supplier[]>([]);

  editingInvoice: EditablePurchaseInvoice = this.defaultInvoice();
  selectedRowItem: EditablePurchaseInvoiceItem | null = null;

  // Date bindings for nz-date-picker
  invoiceDateValue: Date | null = null;
  refDateValue: Date | null = null;

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

  defaultInvoice(): EditablePurchaseInvoice {
    return {
      id: undefined,
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      supplierId: undefined,
      refNumber: '',
      refDate: '',
      items: [{ qty: 1, unitPrice: 0, lineTotal: 0, taxPct: 0, taxAmount: 0, discountType: 'none', discountPct: 0, discountAmount: 0, marginType: 'none', marginPct: 0, marginAmount: 0, sellingPrice: 0 }],
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
            marginType: item.marginType || 'none',
            marginPct: Number(item.marginPct || 0),
            marginAmount: Number(item.marginAmount || 0),
            sellingPrice: Number(item.sellingPrice || 0),
          })),
        };

        if (this.editingInvoice.items.length === 0) {
          this.editingInvoice.items = [{ qty: 1, unitPrice: 0, lineTotal: 0, taxPct: 0, taxAmount: 0, discountType: 'none', discountPct: 0, discountAmount: 0, marginType: 'none', marginPct: 0, marginAmount: 0, sellingPrice: 0 }];
        }

        // Sync date pickers
        this.invoiceDateValue = invoice.invoiceDate
          ? new Date(invoice.invoiceDate + 'T00:00:00')
          : null;
        this.refDateValue = invoice.refDate
          ? new Date(invoice.refDate + 'T00:00:00')
          : null;

        this.recalculateAll();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load purchase invoice';
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

  onRefDateChange(date: Date | null) {
    this.refDateValue = date;
    if (date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      this.editingInvoice.refDate = `${yyyy}-${mm}-${dd}`;
    } else {
      this.editingInvoice.refDate = '';
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
    this.editingInvoice.items.push({ qty: 1, unitPrice: 0, lineTotal: 0, taxPct: 0, taxAmount: 0, discountType: 'none', discountPct: 0, discountAmount: 0, marginType: 'none', marginPct: 0, marginAmount: 0, sellingPrice: 0 });
    this.editingInvoice.items = [...this.editingInvoice.items];
    setTimeout(() => {
      const lastSelect = this.itemRowSelects.last;
      if (lastSelect) {
        lastSelect.focus();
      }
    });
  }

  removeItemRow(item: EditablePurchaseInvoiceItem) {
    if (this.editingInvoice.items.length <= 1) return;
    const index = this.editingInvoice.items.indexOf(item);
    if (index > -1) {
      this.editingInvoice.items.splice(index, 1);
      this.editingInvoice.items = [...this.editingInvoice.items];
      this.recalculateAll();
    }
  }

  isQtyDisabled(item: EditablePurchaseInvoiceItem): boolean {
    if (!item.id) return false;
    const product = this.products().find((p) => p.id === item.productId);
    return product?.gtnGeneration?.toLowerCase() === 'tag';
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

    this.recalculateMargin(item);
    this.recalculateAll();
  }

  recalculateMargin(item: EditablePurchaseInvoiceItem) {
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

  onMarginChanged(item: EditablePurchaseInvoiceItem) {
    this.recalculateMargin(item);
  }

  onSellingPriceChanged(item: EditablePurchaseInvoiceItem) {
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

  recalculateAll() {
    let subtotal = 0;
    let totalQty = 0;
    let totalTaxAmount = 0;

    for (const item of this.editingInvoice.items) {
      subtotal += (item.qty * item.unitPrice);
      totalQty += Number(item.qty || 0);
      totalTaxAmount += Number(item.taxAmount || 0);
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

    // Set header tax to sum of line item taxes
    this.editingInvoice.taxAmount = Number(totalTaxAmount.toFixed(2));

    // Net
    const netBeforeRound = subtotal - this.editingInvoice.discountAmount + this.editingInvoice.taxAmount;
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
  toggleNewProductForm() {
    this.showNewProductForm = !this.showNewProductForm;
    this.productError = null;
  }

  onProductSaved(product: Product) {
    // Add to local product list so nz-select shows it immediately
    this.products.set([product, ...this.products()]);

    if (this.selectedRowItem) {
      this.selectedRowItem.productId = product.id;
      this.onProductSelect(this.selectedRowItem);
    }
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
        marginType: item.marginType,
        marginPct: item.marginPct,
        marginAmount: item.marginAmount,
        sellingPrice: item.sellingPrice,
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

  printInvoice() {
    if (this.editingInvoice.id) {
      const url = this.purchaseInvoiceService.getPdfUrl(this.editingInvoice.id);
      window.open(url, '_blank');
    }
  }
}
