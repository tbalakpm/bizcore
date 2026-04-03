import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { PermissionService } from '../../auth/permission.service';

import { TaxRateService, TaxRate } from './tax-rate-service';
import { TaxRuleService, TaxRule } from './tax-rule-service';
import { StateService, State } from './state-service';

@Component({
  selector: 'app-tax-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule,
    NzSwitchModule, NzPopconfirmModule, NzAlertModule, NzTooltipModule,
    NzCardModule, NzSelectModule, NzTagModule, NzInputNumberModule,
    NzTabsModule, NzDatePickerModule, NzCheckboxModule,
  ],
  templateUrl: './tax-settings.html',
})
export class TaxSettings implements OnInit {
  private taxRateService = inject(TaxRateService);
  private taxRuleService = inject(TaxRuleService);
  private stateService = inject(StateService);
  public permissionService = inject(PermissionService);

  taxRates = signal<TaxRate[]>([]);
  taxRules = signal<TaxRule[]>([]);
  states = signal<State[]>([]);

  loadingRates = false;
  loadingRules = false;
  loadingStates = false;
  error: string | null = null;

  // Tax Rate Form
  editingRate: TaxRate | null = null;
  rateForm: Partial<TaxRate> = this.defaultRateForm();

  // Tax Rule Form
  editingRule: TaxRule | null = null;
  ruleForm: Partial<TaxRule> = this.defaultRuleForm();

  // State Form
  editingState: State | null = null;
  stateForm: Partial<State> = this.defaultStateForm();

  ngOnInit(): void {
    this.loadTaxRates();
    this.loadTaxRules();
    this.loadStates();
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

  loadTaxRules() {
    this.loadingRules = true;
    this.taxRuleService.getAll().subscribe({
      next: (res) => {
        this.taxRules.set(res.data);
        this.loadingRules = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load tax rules';
        this.loadingRules = false;
      },
    });
  }

  defaultRateForm(): Partial<TaxRate> {
    return {
      rate: 0,
      cgst_rate: 0,
      sgst_rate: 0,
      igst_rate: 0,
      cess_rate: 0,
      cess_amount: 0,
      effective_from: new Date().toISOString().split('T')[0]
    };
  }

  defaultRuleForm(): Partial<TaxRule> {
    return {
      hsnCodeStartsWith: '',
      minPrice: 0,
      maxPrice: 0,
      tax_rate: 0,
      effective_from: new Date().toISOString().split('T')[0]
    };
  }

  // --- Tax Rate Actions ---

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

  // --- Tax Rule Actions ---

  addRule() {
    this.taxRuleService.create(this.ruleForm).subscribe({
      next: () => {
        this.ruleForm = this.defaultRuleForm();
        this.loadTaxRules();
        this.error = null;
      },
      error: (err) => { this.error = err.error?.error || 'Failed to add tax rule'; },
    });
  }

  startEditRule(rule: TaxRule) {
    this.editingRule = { ...rule };
    this.ruleForm = { ...rule };
  }

  saveEditRule() {
    if (!this.editingRule) return;
    this.taxRuleService.update(this.editingRule.id, this.ruleForm).subscribe({
      next: () => {
        this.editingRule = null;
        this.ruleForm = this.defaultRuleForm();
        this.loadTaxRules();
        this.error = null;
      },
      error: (err) => { this.error = err.error?.error || 'Failed to update tax rule'; },
    });
  }

  cancelEditRule() {
    this.editingRule = null;
    this.ruleForm = this.defaultRuleForm();
  }

  deleteRule(rule: TaxRule) {
    this.taxRuleService.delete(rule.id).subscribe({
      next: () => this.loadTaxRules(),
      error: (err) => { this.error = err.error?.error || 'Failed to delete tax rule'; },
    });
  }

  onRateValueChange(val: number) {
    this.rateForm.cgst_rate = val / 2;
    this.rateForm.sgst_rate = val / 2;
    this.rateForm.igst_rate = val;
  }

  // --- State Actions ---

  loadStates() {
    this.loadingStates = true;
    this.stateService.getAll().subscribe({
      next: (res) => {
        this.states.set(res.data);
        this.loadingStates = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load states';
        this.loadingStates = false;
      },
    });
  }

  defaultStateForm(): Partial<State> {
    return {
      stateName: '',
      stateCode: '',
      stateShortCode: '',
      countryCode: 'IN',
      isUnionTerritory: false,
      isActive: true,
    };
  }

  addState() {
    this.stateService.create(this.stateForm).subscribe({
      next: () => {
        this.stateForm = this.defaultStateForm();
        this.loadStates();
        this.error = null;
      },
      error: (err) => { this.error = err.error?.error || 'Failed to add state'; },
    });
  }

  startEditState(state: State) {
    this.editingState = { ...state };
    this.stateForm = { ...state };
  }

  saveEditState() {
    if (!this.editingState) return;
    this.stateService.update(this.editingState.id, this.stateForm).subscribe({
      next: () => {
        this.editingState = null;
        this.stateForm = this.defaultStateForm();
        this.loadStates();
        this.error = null;
      },
      error: (err) => { this.error = err.error?.error || 'Failed to update state'; },
    });
  }

  cancelEditState() {
    this.editingState = null;
    this.stateForm = this.defaultStateForm();
  }

  deleteState(state: State) {
    this.stateService.delete(state.id).subscribe({
      next: () => this.loadStates(),
      error: (err) => { this.error = err.error?.error || 'Failed to delete state'; },
    });
  }
}
