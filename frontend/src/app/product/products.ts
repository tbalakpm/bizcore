import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { type Product, ProductList, ProductService } from './product-service';
import { ProductFormComponent } from './product-form.component';
import { PermissionService } from '../auth/permission.service';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-products',
  imports: [
    CommonModule, TranslatePipe, FormsModule, ProductFormComponent,
    NzTableModule, NzTagModule, NzSwitchModule, NzButtonModule,
    NzIconModule, NzTooltipModule, NzPopconfirmModule, NzAlertModule, NzCardModule,
  ],
  templateUrl: './products.html',
})
export class Products implements OnInit {
  private productService = inject(ProductService);
  permissionService = inject(PermissionService);

  products = signal<Product[]>([]);

  /** ID of the product being edited, or undefined when adding a new one */
  editingProductId: number | undefined = undefined;
  showForm = true; // always show the form panel on this page

  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: (res: ProductList) => {
        this.products.set(res.data);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load products';
        this.loading = false;
      },
    });
  }

  toggleActive(p: Product) {
    this.productService.update(p.id, { isActive: !p.isActive }).subscribe({
      next: () => this.loadProducts(),
    });
  }

  editProduct(id: number) {
    this.editingProductId = id;
  }

  onFormSaved() {
    this.editingProductId = undefined;
    this.loadProducts();
  }

  onFormCancelled() {
    this.editingProductId = undefined;
  }

  deleteProduct(id: number) {
    this.productService.delete(id).subscribe(() => this.loadProducts());
  }
}
