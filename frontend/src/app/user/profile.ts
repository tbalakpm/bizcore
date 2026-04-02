import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileService } from './profile-service';
import type { User } from './user-service';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [TranslatePipe, FormsModule, ReactiveFormsModule, NzCardModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule, NzAlertModule, DatePipe],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private profileService = inject(ProfileService);
  private message = inject(NzMessageService);

  user = signal<User | null>(null);
  loading = signal(false);
  
  // Profile form
  firstName = '';
  lastName = '';
  
  // Password form
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordLoading = signal(false);
  passwordError = signal<string | null>(null);

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading.set(true);
    this.profileService.getProfile().subscribe({
      next: (user) => {
        this.user.set(user);
        this.firstName = user.firstName || '';
        this.lastName = user.lastName || '';
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  updateProfile() {
    this.loading.set(true);
    this.profileService.updateProfile({ firstName: this.firstName, lastName: this.lastName }).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
        this.message.success('Profile updated successfully');
      },
      error: () => this.loading.set(false)
    });
  }

  changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('New passwords do not match');
      return;
    }

    this.passwordLoading.set(true);
    this.passwordError.set(null);
    this.profileService.changePassword({ 
      currentPassword: this.currentPassword, 
      newPassword: this.newPassword 
    }).subscribe({
      next: () => {
        this.passwordLoading.set(false);
        this.message.success('Password changed successfully');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.passwordLoading.set(false);
        this.passwordError.set(err.error?.error || 'Failed to change password');
      }
    });
  }
}
