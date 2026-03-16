import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { type User, UserList, UserService } from './user-service';
import { AuthService } from '../auth/auth-service';
import { PermissionService } from '../auth/permission.service';
import { ALL_MODULES, MODULE_LABELS, type UserPermissions } from '../models/permission.model';
import { HasPermissionDirective } from '../shared/directives/has-permission.directive';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-users',
  imports: [
    FormsModule, ReactiveFormsModule, TranslatePipe, CommonModule,
    HasPermissionDirective,
    NzTableModule, NzFormModule, NzInputModule, NzSelectModule,
    NzButtonModule, NzIconModule, NzSwitchModule, NzPopconfirmModule,
    NzAlertModule, NzTooltipModule, NzRadioModule, NzCardModule,
  ],
  templateUrl: './users.html',
})
export class Users implements OnInit {
  private userService = inject(UserService);
  private auth = inject(AuthService);
  permissionService = inject(PermissionService);

  users = signal<User[]>([]);

  allModules = ALL_MODULES;
  moduleLabels = MODULE_LABELS;

  isAdmin = this.auth.currentUserRole === 'admin';

  editingUser: Partial<User> & { permissions: Record<string, string> } = {
    id: undefined,
    username: '',
    firstName: '',
    lastName: '',
    role: 'user',
    isActive: true,
    permissions: this.defaultPermissions(),
  };

  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  defaultPermissions(): Record<string, string> {
    return Object.fromEntries(ALL_MODULES.map((m) => [m, 'none']));
  }

  loadUsers() {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (res: UserList) => {
        this.users.set(res.data);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load users';
        this.loading = false;
      },
    });
  }

  toggleActive(user: User) {
    this.userService.update(user.id, { isActive: !user.isActive }).subscribe({
      next: () => this.loadUsers(),
    });
  }

  onSubmit() {
    const payload: any = { ...this.editingUser };
    payload.permissions = this.editingUser.permissions;

    const request$ = this.editingUser.id
      ? this.userService.update(this.editingUser.id, payload)
      : this.userService.create(payload);

    request$.subscribe({
      next: () => {
        this.onCancel();
        this.loadUsers();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to save user';
      },
    });
  }

  onCancel() {
    this.editingUser = {
      id: undefined,
      username: '',
      firstName: '',
      lastName: '',
      role: 'user',
      isActive: true,
      permissions: this.defaultPermissions(),
    };
  }

  editUser(id: number) {
    this.userService.getById(id).subscribe((res: User) => {
      this.editingUser.id = res.id;
      this.editingUser.username = res.username;
      this.editingUser.firstName = res.firstName;
      this.editingUser.lastName = res.lastName;
      this.editingUser.role = res.role;
      this.editingUser.isActive = res.isActive;

      const perms = typeof res.permissions === 'string' ? JSON.parse(res.permissions || '{}') : (res.permissions || {});
      this.editingUser.permissions = { ...this.defaultPermissions(), ...perms };
    });
  }

  deleteUser(id: number) {
    this.userService.delete(id).subscribe(() => this.loadUsers());
  }
}
