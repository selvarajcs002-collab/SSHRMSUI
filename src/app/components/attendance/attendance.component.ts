import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmsApiService } from '../../services/ems-api.service';
import * as XLSX from 'xlsx-js-style';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="attendance-container animate-fade-in">
      
      <!-- Header -->
      <div class="section-title-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
           <h2>Attendance Management</h2>
        </div>
        <button (click)="openExportModal()" class="btn btn-export-excel" style="background-color: #10b981; color: white; border: none; padding: 0.6rem 1.2rem; font-weight: 600; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3), 0 2px 4px -1px rgba(16, 185, 129, 0.2); transition: all 0.2s ease;">
          <i class="fa-solid fa-file-excel" style="margin-right: 0.4rem;"></i> Export Report
        </button>
      </div>

      <!-- Top Widgets -->
      <div class="dashboard-stats-grid mt-3">
        <div class="stat-widget-card">
          <div class="stat-icon-wrapper badge-blue">
            <i class="fa-solid fa-users"></i>
          </div>
          <div class="stat-info">
            <span>Total Employees</span>
            <h3>{{ employees.length }}</h3>
            <div class="stat-trend text-muted">Active staff</div>
          </div>
        </div>

        <div class="stat-widget-card">
          <div class="stat-icon-wrapper badge-green">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div class="stat-info">
            <span>Present Today</span>
            <h3>{{ presentCount }}</h3>
            <div class="stat-trend trend-up">
              <i class="fa-solid fa-circle-arrow-up"></i> {{ presentPct | number:'1.0-1' }}% rate
            </div>
          </div>
        </div>

        <div class="stat-widget-card">
          <div class="stat-icon-wrapper badge-red">
            <i class="fa-solid fa-circle-xmark"></i>
          </div>
          <div class="stat-info">
            <span>Absent Today</span>
            <h3>{{ absentCount }}</h3>
            <div class="stat-trend trend-down">
              <i class="fa-solid fa-circle-arrow-down"></i> {{ absentPct | number:'1.0-1' }}% rate
            </div>
          </div>
        </div>

        <div class="stat-widget-card">
          <div class="stat-icon-wrapper badge-yellow">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="stat-info">
            <span>Half Day Today</span>
            <h3>{{ halfDayCount }}</h3>
            <div class="stat-trend text-muted">Short hours</div>
          </div>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="attendance-layout mt-4">
        
        <!-- Attendance Marking Table -->
        <div class="glass-card p-0 tracker-card">
          <div class="panel-header">
            <h3>Attendance List</h3>
            
            <div class="filter-bar">
              <!-- Date Selector -->
              <input 
                type="date" 
                [(ngModel)]="selectedDate" 
                (change)="onDateChange()" 
                class="date-picker-input"
              />

              <!-- Search -->
              <div class="search-input-box">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input 
                  type="text" 
                  [(ngModel)]="searchQuery" 
                  placeholder="Search employees..." 
                />
              </div>
            </div>
          </div>

          <div *ngIf="isLoading" class="loading-state">
            <i class="fa-solid fa-circle-notch fa-spin text-accent"></i>
            <span>Fetching daily attendance sheets...</span>
          </div>

          <div *ngIf="!isLoading && employees.length === 0" class="empty-state">
            <i class="fa-solid fa-users-slash"></i>
            <span>No active employees registered.</span>
          </div>

          <div *ngIf="!isLoading && employees.length > 0" class="table-wrapper">
            <table class="ems-table">
              <thead>
                <tr>
                  <th style="width: 40px;"><input type="checkbox" (change)="toggleSelectAll($event)" /></th>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Designation</th>
                  <th>Shift</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let emp of getFilteredEmployees()">
                  <td><input type="checkbox" [checked]="selectedEmployees.has(emp.id)" (change)="toggleSelectEmployee(emp.id)" /></td>
                  <td><code class="emp-code-badge">{{ emp.employeeCode }}</code></td>
                  <td>
                    <div class="avatar-cell">
                      <div class="avatar-circle">
                        <img 
                          *ngIf="emp.profilePicture && emp.profilePicture !== 'undefined' && emp.profilePicture !== 'null'" 
                          [src]="emp.profilePicture" 
                          alt="Profile" 
                          class="avatar-img"
                        />
                        <span *ngIf="!emp.profilePicture || emp.profilePicture === 'undefined' || emp.profilePicture === 'null'">
                          {{ getInitials(emp.fullName) }}
                        </span>
                      </div>
                      <span>{{ emp.fullName }}</span>
                    </div>
                  </td>
                  <td><strong>{{ emp.designation || 'N/A' }}</strong></td>
                  <td>
                    <!-- Shift Type linked from active floor shifts -->
                    <span class="badge" [class.badge-blue]="getEmployeeShift(emp.id) === 1" [class.badge-purple]="getEmployeeShift(emp.id) === 2">
                      <i class="fa-solid" [class.fa-sun]="getEmployeeShift(emp.id) === 1" [class.fa-moon]="getEmployeeShift(emp.id) === 2"></i>
                      {{ getEmployeeShift(emp.id) === 1 ? 'Day' : 'Night' }}
                    </span>
                  </td>
                  <td><span class="time-label">{{ getCheckInTime(emp.id) }}</span></td>
                  <td><span class="time-label">{{ getCheckOutTime(emp.id) }}</span></td>
                  <td>
                    <div class="status-toggle-wrapper">
                      <button 
                        (click)="setStatus(emp.id, 'Present')" 
                        [class.active-present]="getStatus(emp.id) === 'Present'"
                        class="toggle-btn present-btn"
                        title="Mark Present"
                      >
                        Present
                      </button>
                      <button 
                        (click)="setStatus(emp.id, 'Absent')" 
                        [class.active-absent]="getStatus(emp.id) === 'Absent'"
                        class="toggle-btn absent-btn"
                        title="Mark Absent"
                      >
                        Absent
                      </button>
                      <button 
                        (click)="setStatus(emp.id, 'Half Day')" 
                        [class.active-halfday]="getStatus(emp.id) === 'Half Day'"
                        class="toggle-btn halfday-btn"
                        title="Mark Half Day"
                      >
                        Half Day
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="panel-footer" *ngIf="employees.length > 0">
            <span>{{ presentCount }} present, {{ absentCount }} absent, {{ halfDayCount }} half-day</span>
            <button (click)="saveDailyAttendance()" [disabled]="isSaving" class="btn btn-success">
              <i class="fa-solid fa-floppy-disk"></i> Save Attendance Logs
            </button>
          </div>
        </div>

      </div>

    </div>

    <!-- Export Modal -->
    <div class="modal-overlay animate-fade-in" *ngIf="isExportModalOpen">
      <div class="modal-card modal-wide animate-fade-in" style="max-width: 550px; background: white; border-radius: 8px; padding: 20px;">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
          <h3>Export Attendance Report</h3>
          <button class="icon-btn" (click)="closeExportModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="padding: 20px 0;">
          <div class="form-group">
            <label>From Date</label>
            <input type="date" [(ngModel)]="exportFromDate" class="form-control" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>
          <div class="form-group mt-3" style="margin-top: 15px;">
            <label>To Date</label>
            <input type="date" [(ngModel)]="exportToDate" class="form-control" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>
        </div>
        <div class="modal-footer" style="display: flex; gap: 1rem; justify-content: flex-end; padding-top: 15px; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-secondary" (click)="closeExportModal()" style="padding: 8px 16px; border: 1px solid #cbd5e1; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button class="btn btn-success" (click)="downloadExcelReport()" [disabled]="isExporting" style="padding: 8px 16px; border: none; background: #10b981; color: white; border-radius: 4px; cursor: pointer;">
            <i class="fa-solid fa-file-excel" *ngIf="!isExporting"></i>
            <i class="fa-solid fa-circle-notch fa-spin" *ngIf="isExporting"></i>
            {{ isExporting ? 'Exporting...' : 'Download' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .attendance-layout {
      display: block;
    }
    @media (max-width: 1100px) {
      .attendance-layout {
        grid-template-columns: 1fr;
      }
    }
    .panel-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1.5px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      background: #ffffff;
    }
    .panel-header h3 {
      font-size: 1.05rem;
      font-weight: 700;
    }
    .filter-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .date-picker-input {
      padding: 0.45rem 0.75rem;
      font-size: 0.85rem;
      width: auto;
    }
    .search-input-box {
      position: relative;
      width: 200px;
    }
    .search-input-box i {
      position: absolute;
      left: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    .search-input-box input {
      padding-left: 2.25rem;
      padding-top: 0.45rem;
      padding-bottom: 0.45rem;
      font-size: 0.85rem;
    }
    .time-label {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--text-secondary);
      font-family: monospace;
    }

    /* Status Toggle Controls */
    .status-toggle-wrapper {
      display: flex;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border-color);
      max-width: 220px;
      box-shadow: var(--shadow-sm);
    }
    .toggle-btn {
      flex: 1;
      border: none;
      padding: 0.4rem 0.65rem;
      background: #ffffff;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 700;
      transition: var(--transition);
      text-align: center;
    }
    .toggle-btn:not(:last-child) {
      border-right: 1px solid var(--border-color);
    }
    .present-btn:hover {
      background-color: var(--color-success-bg);
      color: var(--color-success);
    }
    .absent-btn:hover {
      background-color: var(--color-error-bg);
      color: var(--color-error);
    }
    .halfday-btn:hover {
      background-color: var(--color-warning-bg);
      color: var(--color-warning);
    }
    .active-present {
      background-color: var(--color-success) !important;
      color: #ffffff !important;
    }
    .active-absent {
      background-color: var(--color-error) !important;
      color: #ffffff !important;
    }
    .active-halfday {
      background-color: var(--color-warning) !important;
      color: #ffffff !important;
    }

    /* Stats counts formatting */
    .panel-footer {
      padding: 1.25rem 1.5rem;
      border-top: 1.5px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }
    .panel-footer span {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-secondary);
    }

    /* Monthly standing list styles */
    .summary-sidebar {
      padding: 1.5rem;
    }
    .summary-sidebar h3 {
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
    }
    .summary-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1.25rem;
    }
    .summary-item {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      box-shadow: var(--shadow-sm);
    }
    .sum-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.45rem;
    }
    .sum-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .code-lbl-small {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-primary);
      background: var(--color-primary-glow);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .progress-bar-wrapper {
      height: 6px;
      background-color: var(--bg-main);
      border-radius: 3px;
      overflow: hidden;
      display: flex;
      margin-bottom: 0.45rem;
    }
    .progress-fill {
      height: 100%;
    }
    .fill-present {
      background-color: var(--color-success);
    }
    .fill-absent {
      background-color: var(--color-error);
    }
    .sum-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.725rem;
      font-weight: 600;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 4rem 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    .loading-state i {
      font-size: 2.25rem;
    }
    .empty-state i {
      font-size: 2.5rem;
      color: var(--text-muted);
    }
    .badge i {
      font-size: 0.75rem;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
  `]
})
export class AttendanceComponent implements OnInit {
  selectedDate = (function() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  
  isExportModalOpen = false;
  exportFromDate: string = '';
  exportToDate: string = '';
  isExporting = false;

  employees: any[] = [];
  attendanceMap: { [empId: string]: 'Present' | 'Absent' | 'Half Day' } = {};
  checkInMap: { [empId: string]: string } = {};
  checkOutMap: { [empId: string]: string } = {};
  remarks: { [empId: string]: string } = {};
  
  // Cache of shift assignments to render Shift badges (joined data!)
  shiftAssignmentsMap: { [empId: string]: number } = {};

  selectedEmployees = new Set<string>();
  summaryList: any[] = [];
  searchQuery = '';

  isLoading = false;
  isSaving = false;

  presentCount = 0;
  absentCount = 0;
  halfDayCount = 0;
  presentPct = 0;
  absentPct = 0;

  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();
  currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  constructor(private apiService: EmsApiService) {}

  ngOnInit() {
    this.loadShiftAssignmentsAndAttendance();
    this.loadMonthlySummary();
  }

  onDateChange() {
    const d = new Date(this.selectedDate);
    this.currentMonth = d.getMonth() + 1;
    this.currentYear = d.getFullYear();
    this.currentMonthName = d.toLocaleString('default', { month: 'long' });

    this.loadShiftAssignmentsAndAttendance();
    this.loadMonthlySummary();
  }

  loadShiftAssignmentsAndAttendance() {
    this.isLoading = true;

    // First load shift assignments to link day/night icons
    this.apiService.getAllShiftAssignments().subscribe({
      next: (shifts) => {
        this.shiftAssignmentsMap = {};
        shifts.forEach((asg: any) => {
          // Keep the latest assignment on that date (or general date)
          if (asg.assignmentDate === this.selectedDate || !this.shiftAssignmentsMap[asg.employeeId]) {
            this.shiftAssignmentsMap[asg.employeeId] = asg.shiftType === 'Morning' || asg.shiftType === 1 ? 1 : 2;
          }
        });

        // Next load employees & daily attendance logs
        this.loadDailyAttendance();
      },
      error: () => {
        this.loadDailyAttendance();
      }
    });
  }

  loadDailyAttendance() {
    // 1. Fetch active employees
    this.apiService.getEmployees(1, 1000).subscribe({
      next: (empRes) => {
        // Filter to only those who have a shift assignment for today
        this.employees = empRes.items.filter((e: any) => e.status === 'Active' && this.shiftAssignmentsMap[e.id] !== undefined);

        // 2. Fetch log for selected date
        this.apiService.getDailyAttendance(this.selectedDate).subscribe({
          next: (logRes) => {
            this.attendanceMap = {};
              this.remarks = {};
              this.checkInMap = {};
              this.checkOutMap = {};

            // Map present/absent/halfday records
            logRes.records.forEach((record: any) => {
              if (record.status === 'Present' || record.status === 1) {
                if (record.remarks === 'Half Day') {
                  this.attendanceMap[record.employeeId] = 'Half Day';
                } else {
                  this.attendanceMap[record.employeeId] = 'Present';
                }
              } else {
                this.attendanceMap[record.employeeId] = 'Absent';
              }
              this.remarks[record.employeeId] = record.remarks || '';
                this.checkInMap[record.employeeId] = record.checkInTime || '-';
                this.checkOutMap[record.employeeId] = record.checkOutTime || '-';
            });

            // For any employee not in the daily logs, default to Absent
            this.employees.forEach(emp => {
              if (!this.attendanceMap[emp.id]) {
                this.attendanceMap[emp.id] = 'Absent';
                this.remarks[emp.id] = '';
              }
            });

            this.calculateStats();
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadMonthlySummary() {
    this.apiService.getMonthlyAttendanceSummary(this.currentMonth, this.currentYear).subscribe({
      next: (res) => {
        this.summaryList = res;
      }
    });
  }

  getFilteredEmployees() {
    if (!this.searchQuery) return this.employees;
    const q = this.searchQuery.toLowerCase();
    return this.employees.filter(emp => emp.fullName.toLowerCase().includes(q) || emp.employeeCode.toLowerCase().includes(q));
  }

  calculateStats() {
    let pres = 0;
    let abs = 0;
    let half = 0;

    this.employees.forEach(emp => {
      const status = this.attendanceMap[emp.id] || 'Absent';
      if (status === 'Present') pres++;
      else if (status === 'Absent') abs++;
      else if (status === 'Half Day') half++;
    });

    this.presentCount = pres;
    this.absentCount = abs;
    this.halfDayCount = half;

    const total = this.employees.length || 1;
    this.presentPct = ((pres + half * 0.5) / total) * 100;
    this.absentPct = ((abs + half * 0.5) / total) * 100;
  }

  getStatus(empId: string): 'Present' | 'Absent' | 'Half Day' {
    return this.attendanceMap[empId] || 'Absent';
  }

  setStatus(empId: string, status: 'Present' | 'Absent' | 'Half Day') {
    this.attendanceMap[empId] = status;
    this.calculateStats();
  }

  getEmployeeShift(empId: string): number {
    // Returns 1 = Day Shift, 2 = Night Shift (default to 1 if not assigned)
    return this.shiftAssignmentsMap[empId] || 1;
  }

  getCheckInTime(empId: string): string {
    const status = this.getStatus(empId);
    if (status === 'Absent') return '-';
    return this.checkInMap[empId] || '-';
  }

  getCheckOutTime(empId: string): string {
    const status = this.getStatus(empId);
    if (status === 'Absent') return '-';
    return this.checkOutMap[empId] || '-';
  }

  getInitials(name: string): string {
    if (!name) return 'EE';
    const trimmed = name.trim();
    if (!trimmed) return 'EE';
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  getDeptBadgeClass(deptName: string): string {
    if (!deptName) return 'badge-blue';
    const name = deptName.toLowerCase();
    if (name.includes('eng') || name.includes('dev') || name.includes('tech')) return 'badge-blue';
    if (name.includes('hr')) return 'badge-purple';
    if (name.includes('sale') || name.includes('mark')) return 'badge-orange';
    if (name.includes('fin') || name.includes('acc')) return 'badge-green';
    if (name.includes('prod')) return 'badge-pink';
    if (name.includes('qual')) return 'badge-yellow';
    return 'badge-blue';
  }

  getMockInfo(emp: any): { dept: string, badgeClass: string } {
    const depts = [
      { dept: 'Engineering', badgeClass: 'badge-blue' },
      { dept: 'HR', badgeClass: 'badge-purple' },
      { dept: 'Marketing', badgeClass: 'badge-orange' },
      { dept: 'Finance', badgeClass: 'badge-green' },
      { dept: 'Sales', badgeClass: 'badge-pink' },
      { dept: 'Support', badgeClass: 'badge-yellow' }
    ];
    const hash = emp.id.split('-').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const index = Math.abs(hash) % depts.length;
    return depts[index];
  }

  getProgressPercent(count: number, total: number): number {
    if (total === 0) return 0;
    return (count / total) * 100;
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    if (checked) {
      this.employees.forEach(emp => this.selectedEmployees.add(emp.id));
    } else {
      this.selectedEmployees.clear();
    }
  }

  toggleSelectEmployee(empId: string) {
    if (this.selectedEmployees.has(empId)) {
      this.selectedEmployees.delete(empId);
    } else {
      this.selectedEmployees.add(empId);
    }
  }

  saveDailyAttendance() {
    this.isSaving = true;
    
    const records = this.employees.map(emp => {
      const statusStr = this.attendanceMap[emp.id];
      let dbStatus = 1; // Present
      let dbRemarks = '';

      if (statusStr === 'Absent') {
        dbStatus = 2; // Absent
      } else if (statusStr === 'Half Day') {
        dbStatus = 1; // Present
        dbRemarks = 'Half Day';
      }

      return {
        employeeId: emp.id,
        status: dbStatus,
        remarks: dbRemarks
      };
    });

    const payload = {
      date: this.selectedDate,
      records: records
    };

    this.apiService.markBulkAttendance(payload).subscribe({
      next: () => {
        this.isSaving = false;
        alert('Daily attendance logs saved successfully!');
        this.loadMonthlySummary();
      },
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Error saving daily logs.');
      }
    });
  }


  openExportModal() {
    const today = new Date();
    this.exportToDate = today.toISOString().split('T')[0];
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.exportFromDate = firstDay.toISOString().split('T')[0];
    this.isExportModalOpen = true;
  }

  closeExportModal() {
    this.isExportModalOpen = false;
  }

  downloadExcelReport() {
    if (!this.exportFromDate || !this.exportToDate) {
      alert('Please select both From and To dates.');
      return;
    }
    this.isExporting = true;
    this.apiService.getAttendanceByDateRange(this.exportFromDate, this.exportToDate).subscribe({
      next: (logs) => {
        this.generateExcel(logs);
        this.isExporting = false;
        this.closeExportModal();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to fetch attendance data for export.');
        this.isExporting = false;
      }
    });
  }

    generateExcel(logs: any[]) {
    const rows: any[][] = [];
    const setCell = (r: number, c: number, val: any, style: any = {}) => {
      if (!rows[r]) rows[r] = [];
      rows[r][c] = { v: val, t: typeof val === 'number' ? 'n' : 's', s: style };
    };

    let presentCount = logs.filter(l => l.status === 'Present' || l.status === 1).length;
    let absentCount = logs.filter(l => l.status === 'Absent' || l.status === 2).length;
    let totalRecords = logs.length;

    const titleStyle = { font: { bold: true, sz: 16, color: { rgb: "002060" } }, alignment: { horizontal: "center", vertical: "center" } };
    const subTitleStyle = { font: { bold: true, sz: 11, color: { rgb: "385623" } }, alignment: { horizontal: "center", vertical: "center" } };
    const metaStyle = { font: { bold: true, sz: 9 } };
    const metaValStyle = { font: { sz: 9 } };
    const lineStyle = { top: { style: "thin", color: { rgb: "002060" } } };
    
    const sumHeadStyle = { font: { bold: true, sz: 9, color: { rgb: "385623" } }, fill: { fgColor: { rgb: "E2EFDA" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const sumValStyle = { font: { bold: true, sz: 11 }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };

    const tableTitleStyle = { font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "002060" } }, alignment: { horizontal: "center", vertical: "center" } };
    const thStyle = { font: { bold: true, sz: 9, color: { rgb: "002060" } }, fill: { fgColor: { rgb: "D9E1F2" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const tdStyle = { font: { sz: 9 }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const tdLeftStyle = { ...tdStyle, alignment: { horizontal: "left", vertical: "center" } };
    
    const grandTotalStyle = { font: { bold: true, sz: 9, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "385623" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };

    for (let i = 0; i < 20; i++) rows[i] = [];

    setCell(0, 0, "S.S. EMBROIDERY", titleStyle);
    setCell(1, 0, "ATTENDANCE REPORT", subTitleStyle);

    const todayStr = new Date().toLocaleString('en-IN');
    setCell(3, 1, "From Date  :", metaStyle); setCell(3, 2, this.exportFromDate, metaValStyle);
    setCell(3, 5, "Generated On :", metaStyle); setCell(3, 6, todayStr, metaValStyle);
    
    setCell(4, 1, "To Date    :", metaStyle); setCell(4, 2, this.exportToDate, metaValStyle);
    setCell(4, 5, "Generated By :", metaStyle); setCell(4, 6, "Admin", metaValStyle);

    rows[5] = [];
    for(let c=0; c<8; c++) setCell(5, c, "", { border: lineStyle });

    setCell(7, 1, "TOTAL RECORDS", sumHeadStyle); setCell(7, 2, "", sumHeadStyle);
    setCell(8, 1, totalRecords, sumValStyle); setCell(8, 2, "", sumValStyle);
    
    setCell(7, 3, "TOTAL PRESENT", sumHeadStyle); setCell(7, 4, "", sumHeadStyle);
    setCell(8, 3, presentCount, sumValStyle); setCell(8, 4, "", sumValStyle);
    
    setCell(7, 5, "TOTAL ABSENT", sumHeadStyle); setCell(7, 6, "", sumHeadStyle);
    setCell(8, 5, absentCount, sumValStyle); setCell(8, 6, "", sumValStyle);

    setCell(10, 0, "ATTENDANCE DETAILS", tableTitleStyle);

    const headers = ["S.NO", "EMP CODE", "NAME", "DATE", "DESIGNATION", "CHECK IN", "CHECK OUT", "STATUS"];
    headers.forEach((h, c) => setCell(11, c, h, thStyle));

    let r = 12;
    logs.forEach((log, i) => {
      let statusStr = log.status;
      if (log.status === 1) statusStr = 'Present';
      if (log.status === 2) statusStr = 'Absent';
      if (log.status === 3) statusStr = 'Half Day';
      if (log.remarks === 'Half Day') statusStr = 'Half Day';
      
      setCell(r, 0, i + 1, tdStyle);
      setCell(r, 1, log.employeeCode, tdStyle);
      setCell(r, 2, log.employeeName, tdLeftStyle);
      setCell(r, 3, log.date, tdStyle);
      setCell(r, 4, log.designation || "Staff", tdStyle); 
      setCell(r, 5, log.checkInTime || "-", tdStyle);
      setCell(r, 6, log.checkOutTime || "-", tdStyle);
      setCell(r, 7, statusStr, tdStyle);
      r++;
    });

    setCell(r, 0, "GRAND TOTAL", grandTotalStyle);
    for(let c=1; c<7; c++) setCell(r, c, "", grandTotalStyle);
    setCell(r, 7, `${presentCount} Present`, grandTotalStyle);
    r += 2;
    setCell(r, 0, "Note : \"-\" Represents zero / not applicable.", { font: { sz: 8, color: { rgb: "0000FF" } } });

    const ws: any = {};
    const range = { s: { c: 0, r: 0 }, e: { c: 8, r: Math.max(r, 15) } };
    
    rows.forEach((row, R) => {
      if (!row) return;
      row.forEach((cell, C) => {
        if (!cell) return;
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        ws[cellRef] = cell;
      });
    });
    ws['!ref'] = XLSX.utils.encode_range(range.s, range.e);
    
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 7, c: 1 }, e: { r: 7, c: 2 } },
      { s: { r: 8, c: 1 }, e: { r: 8, c: 2 } },
      { s: { r: 7, c: 3 }, e: { r: 7, c: 4 } },
      { s: { r: 8, c: 3 }, e: { r: 8, c: 4 } },
      { s: { r: 7, c: 5 }, e: { r: 7, c: 6 } },
      { s: { r: 8, c: 5 }, e: { r: 8, c: 6 } },
      { s: { r: 10, c: 0 }, e: { r: 10, c: 7 } },
      { s: { r: r-2, c: 0 }, e: { r: r-2, c: 3 } }
    ];

    ws['!cols'] = [
      { wch: 6 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
    XLSX.writeFile(wb, `Attendance_Report_${this.exportFromDate}_to_${this.exportToDate}.xlsx`);
  }

}


