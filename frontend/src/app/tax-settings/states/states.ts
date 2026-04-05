import { Component, inject, OnInit, signal } from '@angular/core';
import { PermissionService } from '../../auth/permission.service';
import { StateService, State } from './state-service';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-states',
  imports: [
    CommonModule, FormsModule,
    NzAlertModule, NzCardModule, NzFormModule, NzInputModule,
    NzButtonModule, NzIconModule, NzCheckboxModule, NzTableModule,
    NzTagModule, NzPopconfirmModule
  ],
  templateUrl: './states.html',
})
export class States implements OnInit {
  private stateService = inject(StateService);
  public permissionService = inject(PermissionService);

  error: string | null = null;

  // State Form
  loadingStates = false;
  states = signal<State[]>([]);
  editingState: State | null = null;
  stateForm: Partial<State> = this.defaultStateForm();

  ngOnInit(): void {
    this.loadStates();
  }

  // --- State Actions ---

  loadStates() {
    this.loadingStates = true;
    this.stateService.getAll().subscribe({
      next: (res) => {
        this.states.set(res.data);
        this.loadingStates = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load states';
        this.loadingStates = false;
      },
    });
  }

  defaultStateForm(): Partial<State> {
    return {
      stateName: '',
      stateCode: '',
      stateShortCode: '',
      countryCode: 'IN',
      isUnionTerritory: false,
      isActive: true,
    };
  }

  addState() {
    this.stateService.create(this.stateForm).subscribe({
      next: () => {
        this.stateForm = this.defaultStateForm();
        this.loadStates();
        this.error = null;
      },
      error: (err) => { this.error = err.error?.error || 'Failed to add state'; },
    });
  }

  startEditState(state: State) {
    this.editingState = { ...state };
    this.stateForm = { ...state };
  }

  saveEditState() {
    if (!this.editingState) return;
    this.stateService.update(this.editingState.id, this.stateForm).subscribe({
      next: () => {
        this.editingState = null;
        this.stateForm = this.defaultStateForm();
        this.loadStates();
        this.error = null;
      },
      error: (err) => { this.error = err.error?.error || 'Failed to update state'; },
    });
  }

  cancelEditState() {
    this.editingState = null;
    this.stateForm = this.defaultStateForm();
  }

  deleteState(state: State) {
    this.stateService.delete(state.id).subscribe({
      next: () => this.loadStates(),
      error: (err) => { this.error = err.error?.error || 'Failed to delete state'; },
    });
  }
}
