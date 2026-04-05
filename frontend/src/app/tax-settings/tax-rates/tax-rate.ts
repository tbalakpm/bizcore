import { Component, inject, OnInit, signal } from '@angular/core';
import { PermissionService } from '../../auth/permission.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { FormsModule } from '@angular/forms';
import { TaxRateService } from './tax-rate-service';
import { TaxRate } from '../tax.model';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tax-rate',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzFormModule, NzInputNumberModule, NzTableModule,
    NzTagModule, NzDatePickerModule, NzInputModule, NzCheckboxModule,
    NzIconModule, NzButtonModule, NzPopconfirmModule, NzAlertModule
  ],
  templateUrl: './tax-rate.html'
})
export class TaxRateComponent implements OnInit {
  permissionService = inject(PermissionService);
  taxRateService = inject(TaxRateService);

  taxRates = signal<TaxRate[]>([]);

  error: string | null = null;

  // Tax Rate Form
  loadingRates = false;
  editingRate: TaxRate | null = null;
  rateForm: Partial<TaxRate> = this.defaultRateForm();

  ngOnInit() {
    this.loadTaxRates();
  }

  loadTaxRates() {
    this.loadingRates = true;
    this.taxRateService.getAll().subscribe({
      next: (res) => {
        this.taxRates.set(res.data);
        this.loadingRates = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load tax rates';
        this.loadingRates = false;
      },
    });
  }

  defaultRateForm(): Partial<TaxRate> {
    return {
      code: '',
      rate: 0,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      cessRate: 0,
      cessAmount: 0,
      isExempt: false,
      isNilRated: false,
      reverseCharge: false,
      effectiveFrom: new Date().toISOString().split('T')[0]
    };
  }

  addRate() {
    this.taxRateService.create(this.rateForm).subscribe({
      next: () => {
        this.rateForm = this.defaultRateForm();
        this.loadTaxRates();
        this.error = null;
      },
      error: (err) => { this.error = err.error?.error || 'Failed to add tax rate'; },
    });
  }

  startEditRate(rate: TaxRate) {
    this.editingRate = { ...rate };
    this.rateForm = { ...rate };
  }

  saveEditRate() {
    if (!this.editingRate) return;
    this.taxRateService.update(this.editingRate.id, this.rateForm).subscribe({
      next: () => {
        this.editingRate = null;
        this.rateForm = this.defaultRateForm();
        this.loadTaxRates();
        this.error = null;
      },
      error: (err) => { this.error = err.error?.error || 'Failed to update tax rate'; },
    });
  }

  cancelEditRate() {
    this.editingRate = null;
    this.rateForm = this.defaultRateForm();
  }

  deleteRate(rate: TaxRate) {
    this.taxRateService.delete(rate.id).subscribe({
      next: () => this.loadTaxRates(),
      error: (err) => { this.error = err.error?.error || 'Failed to delete tax rate'; },
    });
  }

  onRateValueChange(val: number) {
    this.rateForm.cgstRate = val / 2;
    this.rateForm.sgstRate = val / 2;
    this.rateForm.igstRate = val;
  }
}
