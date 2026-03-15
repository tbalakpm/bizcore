import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnDestroy, OnInit, QueryList, signal, ViewChildren } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { AddressForm } from '../shared/components/address-form';
import { TranslatePipe } from '@ngx-translate/core';
import { TooltipDirective } from '../shared/directives/tooltip.directive';

import { type Product, ProductService } from '../product/product-service';
import { type Customer, CustomerService } from '../customer/customer-service';
import { type SalesInvoiceItem, SalesInvoiceService, SalesInvoice } from './sales-invoice-service';
import { type Inventory, InventoryService } from '../inventory/inventory-service';
import { LucideAngularModule } from 'lucide-angular';
import { NgSelectComponent } from '@ng-select/ng-select';

type EditableSalesInvoiceItem = {
  id?: number;
  inventoryId?: number;
  productId?: number;
  gtn?: string;
  qty: number;
  unitPrice: number;
  discountType?: string;
  discountPct?: number;
  discountAmount?: number;
  taxPct?: number;
  taxAmount?: number;
  lineTotal: number;
};

type EditableSalesInvoice = {
  id?: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerId?: number;
  refNumber?: string;
  refDate?: string;
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  signedQrCode?: string;
  items: EditableSalesInvoiceItem[];
};

@Component({
  selector: 'app-sales-invoice-form',
  imports: [CommonModule, FormsModule, RouterLink, NgSelectModule, AddressForm, TranslatePipe, TooltipDirective, LucideAngularModule],
  templateUrl: './sales-invoice-form.html',
})
export class SalesInvoiceForm implements OnInit {
  private salesInvoiceService = inject(SalesInvoiceService);
  private productService = inject(ProductService);
  private customerService = inject(CustomerService);
  private inventoryService = inject(InventoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  @ViewChildren('itemRowSelect') itemRowSelects!: QueryList<NgSelectComponent>;

  products = signal<Product[]>([]);
  customers = signal<Customer[]>([]);
  inventories = signal<Inventory[]>([]);

  // Inventory Search & Lazy Loading
  inventoryInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  inventoryLoading = false;
  inventorySearchQuery = '';
  inventoryOffset = 0;
  inventoryLimit = 50;
  inventoryTotal = 0;

  editingInvoice: EditableSalesInvoice = this.defaultInvoice();

  // Inline Customer Creation
  showNewCustomerForm = false;
  newCustomer: Partial<Customer> = {
    code: '',
    name: '',
    type: 'retail',
    gstin: '',
    billingAddress: {},
    shippingAddress: {},
    isActive: true,
  };

  sameAsBilling = false;

  loading = false;
  submitting = false;
  customerSubmitting = false;
  error: string | null = null;
  customerError: string | null = null;

  get isEditMode() {
    return !!this.editingInvoice.id;
  }

  // Computed values
  get totalQty() {
    return this.editingInvoice.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }

  get subtotal() {
    return this.editingInvoice.items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)), 0);
  }

  get totalDiscount() {
    return this.editingInvoice.items.reduce((sum, item) => sum + (Number(item.discountAmount) || 0), 0);
  }

  get totalTax() {
    return this.editingInvoice.items.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0);
  }

  get netAmount() {
    return this.editingInvoice.items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCustomers();
    this.loadInventories();
    this.setupInventorySearch();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isNaN(id)) {
        this.loadInvoice(id);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  defaultInvoice(): EditableSalesInvoice {
    return {
      id: undefined,
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      items: [{ qty: 1, unitPrice: 0, taxPct: 0, taxAmount: 0, discountAmount: 0, lineTotal: 0 }],
    };
  }

  loadProducts() {
    this.productService.getAll().subscribe({
      next: (res) => this.products.set(res.data),
      error: () => this.error = 'Failed to load products',
    });
  }

  loadCustomers() {
    this.customerService.getAll().subscribe({
      next: (res) => this.customers.set(res.data),
      error: () => this.error = 'Failed to load customers',
    });
  }

  loadInventories(append = false) {
    this.inventoryLoading = true;
    this.inventoryService.getAvailableStock(this.inventorySearchQuery, this.inventoryLimit, this.inventoryOffset).subscribe({
      next: (res) => {
        if (append) {
          this.inventories.update(prev => [...prev, ...res.data]);
        } else {
          this.inventories.set(res.data);
        }
        this.inventoryTotal = res.pagination.total;
        this.inventoryLoading = false;
      },
      error: () => {
        this.error = 'Failed to load inventories';
        this.inventoryLoading = false;
      },
    });
  }

  setupInventorySearch() {
    this.inventoryInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.inventorySearchQuery = term || '';
      this.inventoryOffset = 0;
      this.loadInventories(false);
    });
  }

  onInventoryScrollToEnd() {
    if (this.inventoryLoading || this.inventories().length >= this.inventoryTotal) {
      return;
    }
    this.inventoryOffset += this.inventoryLimit;
    this.loadInventories(true);
  }

  loadInvoice(id: number) {
    this.loading = true;
    this.salesInvoiceService.getById(id).subscribe({
      next: (invoice) => {
        this.editingInvoice = {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          customerId: invoice.customerId,
          refNumber: invoice.refNumber,
          refDate: invoice.refDate,
          irn: invoice.irn,
          ackNo: invoice.ackNo,
          ackDate: invoice.ackDate,
          signedQrCode: invoice.signedQrCode,
          items: (invoice.items || []).map((item) => ({
            id: item.id,
            inventoryId: item.inventoryId,
            productId: item.productId,
            gtn: item.gtn,
            qty: Number(item.qty || 0),
            unitPrice: Number(item.unitPrice || 0),
            discountType: item.discountType,
            discountPct: Number(item.discountPct || 0),
            discountAmount: Number(item.discountAmount || 0),
            taxPct: Number(item.taxPct || 0),
            taxAmount: Number(item.taxAmount || 0),
            lineTotal: Number(item.lineTotal || 0),
          })),
        };
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load invoice';
        this.loading = false;
      },
    });
  }

  onInventorySelect(item: EditableSalesInvoiceItem) {
    if (!item.inventoryId) {
      item.productId = undefined;
      item.gtn = undefined;
      item.unitPrice = 0;
      item.taxPct = 0;
      this.calculateLineTotal(item);
      return;
    }

    const inventory = this.inventories().find((inv) => inv.id === item.inventoryId);
    if (inventory) {
      item.productId = inventory.productId;
      item.gtn = inventory.gtn;

      const product = this.products().find((p) => p.id === inventory.productId);
      if (product) {
        item.unitPrice = Number(product.unitPrice || 0);
        item.taxPct = Number(product.taxRate || 0);
      }
      this.calculateLineTotal(item);
    }
  }

  calculateLineTotal(item: EditableSalesInvoiceItem) {
    const qty = Number(item.qty || 0);
    let price = Number(item.unitPrice || 0);
    const grossTotal = qty * price;

    // Apply discount
    let discountAmt = 0;
    if (item.discountType === 'percent' && item.discountPct) {
      discountAmt = grossTotal * (Number(item.discountPct) / 100);
    } else if (item.discountType === 'amount' && item.discountAmount) {
      discountAmt = Number(item.discountAmount);
    }
    item.discountAmount = discountAmt;

    const afterDiscount = grossTotal - discountAmt;

    // Apply tax
    let taxAmt = 0;
    if (item.taxPct) {
      taxAmt = afterDiscount * (Number(item.taxPct) / 100);
    }
    item.taxAmount = taxAmt;

    item.lineTotal = Number((afterDiscount + taxAmt).toFixed(2));
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.altKey && event.code === 'KeyN') {
      event.preventDefault();
      this.addItemRow();
    }
  }

  addItemRow() {
    this.editingInvoice.items.push({ qty: 1, unitPrice: 0, taxPct: 0, taxAmount: 0, discountAmount: 0, lineTotal: 0 });
    setTimeout(() => {
      const lastSelect = this.itemRowSelects.last;
      if (lastSelect) {
        lastSelect.focus();
        lastSelect.open();
      }
    });
  }

  removeItem(index: number) {
    if (this.editingInvoice.items.length > 1) {
      this.editingInvoice.items.splice(index, 1);
    }
  }

  // --- Inline Customer Form Handlers ---

  toggleNewCustomerForm() {
    this.showNewCustomerForm = !this.showNewCustomerForm;
    this.customerError = null;
    if (this.showNewCustomerForm && this.customers().length > 0) {
      // Suggest a code
      const currentCount = this.customers().length;
      this.newCustomer.code = `CUST-${(currentCount + 1).toString().padStart(4, '0')}`;
    }
  }

  createCustomerInline() {
    if (!this.newCustomer.code || !this.newCustomer.name) {
      this.customerError = 'Code and Name are required.';
      return;
    }

    this.customerSubmitting = true;
    this.customerError = null;

    this.customerService.create(this.newCustomer).subscribe({
      next: (createdCustomer) => {
        // Refresh customer list
        this.customerService.getAll().subscribe(res => {
          this.customers.set(res.data);

          if (this.sameAsBilling) {
            this.newCustomer.shippingAddress = { ...this.newCustomer.billingAddress };
          }
          // Auto-select the newly created customer
          this.editingInvoice.customerId = createdCustomer.id;

          this.showNewCustomerForm = false;
          this.customerSubmitting = false;
          this.newCustomer = { code: '', name: '', type: 'retail', gstin: '', billingAddress: {}, shippingAddress: {}, isActive: true };
          this.sameAsBilling = false;
        });
      },
      error: (err) => {
        console.error('Failed to create customer', err);
        this.customerError = err.error?.error || 'Failed to create customer. Please check your inputs.';
        this.customerSubmitting = false;
      }
    });
  }

  // --- Main Form Submission ---

  onSubmit() {
    if (!this.editingInvoice.customerId) {
      this.error = "Customer is required";
      window.scrollTo(0, 0);
      return;
    }

    if (this.editingInvoice.items.length === 0) {
      this.error = 'Please add at least one item.';
      window.scrollTo(0, 0);
      return;
    }

    for (const item of this.editingInvoice.items) {
      if (!item.inventoryId || typeof item.inventoryId !== 'number') {
        this.error = 'All items must have a valid inventory item (GTN) selected.';
        window.scrollTo(0, 0);
        return;
      }
      if (Number(item.qty) <= 0) {
        this.error = 'All items must have a quantity greater than zero.';
        window.scrollTo(0, 0);
        return;
      }

      const inv = this.inventories().find(i => i.id === item.inventoryId);
      if (inv && Number(item.qty) > inv.unitsInStock) {
        this.error = `Insufficient stock for item: ${inv.name} (GTN: ${inv.gtn || 'N/A'}). Available: ${inv.unitsInStock}`;
        window.scrollTo(0, 0);
        return;
      }
    }

    this.submitting = true;
    this.error = null;

    const payload: Partial<SalesInvoice> = {
      invoiceNumber: this.editingInvoice.invoiceNumber,
      invoiceDate: this.editingInvoice.invoiceDate,
      customerId: this.editingInvoice.customerId,
      refNumber: this.editingInvoice.refNumber,
      refDate: this.editingInvoice.refDate,
      totalQty: this.totalQty,
      subtotal: this.subtotal,
      discountAmount: this.totalDiscount,
      taxAmount: this.totalTax,
      netAmount: this.netAmount,
      items: this.editingInvoice.items as SalesInvoiceItem[],
    };

    if (this.isEditMode) {
      this.salesInvoiceService.update(this.editingInvoice.id!, payload).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/sales-invoices']);
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to update invoice';
          this.submitting = false;
          window.scrollTo(0, 0);
        },
      });
    } else {
      this.salesInvoiceService.create(payload).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/sales-invoices']);
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to create invoice';
          this.submitting = false;
          window.scrollTo(0, 0);
        },
      });
    }
  }

  previewPdf() {
    if (this.editingInvoice.id) {
      window.open(this.salesInvoiceService.getPdfUrl(this.editingInvoice.id), '_blank');
    }
  }
}
