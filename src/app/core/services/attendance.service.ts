import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppConfigService } from './app-config.service';


export interface AttendanceRequest {
  employeeId: number;
  attendanceDate: string;
  shift: string;
  status: string;
  remarks?: string | null;
}

export interface BulkAttendanceRequest {
  attendanceDate: string;
  shift: string;
  attendance: AttendanceRequest[];
}

export interface AttendanceResponse {
  attendanceId?: number | null;
  employeeId: number;
  employeeCode?: string | null;
  name?: string | null;
  designation?: string | null;
  attendanceDate: string;
  shift: string;
  status?: string | null;
  remarks?: string | null;
}

export interface AttendanceSummary {
  totalEmployees: number;
  presentCount: number;
  leaveCount: number;
  halfDayCount: number;
}

export interface AttendanceListResponse {
  attendanceDate: string;
  shift?: string | null;
  totalEmployees: number;
  presentCount: number;
  leaveCount: number;
  halfDayCount: number;
  employees: AttendanceResponse[];
}

export interface AttendancePeriodSummary {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  shift: string;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  notMarkedDays: number;
}

export interface SaveEmployeeAttendanceRequest {
  employeeId: number;
  attendanceDate: string;
  status: string;
  remarks?: string;
}

export interface AttendanceDateStatus {
  attendanceDate: string;
  status: string;
  shift?: string;
  remarks?: string | null;
}

export interface AttendanceEmployeeDetail {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  designation?: string;
  shift: string;
  fromDate: string;
  toDate: string;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  notMarkedDays: number;
  absentDates: string[];
  halfDayDates: string[];
  notMarkedDates: string[];
  allDates: AttendanceDateStatus[];
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private get apiUrl(): string {
    return `${this.appConfig.getApiBaseUrl()}/api`;
  }

  constructor(private http: HttpClient, private appConfig: AppConfigService) { }

  /**
   * Helper method to ensure dates are correctly formatted to YYYY-MM-DD
   * to avoid timezone issues when sending calendar dates to the API.
   */
  private formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      // If it's already a string, assume it's correctly formatted or try to parse it
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      return date;
    }
    // If it's a Date object
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 1. GET /api/Attendance
   * Fetch attendance records based on optional filters.
   */
  getAttendance(
    attendanceDate?: string | Date,
    shift?: string,
    employeeId?: number
  ): Observable<AttendanceListResponse> {
    let params = new HttpParams();

    if (attendanceDate) {
      params = params.set('attendanceDate', this.formatDate(attendanceDate));
    }

    if (shift) {
      params = params.set('shift', shift);
    }

    if (employeeId !== undefined && employeeId !== null) {
      params = params.set('employeeId', employeeId.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/Attendance`, { params })
      .pipe(
        map(res => {
          const payload = res.data || res;
          return {
            attendanceDate: payload.attendanceDate || this.formatDate(attendanceDate || new Date()),
            shift: payload.shift || shift,
            totalEmployees: payload.totalEmployees || 0,
            presentCount: payload.presentCount || 0,
            leaveCount: payload.leaveCount || 0,
            halfDayCount: payload.halfDayCount || 0,
            employees: payload.data || payload.employees || []
          } as AttendanceListResponse;
        }),
        catchError(error => {
          console.error('Failed to load attendance', error);
          return throwError(() => error);
        })
      );
  }


  /**
   * 2. POST /api/Attendance
   * Bulk insert or update attendance records for a specific date and shift.
   */
  saveAttendance(request: BulkAttendanceRequest): Observable<AttendanceListResponse> {
    // Ensure the date is formatted correctly for calendar-day operation
    request.attendanceDate = this.formatDate(request.attendanceDate);
    if (request.attendance && request.attendance.length > 0) {
      request.attendance.forEach(att => {
        att.attendanceDate = this.formatDate(att.attendanceDate);
      });
    }

    return this.http.post<any>(`${this.apiUrl}/Attendance`, request)
      .pipe(
        map(res => {
          const payload = res.data || res;
          return {
            attendanceDate: payload.attendanceDate || request.attendanceDate,
            shift: payload.shift || request.shift,
            totalEmployees: payload.totalEmployees || 0,
            presentCount: payload.presentCount || 0,
            leaveCount: payload.leaveCount || 0,
            halfDayCount: payload.halfDayCount || 0,
            employees: payload.data || payload.employees || []
          } as AttendanceListResponse;
        }),
        catchError(error => {
          console.error('Failed to save bulk attendance', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 3. PUT /api/Attendance/{employeeId}
   * Update attendance for a single employee.
   */
  updateAttendance(employeeId: number, request: AttendanceRequest): Observable<AttendanceResponse> {
    // Ensure calendar-day format
    request.attendanceDate = this.formatDate(request.attendanceDate);

    return this.http.put<AttendanceResponse>(`${this.apiUrl}/Attendance/${employeeId}`, request)
      .pipe(
        catchError(error => {
          console.error(`Failed to update attendance for employee ${employeeId}`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Optional: Single employee save/upsert
   * Prefer using the POST bulk endpoint for the main screen, but this is available if needed.
   * It routes to PUT since it's a single update, assuming record already exists, or POST if needed.
   * Based on requirements, backend handles upsert, but we map to PUT here for single updates.
   */
  upsertAttendance(request: AttendanceRequest): Observable<AttendanceResponse> {
    // Calling the single employee update API
    return this.updateAttendance(request.employeeId, request);
  }

  getAttendanceSummary(fromDate: string | Date, toDate: string | Date, shift: string): Observable<AttendancePeriodSummary[]> {
    const params = new HttpParams()
      .set('fromDate', this.formatDate(fromDate))
      .set('toDate', this.formatDate(toDate))
      .set('shift', shift);

    return this.http.get<any>(`${this.getAttendanceBaseUrl()}/summary`, { params }).pipe(
      map(res => res.data || []),
      catchError(error => {
        console.error('Failed to load attendance summary', error);
        return throwError(() => error);
      })
    );
  }

  getEmployeeAttendanceDetails(employeeId: number, fromDate: string | Date, toDate: string | Date): Observable<AttendanceEmployeeDetail> {
    const params = new HttpParams()
      .set('fromDate', this.formatDate(fromDate))
      .set('toDate', this.formatDate(toDate));

    return this.http.get<any>(`${this.getAttendanceBaseUrl()}/employee/${employeeId}/details`, { params }).pipe(
      map(res => res.data),
      catchError(error => {
        console.error(`Failed to load attendance details for employee ${employeeId}`, error);
        return throwError(() => error);
      })
    );
  }

  saveEmployeeAttendance(request: SaveEmployeeAttendanceRequest): Observable<AttendanceResponse> {
    const payload = {
      ...request,
      attendanceDate: this.formatDate(request.attendanceDate)
    };

    return this.http.post<any>(`${this.getAttendanceBaseUrl()}/save`, payload).pipe(
      map(res => res.data),
      catchError(error => {
        console.error('Failed to save employee attendance', error);
        return throwError(() => error);
      })
    );
  }

  private getAttendanceBaseUrl(): string {
    return `${this.appConfig.getApiBaseUrl()}/api/Attendance`;
  }
}
