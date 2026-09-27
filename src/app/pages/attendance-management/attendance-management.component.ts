import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ModernCalendarComponent } from '../../components/modern-calendar/modern-calendar.component';
import { ModernDropdownComponent } from '../../components/modern-dropdown/modern-dropdown.component';
import { AttendanceEmployeeDetail, AttendancePeriodSummary, AttendanceService, AttendanceResponse } from '../../core/services/attendance.service';

@Component({
  selector: 'app-attendance-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, ModernCalendarComponent, ModernDropdownComponent],
  templateUrl: './attendance-management.component.html',
  styleUrls: ['./attendance-management.component.css']
})
export class AttendanceManagementComponent implements OnInit {
  activeShift: 'Morning' | 'Night' = 'Morning';
  currentDate = new Date();
  
  statusOptions = ['Present', 'Leave', 'Half-Day'];

  allRecords: AttendanceResponse[] = [];
  displayedRecords: AttendanceResponse[] = [];
  searchTerm = '';
  
  presentCount = 0;
  leaveCount = 0;
  halfDayCount = 0;

  fromDate = new Date();
  toDate = new Date();
  summaryRecords: AttendancePeriodSummary[] = [];
  displayedSummaryRecords: AttendancePeriodSummary[] = [];
  periodPresentCount = 0;
  periodAbsentCount = 0;
  periodHalfDayCount = 0;
  periodNotMarkedCount = 0;
  isSummaryLoading = false;
  summaryError = '';

  showDetailsDrawer = false;
  selectedSummary: AttendancePeriodSummary | null = null;
  attendanceDetails: AttendanceEmployeeDetail | null = null;
  isDetailsLoading = false;
  detailsError = '';
  showAllDates = false;
  
  // Calendar variables for details drawer
  drawerMonth: Date = new Date();
  drawerWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  drawerCalendarGrid: any[] = [];
  drawerMonthLabel = '';
  
  showSuccessToast = false;
  successToastMessage = 'Attendance Saved Successfully!';
  showErrorToast = false;
  errorToastMessage = '';

  isAttendanceDialogOpen = false;
  isSavingAttendance = false;
  selectedAttendanceDate: Date | null = null;
  selectedAttendanceStatus = '';
  selectedAttendanceRemarks = '';
  attendanceDialogError = '';
  
  // Mark Attendance Modal
  showMarkModal = false;
  selectedRecord: AttendanceResponse | null = null;
  tempRemarks = '';
  tempStatus = '';
  
  // Export Modal
  showExportModal = false;
  exportFromDate = new Date();
  exportToDate = new Date();

  constructor(private attendanceApi: AttendanceService) {}

  ngOnInit() {
    this.allRecords = [];
    
    // Set default dates for export modal (e.g. first and last day of current month)
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    this.exportFromDate = new Date(y, m, 1);
    this.exportToDate = new Date(y, m + 1, 0);
    this.fromDate = new Date(y, m, 1);
    this.toDate = new Date(y, m + 1, 0);

    this.fetchRecords();
    this.fetchSummary();
  }

  fetchRecords() {
    const formattedDate = this.currentDate.toISOString().split('T')[0];
    this.attendanceApi.getAttendance(formattedDate, this.activeShift).subscribe({
      next: (response) => {
        this.allRecords = response.employees || [];
        this.filterRecords();
      },
      error: (err) => {
        console.error('Error fetching attendance:', err);
        this.showError('Unable to load daily attendance.');
      }
    });
  }

  updateStatus(record: AttendanceResponse, newStatus: string) {
    record.status = newStatus as 'Present' | 'Leave' | 'Half-Day';
    this.onStatusChange();
  }
  
  onDateSelected(newDate: Date) {
    this.currentDate = newDate;
    this.fetchRecords();
  }

  onExportFromDateSelected(date: Date) {
    this.exportFromDate = date;
  }

  onExportToDateSelected(date: Date) {
    this.exportToDate = date;
  }

  setShift(shift: 'Morning' | 'Night') {
    this.activeShift = shift;
    this.fetchRecords();
    this.fetchSummary();
  }

  onFromDateSelected(date: Date) {
    this.fromDate = date;
  }

  onToDateSelected(date: Date) {
    this.toDate = date;
  }

  applyDateRange() {
    if (this.fromDate > this.toDate) {
      this.showError('From Date cannot be greater than To Date.');
      return;
    }
    this.fetchSummary();
  }

