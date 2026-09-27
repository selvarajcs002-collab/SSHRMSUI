export interface AttendanceRecord {
  id?: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeePhoto?: string;
  department: string;
  designation: string;
  shift: string | number;
  attendanceDate: string;
  status: string | number;
  remarks?: string;
  lastUpdated?: string;
  lastUpdatedBy?: string;
  isModified?: boolean; // UI specific flag for inline editing
  checkInTime?: string;
  checkOutTime?: string;
}

export interface AttendanceSummary {
  totalEmployees: number;
  present: number;
  absent: number;
  halfDay: number;
}

export interface AttendanceFilter {
  date: string;
  shift: string | number;
  department?: string;
  designation?: string;
  status?: string | number;
  searchQuery?: string;
}
