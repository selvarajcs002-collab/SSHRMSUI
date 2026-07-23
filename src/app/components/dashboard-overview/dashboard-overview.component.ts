import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmsApiService } from '../../services/ems-api.service';

interface RosterItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  designation: string;
  profilePicture: string | null;
  status: 'Working' | 'On Leave' | 'Idle';
  machineAllocation: string;
  shiftType: string;
}

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overview-container">
      
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card total-card">
          <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
          <div class="stat-info">
            <span class="stat-label">Total Active Staff</span>
            <h3 class="stat-value">{{ stats.total }}</h3>
          </div>
        </div>

        <div class="stat-card working-card">
          <div class="stat-icon"><i class="fa-solid fa-user-check"></i></div>
          <div class="stat-info">
            <span class="stat-label">Working Today</span>
            <h3 class="stat-value">{{ stats.working }}</h3>
          </div>
        </div>

        <div class="stat-card idle-card">
          <div class="stat-icon"><i class="fa-solid fa-user-slash"></i></div>
          <div class="stat-info">
            <span class="stat-label">Idle Staff</span>
            <h3 class="stat-value">{{ stats.idle }}</h3>
          </div>
        </div>

        <div class="stat-card leave-card">
          <div class="stat-icon"><i class="fa-solid fa-umbrella-beach"></i></div>
          <div class="stat-info">
            <span class="stat-label">On Leave</span>
            <h3 class="stat-value">{{ stats.leave }}</h3>
          </div>
        </div>
      </div>

      <!-- Live Roster Directory -->
      <div class="glass-card roster-card">
        <div class="roster-header">
          <div class="title-section">
            <h3>Live Roster & Workstations</h3>
          </div>
          
          <div class="action-section">
            <!-- Search -->
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="filterRoster()" 
                placeholder="Search roster..." 
              />
            </div>
            
            <!-- Filter badges -->
            <div class="filter-group">
              <button 
                [class.active]="selectedFilter === 'All'" 
                (click)="setFilter('All')"
                class="filter-btn"
              >
                All ({{ stats.total }})
              </button>
              <button 
                [class.active]="selectedFilter === 'Working'" 
                (click)="setFilter('Working')"
                class="filter-btn status-working"
              >
                Working ({{ stats.working }})
              </button>
              <button 
                [class.active]="selectedFilter === 'Idle'" 
                (click)="setFilter('Idle')"
                class="filter-btn status-idle"
              >
                Idle ({{ stats.idle }})
              </button>
              <button 
                [class.active]="selectedFilter === 'On Leave'" 
                (click)="setFilter('On Leave')"
                class="filter-btn status-leave"
              >
                On Leave ({{ stats.leave }})
              </button>
            </div>
          </div>
        </div>

        <!-- Roster Table -->
        <div *ngIf="isLoading" class="loading-state">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <span>Loading today's roster...</span>
        </div>

        <div *ngIf="!isLoading && filteredRoster.length === 0" class="empty-state">
          <i class="fa-solid fa-users-slash"></i>
          <span>No employees found matching the criteria.</span>
        </div>

        <div *ngIf="!isLoading && filteredRoster.length > 0" class="table-responsive">
          <table class="ems-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee Code</th>
                <th>Designation</th>
                <th>Shift</th>
                <th>Workstation / Machine</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let emp of filteredRoster" class="roster-row">
                <td>
                  <div class="emp-profile">
                    <img 
                      *ngIf="emp.profilePicture" 
                      [src]="emp.profilePicture" 
                      alt="Profile" 
                      class="profile-img"
                    />
                    <div *ngIf="!emp.profilePicture" class="profile-avatar">
                      {{ emp.fullName?.charAt(0) || '' }}
                    </div>
                    <div class="emp-names">
                      <span class="emp-fullname">{{ emp.fullName }}</span>
                    </div>
                  </div>
                </td>
                <td><span class="code-badge">{{ emp.employeeCode }}</span></td>
                <td>{{ emp.designation || 'N/A' }}</td>
                <td><span class="shift-lbl" *ngIf="emp.status === 'Working'">{{ emp.shiftType }}</span></td>
                <td>
                  <div class="workstation-info">
                    <span 
                      [class.assigned]="emp.status === 'Working'"
                      [class.not-assigned]="emp.status !== 'Working'"
                    >
                      <i 
                        [class]="emp.status === 'Working' ? 'fa-solid fa-desktop' : 'fa-solid fa-ban'"
                      ></i>
                      {{ emp.machineAllocation }}
                    </span>
                  </div>
                </td>
                <td>
                  <span 
                    class="badge" 
                    [class.badge-success]="emp.status === 'Working'"
                    [class.badge-warning]="emp.status === 'Idle'"
                    [class.badge-danger]="emp.status === 'On Leave'"
                  >
                    {{ emp.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .overview-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Stats Cards Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
      margin-top: 0.15rem;
    }

    /* Card coloring variants */
    .total-card { border-left: 4px solid var(--color-primary); }
    .total-card .stat-icon { background-color: var(--color-primary-glow); color: var(--color-primary); }
    
    .working-card { border-left: 4px solid var(--color-success); }
    .working-card .stat-icon { background-color: var(--color-success-bg); color: var(--color-success); }

    .idle-card { border-left: 4px solid var(--color-warning); }
    .idle-card .stat-icon { background-color: var(--color-warning-bg); color: var(--color-warning); }

    .leave-card { border-left: 4px solid var(--color-error); }
    .leave-card .stat-icon { background-color: var(--color-error-bg); color: var(--color-error); }

    /* Roster Card Section */
    .roster-card {
      padding: 2rem;
    }
    .roster-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1.5rem;
    }
    .title-section h3 {
      font-size: 1.35rem;
      margin-bottom: 0.35rem;
    }
    .subtitle {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .action-section {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    /* Search Box */
    .search-box {
      position: relative;
      width: 250px;
    }
    .search-icon {
      position: absolute;
      left: 0.95rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .search-box input {
      padding-left: 2.25rem;
      font-size: 0.85rem;
    }

    /* Filter Badges */
    .filter-group {
      display: flex;
      gap: 0.5rem;
      background: var(--bg-main);
      padding: 0.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .filter-btn {
      background: transparent;
      border: none;
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-sm);
      font-family: var(--font-family-title);
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
      color: var(--text-secondary);
      transition: var(--transition);
    }
    .filter-btn.active {
      background: #ffffff;
      box-shadow: var(--shadow-sm);
      color: var(--text-primary);
    }
    .filter-btn.active.status-working { color: var(--color-success); }
    .filter-btn.active.status-idle { color: var(--color-warning-hover); }
    .filter-btn.active.status-leave { color: var(--color-error); }

    /* Roster Table */
    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    .ems-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .ems-table th {
      font-family: var(--font-family-title);
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      border-bottom: 1.5px solid var(--border-color);
      padding: 1rem 1.25rem;
    }
    .ems-table td {
      padding: 1.1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: 0.9rem;
    }
    .roster-row {
      transition: var(--transition);
    }
    .roster-row:hover {
      background-color: var(--bg-main);
    }

    /* Profile Cell */
    .emp-profile {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .profile-img {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid var(--border-color);
    }
    .profile-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background-color: var(--color-primary-glow);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      border: 1px solid var(--border-color);
    }
    .emp-names {
      display: flex;
      flex-direction: column;
    }
    .emp-fullname {
      font-weight: 700;
      color: var(--text-primary);
    }
    .emp-email {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .code-badge {
      font-family: monospace;
      font-size: 0.85rem;
      font-weight: 700;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
    }

    /* Workstation / Shift Allocation Column */
    .workstation-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .workstation-info span.assigned {
      color: var(--color-success-hover);
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .workstation-info span.not-assigned {
      color: var(--text-muted);
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
    }
    .shift-lbl {
      font-size: 0.85rem;
      color: var(--color-primary);
      font-weight: 700;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    /* Badges */
    .badge {
      display: inline-flex;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .badge-success {
      background-color: var(--color-success-bg);
      color: var(--color-success);
    }
    .badge-warning {
      background-color: var(--color-warning-bg);
      color: var(--color-warning-hover);
    }
    .badge-danger {
      background-color: var(--color-error-bg);
      color: var(--color-error);
    }

    /* States */
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;
      color: var(--text-secondary);
    }
    .loading-state i {
      font-size: 2.25rem;
      color: var(--color-primary);
    }
    .empty-state i {
      font-size: 3rem;
      color: var(--text-muted);
    }
    .empty-state span {
      font-weight: 600;
    }
  `]
})
export class DashboardOverviewComponent implements OnInit {
  isLoading = true;
  searchQuery = '';
  selectedFilter: 'All' | 'Working' | 'Idle' | 'On Leave' = 'All';

  rosterList: RosterItem[] = [];
  filteredRoster: RosterItem[] = [];

  stats = {
    total: 0,
    working: 0,
    idle: 0,
    leave: 0
  };

  constructor(private apiService: EmsApiService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    
    // Format today's local date as YYYY-MM-DD
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Load employees, leaves, and shifts concurrently
    Promise.all([
      this.apiService.getEmployees(1, 1000).toPromise(),
      this.apiService.getLeaves().toPromise(),
      this.apiService.getAllShiftAssignments().toPromise()
    ]).then(([empRes, leaveRes, shiftRes]) => {
      const employees = empRes?.items || [];
      const leaves = leaveRes || [];
      const shifts = shiftRes || [];

      // Only evaluate active employees (status !== 2/Inactive, or just active ones in general)
      // Standard: Active (1) and Inactive (2). Let's filter out Inactive (2)
      const activeEmployees = employees.filter((e: any) => e.status !== 2 && e.status !== 'Inactive');

      this.rosterList = activeEmployees.map((emp: any) => {
        // 1. Check leave
        // EmsLeaveStatus: Pending = 0, Approved = 1, Rejected = 2
        // EmsLeaveType: Sick = 0, Casual = 1, Earned = 2, Unpaid = 3
        const hasApprovedLeave = leaves.some((l: any) => {
          if (l.employeeId === emp.id) {
            // Check if status is Approved (usually 1 or string "Approved")
            const isApproved = l.status === 1 || l.status === 'Approved';
            if (isApproved) {
              const start = l.startDate; // YYYY-MM-DD
              const end = l.endDate;
              return todayStr >= start && todayStr <= end;
            }
          }
          return false;
        });

        // 2. Check shift assignment
        // EmsShiftType: Day = 0, Night = 1
        const todayShift = shifts.find((s: any) => {
          // Compare assignmentDate (extract YYYY-MM-DD)
          const assignDate = s.assignmentDate.split('T')[0];
          return s.employeeId === emp.id && assignDate === todayStr;
        });

        let status: 'Working' | 'On Leave' | 'Idle' = 'Idle';
        let machineAllocation = 'Not Assigned';
        let shiftType = '';

        if (hasApprovedLeave) {
          status = 'On Leave';
        } else if (todayShift) {
          status = 'Working';
          machineAllocation = todayShift.machineName || 'Not Assigned';
          shiftType = todayShift.shiftType === 1 || todayShift.shiftType === 'Night' ? 'Night Shift' : 'Day Shift';
        }

        return {
          id: emp.id,
          employeeCode: emp.employeeCode,
          firstName: emp.firstName,
          lastName: emp.lastName,
          fullName: emp.fullName,
          email: emp.email,
          designation: emp.designation,
          profilePicture: emp.profilePicture,
          status,
          machineAllocation,
          shiftType
        };
      });

      this.calculateStats();
      this.filterRoster();
      this.isLoading = false;
    }).catch(err => {
      console.error('Error loading dashboard overview data:', err);
      this.isLoading = false;
    });
  }

  calculateStats() {
    this.stats.total = this.rosterList.length;
    this.stats.working = this.rosterList.filter(e => e.status === 'Working').length;
    this.stats.leave = this.rosterList.filter(e => e.status === 'On Leave').length;
    this.stats.idle = this.rosterList.filter(e => e.status === 'Idle').length;
  }

  setFilter(filter: 'All' | 'Working' | 'Idle' | 'On Leave') {
    this.selectedFilter = filter;
    this.filterRoster();
  }

  filterRoster() {
    let list = this.rosterList;

    // Apply status filter
    if (this.selectedFilter !== 'All') {
      list = list.filter(e => e.status === this.selectedFilter);
    }

    // Apply search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(e => 
        e.fullName?.toLowerCase().includes(q) ||
        e.employeeCode?.toLowerCase().includes(q) ||
        (e.designation && e.designation.toLowerCase().includes(q)) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        e.machineAllocation?.toLowerCase().includes(q) ||
        (e.shiftType && e.shiftType.toLowerCase().includes(q))
      );
    }

    this.filteredRoster = list;
  }
}
