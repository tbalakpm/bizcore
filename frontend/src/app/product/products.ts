import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { type Category, CategoryService } from '../category/category-service';
import { type Product, ProductService } from './product-service';

@Component({
  selector: 'app-products',
  imports: [FormsModule, ReactiveFormsModule, TranslatePipe, CommonModule],
  templateUrl: './products.html',
})
export class Products implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);

  editingProduct: Partial<Product> = {
    id: undefined, // for editing
    code: '',
    name: '',
    description: '',
    categoryId: undefined,
    qtyPerUnit: undefined,
    unitPrice: undefined,
    unitsInStock: undefined,
    isActive: true,
  };

  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.categoryService.getAll().subscribe((categories) => this.categories.set(categories));
  }

  loadProducts() {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: (res: Product[]) => {
        this.products.set(res);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load registers';
        this.loading = false;
      },
    });
  }

  toggleActive(reg: Product) {
    this.productService.update(reg.id, { isActive: !reg.isActive }).subscribe({
      next: () => this.loadProducts(),
    });
  }

  // HTML Template code: [compareWith]="compareCategory"
  // compareCategory(obj1: Partial<Category>, obj2: Partial<Category>): boolean {
  //   return obj1 && obj2 ? obj1.id === obj2.id : obj1 === obj2;
  // }

  onSubmit() {
    // this.editingRegister.categoryId = this.editingRegister.categoryId;
    const request$ = this.editingProduct.id
      ? this.productService.update(this.editingProduct.id, this.editingProduct)
      : this.productService.create(this.editingProduct);

    request$.subscribe({
      next: () => {
        this.onCancel();
        this.loadProducts();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to save register';
      },
    });
  }

  onCancel() {
    this.editingProduct = {
      id: undefined,
      name: '',
      description: '',
      categoryId: undefined,
      qtyPerUnit: undefined,
      unitPrice: undefined,
      unitsInStock: undefined,
      categoryName: undefined,
      isActive: true,
    };
  }

  editProduct(id: number) {
    this.productService.getById(id).subscribe((res: Product) => {
      this.editingProduct.id = res.id;
      this.editingProduct.code = res.code;
      this.editingProduct.name = res.name;
      this.editingProduct.description = res.description;
      this.editingProduct.categoryId = res.categoryId;
      this.editingProduct.qtyPerUnit = res.qtyPerUnit;
      this.editingProduct.unitPrice = res.unitPrice;
      this.editingProduct.unitsInStock = res.unitsInStock;
      this.editingProduct.categoryName = res.categoryName;
      this.editingProduct.isActive = res.isActive;
    });
  }

  deleteProduct(id: number) {
    if (!confirm('Delete this product?')) return;
    this.productService.delete(id).subscribe(() => this.loadProducts());
  }
}
