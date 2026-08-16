import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AttendanceRecord, AttendanceFilter, AttendanceSummary } from '../models/attendance.model';
import { EmsApiService } from '../../services/ems-api.service';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  constructor(private apiService: EmsApiService) {}

  // Get attendance records mapped to the new model
  getAttendance(filter: AttendanceFilter): Observable<AttendanceRecord[]> {
    // We leverage the existing API and map it, or use the exact endpoint if it supports these filters.
    // For now, we simulate fetching employees and merging with daily attendance from existing EmsApiService
    return new Observable<AttendanceRecord[]>(observer => {
      this.apiService.getEmployees(1, 1000).subscribe({
        next: (empRes) => {
          this.apiService.getAllShiftAssignments().subscribe({
            next: (shifts) => {
              this.apiService.getDailyAttendance(filter.date).subscribe({
                next: (logRes) => {
                  let records: AttendanceRecord[] = [];
                  
                  // Map shift assignments
                  let shiftMap: { [empId: string]: number } = {};
                  shifts.forEach((asg: any) => {
                    shiftMap[asg.employeeId] = asg.shiftType === 'Morning' || asg.shiftType === 1 ? 1 : 2;
                  });

                  // Map attendance logs
                  let attMap: { [empId: string]: any } = {};
                  logRes.records.forEach((r: any) => {
                    attMap[r.employeeId] = r;
                  });

                  // Build unified records
                  empRes.items.forEach((emp: any) => {
                    if (emp.status === 'Active') {
                      let empShift = shiftMap[emp.id] || 1;
                      // Filter by selected shift
                      if (empShift.toString() === filter.shift.toString()) {
                        let log = attMap[emp.id];
                        let statusName = 'ABSENT'; // Default
                        let remarks = '';
                        
                        if (log) {
                          if (log.status === 'Present' || log.status === 1) {
                            if (log.remarks === 'Half Day') {
                              statusName = 'HALF DAY';
                            } else {
                              statusName = 'PRESENT';
                            }
                          } else {
                            statusName = 'ABSENT';
                          }
                          remarks = log.remarks || '';
                        }

                        records.push({
                          id: log?.id,
                          employeeId: emp.id,
                          employeeCode: emp.employeeCode,
                          employeeName: emp.fullName,
                          employeePhoto: emp.profilePicture,
                          department: 'Production', // Mocked as the existing API doesn't return dept details
                          designation: emp.designation || 'N/A',
                          shift: empShift,
                          attendanceDate: filter.date,
                          status: statusName,
                          remarks: remarks,
                          lastUpdated: new Date().toISOString(),
                          lastUpdatedBy: 'Admin',
                          isModified: false
                        });
                      }
                    }
                  });

                  // Apply text search filter
                  if (filter.searchQuery) {
                    const q = filter.searchQuery.toLowerCase();
                    records = records.filter(r => 
                      r.employeeName.toLowerCase().includes(q) || 
                      r.employeeCode.toLowerCase().includes(q)
                    );
                  }

                  // Apply department filter
                  if (filter.department && filter.department !== 'all') {
                    records = records.filter(r => r.department === filter.department);
                  }

                  // Apply designation filter
                  if (filter.designation && filter.designation !== 'all') {
                    records = records.filter(r => r.designation === filter.designation);
                  }

                  // Apply status filter
                  if (filter.status && filter.status !== 'all') {
                    records = records.filter(r => r.status === filter.status);
                  }

                  observer.next(records);
                  observer.complete();
                },
                error: (err) => observer.error(err)
              });
            },
            error: (err) => observer.error(err)
          });
        },
        error: (err) => observer.error(err)
      });
    });
  }

  // Update a single attendance record
  updateAttendance(record: AttendanceRecord): Observable<any> {
    // Determine the API status code based on string
    let dbStatus = 1; // Present
    let dbRemarks = record.remarks || '';

    if (record.status === 'ABSENT') {
      dbStatus = 2; // Absent
    } else if (record.status === 'HALF DAY') {
      dbStatus = 1; // Present
      dbRemarks = 'Half Day';
    }

    const payload = {
      date: record.attendanceDate,
      records: [{
        employeeId: record.employeeId,
        status: dbStatus,
        remarks: dbRemarks
      }]
    };

    return this.apiService.markBulkAttendance(payload);
  }

  // Bulk update attendance records
  bulkUpdateAttendance(records: AttendanceRecord[], date: string): Observable<any> {
    const apiRecords = records.map(record => {
      let dbStatus = 1; // Present
      let dbRemarks = record.remarks || '';

      if (record.status === 'ABSENT') {
        dbStatus = 2; // Absent
      } else if (record.status === 'HALF DAY') {
        dbStatus = 1; // Present
        dbRemarks = 'Half Day';
      }

      return {
        employeeId: record.employeeId,
        status: dbStatus,
        remarks: dbRemarks
      };
    });

    const payload = {
      date: date,
      records: apiRecords
    };

    return this.apiService.markBulkAttendance(payload);
  }
}
