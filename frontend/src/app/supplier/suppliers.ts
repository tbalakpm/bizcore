import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { type Supplier, type Address, SupplierList, SupplierService } from './supplier-service';
import { AddressForm } from '../shared/components/address-form';
import { LucideAngularModule } from 'lucide-angular';
import { PermissionService } from '../auth/permission.service';
import { TooltipDirective } from '../shared/directives/tooltip.directive';

@Component({
  selector: 'app-suppliers',
  imports: [FormsModule, ReactiveFormsModule, TranslatePipe, CommonModule, AddressForm, LucideAngularModule, TooltipDirective],
  templateUrl: './suppliers.html',
})
export class Suppliers implements OnInit {
  private supplierService = inject(SupplierService);
  permissionService = inject(PermissionService);

  suppliers = signal<Supplier[]>([]);

  editingSupplier: Partial<Supplier> = {
    id: undefined,
    code: '',
    name: '',
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
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading = true;
    this.supplierService.getAll().subscribe({
      next: (res: SupplierList) => {
        this.suppliers.set(res.data);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load suppliers';
        this.loading = false;
      },
    });
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

  onCancel() {
    this.editingSupplier = {
      id: undefined,
      code: '',
      name: '',
      gstin: '',
      billingAddress: {},
      shippingAddress: {},
      notes: '',
      isActive: true,
    };
    this.sameAsBilling = false;
  }

  editSupplier(id: number) {
    this.supplierService.getById(id).subscribe((res: Supplier) => {
      this.editingSupplier.id = res.id;
      this.editingSupplier.code = res.code;
      this.editingSupplier.name = res.name;
      this.editingSupplier.gstin = res.gstin;
      this.editingSupplier.billingAddress = res.billingAddress || {};
      this.editingSupplier.shippingAddress = res.shippingAddress || {};
      this.editingSupplier.notes = res.notes;
      this.editingSupplier.isActive = res.isActive;
      this.sameAsBilling = false;
    });
  }

  deleteSupplier(id: number) {
    if (!confirm('Delete this supplier?')) return;
    this.supplierService.delete(id).subscribe(() => this.loadSuppliers());
  }
}
