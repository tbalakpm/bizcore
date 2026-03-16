import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Address } from '../../customer/customer-service';

import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, NzCollapseModule, NzFormModule, NzInputModule, NzIconModule],
  templateUrl: './address-form.html',
})
export class AddressForm {
  @Input() address: Address = {};
  @Input() title: string = 'Address';
  @Input() isExpandable: boolean = true;
  @Input() isOpen: boolean = false;
  @Input() disabled: boolean = false;

  toggleOpen() {
    this.isOpen = !this.isOpen;
  }
}
