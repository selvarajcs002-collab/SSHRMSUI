import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { HrmsConfig, Shift, Designation, Department, AttendanceStatus } from '../models/hrms-config.model';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private appConstants: any = {
    Designations: [],
    Shifts: [],
    Attendance: [],
    Machines: []
  };
  private apiBaseUrl: string = 'http://200.141.4.172:6001';

  // Centralized static config as fallback/default
  private defaultConfig: HrmsConfig = {
    shifts: [
      { id: 1, name: 'MORNING', code: 'MRN', startTime: '09:00', endTime: '18:00' },
      { id: 2, name: 'NIGHT', code: 'NGT', startTime: '18:00', endTime: '03:00' }
    ],
    designations: [
      { id: 1, name: 'Operator' },
      { id: 2, name: 'Helper' },
      { id: 3, name: 'Framer' },
      { id: 4, name: 'Manager' }
    ],
    departments: [
      { id: 1, name: 'Production' },
      { id: 2, name: 'Quality' },
      { id: 3, name: 'Engineering' }
    ],
    attendanceStatuses: [
      { id: 1, name: 'PRESENT', code: 'PR', color: 'green' },
      { id: 2, name: 'ABSENT', code: 'AB', color: 'red' },
      { id: 3, name: 'HALF DAY', code: 'HD', color: 'orange' }
    ]
  };

  constructor(private http: HttpClient) { }

  loadConfig(): Observable<any> {
    return this.http.get('/assets/appsettings.json').pipe(
      tap((config: any) => {
        if (config && config.AppConstants) {
          this.appConstants = config.AppConstants;
        }
        if (config && config.ApiSettings && config.ApiSettings.emb_base_url) {
          this.apiBaseUrl = config.ApiSettings.emb_base_url;
        } else if (config && config.ApiSettings && config.ApiSettings.BaseUrl) {
          this.apiBaseUrl = config.ApiSettings.BaseUrl;
        }
      }),
      catchError(() => {
        return of(null);
      })
    );
  }

  getAppDesignations(): string[] {
    return this.appConstants.Designations || [];
  }

  getAppShifts(): string[] {
    return this.appConstants.Shifts || [];
  }

  getAppAttendances(): string[] {
    return this.appConstants.Attendance || [];
  }

  getAppMachines(): string[] {
    return this.appConstants.Machines || [];
  }

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  getConfig(): Observable<HrmsConfig> {
    // In a real app, this might fetch from an API endpoint once and cache it.
    return of(this.defaultConfig);
  }

  getShifts(): Shift[] {
    return this.defaultConfig.shifts;
  }

  getAttendanceStatuses(): AttendanceStatus[] {
    return this.defaultConfig.attendanceStatuses;
  }

  getDepartments(): Department[] {
    return this.defaultConfig.departments;
  }

  getDesignations(): Designation[] {
    return this.defaultConfig.designations;
  }
}
