import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModernCalendarComponent } from '../../components/modern-calendar/modern-calendar.component';
import { ModernDropdownComponent } from '../../components/modern-dropdown/modern-dropdown.component';
import { EmsApiService } from '../../services/ems-api.service';
import { SalaryDetails, SalaryPaymentStatus, SaveSalaryDetailsRequest } from '../../models/salary-details.model';
import { SalaryExcelExportService, SalaryExportItem, SalaryExportSummary } from '../../core/services/salary-excel-export.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface SalaryRecord {
  employeeSalaryId: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  designation: string;
  date: string;
  salaryMonth: string;
  salaryFromDate: string;
  salaryToDate: string;
  perDaySalary: number;
  presentDays: number;
  leaveDays: number;
  halfDays: number;
  totalSalary: number;
  incentive: number;
  advance: number;
  salary: number;
  remarks?: string;
  paymentStatus: SalaryPaymentStatus;
  paidDate?: string | null;
  paidBy?: number | null;
  voucherNo?: string | null;
}

type StatusFilter = 'All' | 'Pending' | 'Paid';

@Component({
  selector: 'app-salary-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModernCalendarComponent, ModernDropdownComponent],
  templateUrl: './salary-management.component.html',
  styleUrls: ['./salary-management.component.css']
})
export class SalaryManagementComponent implements OnInit {
  fromDate = new Date();
  toDate = new Date();
  selectedMonth = '';
  months: string[] = [];

  searchTerm = '';
  statusFilter: StatusFilter = 'All';
  allRecords: SalaryRecord[] = [];
  displayedRecords: SalaryRecord[] = [];

  totalEmployees = 0;
  totalPayment = 0;
  completedCount = 0;
  remainingCount = 0;
  paidAmount = 0;
  pendingAmount = 0;

  showCalcModal = false;
  selectedRecord: SalaryRecord | null = null;
  tempRecord: Partial<SalaryRecord> = {};

  showSuccessModal = false;
  successTitle = 'Success';
  successMessage = '';

  showConfirmPaidModal = false;
  confirmRecord: SalaryRecord | null = null;

  showExportModal = false;
  exportMonth = '';
  isGeneratingPayslip = false;
  isSaving = false;
  isMarkingPaid = false;
  isLoading = false;
  payslipError = '';
  actionError = '';

  constructor(
    private apiService: EmsApiService,
    private excelExportService: SalaryExcelExportService
  ) { }

  ngOnInit() {
    this.months = this.buildMonthOptions();
    const today = new Date();
    this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.selectedMonth = this.formatMonthLabel(this.fromDate);
    this.exportMonth = this.selectedMonth;
    this.loadPage();
  }

  onFromDateSelected(date: Date) {
    this.fromDate = date;
    this.syncMonthFromDates();
    this.loadPage();
  }

  onToDateSelected(date: Date) {
    this.toDate = date;
    this.syncMonthFromDates();
    this.loadPage();
  }

  onMonthChange() {
    const parsed = this.parseMonthLabel(this.selectedMonth);
    if (!parsed) {
      return;
    }

    this.fromDate = new Date(parsed.year, parsed.month, 1);
    this.toDate = new Date(parsed.year, parsed.month + 1, 0);
    this.loadPage();
  }

  loadPage() {
    this.loadData();
    this.loadSummary();
  }

  loadData() {
    const fromStr = this.formatDateForApi(this.fromDate);
    const toStr = this.formatDateForApi(this.toDate);
    this.isLoading = true;
    this.payslipError = '';
    this.actionError = '';

    this.apiService.getSalaryDetails(undefined, fromStr, toStr).subscribe({
      next: (salaries) => {
        this.allRecords = (salaries || []).map((s: SalaryDetails) => this.mapSalaryRecord(s, fromStr, toStr));
        this.filterRecords();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading salary details', err);
        this.actionError = this.readApiError(err, 'Unable to load salary details.');
        this.allRecords = [];
        this.filterRecords();
        this.isLoading = false;
      }
    });
  }

  loadSummary() {
    const fromStr = this.formatDateForApi(this.fromDate);
    const toStr = this.formatDateForApi(this.toDate);

    this.apiService.getSalarySummary(fromStr, toStr).pipe(
      catchError((err) => {
        console.error('Error loading salary summary', err);
        return of(null);
      })
    ).subscribe((summary) => {
      if (!summary) {
        this.calculateSummariesFromRows();
        return;
      }

      this.totalEmployees = summary.totalEmployees || 0;
      this.totalPayment = summary.totalPayment || 0;
      this.completedCount = summary.completedPaid || 0;
      this.remainingCount = summary.remaining || 0;
      this.paidAmount = summary.paidAmount || 0;
      this.pendingAmount = summary.pendingAmount || 0;
    });
  }

