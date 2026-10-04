export type SalaryPaymentStatus = 'Pending' | 'Paid';

export interface SalaryDetails {
  employeeSalaryId: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  designation: string;
  perDaySalary: number;
  presentDays: number;
  leaveDays: number;
  halfDays: number;
  presentSalary?: number;
  halfDaySalary?: number;
  totalSalary: number;
  incentive: number;
  advance: number;
  salary: number;
  remarks?: string;
  salaryFromDate: string;
  salaryToDate: string;
  paymentStatus: SalaryPaymentStatus;
  paidDate?: string | null;
  paidBy?: number | null;
  voucherNo?: string | null;
}

export interface SalarySummary {
  totalEmployees: number;
  totalPayment: number;
  completedPaid: number;
  remaining: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface MarkSalaryPaidRequest {
  salaryFromDate: string;
  salaryToDate: string;
}

export interface SaveSalaryDetailsRequest {
  employeeId: number;
  salaryFromDate: string;
  salaryToDate: string;
  incentive: number;
  advance: number;
  remarks: string;
}
