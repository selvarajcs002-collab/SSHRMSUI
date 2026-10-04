import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  submitted = false;
  errorMessage = '';
  showPassword = false;
  returnUrl = '/employee-registration';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    // Redirect to employee registration if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/employee-registration']);
    }
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      rememberMe: [false]
    });

    // Get return url from route parameters or default to '/employee-registration'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/employee-registration';
  }

  // Convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    // Simulate Remember me (save preference)
    if (this.f['rememberMe'].value) {
      localStorage.setItem('ems_remember_me', 'true');
      localStorage.setItem('ems_saved_username', this.f['username'].value.trim());
    } else {
      localStorage.removeItem('ems_remember_me');
      localStorage.removeItem('ems_saved_username');
    }

    const credentials = {
      email: this.f['username'].value.trim(),
      password: this.f['password'].value
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Unable to sign in right now. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    // Placeholder for forgot password logic
    alert('Forgot password functionality will be implemented soon.');
  }
}
