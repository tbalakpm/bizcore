import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

import { type Product, ProductService } from '../product/product-service';
import { type Customer, CustomerService } from '../customer/customer-service';
import { type SalesInvoiceItem, SalesInvoiceService, SalesInvoice } from './sales-invoice-service';

type EditableSalesInvoiceItem = {
  id?: number;
  productId?: number;
  qty: number;
  unitPrice: number;
  discountBy?: string;
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
  imports: [CommonModule, FormsModule, RouterLink, NgSelectModule],
  templateUrl: './sales-invoice-form.html',
})
export class SalesInvoiceForm implements OnInit {
  private salesInvoiceService = inject(SalesInvoiceService);
  private productService = inject(ProductService);
  private customerService = inject(CustomerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  products = signal<Product[]>([]);
  customers = signal<Customer[]>([]);

  editingInvoice: EditableSalesInvoice = this.defaultInvoice();
  
  // Inline Customer Creation
  showNewCustomerForm = false;
  newCustomer: Partial<Customer> = {
    code: '',
    name: '',
    type: 'retail',
    isActive: true,
  };

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

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isNaN(id)) {
        this.loadInvoice(id);
      }
    }
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
            productId: item.productId,
            qty: Number(item.qty || 0),
            unitPrice: Number(item.unitPrice || 0),
            discountBy: item.discountBy,
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
  
  onProductSelect(item: EditableSalesInvoiceItem) {
    if (!item.productId) {
      item.unitPrice = 0;
      item.taxPct = 0;
      this.calculateLineTotal(item);
      return;
    }

    const product = this.products().find((p) => p.id === item.productId);
    if (product) {
      item.unitPrice = Number(product.unitPrice || 0);
      item.taxPct = Number(product.taxRate || 0);
      this.calculateLineTotal(item);
    }
  }

  calculateLineTotal(item: EditableSalesInvoiceItem) {
    const qty = Number(item.qty || 0);
    let price = Number(item.unitPrice || 0);
    const grossTotal = qty * price;
    
    // Apply discount
    let discountAmt = 0;
    if (item.discountBy === 'pct' && item.discountPct) {
        discountAmt = grossTotal * (Number(item.discountPct) / 100);
    } else if (item.discountBy === 'amt' && item.discountAmount) {
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

  addItem() {
    this.editingInvoice.items.push({ qty: 1, unitPrice: 0, taxPct: 0, taxAmount: 0, discountAmount: 0, lineTotal: 0 });
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
          
          // Auto-select the newly created customer
          this.editingInvoice.customerId = createdCustomer.id;
          
          this.showNewCustomerForm = false;
          this.customerSubmitting = false;
          this.newCustomer = { code: '', name: '', type: 'retail', isActive: true };
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
      if (!item.productId || typeof item.productId !== 'number') {
        this.error = 'All items must have a valid product selected.';
        window.scrollTo(0, 0);
        return;
      }
      if (Number(item.qty) <= 0) {
        this.error = 'All items must have a quantity greater than zero.';
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
}
