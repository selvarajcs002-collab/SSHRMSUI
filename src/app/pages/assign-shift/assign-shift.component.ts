import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Employee, EmployeeUpdateRequest } from '../../core/models/employee.model';
import { EmployeeService } from '../../core/services/employee.service';
@Component({
  selector: 'app-assign-shift',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assign-shift.component.html',
  styleUrls: ['./assign-shift.component.css']
})
export class AssignShiftComponent implements OnInit {
  employees: any[] = [];
  filteredEmployees: any[] = [];
  searchTerm = '';
  
  dayCount = 0;
  nightCount = 0;
  
  showSuccessToast = false;

  sortColumn = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private employeeService: EmployeeService) {}

  ngOnInit() {
    this.fetchEmployees();
  }

  fetchEmployees() {
    this.employeeService.getShiftAssignments().subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.employees = response.data.map((emp: any) => ({
            employeeShiftId: emp.employeeShiftId,
            employeeId: emp.employeeId,
            name: emp.employeeName || 'Unknown',
            designation: emp.designation || 'N/A',
            shift: emp.shift || 'Morning'
          }));
          
          // Make a deep copy to track changes (optional, but good practice if we want to only save modified ones later)
          this.filteredEmployees = [...this.employees];
          this.updateCounts();
          this.filterAndSortEmployees();
        }
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
      }
    });
  }

  updateCounts() {
    this.dayCount = this.employees.filter(e => e.shift === 'Morning').length;
    this.nightCount = this.employees.filter(e => e.shift === 'Night').length;
  }

  onSearch(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterAndSortEmployees();
  }

  filterAndSortEmployees() {
    // Filter
    let result = this.employees;
    if (this.searchTerm) {
      result = result.filter(emp => 
        (emp.name && emp.name.toLowerCase().includes(this.searchTerm)) ||
        (emp.designation && emp.designation.toLowerCase().includes(this.searchTerm))
      );
    }
    
    // Sort
    result.sort((a: any, b: any) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];
      
      if (this.sortColumn === 'employeeId') {
        valA = parseInt(a.employeeId, 10);
        valB = parseInt(b.employeeId, 10);
      }
      
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredEmployees = result;
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.filterAndSortEmployees();
  }

  getSortIcon(column: string) {
    if (this.sortColumn !== column) return 'fa-sort';
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  toggleShift(employee: any) {
    employee.shift = employee.shift === 'Morning' ? 'Night' : 'Morning';
    this.updateCounts();
  }

  saveAssignments() {
    if (this.employees.length === 0) return;

    // Create a list of update observables for each employee
    const updateRequests = this.employees.map(emp => {
      const payload = {
        employeeShiftId: emp.employeeShiftId || 0,
        employeeId: emp.employeeId,
        shift: emp.shift,
        effectiveFrom: new Date().toISOString(),
        effectiveTo: new Date().toISOString(),
        isActive: true,
        createdBy: 0,
        updatedBy: 0
      };
      return this.employeeService.saveShiftAssignment(payload);
    });

    // Wait for all updates to complete
    forkJoin(updateRequests).subscribe({
      next: () => {
        this.showSuccessToast = true;
        setTimeout(() => {
          this.showSuccessToast = false;
        }, 3000);
      },
      error: (err) => {
        console.error('Error saving shift assignments:', err);
      }
    });
  }
}

