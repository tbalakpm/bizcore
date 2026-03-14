import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { type Product, ProductList, ProductService } from './product-service';
import { ProductFormComponent } from './product-form.component';

@Component({
  selector: 'app-products',
  imports: [CommonModule, TranslatePipe, ProductFormComponent],
  templateUrl: './products.html',
})
export class Products implements OnInit {
  private productService = inject(ProductService);

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
    if (!confirm('Delete this product?')) return;
    this.productService.delete(id).subscribe(() => this.loadProducts());
  }
}
