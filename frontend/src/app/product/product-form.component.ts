import { NgSwitch, NgSwitchCase } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { type Category, CategoryService } from '../product-settings/categories/category-service';
import { type Brand, BrandService } from '../product-settings/brands/brand-service';
import { type Product, ProductService } from './product-service';
import { Attribute, AttributeService } from './attribute-service';
import { ProductTemplate, ProductTemplateService } from '../product-settings/product-templates/product-template-service';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzTableModule } from 'ng-zorro-antd/table';

@Component({
  selector: 'app-product-form',
  imports: [
    FormsModule, NgSwitch, NgSwitchCase, TranslatePipe,
    NzFormModule, NzInputModule, NzSelectModule, NzButtonModule,
    NzAlertModule, NzIconModule, NzInputNumberModule, NzTooltipModule,
    NzSwitchModule, NzRadioModule, NzTableModule
  ],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit, OnChanges {
  // ... other properties
  @Input() productId?: number;
  @Output() saved = new EventEmitter<Product>();
  @Output() cancelled = new EventEmitter<void>();

  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private attributeService = inject(AttributeService);
  private templateService = inject(ProductTemplateService);

  categories = signal<Category[]>([]);
  structuredCategories = computed(() => {
    const cats = this.categories();
    const roots = cats.filter(c => !c.parentCategoryId);
    const sorted: Category[] = [];
    for (const r of roots) {
      sorted.push(r);
      const children = cats.filter(c => c.parentCategoryId === r.id);
      for (const child of children) {
        sorted.push({ ...child, name: '  ⤿ ' + child.name });
      }
    }
    // append any unassigned/orphaned categories just in case
    for (const c of cats) {
      if (c.parentCategoryId && !roots.find(r => r.id === c.parentCategoryId) && !sorted.find(s => s.id === c.id)) {
        sorted.push(c);
      }
    }
    return sorted;
  });

  allAttributes = signal<Attribute[]>([]);
  templates = signal<ProductTemplate[]>([]);
  brands = signal<Brand[]>([]);
  get filteredBrands(): Brand[] {
    const catId = this.product.categoryId;
    if (!catId) return this.brands();
    return this.brands().filter(b => 
      !b.categoryIds || 
      b.categoryIds.length === 0 || 
      b.categoryIds.includes(catId)
    );
  }
  loading = false;
  error: string | null = null;
  productList = signal<Product[]>([]);

  product: Partial<Product> = this.blankProduct();

  ngOnInit(): void {
    this.categoryService.getAll({ limit: 1000 }).subscribe((res) => this.categories.set(res.data));
    this.attributeService.getAttributes().subscribe((res) => this.allAttributes.set(res));
    this.templateService.getTemplates().subscribe((res) => this.templates.set(res));
    this.productService.getAll({ limit: 1000 }).subscribe((res) => this.productList.set(res.data));
    this.brandService.getAll({ limit: 1000 }).subscribe((res) => this.brands.set(res.data.filter(b => b.isActive)));
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
    if (this.product.productType === 'simple' && this.product.parentId) {
      const parentProd = this.productList().find(p => p.id === this.product.parentId);
      if (parentProd && parentProd.templateId) {
        this.product.templateId = parentProd.templateId;
      }
    }

    this.error = null;
    const request$ = this.productId
      ? this.productService.update(this.productId, this.product)
      : this.productService.create(this.product);

    request$.subscribe({
      next: (res) => {
        if (!this.productId) {
          this.product = this.blankProduct();
        }
        this.saved.emit(res);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to save product';
      },
    });
  }

  onCancel(): void {
    this.product = this.blankProduct();
    this.cancelled.emit();
  }

  addBundleItem(): void {
    if (!this.product.bundleItems) {
      this.product.bundleItems = [];
    }
    this.product.bundleItems = [...this.product.bundleItems, { productId: 0, quantity: 1 }];
  }

  removeBundleItem(index: number): void {
    if (this.product.bundleItems) {
      this.product.bundleItems = this.product.bundleItems.filter((_, i) => i !== index);
    }
  }

  // Mapped attributes logic moved to templates

  getTemplateAttributes(): Attribute[] {
    let tId = this.product.templateId;
    
    // If simple, inherit template from parent
    if (this.product.productType === 'simple' && this.product.parentId) {
      const parentProd = this.productList().find(p => p.id === this.product.parentId);
      if (parentProd && parentProd.templateId) {
        tId = parentProd.templateId;
      }
    }

    if (!tId) return [];

    const tmpl = this.templates().find(t => t.id === tId);
    if (!tmpl || !tmpl.mappedAttributes) return [];

    // Map attributeIds back to full Attributes
    return tmpl.mappedAttributes
      .map(ma => this.allAttributes().find(a => a.id === ma.attributeId))
      .filter((a): a is Attribute => !!a);
  }

  getAttributeValue(attributeId: number): any {
    const val = this.product.attributeValues?.find(v => v.attributeId === attributeId);
    return val ? val.value : null;
  }

  setAttributeValue(attributeId: number, value: any): void {
    if (!this.product.attributeValues) {
      this.product.attributeValues = [];
    }
    const index = this.product.attributeValues.findIndex(v => v.attributeId === attributeId);
    if (index > -1) {
      this.product.attributeValues[index].value = value;
    } else {
      this.product.attributeValues.push({ attributeId, value });
    }
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
      useGlobal: true,
      trackBundleGtn: true,
      isTaxInclusive: false,
      isActive: true,
      productType: 'simple',
      bundleItems: [],
      attributeValues: [],
      templateId: undefined,
      parentId: undefined,
    };
  }
}
