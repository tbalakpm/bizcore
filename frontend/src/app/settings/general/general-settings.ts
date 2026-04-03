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

import { SettingsService } from '../settings.service';
import { forkJoin } from 'rxjs';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PermissionService } from '../../auth/permission.service';

@Component({
  selector: 'app-general-settings',
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzDividerModule,
    NzInputNumberModule,
    NzSwitchModule,
    NzSelectModule,
    NzIconModule
  ],
  templateUrl: './general-settings.html',
})
export class GeneralSettings implements OnInit {
  private settingsService = inject(SettingsService);
  private message = inject(NzMessageService);
  public permission = inject(PermissionService);

  loading = false;
  saving = false;

  settings: Record<string, any> = {
    company_name: '',
    company_gstin: '',
    company_address_line1: '',
    company_city: '',
    company_state: '',
    company_postal_code: '',
    company_phone: '',
    bank_name: '',
    bank_account: '',
    bank_ifsc: '',
    sgst_sharing_rate: 50,
    igst_sharing_rate: 100,
    invoice_terms: '',
    barcode_width: '2',
    barcode_height: '1.2',
    barcode_columns: 1,
    use_global_gtn: true,
    gtn_mode: 'auto', // auto, manual
    gtn_generation: 'tag', // code, batch, tag, manual
  };

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    this.settingsService.getAllSettings().subscribe({
      next: (res) => {
        res.data.forEach((s) => {
          if (this.settings[s.key] !== undefined) {
            // parse numbers if applicable
            if (s.key === 'sgst_sharing_rate' || s.key === 'igst_sharing_rate' || s.key === 'barcode_columns') {
              this.settings[s.key] = s.value ? Number(s.value) : null;
            } else {
              this.settings[s.key] = s.value;
            }
          }
        });

        this.loading = false;
      },
      error: () => {
        this.message.error('Failed to load settings');
        this.loading = false;
      },
    });
  }

  save() {
    this.saving = true;
    const requests: any[] = Object.keys(this.settings).map((key) => {
      const val = this.settings[key] !== null && this.settings[key] !== undefined
        ? String(this.settings[key])
        : '';
      return this.settingsService.updateSetting(key, val);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.message.success('Settings saved successfully');
        this.saving = false;
      },
      error: () => {
        this.message.error('Failed to save settings');
        this.saving = false;
      },
    });
  }
}
