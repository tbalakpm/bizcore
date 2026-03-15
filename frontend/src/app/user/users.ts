import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { type User, UserList, UserService } from './user-service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-users',
  imports: [FormsModule, ReactiveFormsModule, TranslatePipe, CommonModule, LucideAngularModule],
  templateUrl: './users.html',
})
export class Users implements OnInit {
  private userService = inject(UserService);

  users = signal<User[]>([]);

  editingUser: Partial<User> = {
    id: undefined,
    username: '',
    firstName: '',
    lastName: '',
    role: 'user',
    isActive: true,
  };

  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadUsers();
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
    const request$ = this.editingUser.id
      ? this.userService.update(this.editingUser.id, this.editingUser)
      : this.userService.create(this.editingUser);

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
    });
  }

  deleteUser(id: number) {
    if (!confirm('Delete this user?')) return;
    this.userService.delete(id).subscribe(() => this.loadUsers());
  }
}
