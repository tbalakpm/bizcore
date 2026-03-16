/** biome-ignore-all lint/style/useImportType: Ignore */
/** biome-ignore-all lint/suspicious/noAssignInExpressions: Ignore */

import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Register, RegisterService } from '../register/register-service';
// import { type Category, CategoryService } from '../category/category-service';
import { getLocalYYYYMMDD } from '../utils/datefns';
import { type Entry, type EntryListResponse, EntryService } from './entry-service';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

@Component({
  selector: 'app-entries',
  imports: [
    FormsModule, ReactiveFormsModule, DecimalPipe, TranslatePipe, DatePipe,
    NzTableModule, NzFormModule, NzInputModule, NzSelectModule, NzButtonModule,
    NzIconModule, NzDatePickerModule, NzAlertModule, NzTooltipModule,
    NzPopconfirmModule, NzCardModule, NzInputNumberModule,
  ],
  templateUrl: './entries.html',
})
export class Entries implements OnInit {
  private entryService = inject(EntryService);
  private registerService = inject(RegisterService);
  // private categoryService = inject(CategoryService);

  entries = signal<Entry[]>([]);
  registers = signal<Register[]>([]);
  // categories = signal<Category[]>([]);
  totalExpenses = 0;
  totalIncome = 0;

  startDate: Date | null = null;
  endDate: Date | null = null;

  editingEntry: Partial<Entry> = {
    id: undefined, // for editing purpose
    date: '',
    registerId: undefined,
    description: '',
    amount: 0,
  };

  editingEntryDate: Date | null = null;

  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    const today = new Date();

    this.endDate = today;
    this.startDate = new Date(today.getFullYear(), today.getMonth(), 1);

    // this.loadCategories();
    this.loadRegisters();
    this.loadEntries();
  }

  loadRegisters() {
    this.registerService.getAll().subscribe((registers) => this.registers.set(registers));
  }

  // loadCategories() {
  //   this.categoryService.getAll().subscribe((categories) => this.categories.set(categories));
  // }

  loadEntries() {
    this.loading = true;
    const start = this.startDate ? getLocalYYYYMMDD(this.startDate) : undefined;
    const end = this.endDate ? getLocalYYYYMMDD(this.endDate) : undefined;
    this.entryService.getEntries(start, end).subscribe({
      next: (res: EntryListResponse) => {
        this.entries.set(res.items);
        this.totalExpenses = res.totalExpenses;
        this.totalIncome = res.totalIncome;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load entries';
        this.loading = false;
      },
    });
  }

  onFilter() {
    this.loadEntries();
  }

  onSubmit() {
    this.editingEntry.date = this.editingEntryDate ? getLocalYYYYMMDD(this.editingEntryDate) : '';
    if (!this.editingEntry.amount || !this.editingEntry.date) return;

    const request$ = this.editingEntry.id
      ? this.entryService.update(this.editingEntry.id, this.editingEntry)
      : this.entryService.create(this.editingEntry);

    request$.subscribe({
      next: () => {
        this.onCancelEdit(this.editingEntry.date);
        this.loadEntries();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to save entry';
      },
    });
  }

  onCancelEdit(defaultDate: string | undefined = undefined) {
    this.editingEntry = {
      id: undefined,
      date: defaultDate || '',
      registerId: undefined,
      description: '',
      amount: 0,
    };
    this.editingEntryDate = defaultDate ? new Date(defaultDate + 'T00:00:00') : null;
  }

  editEntry(id: number) {
    this.entryService.get(id).subscribe({
      next: (entry) => {
        this.editingEntry = {
          id: entry.id,
          date: entry.date,
          registerId: entry.registerId,
          description: entry.description,
          amount: entry.amount,
        };
        this.editingEntryDate = entry.date ? new Date(entry.date + 'T00:00:00') : null;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load entry';
      },
    });
  }

  deleteEntry(id: number) {
    this.entryService.delete(id).subscribe(() => this.loadEntries());
  }
}
