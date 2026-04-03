import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { type Supplier, type Address, SupplierList, SupplierService, type SupplierBank } from './supplier-service';
import { AddressForm } from '../shared/components/address-form';
import { PermissionService } from '../auth/permission.service';
import { GstService } from '../shared/services/gst.service';


import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { HasPermissionDirective } from '../shared/directives/has-permission.directive';


@Component({
  selector: 'app-suppliers',
  imports: [
    FormsModule, TranslatePipe, AddressForm,
    NzTableModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule,
    NzSwitchModule, NzPopconfirmModule, NzAlertModule, NzTooltipModule,
    NzCheckboxModule, NzCardModule, NzDropDownModule, NzModalModule, NzSelectModule, HasPermissionDirective,
  ],
  templateUrl: './suppliers.html',
})
export class Suppliers implements OnInit {
  private supplierService = inject(SupplierService);
  private gstService = inject(GstService);
  private modalService = inject(NzModalService);
  permissionService = inject(PermissionService);



  suppliers = signal<Supplier[]>([]);
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  sort: string | null = null;
  filterValues: Record<string, string> = {
    code: '',
    name: '',
    type: '',
    gstin: '',
  };
  filterVisible: Record<string, boolean> = {
    code: false,
    name: false,
    type: false,
    gstin: false,
  };

  editingSupplier: Partial<Supplier> = {
    id: undefined,
    code: '',
    name: '',
    type: 'supplier',
    gstin: '',
    billingAddress: {},
    shippingAddress: {},
    notes: '',
    isActive: true,
    bankAccounts: [],
  };

  sameAsBilling = false;

  captchaData: { captcha: string; sessionId: string } | null = null;
  captchaValue = '';
  captchaVisible = false;

  loading = false;

  error: string | null = null;

  ngOnInit(): void {
  }

  loadSuppliers() {
    this.loading = true;
    this.supplierService
      .getAll({
        page: this.pageIndex,
        limit: this.pageSize,
        sort: this.sort || undefined,
        ...this.filterValues,
      })
      .subscribe({
        next: (res: SupplierList) => {
          this.suppliers.set(res.data);
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to load suppliers';
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

    this.loadSuppliers();
  }

  onFilterChange(field: string, value: string) {
    this.filterValues[field] = value;
    this.pageIndex = 1; // Reset to first page on filter change
    this.loadSuppliers();
  }

  toggleActive(s: Supplier) {
    this.supplierService
      .update(s.id, { isActive: !s.isActive })
      .subscribe({ next: () => this.loadSuppliers() });
  }

  onSubmit() {
    if (this.sameAsBilling) {
      this.editingSupplier.shippingAddress = { ...this.editingSupplier.billingAddress };
    }

    const request$ = this.editingSupplier.id
      ? this.supplierService.update(this.editingSupplier.id, this.editingSupplier)
      : this.supplierService.create(this.editingSupplier);

    request$.subscribe({
      next: () => {
        this.onCancel();
        this.loadSuppliers();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to save supplier';
      },
    });
  }

  searchGstin() {
    const gstin = this.editingSupplier.gstin;
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
    this.gstService.getGstinDetails(this.editingSupplier.gstin!, this.captchaValue, this.captchaData.sessionId).subscribe({
      next: (res) => {
        this.editingSupplier.name = res.name;
        if (res.addressLine1) {
          this.editingSupplier.billingAddress = {
            ...this.editingSupplier.billingAddress,
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



  addBankAccount() {
    if (!this.editingSupplier.bankAccounts) {
      this.editingSupplier.bankAccounts = [];
    }
    this.editingSupplier.bankAccounts.push({
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
      isPrimary: this.editingSupplier.bankAccounts.length === 0,
    });
  }

  removeBankAccount(index: number) {
    this.editingSupplier.bankAccounts?.splice(index, 1);
  }

  setPrimaryBank(index: number) {
    this.editingSupplier.bankAccounts?.forEach((b, i) => {
      b.isPrimary = i === index;
    });
  }

  onCancel() {
    this.editingSupplier = {
      id: undefined,
      code: '',
      name: '',
      type: 'supplier',
      gstin: '',
      billingAddress: {},
      shippingAddress: {},
      notes: '',
      isActive: true,
      bankAccounts: [],
    };
    this.sameAsBilling = false;
  }

  editSupplier(id: number) {
    this.supplierService.getById(id).subscribe((res: Supplier) => {
      this.editingSupplier.id = res.id;
      this.editingSupplier.code = res.code;
      this.editingSupplier.name = res.name;
      this.editingSupplier.type = res.type || 'supplier';
      this.editingSupplier.gstin = res.gstin;
      this.editingSupplier.billingAddress = res.billingAddress || {};
      this.editingSupplier.shippingAddress = res.shippingAddress || {};
      this.editingSupplier.notes = res.notes;
      this.editingSupplier.isActive = res.isActive;
      this.editingSupplier.bankAccounts = res.bankAccounts || [];
      this.sameAsBilling = false;
    });
  }

  deleteSupplier(id: number) {
    this.supplierService.delete(id).subscribe(() => this.loadSuppliers());
  }
}
