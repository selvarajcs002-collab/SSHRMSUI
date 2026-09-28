import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from '../core/services/app-config.service';


import { MarkSalaryPaidRequest, SalaryDetails, SalarySummary, SaveSalaryDetailsRequest } from '../models/salary-details.model';

@Injectable({
  providedIn: 'root'
})
export class EmsApiService {
  baseUrl = '';

  constructor(private http: HttpClient, private appConfig: AppConfigService) {
    this.baseUrl = `${this.appConfig.getApiBaseUrl()}/api/ems`;
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('ems_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // --- AUTH ---
  login(dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, dto).pipe(
      map((res: any) => res.data)
    );
  }

  // --- EMPLOYEE REGISTRATION ---
  registerBasic(dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees/register/basic`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  saveBankDetails(id: string, dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees/register/${id}/bank`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  uploadDocument(id: string, type: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('ems_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.post(`${this.baseUrl}/employees/register/${id}/document?type=${type}`, formData, { headers }).pipe(
      map((res: any) => res.data)
    );
  }

  deleteDocument(employeeId: string, type: string | number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/employees/register/${employeeId}/document/${type}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getPreview(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/register/${id}/preview`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  confirmRegistration(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees/register/${id}/confirm`, {}, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  // --- EMPLOYEE CRUD ---
  getEmployees(pageNumber: number = 1, pageSize: number = 10, search: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get(`${this.appConfig.getApiBaseUrl()}/api/Employee`, { headers: this.getHeaders(), params }).pipe(
      map((res: any) => ({
        items: res.items || res.Items || [],
        totalCount: res.totalRecords || res.TotalRecords || 0
      }))
    );
  }

  getEmployeeById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/${id}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  updateEmployee(id: string, dto: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/${id}`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/employees/${id}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  hardDeleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/employees/${id}/hard`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  // --- SHIFTS ---
  getShiftTypes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/shifts/types`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  assignShift(dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/shifts/assignments`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getAllShiftAssignments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/shifts/assignments`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getEmployeeAssignments(employeeId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/shifts/assignments/employee/${employeeId}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  updateShiftAssignment(id: string, dto: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/shifts/assignments/${id}`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  removeShiftAssignment(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/shifts/assignments/${id}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  // --- ATTENDANCE ---
  markAttendance(dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/attendance/mark`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  markBulkAttendance(dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/attendance/mark-bulk`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getDailyAttendance(date: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance/daily?date=${date}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getAttendanceByDateRange(startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance/range?startDate=${startDate}&endDate=${endDate}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getEmployeeMonthlyAttendance(employeeId: string, month: number, year: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance/employee/${employeeId}?month=${month}&year=${year}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getMonthlyAttendanceSummary(month: number, year: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance/summary?month=${month}&year=${year}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  updateAttendance(id: string, dto: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/attendance/${id}`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  // --- PAYROLL ---
  generatePayroll(employeeId: string, month: number, year: number, dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/payroll/generate/${employeeId}?month=${month}&year=${year}`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getPayrollById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/payroll/${id}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getEmployeePayrollHistory(employeeId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/payroll/employee/${employeeId}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getMonthlyPayrollSummary(month: number, year: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/payroll/summary?month=${month}&year=${year}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getPayrollsByRange(fromMonth: number, fromYear: number, toMonth: number, toYear: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/payroll/range?fromMonth=${fromMonth}&fromYear=${fromYear}&toMonth=${toMonth}&toYear=${toYear}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  markPayrollPaid(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/payroll/${id}/pay`, {}, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  downloadPayslip(id: string): Observable<Blob> {
    const token = localStorage.getItem('ems_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    // Return Blob directly (no wrapper mapping needed)
    return this.http.get(`${this.baseUrl}/payroll/${id}/download`, {
      headers,
      responseType: 'blob'
    });
  }

  // --- SETTINGS ---
  getSettings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/settings`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  updateSetting(dto: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/settings`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getNotificationSchedules(): Observable<any> {
    return this.http.get(`${this.baseUrl}/settings/notifications`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  // --- DEPARTMENTS ---
  getDepartments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/departments`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getDepartmentById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/departments/${id}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  createDepartment(dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/departments`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  updateDepartment(id: string, dto: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/departments/${id}`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  deleteDepartment(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/departments/${id}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  // --- LEAVES ---
  getLeaves(): Observable<any> {
    return this.http.get(`${this.baseUrl}/leaves`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getLeaveById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/leaves/${id}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getLeavesByEmployeeId(employeeId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/leaves/employee/${employeeId}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  applyLeave(dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/leaves`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  approveLeave(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/leaves/${id}/approve`, {}, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  rejectLeave(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/leaves/${id}/reject`, {}, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }
  // --- SALARY DETAILS ---
  createSalaryDetails(dto: SaveSalaryDetailsRequest): Observable<SalaryDetails> {
    return this.http.post(`${this.appConfig.getApiBaseUrl()}/api/salary-details`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getSalaryDetails(employeeId?: number, fromDate?: string, toDate?: string): Observable<SalaryDetails[]> {
    let params = new HttpParams();
    if (employeeId) params = params.set('employeeId', employeeId.toString());
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get(`${this.appConfig.getApiBaseUrl()}/api/salary-details`, { headers: this.getHeaders(), params }).pipe(
      map((res: any) => res.data || [])
    );
  }

  updateSalaryDetails(employeeId: number, dto: SaveSalaryDetailsRequest): Observable<SalaryDetails> {
    return this.http.put(`${this.appConfig.getApiBaseUrl()}/api/salary-details/${employeeId}`, dto, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data)
    );
  }

  getSalaryDetailsByEmployee(employeeId: number, fromDate?: string, toDate?: string): Observable<SalaryDetails[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get(`${this.appConfig.getApiBaseUrl()}/api/salary-details/${employeeId}`, { headers: this.getHeaders(), params }).pipe(
      map((res: any) => res.data || [])
    );
  }

  getSalarySummary(fromDate: string, toDate: string): Observable<SalarySummary> {
    const params = new HttpParams()
      .set('fromDate', fromDate)
      .set('toDate', toDate);

    return this.http.get(`${this.appConfig.getApiBaseUrl()}/api/salary-details/summary`, { headers: this.getHeaders(), params }).pipe(
      map((res: any) => res.data)
    );
  }

  markSalaryAsPaid(employeeId: number, request: MarkSalaryPaidRequest): Observable<SalaryDetails> {
    return this.http.post(
      `${this.appConfig.getApiBaseUrl()}/api/salary-details/${employeeId}/mark-paid`,
      request,
      { headers: this.getHeaders() }
    ).pipe(
      map((res: any) => res.data)
    );
  }

  generatePayslip(employeeId: number, request: PayslipRequest): Observable<Blob> {
    return this.http.post(
      `${this.appConfig.getApiBaseUrl()}/api/salary-details/${employeeId}/payslip`,
      request,
      {
        headers: this.getHeaders(),
        responseType: 'blob',
        observe: 'response'
      }
    ).pipe(
      map((response) => {
        const fileName = this.getPayslipFileName(response.headers.get('Content-Disposition'));
        return new File([response.body ?? new Blob()], fileName, { type: 'application/pdf' });
      })
    );
  }

  private getPayslipFileName(contentDisposition: string | null): string {
    if (!contentDisposition) {
      return 'Payslip.pdf';
    }

    const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (utfMatch?.[1]) {
      return decodeURIComponent(utfMatch[1].replace(/"/g, '').trim());
    }

    const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return match?.[1]?.trim() || 'Payslip.pdf';
  }
}

export interface PayslipRequest {
  employeeId: number;
  salaryMonth: string;
  salaryFromDate: string;
  salaryToDate: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  perDaySalary: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  incentive: number;
  advance: number;
  remarks: string;
}
