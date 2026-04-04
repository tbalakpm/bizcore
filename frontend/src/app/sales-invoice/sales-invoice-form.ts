import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component, HostListener, inject, OnDestroy, OnInit, QueryList, signal, ViewChildren } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AddressForm } from '../shared/components/address-form';
import { TranslatePipe } from '@ngx-translate/core';

import { type Product, ProductService } from '../product/product-service';
import { type Customer, CustomerService } from '../customer/customer-service';
import { type SalesInvoiceItem, SalesInvoiceService, SalesInvoice } from './sales-invoice-service';
import { type Inventory, InventoryService } from '../inventory/inventory-service';
import { PricingCategoryService, ProductMargin } from '../settings/pricing-categories/pricing-category-service';
import { SettingsService } from '../settings/settings.service';
import { TaxRuleService, TaxRule } from '../settings/tax/tax-rule-service';

import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule, NzInputNumberComponent } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTagModule } from 'ng-zorro-antd/tag';

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
  sgstAmount?: number;
  cgstAmount?: number;
  igstAmount?: number;
  lineTotal: number;

  // Track original state for stock validation
  originalQty?: number;
  originalInventoryId?: number;
  unitsInStock?: number;
};

type EditableSalesInvoice = {
  id?: number;
  invoiceNumber: string;
  invoiceDate: string;
  type?: string;
  customerId?: number;
  refNumber?: string;
  refDate?: string;
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  signedQrCode?: string;
  roundOff?: number;
  discountType?: string;
  discountPct?: number;
  discountAmount?: number;
  isTaxInclusive?: boolean | null;
  items: EditableSalesInvoiceItem[];
};

