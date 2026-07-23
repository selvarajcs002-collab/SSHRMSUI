import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmsApiService } from '../../services/ems-api.service';

@Component({
  selector: 'app-shift-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="shift-container animate-fade-in">
      
      <div class="section-title-bar" style="margin-bottom: 1.5rem;">
        <div class="tab-controls" style="display: flex; gap: 0.5rem;">
          <button class="btn btn-sm" [class.btn-primary]="activeTab === 'card'" [class.btn-outline]="activeTab !== 'card'" (click)="activeTab = 'card'">
            <i class="fa-solid fa-layer-group"></i> Visual Mapper
          </button>
          <button class="btn btn-sm" [class.btn-primary]="activeTab === 'grid'" [class.btn-outline]="activeTab !== 'grid'" (click)="activeTab = 'grid'">
            <i class="fa-solid fa-table-list"></i> Detailed Grid
          </button>
          <button class="btn btn-secondary btn-sm ml-2" (click)="toggleAddMachineForm()">
            <i class="fa-solid fa-screwdriver-wrench"></i>
          </button>
        </div>
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
            <div class="stat-trend text-muted">Active Staff</div>
          </div>
        </div>
        
        <div class="stat-widget-card">
          <div class="stat-icon-wrapper badge-purple">
            <i class="fa-solid fa-screwdriver-wrench"></i>
          </div>
          <div class="stat-info">
            <span>Shop Machines</span>
            <h3>{{ machines.length }}</h3>
            <div class="stat-trend text-muted">Active Floor Units</div>
          </div>
        </div>

        <div class="stat-widget-card">
          <div class="stat-icon-wrapper badge-green">
            <i class="fa-solid fa-link"></i>
          </div>
          <div class="stat-info">
            <span>Assigned Today</span>
            <h3>{{ getAssignedCount() }}</h3>
            <div class="stat-trend trend-up">
              <i class="fa-solid fa-circle-check"></i> On the floor
            </div>
          </div>
        </div>

        <div class="stat-widget-card">
          <div class="stat-icon-wrapper badge-orange">
            <i class="fa-solid fa-link-slash"></i>
          </div>
          <div class="stat-info">
            <span>Unassigned</span>
            <h3>{{ getUnassignedCount() }}</h3>
            <div class="stat-trend trend-down">
              <i class="fa-solid fa-circle-exclamation"></i> Awaiting shift
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Dialog for Workstations -->
      <div *ngIf="showAddForm" class="modal-overlay">
        <div class="modal-card animate-fade-in">
          <div class="modal-header">
            <h3><i class="fa-solid fa-screwdriver-wrench text-accent"></i> Manage Workstations</h3>
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
              <button (click)="addMachine()" class="btn btn-primary w-full mt-3" [disabled]="!newMachineName.trim()">
                <i class="fa-solid fa-plus"></i> Add Workstation
              </button>
            </div>
            
            <div class="machine-list mt-4">
              <div *ngFor="let mach of machines" class="machine-list-item">
                <div class="machine-info">
                  <strong>{{ mach.name }}</strong>
                  <span class="text-muted text-sm">{{ mach.floor }}</span>
                </div>
                <button (click)="deleteMachine(mach.name)" class="btn btn-sm btn-outline text-error">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 1: Visual Allocator -->
      <div *ngIf="activeTab === 'card'" class="allocator-grid">
        <!-- Left Panel: Searchable Active Employees List -->
        <div class="glass-card employees-panel p-0">
          <div class="panel-header">
            <h3>Active Employees</h3>
            <div class="search-input-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" [(ngModel)]="searchQuery" placeholder="Search name or code..." />
            </div>
          </div>

          <div class="employee-list-scroll">
            <div *ngIf="employees.length === 0" class="empty-state py-4">
              <i class="fa-solid fa-users-slash"></i>
              <span>No active employees.</span>
            </div>

            <div *ngFor="let emp of getFilteredEmployees()" class="employee-alloc-card large-card" [class.selected]="selectedEmployee?.id === emp.id" (click)="selectEmployee(emp)">
              <div class="avatar-cell">
                <div class="avatar-circle">
                  <img *ngIf="emp.profilePicture && emp.profilePicture !== 'undefined' && emp.profilePicture !== 'null'" [src]="emp.profilePicture" alt="Profile" class="avatar-img" />
                  <span *ngIf="!emp.profilePicture || emp.profilePicture === 'undefined' || emp.profilePicture === 'null'">{{ getInitials(emp.fullName) }}</span>
                </div>
                <div class="emp-meta">
                  <span class="emp-name">{{ emp.fullName }}</span>
                  <span class="emp-dept"><code class="emp-code">{{ emp.employeeCode }}</code></span>
                </div>
              </div>
              <div>
                <span class="badge" [class.badge-green]="getEmpAssignment(emp.id)" [class.badge-orange]="!getEmpAssignment(emp.id)">
                  {{ getEmpAssignment(emp.id) ? 'Assigned' : 'Unassigned' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Machine Floor Grid Cards -->
        <div class="machines-panel">
          <div *ngIf="isLoading" class="loading-state glass-card">
            <i class="fa-solid fa-circle-notch fa-spin text-accent"></i>
            <span>Updating floor allocations...</span>
          </div>

          <div *ngIf="!isLoading" class="machines-grid">
            <div *ngFor="let mach of machines" class="glass-card machine-card large-machine-card animate-fade-in">
              <div class="machine-header">
                <div class="machine-title-box">
                  <div class="machine-icon">
                    <i class="fa-solid fa-gears"></i>
                  </div>
                  <div>
                    <h4>{{ mach.name }}</h4>
                    <span class="location-lbl"><i class="fa-solid fa-map-pin"></i> {{ mach.floor }}</span>
                  </div>
                </div>
              </div>

              <div class="machine-body">
                <div *ngFor="let asg of getMachineAssignments(mach.name)" class="assigned-user-box mb-2">
                  <div class="avatar-cell">
                    <div class="avatar-circle small-avatar">
                      <img *ngIf="getEmpProfilePic(asg.employeeId) as picUrl" [src]="picUrl" alt="Profile" class="avatar-img" />
                      <span *ngIf="!getEmpProfilePic(asg.employeeId)">{{ getInitials(asg.employeeName) }}</span>
                    </div>
                    <div class="emp-meta">
                      <span class="emp-name text-sm">{{ asg.employeeName }}</span>
                      <span class="emp-dept text-xs" style="color: #64748b; font-size: 0.75rem;">
                        <code class="emp-code">{{ asg.employeeCode }}</code> • <i class="fa-solid fa-clock"></i> Since: {{ asg.createdAt | date:'dd MMM yyyy, h:mm a' }}
                      </span>
                    </div>
                  </div>
                  <button (click)="onDeallocate(asg.id)" class="btn btn-danger btn-xs btn-resign">
                    <i class="fa-solid fa-link-slash"></i>
                  </button>
                </div>
                
                <div class="unassigned-box mt-3" *ngIf="selectedEmployee && !getEmpAssignment(selectedEmployee.id)">
                  <button (click)="onAssignToMachine(mach.name, 1)" class="btn btn-primary btn-xs btn-assign w-full">
                    <i class="fa-solid fa-plus"></i> Assign {{ selectedEmployee.fullName }}
                  </button>
                </div>
                <div *ngIf="getMachineAssignments(mach.name).length === 0 && (!selectedEmployee || getEmpAssignment(selectedEmployee.id))" class="unassigned-box">
                  <span class="muted-text text-sm"><i class="fa-solid fa-triangle-exclamation"></i> No workers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Detailed Grid -->
      <div *ngIf="activeTab === 'grid'" class="grid-table-container glass-card p-0 mt-4">
        <div class="table-responsive">
          <table class="ems-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Shift Period</th>
                <th>Workstation / Machine</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let emp of getFilteredEmployees()">
                <td>
                  <div class="avatar-cell">
                    <div class="avatar-circle small-avatar">
                      <img *ngIf="emp.profilePicture && emp.profilePicture !== 'undefined' && emp.profilePicture !== 'null'" [src]="emp.profilePicture" alt="Profile" class="avatar-img" />
                      <span *ngIf="!emp.profilePicture || emp.profilePicture === 'undefined' || emp.profilePicture === 'null'">{{ getInitials(emp.fullName) }}</span>
                    </div>
                    <div class="emp-meta">
                      <span class="emp-name">{{ emp.fullName }}</span>
                      <span class="emp-dept">{{ emp.designation || 'N/A' }}</span>
                    </div>
                  </div>
                </td>
                <td><span class="code-badge">{{ emp.employeeCode }}</span></td>
                <td>
                  <!-- Shift Toggle Button -->
                  <div class="shift-toggle" *ngIf="getEmpAssignment(emp.id) as asg">
                    <button class="btn-shift" [class.active]="asg.shiftType === 'Morning' || asg.shiftType == 1" (click)="toggleShift(emp.id, 1, asg.machineName)"><i class="fa-solid fa-sun" style="margin-right:4px;"></i>Morning</button>
                    <button class="btn-shift" [class.active]="asg.shiftType === 'Night' || asg.shiftType == 2" (click)="toggleShift(emp.id, 2, asg.machineName)"><i class="fa-solid fa-moon" style="margin-right:4px;"></i>Night</button>
                  </div>
                  <div class="shift-toggle" *ngIf="!getEmpAssignment(emp.id)">
                    <button class="btn-shift" disabled>N/A</button>
                  </div>
                </td>
                <td>
                  <select class="input-small" [ngModel]="getEmpMachineName(emp.id)" (ngModelChange)="onGridMachineChange(emp, $event)">
                    <option value="">-- Unassigned --</option>
                    <option *ngFor="let mach of machines" [value]="mach.name">{{ mach.name }}</option>
                  </select>
                </td>
                <td>
                  <span class="badge" [class.badge-green]="getEmpAssignment(emp.id)" [class.badge-orange]="!getEmpAssignment(emp.id)">
                    {{ getEmpAssignment(emp.id) ? 'Assigned' : 'Unassigned' }}
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
    .shift-container {
      padding: 1.5rem;
    }
    .tab-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .ml-2 { margin-left: 0.5rem; }
    .mt-4 { margin-top: 1.5rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .w-full { width: 100%; }
    .text-sm { font-size: 0.85rem; }
    .text-xs { font-size: 0.75rem; }
    
    .large-card {
      padding: 1.25rem !important;
    }
    .large-machine-card {
      padding: 1.75rem !important;
    }
    .large-machine-card .machine-title-box h4 {
      font-size: 1.15rem !important;
    }
    
    .allocator-grid {
      display: grid;
      grid-template-columns: 350px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-card {
      background: var(--bg-main);
      width: 550px;
      border-radius: var(--radius-lg);
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .modal-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
    }
    .modal-header h3 { font-size: 1.25rem; font-weight: 700; margin: 0; }
    .btn-close { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-muted); transition: 0.2s; }
    .btn-close:hover { color: var(--color-error); }
    .modal-body { padding: 2rem; }
    .add-machine-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .machine-list { max-height: 300px; overflow-y: auto; border-top: 1px dashed var(--border-color); padding-top: 1.5rem; }
    .machine-list-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); }
    
    .shift-toggle {
      display: flex;
      gap: 0.25rem;
    }
    
    /* Reuse existing generic styles */
    .dashboard-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; }
    .stat-widget-card { background: #ffffff; padding: 1.25rem; border-radius: var(--radius-lg); display: flex; gap: 1.25rem; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02); border: 1px solid var(--border-color); }
    .stat-icon-wrapper { width: 54px; height: 54px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
    .badge-blue { background: rgba(37,99,235,0.1); color: #2563eb; }
    .badge-purple { background: rgba(147,51,234,0.1); color: #9333ea; }
    .badge-green { background: rgba(16,185,129,0.1); color: #10b981; }
    .badge-orange { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .stat-info span { font-size: 0.825rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }
    .stat-info h3 { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0.25rem 0; }
    .stat-trend { font-size: 0.8rem; font-weight: 600; }
    .text-muted { color: var(--text-muted); }
    .trend-up { color: #10b981; }
    .trend-down { color: #f59e0b; }
    
    .glass-card { background: #ffffff; border-radius: var(--radius-lg); box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid rgba(226,232,240,0.8); }
    
    .panel-header { padding: 1.25rem; border-bottom: 1.5px solid var(--border-color); }
    .panel-header h3 { font-size: 1rem; margin-bottom: 0.75rem; font-weight: 700; }
    .search-input-box { position: relative; width: 100%; }
    .search-input-box i { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.85rem; }
    .search-input-box input { padding-left: 2.25rem; padding-top: 0.5rem; padding-bottom: 0.5rem; font-size: 0.85rem; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-md); }
    
    .employee-list-scroll { max-height: 550px; overflow-y: auto; padding: 0.5rem; }
    .employee-alloc-card { padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid transparent; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: var(--transition); margin-bottom: 0.25rem; }
    .employee-alloc-card:hover { background: var(--bg-input); border-color: var(--border-color); }
    .employee-alloc-card.selected { background: var(--color-primary-glow); border-color: var(--color-primary); box-shadow: 0 0 0 1px var(--color-primary); }
    
    .emp-meta { display: flex; flex-direction: column; gap: 0.15rem; }
    .emp-name { font-size: 0.875rem; font-weight: 700; color: var(--text-primary); }
    .emp-dept { font-size: 0.725rem; color: var(--text-secondary); font-weight: 500; }
    .emp-code { font-family: monospace; color: var(--color-primary); font-weight: 700; }
    
    .machines-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
    .machine-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .machine-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .machine-title-box { display: flex; align-items: center; gap: 0.85rem; }
    .machine-icon { width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--bg-input); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 1.15rem; }
    .machine-title-box h4 { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .location-lbl { font-size: 0.725rem; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 0.25rem; margin-top: 0.15rem; }
    .machine-body { border-top: 1px dashed var(--border-color); padding-top: 1rem; }
    
    .assigned-user-box { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; width: 100%; background: var(--bg-input); padding: 0.5rem; border-radius: var(--radius-md); }
    .unassigned-box { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    
    .avatar-cell { display: flex; align-items: center; gap: 0.75rem; }
    .avatar-circle { width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary-glow); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; overflow: hidden; }
    .small-avatar { width: 28px; height: 28px; font-size: 0.7rem; }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    
    .btn { padding: 0.5rem 1rem; border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: var(--transition); display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .btn-primary:hover { background: var(--color-primary-hover); }
    .btn-secondary { background: var(--bg-input); color: var(--text-primary); border-color: var(--border-color); }
    .btn-outline { background: transparent; border-color: var(--border-color); color: var(--text-secondary); }
    .btn-outline:hover { background: var(--bg-input); }
    .btn-danger { background: transparent; border-color: var(--color-error); color: var(--color-error); }
    .btn-danger:hover { background: var(--color-error-bg); }
    .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
    .btn-xs { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
    
    .badge { padding: 0.25rem 0.65rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 700; }
    .input-full { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); }
    .input-small { padding: 0.4rem 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.85rem; }
    .control-item { margin-bottom: 0.75rem; }
    .control-item label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.35rem; }
    
    .table-responsive { width: 100%; overflow-x: auto; }
    .ems-table { width: 100%; border-collapse: collapse; }
    .ems-table th { background: #f8fafc; padding: 1.5rem 1rem; text-align: left; font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); text-transform: uppercase; letter-spacing: 0.05em; }
    .ems-table td { padding: 1.5rem 1rem; border-bottom: 1px solid var(--border-color); font-size: 0.95rem; vertical-align: middle; }
    .ems-table tbody tr:hover { background: #f1f5f9; }
    .code-badge { background: var(--bg-input); padding: 0.35rem 0.65rem; border-radius: var(--radius-sm); font-family: monospace; font-size: 0.85rem; font-weight: 600; border: 1px solid var(--border-color); }
    .shift-toggle { display: flex; gap: 0.5rem; }
    .btn-shift { padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; border: 1px solid var(--border-color); background: white; color: var(--text-secondary); transition: all 0.2s; }
    .btn-shift.active { background: #2563eb; color: #ffffff; border-color: #2563eb; box-shadow: 0 0 0 2px #bfdbfe; }
    .input-small { padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem; outline: none; width: 100%; max-width: 200px; }
    .input-small:focus { border-color: var(--color-primary); }
  `]
})
export class ShiftManagementComponent implements OnInit {
  activeTab: 'card' | 'grid' = 'card';
  employees: any[] = [];
  assignments: any[] = [];
  isLoading = false;

  selectedDate = (function() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  selectedEmployee: any = null;
  searchQuery = '';

  showAddForm = false;
  newMachineName = '';
  newMachineFloor = '';

  machines: any[] = [];

  constructor(private apiService: EmsApiService) {}

  ngOnInit() {
    this.loadEmployees();
    this.loadAssignments();
    this.loadMachinesFromSettings();
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

  selectEmployee(emp: any) {
    if (this.selectedEmployee?.id === emp.id) {
      this.selectedEmployee = null;
    } else {
      this.selectedEmployee = emp;
    }
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

  getMachineAssignments(machineName: string): any[] {
    return this.assignments.filter(asg => 
      asg.machineName === machineName && 
      this.isSameDate(asg.assignmentDate, this.selectedDate)
    );
  }

  getAssignedCount(): number {
    return this.employees.filter(emp => this.getEmpAssignment(emp.id)).length;
  }

  getUnassignedCount(): number {
    return Math.max(0, this.employees.length - this.getAssignedCount());
  }

  onAssignToMachine(machineName: string, shiftType: number = 1) {
    if (!this.selectedEmployee) return;

    this.isLoading = true;
    const payload = {
      employeeId: this.selectedEmployee.id,
      shiftType: shiftType,
      machineName: machineName,
      assignmentDate: new Date(this.selectedDate)
    };

    this.apiService.assignShift(payload).subscribe({
      next: () => {
        this.selectedEmployee = null;
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

  // Tab 2 Methods
  getEmpMachineName(empId: string): string {
    const asg = this.getEmpAssignment(empId);
    return asg ? asg.machineName : '';
  }

  onGridMachineChange(emp: any, newMachine: string) {
    const asg = this.getEmpAssignment(emp.id);
    if (!newMachine) {
      // Unassigned
      if (asg) this.onDeallocate(asg.id);
      return;
    }

    const shiftType = asg ? asg.shiftType : 1; // default morning if no existing
    this.selectedEmployee = emp;
    this.onAssignToMachine(newMachine, shiftType);
  }

  toggleShift(empId: string, newShiftType: number, machineName: string) {
    this.selectedEmployee = { id: empId };
    this.onAssignToMachine(machineName, newShiftType);
  }

  // Utilities
  getInitials(name: string): string {
    if (!name) return 'EE';
    const trimmed = name.trim();
    if (!trimmed) return 'EE';
    const parts = trimmed.split(/\\s+/);
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  getEmpProfilePic(employeeId: string): string | null {
    const emp = this.employees.find(e => e.id === employeeId);
    if (emp && emp.profilePicture && emp.profilePicture !== 'undefined' && emp.profilePicture !== 'null') {
      return emp.profilePicture;
    }
    return null;
  }

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

  loadMachinesFromSettings() {
    this.apiService.getSettings().subscribe({
      next: (settings) => {
        const machSetting = settings.find((s: any) => s.key === 'FloorMachines');
        if (machSetting && machSetting.value) {
          try {
            this.machines = JSON.parse(machSetting.value);
            if (this.machines.length === 0) this.populateDefaultMachines();
          } catch (e) {
            this.populateDefaultMachines();
          }
        } else {
          this.populateDefaultMachines();
          this.saveMachinesToSettings();
        }
      }
    });
  }

  populateDefaultMachines() {
    this.machines = [
      { name: 'CNC Machine - 01', floor: 'Floor Unit A' },
      { name: 'CNC Machine - 02', floor: 'Floor Unit A' },
      { name: 'Milling Machine - 01', floor: 'Floor Unit B' },
      { name: 'Lathe Machine - 01', floor: 'Floor Unit A' }
    ];
  }
}
