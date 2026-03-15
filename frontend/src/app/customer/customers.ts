import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { type Customer, type Address, CustomerList, CustomerService } from './customer-service';
import { AddressForm } from '../shared/components/address-form';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-customers',
  imports: [FormsModule, ReactiveFormsModule, TranslatePipe, CommonModule, AddressForm, LucideAngularModule],
  templateUrl: './customers.html',
})
export class Customers implements OnInit {
  private customerService = inject(CustomerService);

  customers = signal<Customer[]>([]);

  editingCustomer: Partial<Customer> = {
    id: undefined,
    code: '',
    name: '',
    type: 'retail',
    gstin: '',
    billingAddress: {},
    shippingAddress: {},
    notes: '',
    isActive: true,
  };

  sameAsBilling = false;

  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;
    this.customerService.getAll().subscribe({
      next: (res: CustomerList) => {
        this.customers.set(res.data);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load customers';
        this.loading = false;
      },
    });
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

  onCancel() {
    this.editingCustomer = {
      id: undefined,
      code: '',
      name: '',
      type: 'retail',
      gstin: '',
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
      this.editingCustomer.billingAddress = res.billingAddress || {};
      this.editingCustomer.shippingAddress = res.shippingAddress || {};
      this.editingCustomer.notes = res.notes;
      this.editingCustomer.isActive = res.isActive;
      this.sameAsBilling = false;
    });
  }

  deleteCustomer(id: number) {
    if (!confirm('Delete this customer?')) return;
    this.customerService.delete(id).subscribe(() => this.loadCustomers());
  }
}
