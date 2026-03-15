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
import { LucideAngularModule } from 'lucide-angular';
import { TooltipDirective } from '../shared/directives/tooltip.directive';

@Component({
  selector: 'app-entries',
  imports: [FormsModule, ReactiveFormsModule, DecimalPipe, TranslatePipe, DatePipe, LucideAngularModule, TooltipDirective],
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

  startDate!: string;
  endDate!: string;

  editingEntry: Partial<Entry> = {
    id: undefined, // for editing purpose
    date: '',
    registerId: undefined,
    description: '',
    amount: 0,
  };

  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    const today = new Date();

    const monthEnd = getLocalYYYYMMDD(today);
    const monthStart = getLocalYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), 1));

    this.startDate = monthStart;
    this.endDate = monthEnd;

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
    this.entryService.getEntries(this.startDate, this.endDate).subscribe({
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
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load entry';
      },
    });
  }

  deleteEntry(id: number) {
    if (!confirm('Delete this entry?')) return;
    this.entryService.delete(id).subscribe(() => this.loadEntries());
  }
}
