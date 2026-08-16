import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AttendanceService } from '../../core/services/attendance.service';
import { AppConfigService } from '../../core/services/app-config.service';
import { AttendanceRecord, AttendanceFilter, AttendanceSummary } from '../../core/models/attendance.model';
import { Shift, Department, Designation, AttendanceStatus } from '../../core/models/hrms-config.model';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  providers: [DatePipe],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit {
  // Configuration
  shifts: Shift[] = [];
  departments: Department[] = [];
  designations: Designation[] = [];
  attendanceStatuses: AttendanceStatus[] = [];

  // State
  selectedDate: string = '';
  selectedShift: string | number = 1;
  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  // Data
  records: AttendanceRecord[] = [];
  selectedEmployeeIds: Set<string> = new Set<string>();
  
  // Filters
  isFilterOpen: boolean = false;
  filter: AttendanceFilter = {
    date: '',
    shift: 1,
    department: 'all',
    designation: 'all',
    status: 'all',
    searchQuery: ''
  };

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizes: number[] = [10, 20, 50, 100];
  
  // Summary
  summary: AttendanceSummary = {
    totalEmployees: 0,
    present: 0,
    absent: 0,
    halfDay: 0
  };

  // Edit Modal State
  isEditModalOpen: boolean = false;
  editingRecord: AttendanceRecord | null = null;
  editModalTempStatus: string | number = '';
  editModalTempRemarks: string = '';

  // Bulk Edit Modal State
  isBulkModalOpen: boolean = false;
  bulkActionStatus: string | number = '';

  // Expose Math to template
  Math = Math;

  // Unsaved changes tracking
  get hasUnsavedChanges(): boolean {
    return this.unsavedCount > 0;
  }
  
  get unsavedCount(): number {
    return this.records.filter(r => r.isModified).length;
  }

  constructor(
    private attendanceService: AttendanceService,
    private configService: AppConfigService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadConfig();
    this.initializeDefaults();
    this.loadData();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.hasUnsavedChanges) {
      $event.returnValue = true;
    }
  }

  private loadConfig(): void {
    this.shifts = this.configService.getShifts();
    this.departments = this.configService.getDepartments();
    this.designations = this.configService.getDesignations();
    this.attendanceStatuses = this.configService.getAttendanceStatuses();
  }

  private initializeDefaults(): void {
    const today = new Date();
    this.selectedDate = this.datePipe.transform(today, 'yyyy-MM-dd') || '';
    
    // Default to MORNING shift
    const morningShift = this.shifts.find(s => s.name === 'MORNING');
    this.selectedShift = morningShift ? morningShift.id : 1;

    this.filter.date = this.selectedDate;
    this.filter.shift = this.selectedShift;
  }

  // Loading Data
  loadData(showLoader: boolean = true): void {
    if (showLoader) {
      this.isLoading = true;
    }
    
    this.errorMessage = '';
    
    this.attendanceService.getAttendance(this.filter).subscribe({
      next: (data) => {
        // Merge with unsaved local changes if necessary, 
        // but for now we assume loading resets state or we block loading if unsaved.
        this.records = data;
        this.calculateSummary();
        this.selectedEmployeeIds.clear();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load attendance', error);
        this.errorMessage = 'Unable to load attendance. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private calculateSummary(): void {
    let present = 0;
    let absent = 0;
    let halfDay = 0;

    this.records.forEach(r => {
      if (r.status === 'PRESENT') present++;
      else if (r.status === 'ABSENT') absent++;
      else if (r.status === 'HALF DAY') halfDay++;
    });

    this.summary = {
      totalEmployees: this.records.length,
      present,
      absent,
      halfDay
    };
  }

  // Event Handlers
  onDateChange(): void {
    if (this.checkUnsavedChanges()) {
      this.filter.date = this.selectedDate;
      this.loadData();
    } else {
      // Revert date selection if cancelled
      this.selectedDate = this.filter.date;
    }
  }

  selectShift(shiftId: string | number): void {
    if (this.selectedShift === shiftId) return;
    
    if (this.checkUnsavedChanges()) {
      this.selectedShift = shiftId;
      this.filter.shift = shiftId;
      this.loadData();
    }
  }

  refreshData(): void {
    if (this.checkUnsavedChanges()) {
      this.loadData();
    }
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadData();
  }

  resetFilters(): void {
    this.filter = {
      date: this.selectedDate,
      shift: this.selectedShift,
      department: 'all',
      designation: 'all',
      status: 'all',
      searchQuery: ''
    };
    this.loadData();
  }

  toggleFilterPanel(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  // Pagination
  get paginatedRecords(): AttendanceRecord[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.records.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.records.length / this.pageSize);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Selection
  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.paginatedRecords.forEach(r => {
        if (r.id || r.employeeId) this.selectedEmployeeIds.add(r.employeeId);
      });
    } else {
      this.paginatedRecords.forEach(r => {
        this.selectedEmployeeIds.delete(r.employeeId);
      });
    }
  }

  toggleSelectRow(employeeId: string): void {
    if (this.selectedEmployeeIds.has(employeeId)) {
      this.selectedEmployeeIds.delete(employeeId);
    } else {
      this.selectedEmployeeIds.add(employeeId);
    }
  }

  isAllSelected(): boolean {
    return this.paginatedRecords.length > 0 && 
           this.paginatedRecords.every(r => this.selectedEmployeeIds.has(r.employeeId));
  }

  // Inline Editing
  updateInlineStatus(record: AttendanceRecord, newStatus: string): void {
    if (record.status !== newStatus) {
      record.status = newStatus;
      record.isModified = true;
      this.calculateSummary();
    }
  }

  markAsModified(record: AttendanceRecord): void {
    record.isModified = true;
  }

  // Global Save
  saveChanges(): void {
    const modifiedRecords = this.records.filter(r => r.isModified);
    if (modifiedRecords.length === 0) return;

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.attendanceService.bulkUpdateAttendance(modifiedRecords, this.selectedDate).subscribe({
      next: () => {
        modifiedRecords.forEach(r => r.isModified = false);
        this.isSaving = false;
        this.successMessage = 'Attendance updated successfully.';
        this.calculateSummary();
        
        // Hide success message after 3 seconds
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Save failed', error);
        this.isSaving = false;
        this.errorMessage = 'Failed to save attendance changes. Please try again.';
      }
    });
  }

  // Edit Modal
  openEditModal(record: AttendanceRecord): void {
    this.editingRecord = record;
    this.editModalTempStatus = record.status;
    this.editModalTempRemarks = record.remarks || '';
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editingRecord = null;
  }

  saveEditModal(): void {
    if (this.editingRecord) {
      if (this.editingRecord.status !== this.editModalTempStatus || 
          this.editingRecord.remarks !== this.editModalTempRemarks) {
        
        this.editingRecord.status = this.editModalTempStatus;
        this.editingRecord.remarks = this.editModalTempRemarks;
        this.editingRecord.isModified = true;
        this.calculateSummary();
      }
    }
    this.closeEditModal();
  }

  // Bulk Actions
  openBulkActionModal(status: string | number): void {
    if (this.selectedEmployeeIds.size === 0) return;
    this.bulkActionStatus = status;
    this.isBulkModalOpen = true;
  }

  closeBulkModal(): void {
    this.isBulkModalOpen = false;
    this.bulkActionStatus = '';
  }

  confirmBulkAction(): void {
    const statusName = this.bulkActionStatus as string;
    
    this.records.forEach(r => {
      if (this.selectedEmployeeIds.has(r.employeeId)) {
        if (r.status !== statusName) {
          r.status = statusName;
          r.isModified = true;
        }
      }
    });
    
    this.calculateSummary();
    this.closeBulkModal();
    // Keep selection active as requested: "Do not immediately lose the selection."
  }

  // Helpers
  private checkUnsavedChanges(): boolean {
    if (this.hasUnsavedChanges) {
      return confirm('You have unsaved attendance changes. Do you want to leave without saving?');
    }
    return true;
  }

  getShiftName(shiftId: string | number): string {
    const shift = this.shifts.find(s => s.id == shiftId);
    return shift ? shift.name : String(shiftId);
  }

  getStatusColor(statusName: string | number): string {
    const status = this.attendanceStatuses.find(s => s.name === statusName || s.id === statusName);
    return status ? status.color : 'gray';
  }
  
  getInitials(name: string): string {
    if (!name) return 'EE';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  // Math helper for UI
  getPercentage(count: number): number {
    if (this.summary.totalEmployees === 0) return 0;
    return (count / this.summary.totalEmployees) * 100;
  }
}
