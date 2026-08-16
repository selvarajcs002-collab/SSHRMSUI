import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { EmsApiService } from '../../services/ems-api.service';

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  leaveType: number | string;
  startDate: string;
  endDate: string;
  status: number | string;
  reason: string;
  createdAt: string;
}

interface EmployeeSelect {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="leave-container">
      
      <!-- Top Action Bar -->
      <div class="action-bar">
        <div class="title-section">
          <h2>Leave Management</h2>
          <p class="subtitle">Track employee leave requests, approve or reject applications, and log absences.</p>
        </div>
        
        <div class="actions">
          <button (click)="exportToCSV()" class="btn btn-secondary">
            <i class="fa-solid fa-file-csv text-accent"></i> Export CSV
          </button>
          <button (click)="openApplyModal()" class="btn btn-primary">
            <i class="fa-solid fa-plane-departure"></i> Apply Leave
          </button>
        </div>
      </div>

      <!-- Main Leaves Table Card -->
      <div class="glass-card table-card">
        
        <!-- Filter Controls -->
        <div class="table-controls">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="filterLeaves()" 
              placeholder="Search by name or code..." 
            />
          </div>

          <div class="filter-options">
            <label class="inline-label">Status:</label>
            <ng-select [(ngModel)]="statusFilter" (change)="filterLeaves()" class="status-select" [clearable]="false">
              <ng-option value="All">All Statuses</ng-option>
              <ng-option value="Pending">Pending</ng-option>
              <ng-option value="Approved">Approved</ng-option>
              <ng-option value="Rejected">Rejected</ng-option>
            </ng-select>
          </div>
        </div>

        <div *ngIf="isLoading" class="loading-state">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <span>Loading leave logs...</span>
        </div>

        <div *ngIf="!isLoading && filteredLeaves.length === 0" class="empty-state">
          <i class="fa-solid fa-calendar-xmark"></i>
          <span>No leave applications found.</span>
        </div>

        <!-- Leaves Table -->
        <div *ngIf="!isLoading && filteredLeaves.length > 0" class="table-responsive">
          <table class="ems-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee Code</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th class="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let leave of filteredLeaves" class="leave-row">
                <td>
                  <div class="emp-name-cell">
                    <span class="emp-fullname">{{ leave.employeeName }}</span>
                  </div>
                </td>
                <td><span class="code-badge">{{ leave.employeeCode }}</span></td>
                <td>
                  <span class="type-tag">{{ getLeaveTypeName(leave.leaveType) }}</span>
                </td>
                <td>{{ leave.startDate | date:'mediumDate' }}</td>
                <td>{{ leave.endDate | date:'mediumDate' }}</td>
                <td>
                  <span class="days-count">{{ calculateDays(leave.startDate, leave.endDate) }} day(s)</span>
                </td>
                <td>
                  <span class="reason-text" [title]="leave.reason || 'No reason specified'">
                    {{ leave.reason || 'No reason specified' }}
                  </span>
                </td>
                <td>
                  <span 
                    class="badge" 
                    [class.badge-warning]="isPending(leave.status)"
                    [class.badge-success]="isApproved(leave.status)"
                    [class.badge-danger]="isRejected(leave.status)"
                  >
                    {{ getStatusName(leave.status) }}
                  </span>
                </td>
                <td class="actions-cell">
                  <div class="action-buttons" *ngIf="isPending(leave.status)">
                    <button 
                      (click)="approveLeave(leave.id)" 
                      class="btn-action approve-btn" 
                      title="Approve Leave"
                    >
                      <i class="fa-solid fa-check"></i>
                    </button>
                    <button 
                      (click)="rejectLeave(leave.id)" 
                      class="btn-action reject-btn" 
                      title="Reject Leave"
                    >
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <span *ngIf="!isPending(leave.status)" class="processed-lbl">
                    Processed
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Apply Leave Modal -->
      <div class="modal-overlay" *ngIf="isApplyModalOpen">
        <div class="modal-card glass-card animate-scale-up">
          <div class="modal-header">
            <h3>Apply Leave Request</h3>
            <button (click)="closeApplyModal()" class="close-btn"><i class="fa-solid fa-xmark"></i></button>
          </div>
          
