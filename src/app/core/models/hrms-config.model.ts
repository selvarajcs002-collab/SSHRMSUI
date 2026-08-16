export interface Shift {
  id: string | number;
  name: string;
  code: string;
  startTime?: string;
  endTime?: string;
}

export interface Designation {
  id: string | number;
  name: string;
  departmentId?: string | number;
}

export interface Department {
  id: string | number;
  name: string;
}

export interface AttendanceStatus {
  id: string | number;
  name: string;
  code: string;
  color: string;
}

export interface HrmsConfig {
  shifts: Shift[];
  designations: Designation[];
  departments: Department[];
  attendanceStatuses: AttendanceStatus[];
}