  onSearch(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterRecords();
  }

  setStatusFilter(filter: StatusFilter) {
    this.statusFilter = filter;
    this.filterRecords();
  }

  filterRecords() {
    let result = this.allRecords;

    if (this.searchTerm) {
      result = result.filter(r =>
        r.employeeName.toLowerCase().includes(this.searchTerm) ||
        r.designation.toLowerCase().includes(this.searchTerm) ||
        r.employeeCode.toLowerCase().includes(this.searchTerm)
      );
    }

    if (this.statusFilter !== 'All') {
      result = result.filter(r => r.paymentStatus === this.statusFilter);
    }

    this.displayedRecords = result;
  }

  formatCurrency(val: number | null | undefined): string {
    const amount = Number(val) || 0;
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  isPaid(record?: Partial<SalaryRecord> | null): boolean {
    return (record?.paymentStatus || 'Pending') === 'Paid';
  }

  openCalcModal(record: SalaryRecord) {
    this.selectedRecord = record;
    this.tempRecord = { ...record };
    this.actionError = '';
    this.payslipError = '';

    const fromStr = record.salaryFromDate || this.formatDateForApi(this.fromDate);
    const toStr = record.salaryToDate || this.formatDateForApi(this.toDate);

    this.apiService.getSalaryDetailsByEmployee(record.employeeId, fromStr, toStr).subscribe({
      next: (data) => {
        const sal = Array.isArray(data) ? data[0] : data;
        if (sal) {
          this.tempRecord = { ...this.tempRecord, ...this.mapSalaryRecord(sal, fromStr, toStr) };
        }
        this.showCalcModal = true;
      },
      error: () => {
        this.showCalcModal = true;
      }
    });
  }

  closeCalcModal() {
    this.showCalcModal = false;
    this.payslipError = '';
    this.actionError = '';
    this.isGeneratingPayslip = false;
    this.isSaving = false;
  }

  calculateLiveTotal(): number {
    const present = Number(this.tempRecord.presentDays) || 0;
    const half = Number(this.tempRecord.halfDays) || 0;
    const perDay = Number(this.tempRecord.perDaySalary) || 0;
    const inc = Number(this.tempRecord.incentive) || 0;
    const adv = Number(this.tempRecord.advance) || 0;

    return (present * perDay) + ((perDay / 2) * half) + inc - adv;
  }

  saveSalary() {
    if (!this.selectedRecord || this.isSaving) {
      return;
    }

    const incentive = Number(this.tempRecord.incentive) || 0;
    const advance = Number(this.tempRecord.advance) || 0;

    if (incentive < 0 || advance < 0) {
      this.actionError = 'Incentive and Advance cannot be negative.';
      return;
    }

    const payload = this.buildSavePayload();
    this.isSaving = true;
    this.actionError = '';

    const request$ = this.selectedRecord.employeeSalaryId > 0
      ? this.apiService.updateSalaryDetails(this.selectedRecord.employeeId, payload)
      : this.apiService.createSalaryDetails(payload);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.closeCalcModal();
        this.successTitle = 'Salary Saved Successfully!';
        this.successMessage = `Salary details for ${this.selectedRecord?.employeeName || ''} (${this.selectedMonth}) have been saved.`;
        this.showSuccessModal = true;
        this.loadPage();
      },
      error: (err) => {
        this.isSaving = false;
        this.actionError = this.readApiError(err, 'Unable to save salary details.');
      }
    });
  }

  requestMarkAsPaid() {
    const record = this.resolveWorkingRecord();
    if (!record) {
      this.actionError = 'Unable to mark salary as paid. Please try again.';
      return;
    }

    if (this.isPaid(record)) {
      this.actionError = 'Salary is already marked as paid.';
      return;
    }

    if (!record.employeeSalaryId) {
      this.actionError = 'Please save the salary details before marking as paid.';
      return;
    }

    this.confirmRecord = { ...record };
    this.showConfirmPaidModal = true;
  }

  closeConfirmPaidModal() {
    if (this.isMarkingPaid) {
      return;
    }
    this.showConfirmPaidModal = false;
    this.confirmRecord = null;
  }

  confirmMarkAsPaid() {
    const record = this.confirmRecord;
    if (!record || this.isMarkingPaid) {
      return;
    }

    this.isMarkingPaid = true;
    this.actionError = '';

    this.apiService.markSalaryAsPaid(record.employeeId, {
      salaryFromDate: record.salaryFromDate,
      salaryToDate: record.salaryToDate
    }).subscribe({
      next: () => {
        this.isMarkingPaid = false;
        this.showConfirmPaidModal = false;
        this.confirmRecord = null;
        this.closeCalcModal();
        this.successTitle = 'Salary marked as paid successfully.';
        this.successMessage = `${record.employeeName} has been marked as Paid for ${this.selectedMonth}.`;
        this.showSuccessModal = true;
        this.loadPage();
      },
      error: (err) => {
        this.isMarkingPaid = false;
        this.actionError = this.readApiError(err, 'Unable to mark salary as paid.');
        this.showConfirmPaidModal = false;
      }
    });
  }

  printPayslip(record?: SalaryRecord): void {
    const target = record ?? this.selectedRecord;
    this.payslipError = '';

    if (!target) {
      this.payslipError = 'Unable to generate payslip. Please try again.';
      return;
    }

    if (!target.employeeSalaryId) {
      this.payslipError = 'Please save the salary details before printing.';
      return;
    }

    const request = {
      employeeId: target.employeeId,
      salaryMonth: target.salaryMonth,
      salaryFromDate: target.salaryFromDate || this.formatDateForApi(this.fromDate),
      salaryToDate: target.salaryToDate || this.formatDateForApi(this.toDate),
      employeeName: target.employeeName,
      employeeCode: target.employeeCode || '',
      designation: target.designation,
      perDaySalary: Number(target.perDaySalary) || 0,
      presentDays: Number(target.presentDays) || 0,
      absentDays: Number(target.leaveDays) || 0,
      halfDays: Number(target.halfDays) || 0,
      incentive: Number(target.incentive) || 0,
      advance: Number(target.advance) || 0,
      remarks: target.remarks || ''
    };

    this.isGeneratingPayslip = true;

    this.apiService.generatePayslip(request.employeeId, request).subscribe({
      next: (response) => {
        const file = response instanceof File
          ? response
          : new File([response], 'Payslip.pdf', { type: 'application/pdf' });
        const url = window.URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        this.isGeneratingPayslip = false;
      },
      error: () => {
        this.payslipError = 'Unable to generate payslip. Please try again.';
        this.isGeneratingPayslip = false;
      }
    });
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.selectedRecord = null;
  }

  openExportModal() {
    this.exportMonth = this.selectedMonth;
    this.showExportModal = true;
  }

  closeExportModal() {
    this.showExportModal = false;
  }

  generateExcel() {
    this.closeExportModal();

    const targetMonth = this.exportMonth || this.selectedMonth;
    const parsed = this.parseMonthLabel(targetMonth);
    const year = parsed ? parsed.year : this.fromDate.getFullYear();
    const month = parsed ? parsed.month : this.fromDate.getMonth();

    const fromDate = new Date(year, month, 1);
    const toDate = new Date(year, month + 1, 0);
    const fromStr = this.formatDateForApi(fromDate);
    const toStr = this.formatDateForApi(toDate);
    const fullMonthLabel = `${this.formatMonthLabel(fromDate)} ${year}`;

    // If target month matches the currently loaded date range and we already have records
    if (
      this.fromDate.getFullYear() === year &&
      this.fromDate.getMonth() === month &&
      this.allRecords.length > 0
    ) {
      this.performExcelExport(this.allRecords, fromDate, toDate, fullMonthLabel);
    } else {
      // Fetch fresh records for the selected export month
      this.isLoading = true;
      this.apiService.getSalaryDetails(undefined, fromStr, toStr).subscribe({
        next: (salaries) => {
          this.isLoading = false;
          const records = (salaries || []).map((s: SalaryDetails) =>
            this.mapSalaryRecord(s, fromStr, toStr)
          );
          this.performExcelExport(records, fromDate, toDate, fullMonthLabel);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error fetching salary details for export', err);
          this.actionError = 'Unable to load salary records for the selected month to export.';
        }
      });
    }
  }

  private performExcelExport(
    records: SalaryRecord[],
    fromDate: Date,
    toDate: Date,
    monthLabel: string
  ) {
    if (!records || records.length === 0) {
      this.actionError = `No salary records found for ${monthLabel} to export.`;
      return;
    }

    const items: SalaryExportItem[] = records.map(r => ({
      employeeId: r.employeeId,
      employeeCode: r.employeeCode,
      employeeName: r.employeeName,
      designation: r.designation,
      presentDays: r.presentDays || 0,
      leaveDays: r.leaveDays || 0,
      halfDays: r.halfDays || 0,
      perDaySalary: r.perDaySalary || 0,
      totalSalary: r.totalSalary || 0,
      incentive: r.incentive || 0,
      advance: r.advance || 0,
      salary: r.salary || 0,
      paymentStatus: r.paymentStatus
    }));

    const totalEmployees = items.length;
    const totalSalary = items.reduce((sum, item) => sum + (Number(item.salary) || 0), 0);
    const paidAmount = items
      .filter(item => (item.paymentStatus || '').toLowerCase() === 'paid')
      .reduce((sum, item) => sum + (Number(item.salary) || 0), 0);
    const remainingAmount = items
      .filter(item => (item.paymentStatus || '').toLowerCase() !== 'paid')
      .reduce((sum, item) => sum + (Number(item.salary) || 0), 0);

    const summary: SalaryExportSummary = {
      totalEmployees,
      totalSalary,
      paidAmount,
      remainingAmount
    };

    this.excelExportService.exportSalaryReport(items, summary, {
      monthLabel,
      fromDate,
      toDate,
      remarks: `Salary for the month of ${monthLabel}`
    });

    this.successTitle = 'Excel Exported Successfully!';
    this.successMessage = `Salary report for ${monthLabel} has been generated and downloaded.`;
    this.showSuccessModal = true;
  }

  private mapSalaryRecord(s: SalaryDetails, fromStr: string, toStr: string): SalaryRecord {
    const paymentStatus: SalaryPaymentStatus = s.paymentStatus === 'Paid' ? 'Paid' : 'Pending';
    const salary = Number(s.salary ?? s.totalSalary ?? 0);

    return {
      employeeSalaryId: s.employeeSalaryId || 0,
      employeeId: s.employeeId,
      employeeName: s.employeeName,
      employeeCode: s.employeeCode || '',
      designation: s.designation || 'N/A',
      date: this.toDateOnly(s.salaryFromDate) || fromStr,
      salaryMonth: this.selectedMonth,
      salaryFromDate: this.toDateOnly(s.salaryFromDate) || fromStr,
      salaryToDate: this.toDateOnly(s.salaryToDate) || toStr,
      perDaySalary: Number(s.perDaySalary) || 0,
      presentDays: s.presentDays || 0,
      leaveDays: s.leaveDays || 0,
      halfDays: s.halfDays || 0,
      totalSalary: Number(s.totalSalary) || 0,
      incentive: Number(s.incentive) || 0,
      advance: Number(s.advance) || 0,
      salary,
      remarks: s.remarks || '',
      paymentStatus,
      paidDate: s.paidDate || null,
      paidBy: s.paidBy || null,
      voucherNo: s.voucherNo || null
    };
  }

  private buildSavePayload(): SaveSalaryDetailsRequest {
    return {
      employeeId: this.selectedRecord!.employeeId,
      salaryFromDate: this.selectedRecord!.salaryFromDate || this.formatDateForApi(this.fromDate),
      salaryToDate: this.selectedRecord!.salaryToDate || this.formatDateForApi(this.toDate),
      incentive: Number(this.tempRecord.incentive) || 0,
      advance: Number(this.tempRecord.advance) || 0,
      remarks: this.tempRecord.remarks || ''
    };
  }

  private resolveWorkingRecord(): SalaryRecord | null {
    if (this.selectedRecord) {
      return {
        ...this.selectedRecord,
        ...this.tempRecord,
        employeeSalaryId: this.tempRecord.employeeSalaryId ?? this.selectedRecord.employeeSalaryId,
        paymentStatus: (this.tempRecord.paymentStatus || this.selectedRecord.paymentStatus)
      } as SalaryRecord;
    }
    return this.confirmRecord;
  }

  private calculateSummariesFromRows() {
    this.totalEmployees = this.allRecords.length;
    this.totalPayment = this.allRecords.reduce((sum, r) => sum + (r.salary || 0), 0);
    this.completedCount = this.allRecords.filter(r => this.isPaid(r)).length;
    this.remainingCount = this.allRecords.filter(r => !this.isPaid(r)).length;
    this.paidAmount = this.allRecords.filter(r => this.isPaid(r)).reduce((sum, r) => sum + (r.salary || 0), 0);
    this.pendingAmount = this.allRecords.filter(r => !this.isPaid(r)).reduce((sum, r) => sum + (r.salary || 0), 0);
  }

  private formatDateForApi(date: Date): string {
    const d = new Date(date);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  private toDateOnly(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return value.toString().substring(0, 10);
  }

  private buildMonthOptions(): string[] {
    const year = new Date().getFullYear();
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  }

  private formatMonthLabel(date: Date): string {
    return date.toLocaleString('en-US', { month: 'long' });
  }

  private parseMonthLabel(label: string): { month: number; year: number } | null {
    const currentYear = new Date().getFullYear();
    const parsed = new Date(`${label} 1, ${currentYear}`);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return { month: parsed.getMonth(), year: currentYear };
  }

  private syncMonthFromDates() {
    if (this.fromDate.getMonth() === this.toDate.getMonth() && this.fromDate.getFullYear() === this.toDate.getFullYear()) {
      const label = this.formatMonthLabel(this.fromDate);
      if (!this.months.includes(label)) {
        this.months = [...this.months, label];
      }
      this.selectedMonth = label;
    }
  }

  private readApiError(err: any, fallback: string): string {
    return err?.error?.message || err?.message || fallback;
  }
}
