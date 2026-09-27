import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <i class="fa-solid fa-layer-group brand-icon"></i>
          <div>
            <h1>S.S. Embroidery</h1>
            <span>HRMS</span>
          </div>
        </div>

        <nav class="sidebar-menu">
          <a routerLink="/employee-registration" routerLinkActive="active" class="menu-item">
            <i class="fa-solid fa-users"></i>
            <span>Employee Registration</span>
          </a>

          <a routerLink="/assign-shift" routerLinkActive="active" class="menu-item">
            <i class="fa-solid fa-business-time"></i>
            <span>Assign Shift</span>
          </a>

          <a routerLink="/attendance-management" routerLinkActive="active" class="menu-item">
            <i class="fa-solid fa-clipboard-user"></i>
            <span>Attendance Management</span>
          </a>

          <a routerLink="/salary-management" routerLinkActive="active" class="menu-item">
            <i class="fa-solid fa-file-invoice-dollar"></i>
            <span>Salary Management</span>
          </a>

          <div class="menu-divider"></div>

          <a routerLink="#" class="menu-item">
            <i class="fa-solid fa-chart-line"></i>
            <span>Dashboard</span>
          </a>

          <a routerLink="#" class="menu-item">
            <i class="fa-solid fa-sliders"></i>
            <span>Settings</span>
          </a>

          <button (click)="onLogout()" class="menu-item logout-btn">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Top Header -->
        <header class="top-header">
          <div class="header-left">
            <div class="search-bar">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" placeholder="Search employees, pages, anything...">
            </div>
          </div>
          
          <div class="header-right">
            <div class="notifications">
              <i class="fa-regular fa-bell"></i>
              <span class="badge">3</span>
            </div>
            <div class="user-profile">
              <div class="avatar">{{ userInitials }}</div>
              <div class="user-info">
                <span class="user-name">{{ userName }}</span>
                <span class="user-role">Admin</span>
              </div>
              <i class="fa-solid fa-chevron-down"></i>
            </div>
          </div>
        </header>

        <!-- Router Outlet -->
        <main class="page-container">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  userName = 'Administrator';
  userInitials = 'AD';

  constructor(private router: Router, private authService: AuthService) {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.firstName + ' ' + user.lastName;
      this.userInitials = this.getInitials(this.userName);
    }
  }

  ngOnInit() {}

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