          <form (ngSubmit)="submitLeaveApplication()" #leaveForm="ngForm">
            <div class="modal-body">
              
              <!-- Select Employee -->
              <div class="form-group">
                <label for="employeeId">Employee *</label>
                <ng-select 
                  id="employeeId" 
                  name="employeeId" 
                  [(ngModel)]="applyModel.employeeId" 
                  required
                  #empSelect="ngModel"
                  [class.invalid]="empSelect.invalid && empSelect.touched"
                  placeholder="Select an employee..."
                  [clearable]="false"
                >
                  <ng-option *ngFor="let emp of activeEmployees" [value]="emp.id">
                    {{ emp.firstName }} {{ emp.lastName }} ({{ emp.employeeCode }})
                  </ng-option>
                </ng-select>
                <span class="error-text" *ngIf="empSelect.invalid && empSelect.touched">
                  Please select an employee.
                </span>
              </div>

              <!-- Leave Type -->
              <div class="form-group">
                <label for="leaveType">Leave Type *</label>
                <ng-select 
                  id="leaveType" 
                  name="leaveType" 
                  [(ngModel)]="applyModel.leaveType" 
                  required
                  [clearable]="false"
                >
                  <ng-option [value]="0">Sick Leave</ng-option>
                  <ng-option [value]="1">Casual Leave</ng-option>
                  <ng-option [value]="2">Earned Leave</ng-option>
                  <ng-option [value]="3">Unpaid Leave</ng-option>
                </ng-select>
              </div>

              <!-- Dates Row -->
              <div class="form-row">
                <div class="form-group half-width">
                  <label for="startDate">Start Date *</label>
                  <input 
                    type="date" 
                    id="startDate" 
                    name="startDate" 
                    [(ngModel)]="applyModel.startDate" 
                    required 
                    #startInput="ngModel"
                    [class.invalid]="startInput.invalid && startInput.touched"
                  />
                </div>

                <div class="form-group half-width">
                  <label for="endDate">End Date *</label>
                  <input 
                    type="date" 
                    id="endDate" 
                    name="endDate" 
                    [(ngModel)]="applyModel.endDate" 
                    required 
                    #endInput="ngModel"
                    [class.invalid]="endInput.invalid && endInput.touched"
                  />
                </div>
              </div>
              <span class="error-text" *ngIf="applyModel.startDate && applyModel.endDate && applyModel.startDate > applyModel.endDate">
                Start date cannot be after end date.
              </span>

              <!-- Reason -->
              <div class="form-group">
                <label for="reason">Reason for Absence</label>
                <textarea 
                  id="reason" 
                  name="reason" 
                  [(ngModel)]="applyModel.reason" 
                  rows="3" 
                  placeholder="e.g. Medical emergency, personal work, family trip..."
                ></textarea>
              </div>

            </div>
            
