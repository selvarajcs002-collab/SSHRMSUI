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
  templateUrl: './shift-management.component.html',
  styleUrls: ['./shift-management.component.scss']
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
