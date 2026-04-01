import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzDividerModule } from 'ng-zorro-antd/divider';

import { PricingCategoryService, PricingCategory, ProductMargin } from './pricing-category-service';
import { ProductService, Product } from '../product/product-service';

@Component({
  selector: 'app-pricing-categories',
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule,
    NzSwitchModule, NzPopconfirmModule, NzAlertModule, NzTooltipModule,
    NzCardModule, NzSelectModule, NzTagModule, NzInputNumberModule,
    NzCollapseModule, NzDividerModule,
  ],
  templateUrl: './pricing-categories.html',
})
export class PricingCategories implements OnInit {
  private pricingCategoryService = inject(PricingCategoryService);
  private productService = inject(ProductService);

  categories = signal<PricingCategory[]>([]);
  products = signal<Product[]>([]);
  total = 0;
  pageSize = 10;
  pageIndex = 1;

  editing: PricingCategory | null = null;
  editForm: Partial<PricingCategory> = { code: '', name: '', description: '', isActive: true };
  loading = false;
  error: string | null = null;

  // Formatters
  pctFormatter = (value: number) => `${value}%`;
  amtFormatter = (value: number) => `₹${value}`;

  // Product margins management
  expandedCategoryId: number | null = null;
  productMargins: ProductMargin[] = [];
  marginsLoading = false;

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.loading = true;
    this.pricingCategoryService.getAll({ page: this.pageIndex, limit: this.pageSize }).subscribe({
      next: (res) => {
        this.categories.set(res.data);
        this.total = res.pagination.total;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load pricing categories';
        this.loading = false;
      },
    });
  }

  loadProducts() {
    this.productService.getAll().subscribe({
      next: (res) => this.products.set(res.data),
      error: () => { },
    });
  }

  onPageChange(params: any) {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.loadCategories();
  }

  add() {
    if (!this.editForm.name || !this.editForm.code) return;
    this.pricingCategoryService.create(this.editForm).subscribe({
      next: () => {
        this.editForm = { code: '', name: '', description: '', isActive: true };
        this.loadCategories();
        this.error = null;
      },
      error: (err) => { this.error = err.error?.error || 'Failed to add category'; },
    });
  }

  startEdit(cat: PricingCategory) {
    this.editing = { ...cat };
    this.editForm = { ...cat };
  }

  saveEdit() {
    if (!this.editing) return;
    this.pricingCategoryService.update(this.editing.id, this.editForm).subscribe({
      next: () => {
        this.editing = null;
        this.editForm = { code: '', name: '', description: '', isActive: true };
        this.loadCategories();
        this.error = null;
      },
      error: (err) => { this.error = err.error?.error || 'Failed to update category'; },
    });
  }

  cancelEdit() {
    this.editing = null;
    this.editForm = { code: '', name: '', description: '', isActive: true };
    this.error = null;
  }

  toggleActive(cat: PricingCategory) {
    this.pricingCategoryService.update(cat.id, { isActive: !cat.isActive }).subscribe({
      next: () => this.loadCategories(),
    });
  }

  deleteCategory(cat: PricingCategory) {
    this.pricingCategoryService.delete(cat.id).subscribe({
      next: () => { this.loadCategories(); this.error = null; },
      error: (err) => { this.error = err.error?.error || 'Failed to delete category'; },
    });
  }

  // ── Product Margins ──

  toggleProductMargins(cat: PricingCategory) {
    if (this.expandedCategoryId === cat.id) {
      this.expandedCategoryId = null;
      this.productMargins = [];
      return;
    }
    this.expandedCategoryId = cat.id;
    this.loadProductMargins(cat.id);
  }

  loadProductMargins(categoryId: number) {
    this.marginsLoading = true;
    this.pricingCategoryService.getProducts(categoryId).subscribe({
      next: (rows) => {
        // Build full product list with defaults, merge saved margins
        const marginMap = new Map(rows.map(r => [r.productId, r]));
        this.productMargins = this.products().map(p => {
          const saved = marginMap.get(p.id);
          return {
            productId: p.id,
            productCode: p.code,
            productName: p.name,
            marginType: (saved?.marginType || 'none') as 'none' | 'percent' | 'amount' | 'selling_price',
            marginPct: Number(saved?.marginPct || 0),
            marginAmount: Number(saved?.marginAmount || 0),
          };
        });
        this.marginsLoading = false;
      },
      error: () => { this.marginsLoading = false; },
    });
  }

  saveProductMargins() {
    if (this.expandedCategoryId === null) return;
    // Only save rows where a margin is configured (not 'none')
    const toSave = this.productMargins
      .filter(m => m.marginType !== 'none')
      .map(m => ({
        ...m,
        marginPct: m.marginPct.toString(),
        marginAmount: m.marginAmount.toString(),
      }));
    this.pricingCategoryService.saveProducts(this.expandedCategoryId, toSave as any).subscribe({
      next: () => { this.error = null; },
      error: (err) => { this.error = err.error?.error || 'Failed to save margins'; },
    });
  }

  get marginTypes() {
    return [
      { value: 'none', label: 'None' },
      { value: 'percent', label: 'Markup Percentage (%)' },
      { value: 'amount', label: 'Markup Amount (₹)' },
      { value: 'selling_price', label: 'Selling Price (₹)' },
    ];
  }
}
