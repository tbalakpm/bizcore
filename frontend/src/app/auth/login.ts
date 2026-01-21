import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from './auth-service';

@Component({
  selector: 'app-login',
  imports: [TranslatePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = false;
  error: string | null = null;

  submit() {
    this.loading = true;
    this.error = null;
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: { error: { error: string } }) => {
        this.loading = false;
        this.error = err.error?.error || 'Login failed';
      },
    });
  }
}
