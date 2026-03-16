import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { type Category, CategoryService } from '../category/category-service';
import { getLocalYYYYMMDD } from '../utils/datefns';
import { type Register, RegisterService } from './register-service';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

@Component({
  selector: 'app-registers',
  imports: [
    FormsModule, ReactiveFormsModule, TranslatePipe, CommonModule,
    NzTableModule, NzFormModule, NzInputModule, NzSelectModule, NzButtonModule,
    NzIconModule, NzSwitchModule, NzDatePickerModule, NzAlertModule, NzTooltipModule,
    NzPopconfirmModule, NzCardModule, NzInputNumberModule, NzCheckboxModule,
  ],
  templateUrl: './registers.html',
})
export class Registers implements OnInit {
  private registerService = inject(RegisterService);
  private categoryService = inject(CategoryService);

  registers = signal<Register[]>([]);
  categories = signal<Category[]>([]);

  editingRegister: Partial<Register> = {
    id: undefined, // for editing
    name: '',
    description: '',
    categoryId: undefined,
    amount: undefined,
    date: '',
    categoryType: undefined,
    isActive: true,
  };

  editingRegisterDate: Date | null = null;

  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadCategories();
    this.loadRegisters();
  }

  loadCategories() {
    this.categoryService.getAll().subscribe((categories) => this.categories.set(categories.data));
  }

  loadRegisters() {
    this.loading = true;
    this.registerService.getAll().subscribe({
      next: (res: Register[]) => {
        this.registers.set(res);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load registers';
        this.loading = false;
      },
    });
  }

  toggleActive(reg: Register) {
    this.registerService.update(reg.id, { isActive: !reg.isActive }).subscribe({
      next: () => this.loadRegisters(),
    });
  }

  // HTML Template code: [compareWith]="compareCategory"
  // compareCategory(obj1: Partial<Category>, obj2: Partial<Category>): boolean {
  //   return obj1 && obj2 ? obj1.id === obj2.id : obj1 === obj2;
  // }

  onSubmit() {
    this.editingRegister.date = this.editingRegisterDate ? getLocalYYYYMMDD(this.editingRegisterDate) : '';
    // this.editingRegister.categoryId = this.editingRegister.categoryId;
    const request$ = this.editingRegister.id
      ? this.registerService.update(this.editingRegister.id, this.editingRegister)
      : this.registerService.create(this.editingRegister);

    request$.subscribe({
      next: () => {
        this.onCancel();
        this.loadRegisters();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to save register';
      },
    });
  }

  onCancel() {
    this.editingRegister = {
      id: undefined,
      name: '',
      description: '',
      categoryId: undefined,
      amount: undefined,
      date: undefined,
      categoryName: undefined,
      categoryType: undefined,
      isActive: true,
    };
    this.editingRegisterDate = null;
  }

  editRegister(id: number) {
    this.registerService.getById(id).subscribe((res: Register) => {
      this.editingRegister.id = res.id;
      this.editingRegister.name = res.name;
      this.editingRegister.description = res.description;
      this.editingRegister.categoryId = res.categoryId;
      this.editingRegister.amount = res.amount;
      this.editingRegister.date = res.date;
      this.editingRegister.categoryName = res.categoryName;
      this.editingRegister.categoryType = res.categoryType;
      this.editingRegister.isActive = res.isActive;
      this.editingRegisterDate = res.date ? new Date(res.date + 'T00:00:00') : null;
    });
  }

  deleteRegister(id: number) {
    this.registerService.delete(id).subscribe(() => this.loadRegisters());
  }
}
