import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Address } from '../../customer/customer-service';
import { StateService, State } from '../../tax-settings/states/state-service';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NgIf, NgFor } from '@angular/common';

import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [NgTemplateOutlet, FormsModule, TranslatePipe, NzCollapseModule, NzFormModule, NzInputModule, NzIconModule, NzSelectModule],
  templateUrl: './address-form.html',
})
export class AddressForm implements OnInit {
  @Input() address: Address = {};
  @Input() title: string = 'Address';
  @Input() isExpandable: boolean = true;
  @Input() isOpen: boolean = false;
  @Input() disabled: boolean = false;

  private stateService = inject(StateService);
  states: State[] = [];

  ngOnInit() {
    this.stateService.getAll().subscribe(res => {
      this.states = res.data;
    });
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
  }
}
