import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from './auth-service';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { PermissionService } from './permission.service';

@Component({
  selector: 'app-login',
  imports: [TranslatePipe, FormsModule, ReactiveFormsModule, NzCardModule, NzFormModule, NzInputModule, NzButtonModule, NzIconModule, NzAlertModule],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private auth = inject(AuthService);
  private permissionService = inject(PermissionService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    if (this.auth.isLoggedIn) {
      const firstReadPermission = this.permissionService.getFirstReadPermission();
      this.router.navigate([`/${firstReadPermission}`]);
    }
  }

  submit() {
    this.loading = true;
    this.error = null;
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        const firstReadPermission = this.permissionService.getFirstReadPermission();
        this.router.navigate([`/${firstReadPermission}`]);
        // const permissions = this.auth.currentUserPermissions as any;
        // const permissionKeys = Object.keys(this.auth.currentUserPermissions);

        // for (const key of permissionKeys) {
        //   if (permissions[key].read) {
        //     this.router.navigate([`/${key}`]);
        //     break;
        //   }
        // }

      },
      error: (err: { error: { error: string } }) => {
        console.error(err.error?.error);
        this.loading = false;
        this.error = err.error?.error || 'Login failed';
      },
    });
  }
}
