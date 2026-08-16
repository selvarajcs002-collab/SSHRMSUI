import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { EmsApiService } from '../../services/ems-api.service';
import { AppConfigService } from '../../core/services/app-config.service';

@Component({
  selector: 'app-shift-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  template: `
    <div class="shift-container modern-ui animate-fade-in">
      
      <!-- Modern Header -->
      <div class="dashboard-header mb-4">
        <div class="header-titles">
          <h2>Shift Management</h2>
          <p class="text-secondary">Organize employee shifts and allocate workstations</p>
        </div>
        <div class="header-actions">
          <button class="btn-glow-primary" (click)="toggleAddMachineForm()">
            <i class="fa-solid fa-screwdriver-wrench"></i> Manage Workstations
          </button>
        </div>
      </div>

      <!-- Top Widgets -->
      <div class="stats-row mb-4">
        <div class="stat-card clean-card">
          <div class="stat-icon text-orange"><i class="fa-solid fa-sun"></i></div>
          <div class="stat-data">
            <span class="value">{{ getDayShiftCount() }}</span>
            <span class="label">Day Shift</span>
          </div>
        </div>
        
        <div class="stat-card clean-card">
          <div class="stat-icon text-purple"><i class="fa-solid fa-moon"></i></div>
          <div class="stat-data">
            <span class="value">{{ getNightShiftCount() }}</span>
            <span class="label">Night Shift</span>
          </div>
        </div>

        <div class="stat-card clean-card">
          <div class="stat-icon text-green"><i class="fa-solid fa-clipboard-check"></i></div>
          <div class="stat-data">
            <span class="value">{{ getAssignedCount() }}</span>
            <span class="label">Total Assigned</span>
          </div>
        </div>

        <div class="stat-card clean-card">
          <div class="stat-icon text-red"><i class="fa-solid fa-user-clock"></i></div>
          <div class="stat-data">
            <span class="value">{{ getUnassignedCount() }}</span>
            <span class="label">Awaiting Assignment</span>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar clean-card mb-4">
        <div class="search-wrap">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search by name or code..." class="search-input" />
        </div>
      </div>

      <!-- Table Section -->
      <div class="table-container clean-card">
        <table class="modern-table">
          <thead>
            <tr>
              <th width="5%"><input type="checkbox" class="modern-checkbox" /></th>
              <th width="25%">EMPLOYEE</th>
              <th width="25%">MACHINE / WORKSTATION</th>
              <th width="25%">SHIFT</th>
              <th width="20%">STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of getFilteredEmployees(); let i = index">
              <td><input type="checkbox" class="modern-checkbox" /></td>
              <td>
                <div class="user-profile">
                  <div class="avatar">
                    <img *ngIf="emp.profilePicture && emp.profilePicture !== 'undefined' && emp.profilePicture !== 'null'" [src]="emp.profilePicture" alt="Profile" />
                    <span *ngIf="!emp.profilePicture || emp.profilePicture === 'undefined' || emp.profilePicture === 'null'">{{ getInitials(emp.fullName) }}</span>
                  </div>
                  <div class="user-info">
                    <span class="name">{{ emp.fullName }}</span>
                    <span class="code">{{ emp.employeeCode }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="machine-radio-group">
                  <label class="custom-radio" *ngFor="let mach of machines" [class.is-active]="getEmpMachineName(emp.id) === mach.name">
                    <input type="checkbox" #chk [checked]="getEmpMachineName(emp.id) === mach.name" (change)="onGridMachineChange(emp, chk.checked ? mach.name : '')" />
                    <span class="radio-mark"></span>
                    <span class="label-text">{{ mach.name }}</span>
                  </label>
                </div>
              </td>
              <td>
                <div class="shift-toggles" *ngIf="getEmpAssignment(emp.id) as asg">
                  <button class="toggle-btn day-btn" [class.active]="asg.shiftType === 'Morning' || asg.shiftType == 1" (click)="toggleShift(emp.id, 1, asg.machineName)">
                    <i class="fa-solid fa-sun"></i> Day
                  </button>
                  <button class="toggle-btn night-btn" [class.active]="asg.shiftType === 'Night' || asg.shiftType == 2" (click)="toggleShift(emp.id, 2, asg.machineName)">
                    <i class="fa-solid fa-moon"></i> Night
                  </button>
                </div>
                <div class="shift-toggles" *ngIf="!getEmpAssignment(emp.id)">
                  <button class="toggle-btn disabled" disabled><i class="fa-solid fa-sun"></i> Day</button>
                  <button class="toggle-btn disabled" disabled><i class="fa-solid fa-moon"></i> Night</button>
                </div>
              </td>
              <td>
                <span class="status-badge" [class.assigned]="getEmpAssignment(emp.id)" [class.unassigned]="!getEmpAssignment(emp.id)">
                  {{ getEmpAssignment(emp.id) ? 'Assigned' : 'Unassigned' }}
                </span>
              </td>
            </tr>
            <tr *ngIf="getFilteredEmployees().length === 0">
              <td colspan="5">
                <div class="empty-state">
                  <i class="fa-solid fa-users-slash empty-icon"></i>
                  <p>No active employees found.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="table-footer">
          <span class="footer-text">Showing {{ getFilteredEmployees().length > 0 ? 1 : 0 }}–{{ getFilteredEmployees().length }} of {{ getFilteredEmployees().length }} employees</span>
        </div>
      </div>

      <!-- Modal Dialog for Workstations -->
      <div *ngIf="showAddForm" class="modal-overlay">
        <div class="modal-card clean-card animate-fade-in">
          <div class="modal-header">
            <h3><i class="fa-solid fa-screwdriver-wrench"></i> Manage Workstations</h3>
            <button class="btn-close" (click)="toggleAddMachineForm()"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <div class="add-machine-form">
              <div class="control-item">
                <label>Workstation Name</label>
                <input type="text" [(ngModel)]="newMachineName" placeholder="e.g. CNC Machine - 03" class="input-full" />
              </div>
              <div class="control-item">
                <label>Floor / Area Unit</label>
                <input type="text" [(ngModel)]="newMachineFloor" placeholder="e.g. Floor Unit A" class="input-full" />
              </div>
              <button (click)="addMachine()" class="btn-glow-primary w-full mt-3" [disabled]="!newMachineName.trim()">
                <i class="fa-solid fa-plus"></i> Add Workstation
              </button>
            </div>
            
            <div class="machine-list mt-4">
              <div *ngFor="let mach of machines" class="machine-list-item">
                <div class="machine-info">
                  <strong>{{ mach.name }}</strong>
                  <span class="text-secondary text-sm">{{ mach.floor }}</span>
                </div>
                <button (click)="deleteMachine(mach.name)" class="btn-icon-danger">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :root {
      --primary-color: #4f46e5;
      --primary-glow: rgba(79, 70, 229, 0.4);
      --text-main: #0f172a;
      --text-sec: #64748b;
      --border-light: #e2e8f0;
      --bg-light: #f8fafc;
    }

    .modern-ui {
      font-family: 'Inter', -apple-system, sans-serif;
      color: var(--text-main);
      padding: 2rem;
      background: #f1f5f9; /* sleek light gray background */
      min-height: 100vh;
    }

    .clean-card {
      background: #ffffff;
      border: 1px solid var(--border-light);
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .mb-4 { margin-bottom: 1.5rem; }
    .mt-3 { margin-top: 1rem; }
    .mt-4 { margin-top: 1.5rem; }
    .w-full { width: 100%; }

    /* Header */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-titles h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .header-titles p {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
      color: var(--text-sec);
    }

    /* Buttons */
    .btn-glow-primary {
      background: #ffffff;
      color: var(--text-main);
      border: 1px solid var(--border-light);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      transition: all 0.2s ease;
    }
    .btn-glow-primary:hover {
      background: var(--bg-light);
      border-color: #cbd5e1;
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .stat-card {
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--bg-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .text-orange { color: #f59e0b; background: #fffbeb; }
    .text-purple { color: #8b5cf6; background: #f5f3ff; }
    .text-green { color: #10b981; background: #ecfdf5; }
    .text-red { color: #ef4444; background: #fef2f2; }
    
    .stat-data {
      display: flex;
      flex-direction: column;
    }
    .stat-data .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
    }
    .stat-data .label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-sec);
      text-transform: uppercase;
      margin-top: 0.25rem;
    }

    /* Toolbar */
    .toolbar {
      padding: 1rem;
      display: flex;
      align-items: center;
    }
    .search-wrap {
      position: relative;
      width: 100%;
      max-width: 320px;
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-sec);
    }
    .search-input {
      width: 100%;
      padding: 0.6rem 1rem 0.6rem 2.5rem;
      border: 1px solid var(--border-light);
      border-radius: 6px;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-input:focus {
      border-color: #94a3b8;
    }

    /* Table */
    .table-container {
      overflow-x: auto;
    }
    .modern-table {
      width: 100%;
      border-collapse: collapse;
      white-space: nowrap;
    }
    .modern-table th {
      padding: 1rem 1.5rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-sec);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border-light);
    }
    .modern-table td {
      padding: 1rem 1.5rem;
      vertical-align: middle;
      border-bottom: 1px solid var(--border-light);
    }
    .index-cell {
      font-weight: 500;
      color: var(--text-sec);
    }
    
    /* User Profile in Table */
    .user-profile {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
      overflow: hidden;
    }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .user-info { display: flex; flex-direction: column; }
    .user-info .name { font-weight: 600; font-size: 0.875rem; color: var(--text-main); }
    .user-info .code { font-size: 0.75rem; color: var(--text-sec); margin-top: 0.15rem; }

    /* Modern Checkbox for Rows */
    .modern-checkbox {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      cursor: pointer;
      accent-color: var(--primary-color);
    }

    /* Machine Radio Group (styled like the screenshot) */
    .machine-radio-group {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--border-light);
      border-radius: 8px;
      padding: 0.25rem;
      background: #ffffff;
      gap: 0.25rem;
    }
    .custom-radio {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      font-size: 0.8rem;
      color: var(--text-sec);
      user-select: none;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .custom-radio:hover:not(.is-active) {
      background: var(--bg-light);
    }
    .custom-radio input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }
    .custom-radio .radio-mark {
      position: relative;
      height: 16px;
      width: 16px;
      background-color: transparent;
      border: 2px solid #cbd5e1;
      border-radius: 50%;
      margin-right: 0.5rem;
      transition: all 0.2s ease;
    }
    .custom-radio .radio-mark:after {
      content: "";
      position: absolute;
      display: none;
      left: 3px;
      top: 3px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--primary-color);
    }
    .custom-radio input:checked ~ .radio-mark {
      border-color: var(--primary-color);
    }
    .custom-radio input:checked ~ .radio-mark:after {
      display: block;
    }
    .custom-radio .label-text {
      font-weight: 600;
    }
    .custom-radio.is-active {
      background-color: #e0e7ff; /* light indigo pill background */
      color: var(--primary-color);
    }
    .custom-radio.is-active .label-text {
      color: var(--primary-color);
    }

    /* Shift Toggles */
    .shift-toggles {
      display: inline-flex;
      background: #f1f5f9;
      padding: 0.2rem;
      border-radius: 6px;
      gap: 0.2rem;
    }
    .toggle-btn {
      border: none;
      background: transparent;
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.75rem;
      color: var(--text-sec);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .toggle-btn:hover:not(.disabled) {
      background: #e2e8f0;
    }
    .toggle-btn.active {
      background: #ffffff;
      color: var(--text-main);
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .toggle-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Status Badge */
    .status-badge {
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      display: inline-block;
    }
    .status-badge.assigned {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .status-badge.unassigned {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    /* Table Footer */
    .table-footer {
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border-light);
    }
    .footer-text {
      font-size: 0.8rem;
      color: var(--text-sec);
    }

    /* Empty State */
    .empty-state {
      padding: 3rem;
      text-align: center;
      color: var(--text-sec);
    }
    .empty-icon {
      font-size: 2.5rem;
      color: #cbd5e1;
      margin-bottom: 0.75rem;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-card {
      width: 100%;
      max-width: 480px;
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 { margin: 0; font-size: 1.15rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; color: var(--text-main); }
    .btn-close {
      background: none; border: none; font-size: 1.25rem; color: var(--text-sec); cursor: pointer; transition: 0.2s;
    }
    .btn-close:hover { color: #ef4444; }
    .modal-body { padding: 1.5rem; }
    .control-item { margin-bottom: 1rem; }
    .control-item label { display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-main); margin-bottom: 0.5rem; }
    .input-full {
      width: 100%; padding: 0.6rem 1rem; border: 1px solid var(--border-light); border-radius: 6px; font-size: 0.875rem; outline: none; transition: 0.2s;
    }
    .input-full:focus { border-color: #94a3b8; }
    
    .machine-list { max-height: 250px; overflow-y: auto; border-top: 1px solid var(--border-light); padding-top: 1rem; }
    .machine-list-item {
      display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--bg-light); margin-bottom: 0.25rem;
    }
    .machine-info { display: flex; flex-direction: column; }
    .machine-info strong { font-size: 0.875rem; color: var(--text-main); }
    .btn-icon-danger {
      background: transparent; color: #ef4444; border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;
    }
    .btn-icon-danger:hover { background: #fef2f2; }
  `]
})
export class ShiftManagementComponent implements OnInit {
  employees: any[] = [];
  assignments: any[] = [];
  isLoading = false;

  selectedDate = (function() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  searchQuery = '';

  showAddForm = false;
  newMachineName = '';
  newMachineFloor = '';
  machines: any[] = [];

  constructor(private apiService: EmsApiService, private appConfig: AppConfigService) {}

  ngOnInit() {
    this.loadEmployees();
    this.loadAssignments();
    this.populateDefaultMachines();
  }

  loadEmployees() {
    this.apiService.getEmployees(1, 1000).subscribe({
      next: (res) => {
        this.employees = res.items.filter((e: any) => e.status === 'Active');
      }
    });
  }

  loadAssignments() {
    this.isLoading = true;
    this.apiService.getAllShiftAssignments().subscribe({
      next: (res) => {
        this.assignments = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getFilteredEmployees() {
    if (!this.searchQuery) return this.employees;
    const q = this.searchQuery.toLowerCase();
    return this.employees.filter(emp => 
      emp.fullName.toLowerCase().includes(q) || 
      emp.employeeCode.toLowerCase().includes(q)
    );
  }

  isSameDate(date1: string, date2: string): boolean {
    if (!date1 || !date2) return false;
    return date1.substring(0, 10) === date2.substring(0, 10);
  }

  getEmpAssignment(empId: string): any {
    return this.assignments.find(asg => 
      asg.employeeId === empId && 
      this.isSameDate(asg.assignmentDate, this.selectedDate)
    );
  }

  // Dashboard Stats
  getDayShiftCount(): number {
    return this.assignments.filter(a => this.isSameDate(a.assignmentDate, this.selectedDate) && (a.shiftType === 1 || a.shiftType === 'Morning')).length;
  }

  getNightShiftCount(): number {
    return this.assignments.filter(a => this.isSameDate(a.assignmentDate, this.selectedDate) && (a.shiftType === 2 || a.shiftType === 'Night')).length;
  }

  getAssignedCount(): number {
    return this.employees.filter(emp => this.getEmpAssignment(emp.id)).length;
  }

  getUnassignedCount(): number {
    return Math.max(0, this.employees.length - this.getAssignedCount());
  }

  // Actions
  onAssignToMachine(employeeId: string, machineName: string, shiftType: number = 1) {
    this.isLoading = true;
    const payload = {
      employeeId: employeeId,
      shiftType: shiftType,
      machineName: machineName,
      assignmentDate: new Date(this.selectedDate)
    };

    this.apiService.assignShift(payload).subscribe({
      next: () => {
        this.loadAssignments();
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'Failed to allocate machine shift.');
      }
    });
  }

  onDeallocate(assignmentId: string) {
    this.isLoading = true;
    this.apiService.removeShiftAssignment(assignmentId).subscribe({
      next: () => {
        this.loadAssignments();
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'Failed to resign employee assignment.');
      }
    });
  }

  getEmpMachineName(empId: string): string {
    const asg = this.getEmpAssignment(empId);
    return asg ? asg.machineName : '';
  }

  onGridMachineChange(emp: any, newMachine: string) {
    const asg = this.getEmpAssignment(emp.id);
    if (!newMachine) {
      if (asg) this.onDeallocate(asg.id);
      return;
    }

    const shiftType = asg ? asg.shiftType : 1;
    this.onAssignToMachine(emp.id, newMachine, shiftType);
  }

  toggleShift(empId: string, newShiftType: number, machineName: string) {
    this.onAssignToMachine(empId, machineName, newShiftType);
  }

  // Utilities
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

  // Modal Management
  toggleAddMachineForm() {
    this.showAddForm = !this.showAddForm;
  }

  addMachine() {
    if (!this.newMachineName.trim()) return;
    const name = this.newMachineName.trim();
    const floor = this.newMachineFloor.trim() || 'General Floor';
    
    if (this.machines.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      alert('A workstation with this name already exists.');
      return;
    }

    this.machines.push({ name, floor });
    this.saveMachinesToSettings();
    this.newMachineName = '';
    this.newMachineFloor = '';
  }

  deleteMachine(machineName: string) {
    if (confirm(`Are you sure you want to remove the workstation "${machineName}"?`)) {
      this.machines = this.machines.filter(m => m.name !== machineName);
      this.saveMachinesToSettings();
    }
  }

  saveMachinesToSettings() {
    const payload = {
      key: 'FloorMachines',
      value: JSON.stringify(this.machines)
    };
    this.apiService.updateSetting(payload).subscribe();
  }

  populateDefaultMachines() {
    const configMachines = this.appConfig.getAppMachines();
    if (configMachines && configMachines.length > 0) {
      this.machines = configMachines.map(m => ({ name: m, floor: 'General Floor' }));
    } else {
      this.machines = [];
    }
  }
}
