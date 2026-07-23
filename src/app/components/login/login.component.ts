import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmsApiService } from '../../services/ems-api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="glass-card login-card animate-fade-in">
        <div class="logo-area">
          <i class="fa-solid fa-users-gear glow-icon"></i>
          <h2>EMS PORTAL</h2>
          <p>Employee Management System</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <div class="input-wrapper">
              <i class="fa-solid fa-envelope"></i>
              <input 
                type="email" 
                id="email" 
                name="email" 
                [(ngModel)]="email" 
                placeholder="admin@ems.local" 
                required 
                #emailInput="ngModel"
              />
            </div>
            <div *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)" class="error-text">
              Email is required.
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <i class="fa-solid fa-lock"></i>
              <input 
                type="password" 
                id="password" 
                name="password" 
                [(ngModel)]="password" 
                placeholder="••••••••" 
                required
                #passInput="ngModel"
              />
            </div>
            <div *ngIf="passInput.invalid && (passInput.dirty || passInput.touched)" class="error-text">
              Password is required.
            </div>
          </div>

          <div class="help-box">
            <span>Demo credentials:</span>
            <code>admin&#64;ems.local / admin123</code>
          </div>

          <div *ngIf="errorMessage" class="alert-error animate-fade-in">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <button type="submit" [disabled]="loginForm.invalid || isLoading" class="btn btn-primary btn-block">
            <span *ngIf="!isLoading">Login Securely</span>
            <i *ngIf="isLoading" class="fa-solid fa-circle-notch fa-spin"></i>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle at 10% 20%, HSL(222, 47%, 7%) 0%, HSL(224, 60%, 15%) 90%);
      padding: 1.5rem;
    }
    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 3rem 2.5rem;
    }
    .logo-area {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .glow-icon {
      font-size: 3rem;
      background: var(--grad-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
      filter: drop-shadow(0 0 10px var(--color-primary-glow));
    }
    .logo-area h2 {
      font-size: 1.75rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
      letter-spacing: 0.05em;
    }
    .logo-area p {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-wrapper i {
      position: absolute;
      left: 1rem;
      color: var(--text-muted);
      font-size: 1.1rem;
      pointer-events: none;
      transition: var(--transition);
    }
    .input-wrapper input {
      padding-left: 2.75rem;
    }
    .input-wrapper input:focus + i {
      color: var(--color-primary);
      filter: drop-shadow(0 0 4px var(--color-primary-glow));
    }
    .help-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px dashed var(--border-glass);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.825rem;
    }
    .help-box span {
      color: var(--text-secondary);
    }
    .help-box code {
      color: var(--color-accent);
      background: rgba(0, 230, 255, 0.1);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--color-error);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
    }
    .btn-block {
      width: 100%;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(private apiService: EmsApiService, private router: Router) {
    // Redirect if already logged in
    if (localStorage.getItem('ems_token')) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      email_Id: this.email,
      password: this.password
    };

    this.apiService.login(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        localStorage.setItem('ems_token', res.token);
        localStorage.setItem('ems_user_email', res.email_Id);
        localStorage.setItem('ems_user_id', res.userId);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 400 || err.status === 401) {
          this.errorMessage = err.error?.message || 'Invalid email or password.';
        } else {
          this.errorMessage = 'Could not connect to the backend server. Make sure the API is running.';
        }
      }
    });
  }
}
