import { Component, inject, OnInit, signal } from '@angular/core';
import { CategoryService, Category, CategoryList } from './category-service';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../auth/permission.service';

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

@Component({
  selector: 'app-categories',
  imports: [TranslatePipe, FormsModule, CommonModule, NzTableModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule, NzSwitchModule, NzPopconfirmModule, NzAlertModule, NzTooltipModule, NzCardModule],
  templateUrl: './categories.html',
})
export class Categories implements OnInit {
  categoryService = inject(CategoryService);
  permissionService = inject(PermissionService);

  categories = signal<Category[]>([]);
  newCategory: Partial<Category> = { code: '', name: '', description: '', isActive: true };
  loading = false;
  error: string | null = null;

  editing: Category | null = null;
  // categoryTypes: { [key: string]: string } = {
  //   I: 'CATEGORY.INCOME',
  //   E: 'CATEGORY.EXPENSE',
  //   A: 'CATEGORY.ASSET',
  //   L: 'CATEGORY.LIABILITY',
  // };

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.categoryService.getAll().subscribe({
      next: (cats: CategoryList) => {
        this.categories.set(cats.data);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load categories';
        this.loading = false;
      },
    });
  }

  addCategory() {
    if (!this.newCategory.name) return;
    this.categoryService.create(this.newCategory).subscribe({
      next: () => {
        this.newCategory = { code: '', name: '', description: '', isActive: true };
        this.loadCategories();
        this.error = null;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to add category';
      },
    });
  }

  startEdit(cat: Category) {
    this.editing = { ...cat };
  }

  saveEdit() {
    if (!this.editing) return;
    this.categoryService.update(this.editing.id, this.editing).subscribe({
      next: () => {
        this.editing = null;
        this.loadCategories();
        this.error = null;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to update category';
      },
    });
  }

  cancelEdit() {
    this.editing = null;
    this.error = null;
  }

  toggleActive(cat: Category) {
    this.categoryService.update(cat.id, { isActive: !cat.isActive }).subscribe({
      next: () => this.loadCategories(),
    });
  }

  deleteCategory(cat: Category) {
    this.categoryService.delete(cat.id).subscribe({
      next: () => {
        this.loadCategories();
        this.error = null;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to delete category';
      },
    });
  }
}
