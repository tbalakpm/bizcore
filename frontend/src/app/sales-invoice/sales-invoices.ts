import { DatePipe, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SalesInvoice, SalesInvoiceService } from './sales-invoice-service';
import { pagination } from '../models/pagination';
import { Customer, CustomerService } from '../customer/customer-service';
import { NgSelectModule } from '@ng-select/ng-select';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-sales-invoices',
  imports: [ReactiveFormsModule, FormsModule, DatePipe, CurrencyPipe, RouterLink, NgSelectModule, LucideAngularModule],
  templateUrl: './sales-invoices.html',
})
export class SalesInvoices implements OnInit {
  private service = inject(SalesInvoiceService);
  private customerService = inject(CustomerService);
  private router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);

  invoices = signal<SalesInvoice[]>([]);
  customers = signal<Customer[]>([]);
  pagination = signal<pagination>({ limit: 10, offset: 0, total: 0, page: 1, totalPages: 1 });

  filterForm: FormGroup;
  private filterSubject = new Subject<void>();

  sortColumn = signal<string>('id');
  sortDirection = signal<'asc' | 'desc'>('desc');
  pageLimit = 10;

  constructor() {
    this.filterForm = this.fb.group({
      invoiceNumber: [''],
      invoiceDate: [''],
      customerId: [null],
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
    const sort = `${this.sortColumn()}:${this.sortDirection()}`;

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
        },
        error: (err) => {
          console.error('Failed to load sales invoices', err);
        },
      });
  }

  onSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.loadInvoices(1);
  }

  onPageChange(page: number) {
    this.loadInvoices(page);
  }

  onPageLimitChange() {
    this.pagination.update(p => ({ ...p, limit: this.pageLimit }));
    this.loadInvoices(1);
  }

  onClearFilters() {
    this.filterForm.reset();
    this.loadInvoices(1);
  }

  deleteInvoice(id: number) {
    if (confirm('Are you sure you want to delete this sales invoice? This will restore the exported inventory.')) {
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
