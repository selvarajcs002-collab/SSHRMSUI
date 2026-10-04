// Common API Response wrapper matching your backend's ApiResponse<T>
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}

// Pagination wrapper
export interface PaginationResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

// Employee Model
export interface Employee {
  employeeId: number;
  employeeCode: string;
  name: string;
  designation: string;
  city?: string;
  perDaySalary: number;
  joinedYear: number;
  isActive: boolean;
  documentId?: number;
  documentName?: string;
  totalCount: number;
  shift?: 'Morning' | 'Night';
}

// Create Payload
export interface EmployeeCreateRequest {
  employeeCode: string;
  name: string;
  designation: string;
  city?: string;
  perDaySalary: number;
  joinedYear: number;
}

// Update Payload
export interface EmployeeUpdateRequest {
  name: string;
  designation: string;
  city?: string;
  perDaySalary: number;
  joinedYear: number;
  shift?: 'Morning' | 'Night';
}

// Duplicate Payload
export interface EmployeeDuplicateRequest {
  newEmployeeCode: string;
}

// Delete Response
export interface DeleteEmployeeResponse {
  success: boolean;
  message: string;
  employeeId: number;
  error?: string;
}

// Document Model
export interface EmployeeDocument {
  documentId: number;
  employeeId: number;
  documentName: string;
  originalFileName: string;
  filePath: string;
  contentType?: string;
  fileSize?: number;
  uploadedDate: string;
  uploadedBy?: number;
  isActive: boolean;
}
