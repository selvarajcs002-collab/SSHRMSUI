import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  Employee,
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
  EmployeeDuplicateRequest,
  EmployeeDocument,
  ApiResponse,
  PaginationResponse,
  DeleteEmployeeResponse
} from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://200.141.4.172:6000/api/Employee';

  constructor(private http: HttpClient) { }

  /**
   * 1. GET /api/Employee
   * Get paginated list of employees
   */
  getEmployees(pageNumber: number = 1, pageSize: number = 10): Observable<PaginationResponse<Employee>> {
    let params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());

    return this.http.get<PaginationResponse<Employee>>(this.apiUrl, { params });
  }

  /**
   * 2. GET /api/Employee/{id}
   * Get a single employee by ID
   */
  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  /**
   * 3. POST /api/Employee
   * Create a new employee
   */
  createEmployee(request: EmployeeCreateRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.apiUrl, request, {
      headers: { 'Accept': 'application/json' }
    });
  }

  /**
   * 4. PUT /api/Employee/{id}
   * Update an existing employee
   */
  updateEmployee(id: number, request: EmployeeUpdateRequest): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * 5. DELETE /api/Employee/{id}
   * Delete an employee and all dependent records
   */
  deleteEmployee(id: number): Observable<DeleteEmployeeResponse> {
    return this.http.delete<DeleteEmployeeResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * 6. POST /api/Employee/{id}/duplicate
   * Duplicate an employee record
   */
  duplicateEmployee(id: number, request: EmployeeDuplicateRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/${id}/duplicate`, request);
  }

  /**
   * 7. GET /api/Employee/{id}/document
   * Get employee document details
   */
  getEmployeeDocument(id: number): Observable<EmployeeDocument> {
    return this.http.get<EmployeeDocument>(`${this.apiUrl}/${id}/document`);
  }

  /**
   * 8. POST /api/shift-management
   * Save shift assignment
   */
  saveShiftAssignment(payload: any): Observable<any> {
    const shiftApiUrl = this.apiUrl.replace('/api/Employee', '/api/shift-management');
    return this.http.post<any>(shiftApiUrl, payload);
  }

  /**
   * 9. GET /api/shift-management
   * Get shift assignments
   */
  getShiftAssignments(): Observable<any> {
    const shiftApiUrl = this.apiUrl.replace('/api/Employee', '/api/shift-management');
    return this.http.get<any>(shiftApiUrl);
  }
}