  fetchSummary() {
    this.isSummaryLoading = true;
    this.summaryError = '';

    this.attendanceApi.getAttendanceSummary(this.fromDate, this.toDate, this.activeShift).subscribe({
      next: (rows) => {
        this.summaryRecords = rows || [];
        this.filterRecords();
        this.isSummaryLoading = false;
      },
      error: (err) => {
        console.error('Error fetching attendance summary:', err);
        this.summaryRecords = [];
        this.filterRecords();
        this.isSummaryLoading = false;
        this.summaryError = 'Unable to load attendance summary.';
        this.showError(this.summaryError);
      }
    });
  }

  onSearch(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterRecords();
  }

  filterRecords() {
    let result = this.allRecords;
    
    if (this.activeShift) {
      result = result.filter(r => r.shift === this.activeShift);
    }
    
    if (this.searchTerm) {
      result = result.filter(r => (r.name || '').toLowerCase().includes(this.searchTerm));
    }
    
    this.displayedRecords = result;
    this.updateSummaryCounts();

    let summary = this.summaryRecords;
    
    if (this.activeShift) {
      summary = summary.filter(r => r.shift === this.activeShift);
    }
    
    if (this.searchTerm) {
      summary = summary.filter(r =>
        (r.employeeName || '').toLowerCase().includes(this.searchTerm) ||
        (r.employeeCode || '').toLowerCase().includes(this.searchTerm)
      );
    }
    this.displayedSummaryRecords = summary;
    this.updatePeriodCounts();
  }

  updatePeriodCounts() {
    this.periodPresentCount = this.displayedSummaryRecords.reduce((sum, r) => sum + (r.presentDays || 0), 0);
    this.periodAbsentCount = this.displayedSummaryRecords.reduce((sum, r) => sum + (r.absentDays || 0), 0);
    this.periodHalfDayCount = this.displayedSummaryRecords.reduce((sum, r) => sum + (r.halfDays || 0), 0);
    this.periodNotMarkedCount = this.displayedSummaryRecords.reduce((sum, r) => sum + (r.notMarkedDays || 0), 0);
  }

  onStatusChange() {
    this.updateSummaryCounts();
  }

  updateSummaryCounts() {
    this.presentCount = this.displayedRecords.filter(r => r.status === 'Present').length;
    this.leaveCount = this.displayedRecords.filter(r => r.status === 'Leave').length;
    this.halfDayCount = this.displayedRecords.filter(r => r.status === 'Half-Day').length;
  }

  openMarkModal(record: AttendanceResponse) {
    this.selectedRecord = record;
    this.tempRemarks = record.remarks !== '-' && record.remarks ? record.remarks : '';
    this.tempStatus = record.status || 'Present';
    this.showMarkModal = true;
  }

  saveMarkModal() {
    if (this.selectedRecord) {
      this.selectedRecord.remarks = this.tempRemarks || '-';
      this.selectedRecord.status = this.tempStatus as any;
      this.onStatusChange();
    }
    this.closeMarkModal();
  }

  closeMarkModal() {
    this.showMarkModal = false;
    this.selectedRecord = null;
  }

  getModalDate(): string {
    if (!this.currentDate) return '';
    const dateStr = this.currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const dayStr = this.currentDate.toLocaleDateString('en-GB', { weekday: 'long' });
    return `${dateStr} (${dayStr})`;
  }

  saveAttendance() {
    const formattedDate = this.currentDate.toISOString().split('T')[0];
    const bulkRequest = {
      attendanceDate: formattedDate,
      shift: this.activeShift,
      attendance: this.allRecords.map(emp => ({
        employeeId: emp.employeeId,
        attendanceDate: emp.attendanceDate || formattedDate,
        shift: this.activeShift,
        status: emp.status || 'Present',
        remarks: emp.remarks
      }))
    };

    this.attendanceApi.saveAttendance(bulkRequest).subscribe({
      next: (response) => {
        this.successToastMessage = 'Attendance Saved Successfully!';
        this.showSuccessToast = true;
        this.allRecords = response.employees || [];
        this.filterRecords();
        this.fetchSummary();
        setTimeout(() => {
          this.showSuccessToast = false;
        }, 3000);
      },
      error: (err) => {
        console.error('Error saving attendance:', err);
        this.showError('Unable to save attendance.');
      }
    });
  }

  openExportModal() {
    this.showExportModal = true;
  }

  closeExportModal() {
    this.showExportModal = false;
  }

  generateExcel() {
    // Placeholder for actual generation
    this.closeExportModal();
    alert('Excel Export Triggered (UI Only Placeholder)');
  }

