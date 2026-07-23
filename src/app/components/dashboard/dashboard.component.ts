import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegisterEmployeeComponent } from '../register-employee/register-employee.component';
import { ShiftManagementComponent } from '../shift-management/shift-management.component';
import { AttendanceComponent } from '../attendance/attendance.component';
import { PayrollComponent } from '../payroll/payroll.component';
import { SettingsComponent } from '../settings/settings.component';
import { DashboardOverviewComponent } from '../dashboard-overview/dashboard-overview.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RegisterEmployeeComponent,
    ShiftManagementComponent,
    AttendanceComponent,
    PayrollComponent,
    SettingsComponent,
    DashboardOverviewComponent
  ],
  template: `
    <div class="dashboard-wrapper">
      
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <i class="fa-solid fa-users-gear brand-icon"></i>
          <div>
            <h1>Swift EMS</h1>
            <span>Manager Workspace</span>
          </div>
        </div>

        <nav class="sidebar-menu">
          <!-- Dashboard Overview Tab -->
          <button 
            (click)="setTab('overview')" 
            [class.active]="activeTab === 'overview'"
            class="menu-item"
          >
            <i class="fa-solid fa-chart-line"></i>
            <span>Overview Dashboard</span>
          </button>

          <button 
            (click)="setTab('register')" 
            [class.active]="activeTab === 'register'"
            class="menu-item"
          >
            <i class="fa-solid fa-users"></i>
            <span>Employee Management</span>
          </button>

          <button 
            (click)="setTab('shifts')" 
            [class.active]="activeTab === 'shifts'"
            class="menu-item"
          >
            <i class="fa-solid fa-business-time"></i>
            <span>Shift Management</span>
          </button>

          <button 
            (click)="setTab('attendance')" 
            [class.active]="activeTab === 'attendance'"
            class="menu-item"
          >
            <i class="fa-solid fa-clipboard-user"></i>
            <span>Attendance</span>
          </button>

          <button 
            (click)="setTab('payroll')" 
            [class.active]="activeTab === 'payroll'"
            class="menu-item"
          >
            <i class="fa-solid fa-file-invoice-dollar"></i>
            <span>Payroll</span>
          </button>

          <button 
            (click)="setTab('settings')" 
            [class.active]="activeTab === 'settings'"
            class="menu-item"
          >
            <i class="fa-solid fa-sliders"></i>
            <span>System Settings</span>
          </button>

          <div class="menu-divider"></div>

          <button (click)="onLogout()" class="menu-item logout-btn">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>Logout Portal</span>
          </button>
        </nav>
      </aside>

      <!-- Main Section -->
      <div class="main-content">
        <!-- Top Navbar -->
        <header class="navbar">
          <div class="navbar-left" style="display: flex; flex-direction: column; gap: 0.35rem; justify-content: center;">
            <h2>{{ activeTabTitle }}</h2>
            <div class="breadcrumb-trail">
              <span class="root-crumb" (click)="setTab('overview')" style="cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color=''">DASHBOARD</span>
              <i class="fa-solid fa-chevron-right separator-icon"></i>
              <span class="active-crumb" style="text-transform: uppercase;">{{ activeTabTitle }}</span>
            </div>
          </div>
          
          <div class="navbar-right">
            <div class="time-widget">
              <i class="fa-regular fa-clock clock-icon"></i>
              <span>{{ liveTime }}</span>
            </div>
            <div class="user-profile">
              <div class="user-avatar">
                <i class="fa-solid fa-user-shield"></i>
              </div>
              <div class="user-details">
                <span class="user-name">Administrator</span>
                <span class="user-email">{{ userEmail }}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- View Container -->
        <main class="view-container">
          <app-dashboard-overview *ngIf="activeTab === 'overview'"></app-dashboard-overview>
          <app-register-employee *ngIf="activeTab === 'register'"></app-register-employee>
          <app-shift-management *ngIf="activeTab === 'shifts'"></app-shift-management>
          <app-attendance *ngIf="activeTab === 'attendance'"></app-attendance>
          <app-payroll *ngIf="activeTab === 'payroll'"></app-payroll>
          <app-settings *ngIf="activeTab === 'settings'"></app-settings>
        </main>
      </div>

    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      display: flex;
      min-height: 100vh;
      background-color: var(--bg-main);
      gap: 1.5rem;
      padding-right: 1.5rem;
    }
    
    /* Sidebar styling */
    .sidebar {
      width: 270px;
      background-color: #1e293b;
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 2.25rem;
      flex-shrink: 0;
      padding: 2rem 1.25rem;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
      min-height: 100vh;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding-left: 0.5rem;
    }
    .sidebar-brand h1 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.1;
    }
    .sidebar-brand span {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .brand-icon {
      font-size: 2rem;
      color: #3b82f6;
    }
    .sidebar-menu {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }
    .menu-item {
      background: none;
      border: none;
      padding: 0.8rem 1.1rem;
      border-radius: var(--radius-md);
      color: #cbd5e1;
      font-family: var(--font-family-title);
      font-weight: 600;
      font-size: 0.925rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      transition: var(--transition);
      text-align: left;
      width: 100%;
    }
    .menu-item i {
      font-size: 1.15rem;
      color: #94a3b8;
      transition: var(--transition);
      width: 24px;
      text-align: center;
    }
    .menu-item:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: #ffffff;
    }
    .menu-item:hover i {
      color: #ffffff;
    }
    .menu-item.active {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    }
    .menu-item.active i {
      color: #ffffff;
    }
    .menu-divider {
      height: 1px;
      background-color: #334155;
      margin: 1rem 0;
    }
    .logout-btn {
      color: var(--color-error);
      margin-top: auto;
    }
    .logout-btn i {
      color: var(--color-error);
    }
    .logout-btn:hover {
      background-color: var(--color-error-bg);
      color: var(--color-error-hover);
    }
    .logout-btn:hover i {
      color: var(--color-error-hover);
    }

    /* Main Section */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      min-width: 0;
      padding-top: 1.5rem;
    }

    /* Navbar styling */
    .navbar {
      background-color: transparent;
      border: none;
      box-shadow: none;
      height: 70px;
      padding: 0 1.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 1.5rem;
      z-index: 100;
    }
    .breadcrumb-trail {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.15rem;
    }
    .root-crumb {
      color: var(--text-muted);
    }
    .active-crumb {
      color: var(--color-primary);
    }
    .separator-icon {
      font-size: 0.65rem;
      color: var(--text-muted);
    }
    .navbar h2 {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }
    .navbar-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .time-widget {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 600;
      border-right: 1px solid var(--border-color);
      padding-right: 1.5rem;
      height: 36px;
    }
    .clock-icon {
      color: var(--color-primary);
    }
    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: var(--color-primary-glow);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
      font-size: 1rem;
    }
    .user-details {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }
    .user-email {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* View Container */
    .view-container {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 2rem;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeTab = 'overview'; // default tab (Overview Dashboard)
  activeTabTitle = 'Overview Dashboard';
  userEmail = 'admin@ems.local';
  liveTime = '';
  private timerId: any;

  constructor(private router: Router) {
    const token = localStorage.getItem('ems_token');
    if (!token) {
      this.router.navigate(['/login']);
    }
    
    const savedEmail = localStorage.getItem('ems_user_email');
    if (savedEmail) {
      this.userEmail = savedEmail;
    }
  }

  ngOnInit() {
    this.updateTime();
    this.timerId = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  updateTime() {
    const now = new Date();
    this.liveTime = now.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    switch(tab) {
      case 'overview': this.activeTabTitle = 'Overview Dashboard'; break;
      case 'register': this.activeTabTitle = 'Employee Management'; break;
      case 'departments': this.activeTabTitle = 'Department Directory'; break;
      case 'leaves': this.activeTabTitle = 'Leave Management'; break;
      case 'shifts': this.activeTabTitle = 'Shift Management'; break;
      case 'attendance': this.activeTabTitle = 'Attendance'; break;
      case 'payroll': this.activeTabTitle = 'Payroll'; break;
      case 'settings': this.activeTabTitle = 'Configuration Settings'; break;
    }
  }

  onLogout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      this.router.navigate(['/login']);
    }
  }
}
