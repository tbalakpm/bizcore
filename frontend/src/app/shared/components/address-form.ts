import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Address } from '../../customer/customer-service';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
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
