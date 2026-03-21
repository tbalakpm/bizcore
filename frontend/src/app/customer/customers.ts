import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { type Customer, type Address, CustomerList, CustomerService } from './customer-service';
import { AddressForm } from '../shared/components/address-form';
import { PermissionService } from '../auth/permission.service';
import { GstService } from '../shared/services/gst.service';
import { PricingCategoryService, PricingCategory } from '../settings/pricing-category-service';


import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';


@Component({
  selector: 'app-customers',
  imports: [
    FormsModule, ReactiveFormsModule, TranslatePipe, CommonModule, AddressForm,
    NzTableModule, NzFormModule, NzInputModule, NzSelectModule, NzButtonModule,
    NzIconModule, NzSwitchModule, NzPopconfirmModule, NzAlertModule, NzTooltipModule,
    NzCheckboxModule, NzCardModule, NzDropDownModule, NzModalModule,
  ],

  templateUrl: './customers.html',
})
export class Customers implements OnInit {
  private customerService = inject(CustomerService);
  private gstService = inject(GstService);
  private modalService = inject(NzModalService);
  private pricingCategoryService = inject(PricingCategoryService);
  permissionService = inject(PermissionService);

  pricingCategories = signal<PricingCategory[]>([]);



  customers = signal<Customer[]>([]);
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  sort: string | null = null;
  filterValues: Record<string, string> = {
    code: '',
    name: '',
    gstin: '',
    type: '',
  };
  filterVisible: Record<string, boolean> = {
    code: false,
    name: false,
    gstin: false,
    type: false,
  };

  editingCustomer: Partial<Customer> = {
    id: undefined,
    code: '',
    name: '',
    type: 'retail',
    gstin: '',
    pricingCategoryId: undefined,
    billingAddress: {},
    shippingAddress: {},
    notes: '',
    isActive: true,
  };

  sameAsBilling = false;

  captchaData: { captcha: string; sessionId: string } | null = null;
  captchaValue = '';
  captchaVisible = false;

  loading = false;

  error: string | null = null;

  ngOnInit(): void {
    this.loadCustomers();
    this.loadPricingCategories();
  }

  loadPricingCategories() {
    this.pricingCategoryService.getAll({ isActive: true }).subscribe({
      next: (res) => this.pricingCategories.set(res.data),
      error: () => {},
    });
  }

  loadCustomers() {
    this.loading = true;
    this.customerService
      .getAll({
        page: this.pageIndex,
        limit: this.pageSize,
        sort: this.sort || undefined,
        ...this.filterValues,
      })
      .subscribe({
        next: (res: CustomerList) => {
          this.customers.set(res.data);
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to load customers';
          this.loading = false;
        },
      });
  }

  onQueryParamsChange(params: any): void {
    const { pageSize, pageIndex, sort } = params;
    this.pageSize = pageSize;
    this.pageIndex = pageIndex;

    const currentSort = sort.find((item: any) => item.value !== null);
    const sortField = (currentSort && currentSort.key) || null;
    const sortOrder = (currentSort && currentSort.value) || null;

    if (sortField && sortOrder) {
      this.sort = `${sortField}:${sortOrder === 'descend' ? 'desc' : 'asc'}`;
    } else {
      this.sort = null;
    }

    this.loadCustomers();
  }

  onFilterChange(field: string, value: string) {
    this.filterValues[field] = value;
    this.pageIndex = 1; // Reset to first page on filter change
    this.loadCustomers();
  }

  toggleActive(c: Customer) {
    this.customerService
      .update(c.id, { isActive: !c.isActive })
      .subscribe({ next: () => this.loadCustomers() });
  }

  onSubmit() {
    if (this.sameAsBilling) {
      this.editingCustomer.shippingAddress = { ...this.editingCustomer.billingAddress };
    }

    const request$ = this.editingCustomer.id
      ? this.customerService.update(this.editingCustomer.id, this.editingCustomer)
      : this.customerService.create(this.editingCustomer);

    request$.subscribe({
      next: () => {
        this.onCancel();
        this.loadCustomers();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to save customer';
      },
    });
  }

  searchGstin() {
    const gstin = this.editingCustomer.gstin;
    if (!gstin || gstin.length < 15) return;

    this.loading = true;
    this.gstService.getCaptcha().subscribe({
      next: (res) => {
        this.captchaData = res;
        this.captchaValue = '';
        this.captchaVisible = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to fetch captcha';
        this.loading = false;
      }
    });
  }

  submitCaptcha() {
    if (!this.captchaValue || !this.captchaData) return;

    this.loading = true;
    this.gstService.getGstinDetails(this.editingCustomer.gstin!, this.captchaValue, this.captchaData.sessionId).subscribe({
      next: (res) => {
        this.editingCustomer.name = res.name;
        if (res.addressLine1) {
          this.editingCustomer.billingAddress = {
            ...this.editingCustomer.billingAddress,
            addressLine1: res.addressLine1,
            addressLine2: res.addressLine2,
            city: res.city,
            state: res.state,
            postalCode: res.postalCode,
            phone: res.phone,
            mobile: res.mobile
          };
        }
        this.captchaVisible = false;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to fetch GSTIN details';
        this.loading = false;
        // Refresh captcha on error
        this.searchGstin();
      }
    });
  }



  onCancel() {
    this.editingCustomer = {
      id: undefined,
      code: '',
      name: '',
      type: 'retail',
      gstin: '',
      pricingCategoryId: undefined,
      billingAddress: {},
      shippingAddress: {},
      notes: '',
      isActive: true,
    };
    this.sameAsBilling = false;
  }

  editCustomer(id: number) {
    this.customerService.getById(id).subscribe((res: Customer) => {
      this.editingCustomer.id = res.id;
      this.editingCustomer.code = res.code;
      this.editingCustomer.name = res.name;
      this.editingCustomer.type = res.type;
      this.editingCustomer.gstin = res.gstin;
      this.editingCustomer.pricingCategoryId = res.pricingCategoryId;
      this.editingCustomer.billingAddress = res.billingAddress || {};
      this.editingCustomer.shippingAddress = res.shippingAddress || {};
      this.editingCustomer.notes = res.notes;
      this.editingCustomer.isActive = res.isActive;
      this.sameAsBilling = false;
    });
  }

  deleteCustomer(id: number) {
    this.customerService.delete(id).subscribe(() => this.loadCustomers());
  }
}
