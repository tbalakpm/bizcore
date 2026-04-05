import { Component, inject, OnInit, signal } from '@angular/core';
import { TaxRuleService } from './tax-rule-service';
import { TaxRate, TaxRule, TaxRuleGroup } from '../tax.model';
import { PermissionService } from '../../auth/permission.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TaxRuleGroupService } from '../rule-groups/tax-rule-group-service';
import { TaxRateService } from '../tax-rates/tax-rate-service';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tax-rules',
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzFormModule, NzSelectModule, NzInputNumberModule,
    NzTableModule, NzTagModule, NzPopconfirmModule, NzButtonModule,
    NzIconModule, NzInputModule, NzCheckboxModule, NzAlertModule
  ],
  templateUrl: './tax-rules.html',
})
export class TaxRules implements OnInit {
  private taxRuleService = inject(TaxRuleService);

  taxRuleGroupService = inject(TaxRuleGroupService);
  permissionService = inject(PermissionService);
  taxRateService = inject(TaxRateService);

  error: string | null = null;

  taxRuleGroups = signal<TaxRuleGroup[]>([]);
  taxRates = signal<TaxRate[]>([]);

  loadingRules = false;
  taxRules = signal<TaxRule[]>([]);
  editingRule: TaxRule | null = null;
  ruleForm: Partial<TaxRule> = this.defaultRuleForm();

  ngOnInit(): void {
    this.loadTaxRules();
    this.loadTaxRuleGroups();
    this.loadTaxRates();
  }

  loadTaxRates() {
    this.taxRateService.getAll().subscribe({
      next: (res) => {
        this.taxRates.set(res.data);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load tax rates';
      },
    });
  }

  loadTaxRuleGroups() {
    this.taxRuleGroupService.getAll().subscribe({
      next: (res) => {
        this.taxRuleGroups.set(res.data);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load tax rule groups';
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

  defaultRuleForm(): Partial<TaxRule> {
    return {
      ruleGroupId: undefined,
      taxRateId: undefined,
      hsnCodeStartsWith: '',
      minPrice: 0,
      maxPrice: 0,
      isInterState: false,
      isIntraState: true,
      customerType: 'retail',
      priority: 0,
      effectiveFrom: new Date().toISOString().split('T')[0],
      conditions: []
    };
  }


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

  getRateValue(id: number) {
    return this.taxRates().find(r => r.id === id)?.rate || 0;
  }

  getGroupName(id: number) {
    return this.taxRuleGroups().find(g => g.id === id)?.name || 'Unknown';
  }
}

