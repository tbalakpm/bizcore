import { CommonModule, DatePipe, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SalesInvoice, SalesInvoiceService } from './sales-invoice-service';
import { pagination } from '../models/pagination';
import { Customer, CustomerService } from '../customer/customer-service';
import { PermissionService } from '../auth/permission.service';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-sales-invoices',
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, DatePipe, CurrencyPipe, TitleCasePipe, RouterLink,
    NzTableModule, NzSelectModule, NzInputModule, NzDatePickerModule,
    NzInputNumberModule, NzButtonModule, NzIconModule, NzTagModule,
    NzPaginationModule, NzTooltipModule, NzPopconfirmModule, NzCardModule, NzAlertModule,
  ],
  templateUrl: './sales-invoices.html',
})
export class SalesInvoices implements OnInit {
  private service = inject(SalesInvoiceService);
  private customerService = inject(CustomerService);
  private router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  permissionService = inject(PermissionService);

  invoices = signal<SalesInvoice[]>([]);
  customers = signal<Customer[]>([]);
  pagination = signal<pagination>({ limit: 10, offset: 0, total: 0, page: 1, totalPages: 1 });

  filterForm: FormGroup;
  private filterSubject = new Subject<void>();

  sortValue = signal<string>('id:desc');
  pageLimit = 10;
  loading = false;

  // For nz-date-picker binding
  filterInvoiceDate: Date | null = null;

  constructor() {
    this.filterForm = this.fb.group({
      invoiceNumber: [''],
      invoiceDate: [''],
      customerId: [null],
      type: [null],
      minAmount: [''],
      maxAmount: [''],
    });

    this.filterSubject.pipe(debounceTime(400)).subscribe(() => {
      this.loadInvoices(1);
    });

    this.filterForm.valueChanges.subscribe(() => {
      this.filterSubject.next();
    });
  }

  ngOnInit() {
    this.loadInvoices();
    this.loadCustomers();
  }

  loadCustomers() {
    this.customerService.getAll().subscribe({
      next: (res) => this.customers.set(res.data),
      error: (err) => console.error('Failed to load customers', err),
    });
  }

  loadInvoices(page: number = 1) {
    const filters = this.filterForm.value;
    const sort = this.sortValue();
    this.loading = true;

    this.service
      .getAll({
        page,
        limit: this.pagination().limit,
        ...filters,
        sort,
      })
      .subscribe({
        next: (res) => {
          this.invoices.set(res.data);
          this.pagination.set(res.pagination);
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load sales invoices', err);
          this.loading = false;
        },
      });
  }

  onSortChange(value: string) {
    this.sortValue.set(value);
    this.loadInvoices(1);
  }

  onPageChange(page: number) {
    this.loadInvoices(page);
  }

  onPageLimitChange() {
    this.pagination.update(p => ({ ...p, limit: this.pageLimit }));
    this.loadInvoices(1);
  }

  applyFilters() {
    this.loadInvoices(1);
  }

  get hasFilters(): boolean {
    const v = this.filterForm.value;
    return !!(v.invoiceNumber || v.invoiceDate || v.customerId || v.minAmount || v.maxAmount || v.type);
  }

  onClearFilters() {
    this.filterForm.reset();
    this.filterInvoiceDate = null;
    this.loadInvoices(1);
  }

  onInvoiceDateChange(date: Date | null) {
    this.filterInvoiceDate = date;
    if (date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      this.filterForm.patchValue({ invoiceDate: `${yyyy}-${mm}-${dd}` });
    } else {
      this.filterForm.patchValue({ invoiceDate: '' });
    }
  }

  deleteInvoice(id: number) {
    this.service.delete(id).subscribe({
      next: () => {
        this.loadInvoices(this.pagination().page);
      },
      error: (err) => {
        console.error('Failed to delete sales invoice', err);
        alert('Failed to delete sales invoice.');
      },
    });
  }

  printInvoice(id: number) {
    const url = this.service.getPdfUrl(id);
    window.open(url, '_blank');
  }

  generateIrn(id: number) {
    if (confirm('Are you sure you want to generate an IRN for this invoice? It will become locked for editing.')) {
      this.service.generateIrn(id).subscribe({
        next: () => {
          this.loadInvoices(this.pagination().page);
        },
        error: (err) => {
          console.error('Failed to generate IRN', err);
          alert('Failed to generate IRN.');
        },
      });
    }
  }
}
