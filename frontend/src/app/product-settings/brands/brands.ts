import { Component, inject, OnInit, signal } from '@angular/core';
import { BrandService, Brand, BrandList } from './brand-service';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../auth/permission.service';
import { CategoryService, Category } from '../categories/category-service';

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
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-brands',
  imports: [CommonModule, TranslatePipe, FormsModule, NzTableModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule, NzSwitchModule, NzPopconfirmModule, NzAlertModule, NzTooltipModule, NzCardModule, NzDropdownModule, HasPermissionDirective, NzSelectModule],
  templateUrl: './brands.html',
})
export class Brands implements OnInit {
  brandService = inject(BrandService);
  permissionService = inject(PermissionService);
  categoryService = inject(CategoryService);

  brands = signal<Brand[]>([]);
  categories = signal<Category[]>([]);
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

  newBrand: Partial<Brand> = { code: '', name: '', description: '', isActive: true, categoryIds: [] };
  loading = false;
  error: string | null = null;

  editing: Brand | null = null;

  ngOnInit(): void {
    this.loadBrands();
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getAll({ limit: 1000 }).subscribe({
      next: (res) => this.categories.set(res.data),
    });
  }

  loadBrands() {
    this.loading = true;
    this.brandService
      .getAll({
        page: this.pageIndex,
        limit: this.pageSize,
        sort: this.sort || undefined,
        ...this.filterValues,
      })
      .subscribe({
        next: (res: BrandList) => {
          this.brands.set(res.data);
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to load brands';
          this.loading = false;
        },
      });
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
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

    this.loadBrands();
  }

  onFilterChange(field: string, value: string) {
    this.filterValues[field] = value;
    this.pageIndex = 1;
    this.loadBrands();
  }

  addBrand() {
    if (!this.newBrand.name) return;
    this.brandService.create(this.newBrand).subscribe({
      next: () => {
        this.newBrand = { code: '', name: '', description: '', isActive: true, categoryIds: [] };
        this.loadBrands();
        this.error = null;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to add brand';
      },
    });
  }

  startEdit(brand: Brand) {
    this.editing = { ...brand };
  }

  saveEdit() {
    if (!this.editing) return;
    this.brandService.update(this.editing.id, this.editing).subscribe({
      next: () => {
        this.editing = null;
        this.loadBrands();
        this.error = null;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to update brand';
      },
    });
  }

  cancelEdit() {
    this.editing = null;
    this.error = null;
  }

  toggleActive(brand: Brand) {
    this.brandService.update(brand.id, { isActive: !brand.isActive }).subscribe({
      next: () => this.loadBrands(),
    });
  }

  deleteBrand(brand: Brand) {
    this.brandService.delete(brand.id).subscribe({
      next: () => {
        this.loadBrands();
        this.error = null;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to delete brand';
      },
    });
  }

  getCategoryName(id: number): string {
    return this.categories().find((c) => c.id === id)?.name || id.toString();
  }
}