@Component({
  selector: 'app-sales-invoice-form',
  imports: [
    DatePipe, DecimalPipe, TitleCasePipe, FormsModule, RouterLink, AddressForm, TranslatePipe,
    NzSelectModule, NzFormModule, NzInputModule, NzDatePickerModule,
    NzInputNumberModule, NzButtonModule, NzIconModule, NzTableModule,
    NzAlertModule, NzTooltipModule, NzCardModule, NzCollapseModule,
    NzCheckboxModule, NzTagModule,
  ],
  templateUrl: './sales-invoice-form.html',
})
export class SalesInvoiceForm implements OnInit {
  private salesInvoiceService = inject(SalesInvoiceService);
  private productService = inject(ProductService);
  private customerService = inject(CustomerService);
  private inventoryService = inject(InventoryService);
  private pricingCategoryService = inject(PricingCategoryService);
  private settingsService = inject(SettingsService);
  private taxRuleService = inject(TaxRuleService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  @ViewChildren('itemRowSelect') itemRowSelects!: QueryList<NzSelectComponent>;
  @ViewChildren('unitPriceInput') unitPriceInputs!: QueryList<NzInputNumberComponent>;

  products = signal<Product[]>([]);
  customers = signal<Customer[]>([]);
  inventories = signal<Inventory[]>([]);
  originalInventories = signal<Inventory[]>([]);
  taxRules = signal<TaxRule[]>([]);

  // Pricing category for selected customer
  selectedPricingCategoryName: string | null = null;
  pricingCategoryMargins: ProductMargin[] = [];

  // Inventory Search & Lazy Loading
  inventoryInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  inventoryLoading = false;
  inventorySearchQuery = '';
  inventoryOffset = 0;
  inventoryLimit = 50;
  inventoryTotal = 0;

  companyGstin: string = '';
  companyState: string = '';

  editingInvoice: EditableSalesInvoice = this.defaultInvoice();

  // Date bindings for nz-date-picker
  invoiceDateValue: Date | null = null;
  refDateValue: Date | null = null;

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
    const sum = this.editingInvoice.items.reduce((acc, item) => acc + (Number(item.lineTotal) || 0), 0);
    return sum + (Number(this.editingInvoice.roundOff) || 0);
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCustomers();
    this.loadInventories();
    this.loadTaxRules();
    this.setupInventorySearch();

    this.settingsService.getSetting('company_gstin').subscribe({
      next: (setting) => {
        this.companyGstin = setting.value || '';
        this.recalculateAllTaxes();
      },
      error: () => { }
    });

    this.settingsService.getSetting('company_state').subscribe({
      next: (setting) => {
        this.companyState = setting.value || '';
        this.recalculateAllTaxes();
      },
      error: () => { }
    });

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  defaultInvoice(): EditableSalesInvoice {
    return {
      id: undefined,
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      type: 'invoice',
      roundOff: 0,
      discountType: 'none',
      discountPct: 0,
      discountAmount: 0,
      isTaxInclusive: null,
      items: [{ qty: 1, unitPrice: 0, discountType: 'none', discountPct: 0, discountAmount: 0, taxPct: 0, taxAmount: 0, lineTotal: 0 }],
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

  loadTaxRules() {
    this.taxRuleService.getAll().subscribe({
      next: (res) => this.taxRules.set(res.data),
      error: () => { }
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

  onInventorySearch(term: string) {
    this.inventoryInput$.next(term);
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
          type: invoice.type || 'invoice',
          customerId: invoice.customerId,
          refNumber: invoice.refNumber,
          refDate: invoice.refDate,
          irn: invoice.irn,
          ackNo: invoice.ackNo,
          ackDate: invoice.ackDate,
          signedQrCode: invoice.signedQrCode,
          roundOff: Number(invoice.roundOff || 0),
          discountType: invoice.discountType || 'none',
          discountPct: Number(invoice.discountPct || 0),
          discountAmount: Number(invoice.discountAmount || 0),
          isTaxInclusive: invoice.isTaxInclusive,
          items: (invoice.items || []).map((item) => ({
            id: item.id,
            inventoryId: item.inventoryId,
            productId: item.productId,
            gtn: item.gtn,
            qty: Number(item.qty || 0),
            unitPrice: Number(item.unitPrice || 0),
            discountType: item.discountType,
            discountPct: Number(item.discountPct || 0),
            discountAmount: Math.round(Number(item.discountAmount || 0)),
            taxPct: Number(item.taxPct || 0),
            taxAmount: Number(item.taxAmount || 0),
            lineTotal: Number(item.lineTotal || 0),
            originalQty: Number(item.qty || 0),
            originalInventoryId: item.inventoryId,
            unitsInStock: Number(item.unitsInStock || 0),
          })),
        };

        // Sync date pickers
        this.invoiceDateValue = invoice.invoiceDate
          ? new Date(invoice.invoiceDate + 'T00:00:00')
          : null;
        this.refDateValue = invoice.refDate
          ? new Date(invoice.refDate + 'T00:00:00')
          : null;

        // Track original inventories to keep them in dropdown even if 0 stock
        const loadedOriginalInvs: Inventory[] = (invoice.items || []).map(item => ({
          id: item.inventoryId!,
          productId: item.productId!,
          gtn: item.gtn,
          unitsInStock: Number(item.unitsInStock || 0),
          code: item.productCode,
          name: item.productName
        }));
        this.originalInventories.set(loadedOriginalInvs);

        this.loading = false;

        // Load pricing category for the selected customer
        if (invoice.customerId) {
          this.onCustomerChange(invoice.customerId);
        } else {
          this.recalculateAllTaxes();
        }
      },
      error: () => {
        this.error = 'Failed to load invoice';
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

  onInventorySelect(item: EditableSalesInvoiceItem, skipFocus: boolean = false) {
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
        // Base price: use inventory's sellingPrice or product unitPrice
        let basePrice = inventory.sellingPrice !== undefined && inventory.sellingPrice !== null
          ? Number(inventory.sellingPrice)
          : Number(product.unitPrice || 0);

        // Apply pricing category margin if configured
        const margin = this.pricingCategoryMargins.find(m => m.productId === product.id);
        if (margin && margin.marginType !== 'none') {
          if (margin.marginType === 'percent') {
            const costBasis = Number(inventory.buyingPrice || 0);
            basePrice = costBasis + costBasis * (Number(margin.marginPct) / 100);
          } else if (margin.marginType === 'amount') {
            const costBasis = Number(inventory.buyingPrice || 0);
            basePrice = costBasis + Number(margin.marginAmount);
          } else if (margin.marginType === 'selling_price') {
            basePrice = Number(margin.marginAmount);
          }
          basePrice = Math.round(basePrice);
        }

        item.taxPct = this.editingInvoice.type === 'estimate' ? 0 : this.getEffectiveTaxRate(product, basePrice);

        // Determine tax inclusive mode: Invoice override > Product setting
        const isTaxInclusive = this.editingInvoice.isTaxInclusive !== null && this.editingInvoice.isTaxInclusive !== undefined
          ? this.editingInvoice.isTaxInclusive
          : !!product.isTaxInclusive;

        if (isTaxInclusive && item.taxPct > 0) {
          basePrice = basePrice / (1 + (item.taxPct / 100));
          basePrice = Math.round(basePrice);
        }

        item.unitPrice = basePrice;
      }
      item.unitsInStock = inventory.unitsInStock;
      this.calculateLineTotal(item);

      if (skipFocus) return;

      // Barcode scan flow: if price non-zero, next row; if zero price, focus price.
      const index = this.editingInvoice.items.indexOf(item);
      if (item.unitPrice > 0) {
        if (index === this.editingInvoice.items.length - 1) {
          this.addItemRow();
        } else {
          // Focus the GTN field of the next row
          setTimeout(() => {
            const nextSelect = this.itemRowSelects.toArray()[index + 1];
            if (nextSelect) {
              nextSelect.focus();
            }
          });
        }
      } else {
        // Zero price: focus the unit price input of the current row
        setTimeout(() => {
          const currentPriceInput = this.unitPriceInputs.toArray()[index];
          if (currentPriceInput) {
            currentPriceInput.focus();
          }
        });
      }
    }
  }

  onCustomerChange(customerId: number | undefined) {
    this.editingInvoice.customerId = customerId;
    this.selectedPricingCategoryName = null;
    this.pricingCategoryMargins = [];

    if (!customerId) {
      this.recalculateAllPrices();
      return;
    }

    const customer = this.customers().find(c => c.id === customerId);
    if (customer?.pricingCategoryId) {
      this.selectedPricingCategoryName = customer.pricingCategoryName || null;
      this.pricingCategoryService.getProducts(customer.pricingCategoryId).subscribe({
        next: (margins) => {
          this.pricingCategoryMargins = margins;
          this.recalculateAllPrices();
        },
        error: () => {
          this.recalculateAllPrices();
        },
      });
    } else {
      this.recalculateAllPrices();
    }
  }

  recalculateAllPrices() {
    this.editingInvoice.items.forEach(item => {
      if (item.inventoryId) {
        this.onInventorySelect(item, true);
      } else {
        this.calculateLineTotal(item);
      }
    });
  }

  recalculateAllTaxes() {
    this.recalculateAllPrices();
  }

  onTaxModeChange(mode: boolean | null) {
    this.editingInvoice.isTaxInclusive = mode;
    this.recalculateAllPrices();
  }

  onTypeChange(type: string) {
    this.editingInvoice.type = type;
    for (const item of this.editingInvoice.items) {
      if (type === 'estimate') {
        item.taxPct = 0;
        item.taxAmount = 0;
      } else {
        // Require refetching tax from products
        if (item.productId) {
          const product = this.products().find(p => p.id === item.productId);
          if (product) {
            item.taxPct = Number(product.taxRate || 0);
          }
        }
      }
      this.calculateLineTotal(item);
    }
  }

  onGlobalDiscountChange() {
    const type = this.editingInvoice.discountType || 'none';
    const pct = this.editingInvoice.discountPct || 0;
    const amt = this.editingInvoice.discountAmount || 0;

    for (const item of this.editingInvoice.items) {
      item.discountType = type;
      item.discountPct = pct;
      item.discountAmount = amt;
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
      discountAmt = Math.round(grossTotal * (Number(item.discountPct) / 100));
    } else if (item.discountType === 'amount' && item.discountAmount) {
      discountAmt = Math.round(Number(item.discountAmount));
    }
    item.discountAmount = discountAmt;

    const afterDiscount = grossTotal - discountAmt;

    // Apply tax components and round them individually
    const customer = this.customers().find(c => c.id === this.editingInvoice.customerId);
    const customerGstin = customer?.gstin || '';
    const customerState = customer?.billingAddress?.state || '';

    let isInterState = false;
    if (this.companyGstin && customerGstin) {
      isInterState = this.companyGstin.substring(0, 2) !== customerGstin.substring(0, 2);
    } else if (this.companyState && customerState) {
      isInterState = this.companyState.toLowerCase() !== customerState.toLowerCase();
    } else {
      // Default to intra-state if information is missing
      isInterState = false;
    }

    const taxPct = Number(item.taxPct || 0);

    if (isInterState) {
      item.igstAmount = Math.round(afterDiscount * (taxPct / 100));
      item.cgstAmount = 0;
      item.sgstAmount = 0;
    } else {
      item.igstAmount = 0;
      const componentRate = taxPct / 2;
      item.cgstAmount = Math.round(afterDiscount * (componentRate / 100));
      item.sgstAmount = Math.round(afterDiscount * (componentRate / 100));
    }

    // and update total tax Amount of the row
    item.taxAmount = (item.igstAmount || 0) + (item.cgstAmount || 0) + (item.sgstAmount || 0);

    item.lineTotal = Number((afterDiscount + item.taxAmount).toFixed(2));
  }

  getEffectiveTaxRate(product: Product, unitPrice: number): number {
    const hsn = product.hsnSac || '';
    const rules = this.taxRules();

    // Find matching rules
    const matchingRules = rules.filter(r => {
      const hsnMatch = hsn.startsWith(r.hsnCodeStartsWith || '');
      const priceMatch = unitPrice >= r.minPrice && (r.maxPrice === 0 || unitPrice <= r.maxPrice);
      return hsnMatch && priceMatch;
    });

    if (matchingRules.length > 0) {
      // Sort by HSN prefix length descending to find most specific match
      matchingRules.sort((a, b) => (b.hsnCodeStartsWith?.length || 0) - (a.hsnCodeStartsWith?.length || 0));
      return Number(matchingRules[0].taxRate);
    }

    return Number(product.taxRate || 0);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.code === 'KeyN') {
      event.preventDefault();
      this.addItemRow();
    }
  }

  addItemRow() {
    this.editingInvoice.items.push({
      qty: 1,
      unitPrice: 0,
      taxPct: 0,
      taxAmount: 0,
      discountType: this.editingInvoice.discountType || 'none',
      discountPct: this.editingInvoice.discountPct || 0,
      discountAmount: this.editingInvoice.discountAmount || 0,
      lineTotal: 0
    });
    setTimeout(() => {
      const lastSelect = this.itemRowSelects.last;
      if (lastSelect) {
        lastSelect.focus();
      }
    });
  }

  removeItem(index: number) {
    if (this.editingInvoice.items.length > 1) {
      this.editingInvoice.items.splice(index, 1);
    }
  }

  getFilteredInventories(currentItem: EditableSalesInvoiceItem): (Inventory & { disabled?: boolean })[] {
    const available = this.inventories();
    const original = this.originalInventories();

    // Merge available with original items (avoiding duplicates)
    const mergedMap = new Map<number, Inventory>();
    original.forEach(inv => mergedMap.set(inv.id, inv));
    available.forEach(inv => mergedMap.set(inv.id, inv));

    return Array.from(mergedMap.values()).map(inv => {
      const warehouseLeft = this.getInventoryEffectiveStock(inv);
      return {
        ...inv,
        disabled: warehouseLeft <= 0 && currentItem.inventoryId !== inv.id
      };
    });
  }

  // Global Warehouse Left: Pool (DB + Original) - Total Current Usage
  getInventoryEffectiveStock(inv: Inventory): number {
    let pool = Number(inv.unitsInStock || 0);

    // Add back everything this invoice originally took
    this.editingInvoice.items.forEach(item => {
      if (item.originalInventoryId === inv.id) {
        pool += (item.originalQty || 0);
      }
    });

    // Subtract what's currently in all rows
    const totalCurrentUsage = this.editingInvoice.items
      .filter(item => item.inventoryId === inv.id)
      .reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    return pool - totalCurrentUsage;
  }

  isQtyLocked(item: EditableSalesInvoiceItem): boolean {
    if (!item.productId) return false;
    const product = this.products().find(p => p.id === item.productId);
    return product ? product.gtnGeneration === 'tag' : false;
  }

  isInventoryDisabledFor(currentItem: EditableSalesInvoiceItem) {
    return (inv: Inventory) => {
      const warehouseLeft = this.getInventoryEffectiveStock(inv);
      // Disable if warehouse is empty AND it's not the one already picked in this row
      return warehouseLeft <= 0 && currentItem.inventoryId !== inv.id;
    };
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
      const unitsInStock = item.unitsInStock ?? inv?.unitsInStock ?? 0;
      const originalQty = item.originalQty || 0;
      const isSameItem = item.inventoryId === item.originalInventoryId;

      const effectiveAvailableStock = unitsInStock + (isSameItem ? originalQty : 0);

      if (Number(item.qty) > effectiveAvailableStock) {
        const itemName = inv?.name || item.gtn || 'Selected product';
        this.error = `Insufficient stock for item: ${itemName}. Available: ${effectiveAvailableStock}`;
        window.scrollTo(0, 0);
        return;
      }
    }

    this.submitting = true;
    this.error = null;

    const payload: Partial<SalesInvoice> = {
      invoiceNumber: this.editingInvoice.invoiceNumber,
      invoiceDate: this.editingInvoice.invoiceDate,
      type: this.editingInvoice.type,
      customerId: this.editingInvoice.customerId,
      refNumber: this.editingInvoice.refNumber,
      refDate: this.editingInvoice.refDate,
      totalQty: this.totalQty,
      subtotal: this.subtotal,
      discountType: this.editingInvoice.discountType,
      discountPct: this.editingInvoice.discountPct,
      discountAmount: this.totalDiscount,
      totalTaxAmount: this.totalTax,
      roundOff: this.editingInvoice.roundOff,
      netAmount: this.netAmount,
      isTaxInclusive: this.editingInvoice.isTaxInclusive,
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
