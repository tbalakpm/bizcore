import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { type Category, CategoryService } from '../category/category-service';
import { type Product, ProductService } from './product-service';

@Component({
  selector: 'app-product-form',
  imports: [FormsModule, CommonModule, TranslatePipe],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit, OnChanges {
  /** Pass a product ID to edit an existing product. Omit (or pass undefined) to create a new one. */
  @Input() productId?: number;

  /** Emitted with the saved product after a successful create or update. */
  @Output() saved = new EventEmitter<Product>();

  /** Emitted when the user clicks Cancel. */
  @Output() cancelled = new EventEmitter<void>();

  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  categories = signal<Category[]>([]);
  loading = false;
  error: string | null = null;

  product: Partial<Product> = this.blankProduct();

  ngOnInit(): void {
    this.categoryService.getAll().subscribe((res) => this.categories.set(res.data));
    this.loadProduct();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId']) {
      this.loadProduct();
    }
  }

  private loadProduct(): void {
    if (this.productId) {
      this.loading = true;
      this.error = null;
      this.productService.getById(this.productId).subscribe({
        next: (res) => {
          this.product = { ...res };
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load product';
          this.loading = false;
        },
      });
    } else {
      this.product = this.blankProduct();
      this.error = null;
    }
  }

  onSubmit(): void {
    this.error = null;
    const request$ = this.productId
      ? this.productService.update(this.productId, this.product)
      : this.productService.create(this.product);

    request$.subscribe({
      next: (res) => this.saved.emit(res),
      error: (err) => {
        this.error = err.error?.error || 'Failed to save product';
      },
    });
  }

  onCancel(): void {
    this.product = this.blankProduct();
    this.cancelled.emit();
  }

  private blankProduct(): Partial<Product> {
    return {
      id: undefined,
      code: '',
      name: '',
      description: '',
      categoryId: undefined,
      qtyPerUnit: undefined,
      unitPrice: undefined,
      hsnSac: undefined,
      taxRate: undefined,
      gtnMode: 'auto',
      gtnGeneration: 'code',
      gtnPrefix: undefined,
      gtnStartPos: 1,
      gtnLength: 10,
      isActive: true,
    };
  }
}
