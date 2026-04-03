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
import { Attribute, AttributeService } from '../product/attribute-service';
import { ProductTemplate, ProductTemplateService } from './product-template-service';

@Component({
  selector: 'app-product-templates',
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
  ],
  templateUrl: './product-templates.html',
})
export class ProductTemplates implements OnInit {
  private templateService = inject(ProductTemplateService);
  private attributeService = inject(AttributeService);
  private fb = inject(FormBuilder);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);

  templates: ProductTemplate[] = [];
  allAttributes: Attribute[] = [];
  loading = false;
  editingTemplate: ProductTemplate | null = null;
  
  templateForm!: FormGroup;
  isModalVisible = false;

  get mappedAttributesFormArray() {
    return this.templateForm.get('mappedAttributes')?.value as any[];
  }

  ngOnInit(): void {
    this.loadTemplates();
    this.loadAttributes();
    this.initForm();
  }

  loadTemplates(): void {
    this.loading = true;
    this.templateService.getTemplates().subscribe({
      next: (data) => {
        this.templates = data;
        this.loading = false;
      },
      error: () => {
        this.message.error('Failed to load product templates');
        this.loading = false;
      }
    });
  }

  loadAttributes(): void {
    this.attributeService.getAttributes().subscribe(attrs => this.allAttributes = attrs);
  }

  initForm(): void {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      isActive: [true],
      mappedAttributes: [[]]
    });
  }

  showModal(template?: ProductTemplate): void {
    this.isModalVisible = true;
    this.editingTemplate = template || null;
    
    if (template) {
      this.templateForm.patchValue({
        name: template.name,
        description: template.description,
        isActive: template.isActive,
        mappedAttributes: template.mappedAttributes ? [...template.mappedAttributes] : []
      });
    } else {
      this.templateForm.reset({
        isActive: true,
        mappedAttributes: []
      });
    }
  }

  handleCancel(): void {
    this.isModalVisible = false;
    this.editingTemplate = null;
  }

  handleOk(): void {
    if (this.templateForm.valid) {
      const data = this.templateForm.value;
      
      if (this.editingTemplate) {
        this.templateService.updateTemplate(this.editingTemplate.id!, data).subscribe({
          next: () => {
            this.message.success('Template updated');
            this.loadTemplates();
            this.handleCancel();
          },
          error: () => this.message.error('Update failed')
        });
      } else {
        this.templateService.createTemplate(data).subscribe({
          next: () => {
            this.message.success('Template created');
            this.loadTemplates();
            this.handleCancel();
          },
          error: () => this.message.error('Creation failed')
        });
      }
    } else {
      Object.values(this.templateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  deleteTemplate(id: number): void {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this template?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.templateService.deleteTemplate(id).subscribe({
          next: () => {
            this.message.success('Template deleted');
            this.loadTemplates();
          },
          error: () => this.message.error('Deletion failed')
        });
      }
    });
  }

  addAttribute(): void {
    const current = this.templateForm.get('mappedAttributes')?.value || [];
    this.templateForm.patchValue({ mappedAttributes: [...current, { attributeId: null, isVariantDefining: false }] });
  }

  removeAttribute(index: number): void {
    const current = [...(this.templateForm.get('mappedAttributes')?.value || [])];
    current.splice(index, 1);
    this.templateForm.patchValue({ mappedAttributes: current });
  }

  updateAttribute(index: number, key: string, value: any): void {
    const current = [...(this.templateForm.get('mappedAttributes')?.value || [])];
    current[index][key] = value;
    this.templateForm.patchValue({ mappedAttributes: current });
  }
}