  openDetails(record: AttendancePeriodSummary | AttendanceResponse) {
    this.selectedSummary = record as any;
    this.attendanceDetails = null;
    this.detailsError = '';
    this.showAllDates = false;
    this.showDetailsDrawer = true;
    this.isDetailsLoading = true;

    this.attendanceApi.getEmployeeAttendanceDetails(record.employeeId, this.fromDate, this.toDate).subscribe({
      next: (details) => {
        this.attendanceDetails = details;
        this.isDetailsLoading = false;
        this.drawerMonth = new Date(this.fromDate); // Start with selected fromDate
        this.generateDrawerCalendar(this.drawerMonth, details.allDates || []);
      },
      error: (err) => {
        console.error('Error fetching attendance details:', err);
        this.isDetailsLoading = false;
        this.detailsError = err?.error?.message || 'Unable to load attendance details.';
        this.showError(this.detailsError);
      }
    });
  }

  closeDetails() {
    this.showDetailsDrawer = false;
    this.selectedSummary = null;
    this.attendanceDetails = null;
    this.showAllDates = false;
    this.detailsError = '';
  }

  toggleShowAllDates() {
    this.showAllDates = !this.showAllDates;
  }

  generateDrawerCalendar(monthDate: Date, allDates: any[]) {
    this.drawerCalendarGrid = [];
    this.drawerMonthLabel = monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    const days: { date: Date, inMonth: boolean, status?: string | null }[] = [];
    for (let x = firstDayIndex; x > 0; x--) {
      days.push({ date: new Date(year, month - 1, prevLastDay - x + 1), inMonth: false });
    }
    for (let i = 1; i <= lastDay; i++) {
      days.push({ date: new Date(year, month, i), inMonth: true });
    }
    const remainingDays = 42 - days.length;
    for (let j = 1; j <= remainingDays; j++) {
      days.push({ date: new Date(year, month + 1, j), inMonth: false });
    }

    days.forEach(d => {
      const match = allDates.find(a => this.isSameDate(a.attendanceDate, d.date));
      d.status = match ? this.normalizeCalendarStatus(match.status) : null;
    });
    this.drawerCalendarGrid = days;
  }

  drawerPrevMonth() {
    this.drawerMonth = new Date(this.drawerMonth.getFullYear(), this.drawerMonth.getMonth() - 1, 1);
    if (this.attendanceDetails && this.attendanceDetails.allDates) {
      this.generateDrawerCalendar(this.drawerMonth, this.attendanceDetails.allDates);
    }
  }

  drawerNextMonth() {
    this.drawerMonth = new Date(this.drawerMonth.getFullYear(), this.drawerMonth.getMonth() + 1, 1);
    if (this.attendanceDetails && this.attendanceDetails.allDates) {
      this.generateDrawerCalendar(this.drawerMonth, this.attendanceDetails.allDates);
    }
  }

  shiftLabel(shift?: string | null): string {
    return shift === 'Night' ? 'Night' : 'Day';
  }

