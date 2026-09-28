import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface AttendanceRecord {
  id: string;
  name: string;
  shift: 'Morning' | 'Night';
  status: 'Present' | 'Leave' | 'Half-Day';
  remarks: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceApiService {
  private get apiUrl(): string {
    return `${this.appConfig.getApiBaseUrl()}/api/Attendance`;
  }

  constructor(private http: HttpClient, private appConfig: AppConfigService) { }

  getAttendance(date: string, shift: string): Observable<AttendanceRecord[]> {
    let params = new HttpParams()
      .set('date', date)
      .set('shift', shift);
    return this.http.get<AttendanceRecord[]>(this.apiUrl, { params });
  }

  saveAttendance(records: AttendanceRecord[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bulk`, records);
  }

  updateAttendanceStatus(id: string, record: Partial<AttendanceRecord>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, record);
  }
}
