import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PermissionService } from '../../auth/permission.service';

import { SettingsService } from '../settings.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-serial-settings',
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzDividerModule,
    NzInputNumberModule,
    NzIconModule,
  ],
  templateUrl: './serial-settings.html',
})
export class SerialSettings implements OnInit {
  private settingsService = inject(SettingsService);
  private message = inject(NzMessageService);
  public permission = inject(PermissionService);

  loading = false;
  saving = false;

  invoiceConfigs = [
    { key: 'gtn', label: 'Goods Tracking Number', prefix: 'AA-', current: 1, length: 10 },
    { key: 'stock_invoice', label: 'Stock Invoice', prefix: 'STK-', current: 1, length: 10 },
    { key: 'sales_invoice', label: 'Sales Invoice', prefix: 'INV-', current: 1, length: 10 },
    { key: 'sales_estimate', label: 'Sales Estimate', prefix: 'EST-', current: 1, length: 10 },
    { key: 'purchase_invoice', label: 'Purchase Invoice', prefix: 'PUR-', current: 1, length: 10 },
    { key: 'debit_note', label: 'Debit Note', prefix: 'DN-', current: 1, length: 10 },
    { key: 'credit_note', label: 'Credit Note', prefix: 'CN-', current: 1, length: 10 },
  ];

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    this.settingsService.getInvoiceConfigs().subscribe({
      next: (res) => {
        res.data.forEach((config: any) => {
          const item = this.invoiceConfigs.find((i) => i.key === config.key);
          if (item) {
            item.prefix = config.prefix;
            item.current = Number(config.current);
            item.length = Number(config.length);
          }
        });
        this.loading = false;
      },
      error: () => {
        this.message.error('Failed to load serial settings');
        this.loading = false;
      },
    });
  }

  save() {
    this.saving = true;
    const invoiceRequests = this.invoiceConfigs.map((config) =>
      this.settingsService.updateInvoiceConfig(config.key, {
        prefix: config.prefix,
        current: config.current,
        length: config.length
      })
    );

    forkJoin(invoiceRequests).subscribe({
      next: () => {
        this.message.success('Serial settings saved successfully');
        this.saving = false;
      },
      error: () => {
        this.message.error('Failed to save serial settings');
        this.saving = false;
      },
    });
  }
}
