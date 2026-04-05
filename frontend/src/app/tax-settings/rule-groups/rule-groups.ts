import { Component, inject, OnInit, signal } from '@angular/core';
import { TaxRuleGroup } from '../tax.model';
import { TaxRuleGroupService } from './tax-rule-group-service';
import { PermissionService } from '../../auth/permission.service';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-rule-groups',
  standalone: true,
  imports: [
    FormsModule,
    NzCardModule, NzFormModule, NzInputNumberModule, NzTableModule,
    NzTagModule, NzDatePickerModule, NzInputModule, NzCheckboxModule,
    NzIconModule, NzButtonModule, NzPopconfirmModule, NzAlertModule
  ],
  templateUrl: './rule-groups.html',
})
export class RuleGroups implements OnInit {
  permissionService = inject(PermissionService);

  taxRuleGroupService = inject(TaxRuleGroupService);
  error: string | null = null;

  // Tax Rule Group Form
  loadingGroups = false;
  taxRuleGroups = signal<TaxRuleGroup[]>([]);
  editingGroup: TaxRuleGroup | null = null;
  groupForm: Partial<TaxRuleGroup> = this.defaultGroupForm();

  ngOnInit(): void {
    this.loadTaxRuleGroups();
  }

  defaultGroupForm(): Partial<TaxRuleGroup> {
    return {
      name: '',
      priority: 0,
      description: ''
    };
  }

  loadTaxRuleGroups() {
    this.loadingGroups = true;
    this.taxRuleGroupService.getAll().subscribe({
      next: (res) => {
        this.taxRuleGroups.set(res.data);
        this.loadingGroups = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load tax rule groups';
        this.loadingGroups = false;
      },
    });
  }

  addGroup() {
    this.taxRuleGroupService.create(this.groupForm).subscribe({
      next: () => {
        this.groupForm = this.defaultGroupForm();
        this.loadTaxRuleGroups();
        this.error = null;
      },
      error: (err) => { this.error = err.error?.error || 'Failed to add rule group'; },
    });
  }

  startEditGroup(group: TaxRuleGroup) {
    this.editingGroup = { ...group };
    this.groupForm = { ...group };
  }

  saveEditGroup() {
    if (!this.editingGroup) return;
    this.taxRuleGroupService.update(this.editingGroup.id, this.groupForm).subscribe({
      next: () => {
        this.editingGroup = null;
        this.groupForm = this.defaultGroupForm();
        this.loadTaxRuleGroups();
        this.error = null;
      },
      error: (err) => { this.error = err.error?.error || 'Failed to update rule group'; },
    });
  }

  cancelEditGroup() {
    this.editingGroup = null;
    this.groupForm = this.defaultGroupForm();
  }

  deleteGroup(group: TaxRuleGroup) {
    this.taxRuleGroupService.delete(group.id).subscribe({
      next: () => this.loadTaxRuleGroups(),
      error: (err) => { this.error = err.error?.error || 'Failed to delete rule group'; },
    });
  }

}
