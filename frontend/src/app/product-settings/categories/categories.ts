import { Component, inject, OnInit, signal } from '@angular/core';
import { CategoryService, Category, CategoryList } from './category-service';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../auth/permission.service';

import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-categories',
  imports: [TranslatePipe, FormsModule, HasPermissionDirective, NzTableModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule, NzSwitchModule, NzPopconfirmModule, NzAlertModule, NzTooltipModule, NzCardModule, NzDropDownModule, NzSelectModule],
  templateUrl: './categories.html',
})
export class Categories implements OnInit {
  categoryService = inject(CategoryService);
  permissionService = inject(PermissionService);

  categories = signal<Category[]>([]);
  rootCategories = signal<Category[]>([]);
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  sort: string | null = null;
  filterValues: Record<string, string> = {
    code: '',
    name: '',
    description: '',
  };
  filterVisible: Record<string, boolean> = {
    code: false,
    name: false,
    description: false,
  };

  newCategory: Partial<Category> = { code: '', name: '', description: '', isActive: true };
  loading = false;
  error: string | null = null;

  editing: Category | null = null;

  ngOnInit(): void {
    this.loadRootCategories();
  }

  loadRootCategories() {
    this.categoryService.getAll({ limit: 1000 }).subscribe({
      next: (res) => {
        // filter client side to only get categories without a parent
        this.rootCategories.set(res.data.filter(c => !c.parentCategoryId));
      }
    });
  }

  getCategoryName(id: number | null | undefined): string {
    if (!id) return '-';
    // Look in rootCategories first
    const cat = this.rootCategories().find(c => c.id === id);
    if (cat) return cat.name;
    // Look in categories (if it exists)
    const inList = this.categories().find(c => c.id === id);
    return inList ? inList.name : id.toString();
  }

  loadCategories() {
    this.loading = true;
    this.categoryService
      .getAll({
        page: this.pageIndex,
        limit: this.pageSize,
        sort: this.sort || undefined,
        ...this.filterValues,
      })
      .subscribe({
        next: (res: CategoryList) => {
          this.categories.set(res.data);
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to load categories';
          this.loading = false;
        },
      });
  }

  onQueryParamsChange(params: any): void {
    const { pageSize, pageIndex, sort } = params;
    this.pageSize = pageSize;
    this.pageIndex = pageIndex;

    const currentSort = sort.find((item: any) => item.value !== null);
    const sortField = (currentSort && currentSort.key) || null;
    const sortOrder = (currentSort && currentSort.value) || null;

    if (sortField && sortOrder) {
      this.sort = `${sortField}:${sortOrder === 'descend' ? 'desc' : 'asc'}`;
    } else {
      this.sort = null;
    }

    this.loadCategories();
  }

  onFilterChange(field: string, value: string) {
    this.filterValues[field] = value;
    this.pageIndex = 1; // Reset to first page on filter change
    this.loadCategories();
  }

  addCategory() {
    if (!this.newCategory.name) return;
    this.categoryService.create(this.newCategory).subscribe({
      next: () => {
        this.newCategory = { code: '', name: '', description: '', isActive: true };
        this.loadCategories();
        this.loadRootCategories();
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
        this.loadRootCategories();
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
        this.loadRootCategories();
        this.error = null;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to delete category';
      },
    });
  }
}
