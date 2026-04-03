import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzCardModule } from 'ng-zorro-antd/card';
import { TitleCasePipe } from '@angular/common';
import { Attribute, AttributeService } from '../product/attribute-service';

@Component({
  selector: 'app-attributes',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzSwitchModule,
    NzIconModule,
    NzPopconfirmModule,
    NzTooltipModule,
    NzCardModule,
    TitleCasePipe,
  ],
  templateUrl: './attributes.html',
})
export class Attributes implements OnInit {
  private attributeService = inject(AttributeService);
  private fb = inject(FormBuilder);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);

  attributes: Attribute[] = [];
  loading = false;
  editingAttribute: Attribute | null = null;
  
  // Form properties
  attributeForm!: FormGroup;
  isModalVisible = false;

  types = [
    { label: 'Single Select', value: 'single_select' },
    { label: 'Multi Select', value: 'multi_select' },
    { label: 'Text', value: 'text' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
  ];

  ngOnInit(): void {
    this.loadAttributes();
    this.initForm();
  }

  loadAttributes(): void {
    this.loading = true;
    this.attributeService.getAttributes().subscribe({
      next: (data) => {
        this.attributes = data;
        this.loading = false;
      },
      error: () => {
        this.message.error('Failed to load attributes');
        this.loading = false;
      }
    });
  }

  initForm(): void {
    this.attributeForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      type: ['text', [Validators.required]],
      options: [[]],
      defaultValue: [null],
      isActive: [true]
    });
  }

  showModal(attribute?: Attribute): void {
    this.isModalVisible = true;
    this.editingAttribute = attribute || null;
    
    if (attribute) {
      this.attributeForm.patchValue({
        name: attribute.name,
        description: attribute.description,
        type: attribute.type,
        options: attribute.options || [],
        defaultValue: attribute.defaultValue,
        isActive: attribute.isActive
      });
    } else {
      this.attributeForm.reset({
        type: 'text',
        isActive: true,
        options: []
      });
    }
  }

  handleCancel(): void {
    this.isModalVisible = false;
    this.editingAttribute = null;
  }

  handleOk(): void {
    if (this.attributeForm.valid) {
      const data = this.attributeForm.value;
      
      if (this.editingAttribute) {
        this.attributeService.updateAttribute(this.editingAttribute.id!, data).subscribe({
          next: () => {
            this.message.success('Attribute updated');
            this.loadAttributes();
            this.handleCancel();
          },
          error: () => this.message.error('Update failed')
        });
      } else {
        this.attributeService.createAttribute(data).subscribe({
          next: () => {
            this.message.success('Attribute created');
            this.loadAttributes();
            this.handleCancel();
          },
          error: () => this.message.error('Creation failed')
        });
      }
    } else {
      Object.values(this.attributeForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  deleteAttribute(id: number): void {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this attribute?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.attributeService.deleteAttribute(id).subscribe({
          next: () => {
            this.message.success('Attribute deleted');
            this.loadAttributes();
          },
          error: () => this.message.error('Deletion failed')
        });
      }
    });
  }

  get showOptions(): boolean {
    const type = this.attributeForm.get('type')?.value;
    return type === 'single_select' || type === 'multi_select';
  }
}