  formatDisplayDate(value?: string | Date | null): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value.toString();
    }
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  statusClass(status?: string | null): string {
    const value = (status || 'Not Marked').toLowerCase().replace(/\s+/g, '-');
    return value === 'half-day' ? 'half-day' : value;
  }

  onAttendanceDateClick(date: Date | string, inMonth = true) {
    if (!inMonth || !this.attendanceDetails) {
      return;
    }

    const clickedDate = this.toLocalDate(date);
    this.selectedAttendanceDate = clickedDate;
    this.attendanceDialogError = '';

    const existing = (this.attendanceDetails.allDates || []).find(item => this.isSameDate(item.attendanceDate, clickedDate));
    const apiStatus = existing ? this.toApiStatus(existing.status) : '';

    this.selectedAttendanceStatus = apiStatus;
    this.selectedAttendanceRemarks = existing?.remarks && existing.remarks !== '-' ? existing.remarks : '';
    this.isAttendanceDialogOpen = true;
  }

  closeAttendanceDialog() {
    if (this.isSavingAttendance) {
      return;
    }
    this.isAttendanceDialogOpen = false;
    this.selectedAttendanceDate = null;
    this.selectedAttendanceStatus = '';
    this.selectedAttendanceRemarks = '';
    this.attendanceDialogError = '';
  }

  saveDialogAttendance() {
    if (!this.attendanceDetails || !this.selectedAttendanceDate) {
      this.attendanceDialogError = 'Unable to save attendance. Please try again.';
      return;
    }

    if (!this.selectedAttendanceStatus || !['Present', 'Leave', 'Half-Day'].includes(this.selectedAttendanceStatus)) {
      this.attendanceDialogError = 'Please select attendance status.';
      return;
    }

    this.isSavingAttendance = true;
    this.attendanceDialogError = '';

    this.attendanceApi.saveEmployeeAttendance({
      employeeId: this.attendanceDetails.employeeId,
      attendanceDate: this.formatDateOnly(this.selectedAttendanceDate),
      status: this.selectedAttendanceStatus,
      remarks: this.selectedAttendanceRemarks || ''
    }).subscribe({
      next: (saved) => {
        this.applySavedAttendance(saved?.status || this.selectedAttendanceStatus, saved?.remarks || this.selectedAttendanceRemarks);
        this.isSavingAttendance = false;
        this.isAttendanceDialogOpen = false;
        this.successToastMessage = 'Attendance saved successfully.';
        this.showSuccessToast = true;
        setTimeout(() => {
          this.showSuccessToast = false;
        }, 3000);
        this.fetchSummary();
        this.fetchRecords();
      },
      error: (err) => {
        this.isSavingAttendance = false;
        this.attendanceDialogError = err?.error?.message || 'Unable to save attendance.';
        this.showError(this.attendanceDialogError);
      }
    });
  }

  formatDialogTitle(date?: Date | null): string {
    if (!date) {
      return '';
    }
    const formatted = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
    return `${formatted} (${weekday})`;
  }

  private applySavedAttendance(status: string, remarks: string) {
    if (!this.attendanceDetails || !this.selectedAttendanceDate) {
      return;
    }

    const apiStatus = this.toApiStatus(status);
    const displayStatus = this.toDisplayStatus(apiStatus);
    const dateKey = this.formatDateOnly(this.selectedAttendanceDate);

    const allDates = [...(this.attendanceDetails.allDates || [])];
    const index = allDates.findIndex(item => this.isSameDate(item.attendanceDate, this.selectedAttendanceDate!));
    if (index >= 0) {
      allDates[index] = { ...allDates[index], status: displayStatus, remarks };
    } else {
      allDates.push({
        attendanceDate: dateKey,
        status: displayStatus,
        shift: this.attendanceDetails.shift,
        remarks
      });
    }

    this.attendanceDetails.allDates = allDates;
    this.attendanceDetails.presentDays = allDates.filter(x => this.toApiStatus(x.status) === 'Present').length;
    this.attendanceDetails.absentDays = allDates.filter(x => this.toApiStatus(x.status) === 'Leave').length;
    this.attendanceDetails.halfDays = allDates.filter(x => this.toApiStatus(x.status) === 'Half-Day').length;
    this.attendanceDetails.notMarkedDays = allDates.filter(x => this.normalizeCalendarStatus(x.status) === 'Not Marked').length;
    this.attendanceDetails.absentDates = allDates.filter(x => this.toApiStatus(x.status) === 'Leave').map(x => x.attendanceDate);
    this.attendanceDetails.halfDayDates = allDates.filter(x => this.toApiStatus(x.status) === 'Half-Day').map(x => x.attendanceDate);
    this.attendanceDetails.notMarkedDates = allDates.filter(x => this.normalizeCalendarStatus(x.status) === 'Not Marked').map(x => x.attendanceDate);

    this.generateDrawerCalendar(this.drawerMonth, this.attendanceDetails.allDates);
  }

  private normalizeCalendarStatus(status?: string | null): string {
    const apiStatus = this.toApiStatus(status || '');
    if (apiStatus === 'Present') return 'Present';
    if (apiStatus === 'Leave') return 'Absent';
    if (apiStatus === 'Half-Day') return 'Half-Day';
    return 'Not Marked';
  }

  private toApiStatus(status?: string | null): string {
    const value = (status || '').trim().toLowerCase();
    if (value === 'present') return 'Present';
    if (value === 'leave' || value === 'absent') return 'Leave';
    if (value === 'half-day' || value === 'half day') return 'Half-Day';
    return '';
  }

  private toDisplayStatus(apiStatus: string): string {
    if (apiStatus === 'Leave') return 'Absent';
    if (apiStatus === 'Half-Day') return 'Half Day';
    if (apiStatus === 'Present') return 'Present';
    return 'Not Marked';
  }

  private isSameDate(left: string | Date, right: string | Date): boolean {
    return this.formatDateOnly(left) === this.formatDateOnly(right);
  }

  private toLocalDate(value: string | Date): Date {
    if (value instanceof Date) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    const text = value.toString();
    const dateOnly = text.substring(0, 10);
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    const parsed = new Date(value);
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private formatDateOnly(value: string | Date): string {
    const date = this.toLocalDate(value);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private showError(message: string) {
    this.errorToastMessage = message;
    this.showErrorToast = true;
    setTimeout(() => {
      this.showErrorToast = false;
    }, 3500);
  }
}
