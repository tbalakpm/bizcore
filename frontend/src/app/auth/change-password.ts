import { Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from './auth-service';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-change-password',
  imports: [TranslatePipe, FormsModule, ReactiveFormsModule, NzCardModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule, NzAlertModule],
  templateUrl: './change-password.html',
})
export class ChangePassword {
  private auth = inject(AuthService);
  private router = inject(Router);

  newPassword = signal('');
  confirmPassword = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    if (!this.newPassword()) {
      this.error.set('New password is required');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('Passwords do not match');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.auth.changePassword(this.newPassword()).subscribe({
      next: () => {
        this.loading.set(false);
        // changePassword calls logout(), so router will redirect to /login
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Password change failed');
      },
    });
  }
}