            <div class="modal-footer">
              <button type="button" (click)="closeApplyModal()" class="btn btn-secondary">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="leaveForm.invalid || applyModel.startDate > applyModel.endDate || isSaving"
              >
                <i class="fa-solid fa-circle-notch fa-spin" *ngIf="isSaving"></i>
                <span *ngIf="!isSaving">Submit Application</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .leave-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Action Bar */
    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .action-bar h2 {
      font-size: 1.65rem;
      margin-bottom: 0.25rem;
    }
    .subtitle {
      color: var(--text-secondary);
      font-size: 0.925rem;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Table Card */
    .table-card {
      padding: 1.75rem;
    }
    .table-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .search-box {
      position: relative;
      width: 280px;
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
    .filter-options {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .inline-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
    }
    .status-select {
      width: 150px;
      padding: 0.45rem 0.75rem;
      font-size: 0.85rem;
      background-color: var(--bg-main);
    }

    /* Table styling */
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
    .leave-row {
      transition: var(--transition);
    }
    .leave-row:hover {
      background-color: var(--bg-main);
    }

    .emp-fullname {
      font-weight: 700;
      color: var(--text-primary);
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

    .type-tag {
      font-weight: 600;
      color: var(--text-secondary);
      background-color: var(--bg-main);
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }

    .days-count {
      font-weight: 700;
      color: var(--text-primary);
    }

    .reason-text {
      display: inline-block;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--text-secondary);
    }

    /* Status Badges */
    .badge {
      display: inline-flex;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .badge-warning {
      background-color: var(--color-warning-bg);
      color: var(--color-warning-hover);
    }
    .badge-success {
      background-color: var(--color-success-bg);
      color: var(--color-success);
    }
    .badge-danger {
      background-color: var(--color-error-bg);
      color: var(--color-error);
    }

    /* Actions Column */
    .actions-col {
      width: 120px;
      text-align: center;
    }
    .actions-cell {
      text-align: center;
    }
    .action-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }
    .btn-action {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--border-color);
      background-color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.85rem;
      transition: var(--transition);
    }
    .approve-btn {
      color: var(--color-success);
    }
    .approve-btn:hover {
      background-color: var(--color-success-bg);
      border-color: var(--color-success);
      transform: scale(1.05);
    }
    .reject-btn {
      color: var(--color-error);
    }
    .reject-btn:hover {
      background-color: var(--color-error-bg);
      border-color: var(--color-error);
      transform: scale(1.05);
    }
    .processed-lbl {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    /* Modal Form Rows */
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .half-width {
      flex: 1;
    }

    /* Modal Overlay & Card */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-card {
      width: 100%;
      max-width: 500px;
      background: #ffffff;
      padding: 0;
      overflow: hidden;
      box-shadow: var(--shadow-xl);
    }
    .modal-header {
      padding: 1.5rem 1.75rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: var(--bg-main);
    }
    .modal-header h3 {
      font-size: 1.2rem;
      font-weight: 700;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: var(--text-muted);
      transition: var(--transition);
    }
    .close-btn:hover {
      color: var(--text-primary);
    }
    .modal-body {
      padding: 1.75rem;
      max-height: 70vh;
      overflow-y: auto;
    }
    .modal-footer {
      padding: 1.25rem 1.75rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      background-color: var(--bg-main);
    }

    select.invalid, input.invalid {
      border-color: var(--color-error);
      box-shadow: 0 0 0 3px var(--color-error-bg);
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

    .animate-scale-up {
      animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes scaleUp {
      0% { transform: scale(0.95); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class LeaveManagementComponent implements OnInit {
  isLoading = true;
  isSaving = false;
  isApplyModalOpen = false;
  searchQuery = '';
  statusFilter = 'All';

  leaves: LeaveRequest[] = [];
  filteredLeaves: LeaveRequest[] = [];
  activeEmployees: EmployeeSelect[] = [];

  applyModel = {
    employeeId: '',
    leaveType: 0,
    startDate: '',
    endDate: '',
    reason: ''
  };

  constructor(private apiService: EmsApiService) {}

  ngOnInit() {
    this.loadLeaves();
    this.loadActiveEmployees();
  }

  loadLeaves() {
    this.isLoading = true;
    this.apiService.getLeaves().subscribe(
      (data) => {
        this.leaves = data || [];
        this.filterLeaves();
        this.isLoading = false;
      },
      (err) => {
        console.error('Error fetching leaves:', err);
        this.isLoading = false;
      }
    );
  }

  loadActiveEmployees() {
    this.apiService.getEmployees(1, 1000).subscribe(
      (res) => {
        // Map active employees (status is Active or Working)
        const items = res?.items || [];
        this.activeEmployees = items
          .filter((e: any) => e.status !== 2 && e.status !== 'Inactive')
          .map((e: any) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            employeeCode: e.employeeCode
          }));
      },
      (err) => {
        console.error('Error loading active employees for leave selection:', err);
      }
    );
  }

  filterLeaves() {
    let list = this.leaves;

    // Filter by Status
    if (this.statusFilter !== 'All') {
      list = list.filter((l) => this.getStatusName(l.status) === this.statusFilter);
    }

    // Filter by Query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.employeeName.toLowerCase().includes(q) ||
          l.employeeCode.toLowerCase().includes(q) ||
          (l.reason && l.reason.toLowerCase().includes(q))
      );
    }

    this.filteredLeaves = list;
  }

  calculateDays(start: string, end: string): number {
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 0 : diffDays;
  }

  getLeaveTypeName(type: number | string): string {
    const typeInt = typeof type === 'number' ? type : parseInt(type, 10);
    switch (typeInt) {
      case 0: return 'Sick Leave';
      case 1: return 'Casual Leave';
      case 2: return 'Earned Leave';
      case 3: return 'Unpaid Leave';
      default: return String(type);
    }
  }

  getStatusName(status: number | string): string {
    // Standard leave statuses: 0: Pending, 1: Approved, 2: Rejected
    if (typeof status === 'string') {
      return status;
    }
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      default: return String(status);
    }
  }

  isPending(status: number | string): boolean {
    return this.getStatusName(status) === 'Pending';
  }

  isApproved(status: number | string): boolean {
    return this.getStatusName(status) === 'Approved';
  }

  isRejected(status: number | string): boolean {
    return this.getStatusName(status) === 'Rejected';
  }

  approveLeave(id: string) {
    if (confirm('Are you sure you want to approve this leave request?')) {
      this.apiService.approveLeave(id).subscribe(
        () => {
          this.loadLeaves();
        },
        (err) => {
          alert('Failed to approve leave: ' + (err.error?.message || err.message));
        }
      );
    }
  }

  rejectLeave(id: string) {
    if (confirm('Are you sure you want to reject this leave request?')) {
      this.apiService.rejectLeave(id).subscribe(
        () => {
          this.loadLeaves();
        },
        (err) => {
          alert('Failed to reject leave: ' + (err.error?.message || err.message));
        }
      );
    }
  }

  openApplyModal() {
    this.applyModel = {
      employeeId: '',
      leaveType: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: ''
    };
    this.isApplyModalOpen = true;
  }

  closeApplyModal() {
    this.isApplyModalOpen = false;
  }

  submitLeaveApplication() {
    if (!this.applyModel.employeeId || !this.applyModel.startDate || !this.applyModel.endDate) return;
    if (this.applyModel.startDate > this.applyModel.endDate) return;

    this.isSaving = true;
    this.apiService.applyLeave(this.applyModel).subscribe(
      () => {
        this.isSaving = false;
        this.closeApplyModal();
        this.loadLeaves();
      },
      (err) => {
        alert('Failed to submit leave: ' + (err.error?.message || err.message));
        this.isSaving = false;
      }
    );
  }

  exportToCSV() {
    const headers = [
      'Employee Code',
      'Employee Name',
      'Leave Type',
      'Start Date',
      'End Date',
      'Duration (Days)',
      'Status',
      'Reason'
    ];

    const rows = this.leaves.map(l => [
      l.employeeCode,
      l.employeeName,
      this.getLeaveTypeName(l.leaveType),
      l.startDate,
      l.endDate,
      this.calculateDays(l.startDate, l.endDate),
      this.getStatusName(l.status),
      l.reason || 'N/A'
    ]);

    // Bold title at the top
    let csvContent = 'EMPLOYEE LEAVE REPORT\n\n';
    csvContent += headers.join(',') + '\n';

    rows.forEach((row: any[]) => {
      const escapedRow = row.map((val: any) => {
        let str = String(val);
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      });
      csvContent += escapedRow.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Leaves_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
