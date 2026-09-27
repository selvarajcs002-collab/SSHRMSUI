import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import { ModernDropdownComponent } from '../../components/modern-dropdown/modern-dropdown.component';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { EmployeeService } from '../../core/services/employee.service';
import { EmployeeCreateRequest } from '../../core/models/employee.model';


interface Employee {
  id: string;
  name: string;
  designation: string;
  city: string;
  perDaySalary: number;
  joinedYear: number;
  documentName?: string;
  documentSize?: number;
  shift?: string;
  employeeCode?: string;
}


@Component({
  selector: 'app-employee-registration',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModernDropdownComponent
  ],

  templateUrl: './employee-registration.component.html',

  styleUrls: [
    './employee-registration.component.css'
  ]
})
export class EmployeeRegistrationComponent implements OnInit {

  /* ============================================================
     EMPLOYEE DATA
     ============================================================ */

  employees: Employee[] = [];

  filteredEmployees: Employee[] = [];

  searchTerm = '';


  /* ============================================================
     MODAL
     ============================================================ */

  showModal = false;

  isEditMode = false;

  currentEmployeeId: string | null = null;


  /* ============================================================
     DELETE CONFIRMATION MODAL
     ============================================================ */

  showDeleteModal = false;

  employeeToDelete: Employee | null = null;

  isDeleting = false;


  /* ============================================================
     FORM
     ============================================================ */

  employeeForm!: FormGroup;


  /* ============================================================
     DOCUMENT
     ============================================================ */

  uploadedFileName: string | null = null;

  uploadedFileSize = '';


  /* ============================================================
     LOADING
     ============================================================ */

  isSaving = false;


  /* ============================================================
     SUCCESS & ERROR TOASTS
     ============================================================ */

  showSuccessToast = false;

  successMessage = '';

  private toastTimer: any;

  showErrorToast = false;

  errorMessage = '';

  private errorToastTimer: any;


  /* ============================================================
     ADD ANOTHER
     ============================================================ */

  askAddAnother = false;


  /* ============================================================
     CONFIGURATION

     Later these should come from:

     GET /api/configuration/hrms

     Do not duplicate these values once your
     configuration service is connected.
     ============================================================ */

  designations: string[] = [
    'Admin',
    'Incharge',
    'Operator',
    'Framer',
    'Helper',
    'Quality Checker',
    'Cleaning Staff'
  ];


  /* ============================================================
     CONSTRUCTOR
     ============================================================ */

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService
  ) { }


  /* ============================================================
     INIT
     ============================================================ */

  ngOnInit(): void {

    this.initForm();

    this.loadEmployees();

  }


  /* ============================================================
     FORM INITIALIZATION
     ============================================================ */

  private initForm(): void {

    this.employeeForm = this.fb.group({

      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(150)
        ]
      ],

      designation: [
        '',
        Validators.required
      ],

      city: [
        '',
        Validators.maxLength(100)
      ],

      perDaySalary: [
        '',
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      joinedYear: [
        '',
        [
          Validators.required,
          Validators.min(1900),
          Validators.max(2100)
        ]
      ],

      hasDocument: [
        false
      ],

      documentFile: [
        null
      ]

    });


    /* ==========================================================
       DOCUMENT VALIDATION
       ========================================================== */

    this.employeeForm
      .get('hasDocument')
      ?.valueChanges
      .subscribe((hasDocument: boolean) => {

        const documentControl =
          this.employeeForm.get('documentFile');

        if (hasDocument) {

          documentControl?.setValidators(
            Validators.required
          );

        } else {

          documentControl?.clearValidators();

          documentControl?.setValue(null);

          this.uploadedFileName = null;

          this.uploadedFileSize = '';

        }

        documentControl?.updateValueAndValidity();

      });

  }


  /* ============================================================
     LOAD EMPLOYEES
     ============================================================ */

  private loadEmployees(): void {
    this.employeeService.getEmployees(1, 100).subscribe({
      next: (response) => {
        if (response && response.items) {
          this.employees = response.items.map(apiEmp => ({
            id: apiEmp.employeeId.toString(),
            name: apiEmp.name,
            designation: apiEmp.designation,
            city: apiEmp.city || '',
            perDaySalary: apiEmp.perDaySalary,
            joinedYear: apiEmp.joinedYear,
            documentName: apiEmp.documentName,
            shift: apiEmp.shift,
            employeeCode: apiEmp.employeeCode || `EMP${apiEmp.employeeId.toString().padStart(3, '0')}`
          }));
          this.filterEmployees();
        }
      },
      error: (err) => console.error('Failed to load employees', err)
    });
  }


  /* ============================================================
     SEARCH
     ============================================================ */

  onSearch(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    this.searchTerm =
      input.value.trim().toLowerCase();

    this.filterEmployees();

  }


  private filterEmployees(): void {

    if (!this.searchTerm) {

      this.filteredEmployees =
        [...this.employees];

      return;

    }


    this.filteredEmployees =
      this.employees.filter(employee => {

        const name =
          employee.name?.toLowerCase() || '';

        const city =
          employee.city?.toLowerCase() || '';

        const year =
          employee.joinedYear
            ?.toString()
            .toLowerCase() || '';

        return (
          name.includes(this.searchTerm) ||
          city.includes(this.searchTerm) ||
          year.includes(this.searchTerm)
        );

      });

  }


  /* ============================================================
     INITIAL
     ============================================================ */

  getInitial(name: string): string {

    if (!name) {
      return '?';
    }

    return name
      .trim()
      .charAt(0)
      .toUpperCase();

  }


  /* ============================================================
     ADD MODAL
     ============================================================ */

  openAddModal(): void {

    this.isEditMode = false;

    this.currentEmployeeId = null;

    this.uploadedFileName = null;

    this.uploadedFileSize = '';

    this.employeeForm.reset({
      name: '',
      designation: '',
      city: '',
      perDaySalary: '',
      joinedYear: '',
      hasDocument: false,
      documentFile: null
    });

    this.showModal = true;

  }


  /* ============================================================
     EDIT MODAL
     ============================================================ */

  openEditModal(employee: Employee): void {

    this.isEditMode = true;

    this.currentEmployeeId =
      employee.id;

    this.uploadedFileName =
      employee.documentName || null;

    this.uploadedFileSize =
      employee.documentSize
        ? this.formatFileSize(employee.documentSize)
        : 'Uploaded document';


    this.employeeForm.patchValue({

      name: employee.name,

      designation: employee.designation,

      city: employee.city,

      perDaySalary: employee.perDaySalary,

      joinedYear: employee.joinedYear,

      hasDocument: !!employee.documentName

    });


    this.showModal = true;

  }


  /* ============================================================
     DUPLICATE
     ============================================================ */

  duplicateEmployee(employee: Employee): void {

    this.isEditMode = false;

    this.currentEmployeeId = null;

    this.uploadedFileName = null;

    this.uploadedFileSize = '';


    this.employeeForm.reset({

      name: `${employee.name} (Copy)`,

      designation: employee.designation,

      city: employee.city,

      perDaySalary: employee.perDaySalary,

      joinedYear: employee.joinedYear,

      hasDocument: false,

      documentFile: null

    });


    this.showModal = true;

  }


  /* ============================================================
     DELETE CONFIRMATION & API CALL
     ============================================================ */

  openDeleteModal(emp: Employee): void {
    this.employeeToDelete = emp;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.employeeToDelete = null;
    this.isDeleting = false;
  }

  confirmDelete(): void {
    if (!this.employeeToDelete) {
      return;
    }

    const empId = parseInt(this.employeeToDelete.id, 10);
    if (isNaN(empId)) {
      this.showError('Invalid employee ID.');
      return;
    }

    const targetId = this.employeeToDelete.id;
    this.isDeleting = true;

    this.employeeService.deleteEmployee(empId).subscribe({
      next: (response) => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.employeeToDelete = null;

        // 1. Remove employee immediately from local table array
        this.employees = this.employees.filter(e => e.id !== targetId);

        // 2. Refresh filtered list & employee count
        this.filterEmployees();

        // 3. Show success toast
        this.showSuccess('Employee deleted successfully.');
      },
      error: (err) => {
        this.isDeleting = false;
        // Keep employee in table on error
        const message = err?.error?.message || err?.message || 'Unable to delete employee.';
        this.showError(message);
      }
    });
  }

  deleteEmployee(id: string): void {
    const employee = this.employees.find(x => x.id === id);
    if (employee) {
      this.openDeleteModal(employee);
    }
  }


  /* ============================================================
     FILE CHANGE
     ============================================================ */

  onFileChange(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }


    const file =
      input.files[0];


    this.uploadedFileName =
      file.name;

    this.uploadedFileSize =
      this.formatFileSize(file.size);


    this.employeeForm.patchValue({

      documentFile: file

    });


    this.employeeForm
      .get('documentFile')
      ?.updateValueAndValidity();

  }


  /* ============================================================
     REMOVE FILE
     ============================================================ */

  removeFile(): void {

    this.uploadedFileName = null;

    this.uploadedFileSize = '';


    this.employeeForm.patchValue({

      documentFile: null

    });

  }


  /* ============================================================
     FORMAT FILE SIZE
     ============================================================ */

  private formatFileSize(
    bytes: number
  ): string {

    if (!bytes) {
      return '0 KB';
    }


    const units = [
      'Bytes',
      'KB',
      'MB',
      'GB'
    ];


    const index =
      Math.floor(
        Math.log(bytes) /
        Math.log(1024)
      );


    const size =
      bytes /
      Math.pow(1024, index);


    return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;

  }


  /* ============================================================
     SUBMIT
     ============================================================ */

  onSubmit(): void {

    if (this.employeeForm.invalid) {

      this.employeeForm.markAllAsTouched();

      return;

    }


    const values =
      this.employeeForm.value;


    this.isSaving = true;


    /*
     * Temporary local implementation.
     *
     * Later this block will call:
     *
     * Employee API
     * +
     * Document API
     */


    setTimeout(() => {

      if (
        this.isEditMode &&
        this.currentEmployeeId
      ) {

        this.updateEmployee(values);

      } else {

        this.addEmployee(values);

      }

      this.isSaving = false;

    }, 300);

  }


  /* ============================================================
     ADD EMPLOYEE
     ============================================================ */

  private addEmployee(
    values: any
  ): void {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `SS_EMB_${randomNum}`;

    const payload: EmployeeCreateRequest = {
      employeeCode: generatedCode,
      name: values.name.trim(),
      designation: values.designation,
      city: values.city?.trim() || '',
      perDaySalary: Number(values.perDaySalary),
      joinedYear: Number(values.joinedYear)
    };

    this.employeeService.createEmployee(payload).subscribe({
      next: (response) => {
        this.closeModal();
        this.successMessage = 'Employee registered successfully.';
        this.showSuccessToast = true;
        this.askAddAnother = true;
        this.loadEmployees();
      },
      error: (err) => {
        console.error('Failed to add employee', err);
        alert('Failed to register employee. Please check console for details.');
      }
    });
  }


  /* ============================================================
     UPDATE EMPLOYEE
     ============================================================ */

  private updateEmployee(
    values: any
  ): void {

    const index =
      this.employees.findIndex(
        employee =>
          employee.id ===
          this.currentEmployeeId
      );


    if (index === -1) {
      return;
    }


    const existing =
      this.employees[index];


    this.employees[index] = {

      ...existing,

      name:
        values.name.trim(),

      designation:
        values.designation,

      city:
        values.city?.trim() || '',

      perDaySalary:
        Number(values.perDaySalary),

      joinedYear:
        Number(values.joinedYear),

      documentName:
        values.hasDocument
          ? this.uploadedFileName || existing.documentName
          : undefined,

      documentSize:
        values.hasDocument
          ? this.getCurrentFileSize() || existing.documentSize
          : undefined

    };


    this.filterEmployees();


    this.closeModal();


    this.showSuccess(
      'Employee updated successfully.'
    );

  }


  /* ============================================================
     GET CURRENT FILE SIZE
     ============================================================ */

  private getCurrentFileSize(): number | undefined {

    const file =
      this.employeeForm.get(
        'documentFile'
      )?.value;


    if (
      file &&
      file instanceof File
    ) {

      return file.size;

    }


    return undefined;

  }


  /* ============================================================
     DOCUMENT VIEW
     ============================================================ */

  viewDocument(
    employee: Employee
  ): void {

    /*
     * Later replace with API:
     *
     * GET /api/employees/{id}/document
     *
     * For now we only show the file name.
     */

    if (!employee.documentName) {
      return;
    }


    window.alert(
      `Document: ${employee.documentName}`
    );

  }


  /* ============================================================
     CLEAR FORM
     ============================================================ */

  clearForm(): void {

    this.employeeForm.reset({

      name: '',

      designation: '',

      city: '',

      perDaySalary: '',

      joinedYear: '',

      hasDocument: false,

      documentFile: null

    });


    this.uploadedFileName = null;

    this.uploadedFileSize = '';

  }


  /* ============================================================
     CLOSE MODAL
     ============================================================ */

  closeModal(): void {

    this.showModal = false;

    this.employeeForm.markAsUntouched();

    this.employeeForm.markAsPristine();

  }


  /* ============================================================
     OVERLAY CLICK
     ============================================================ */

  onOverlayClick(
    event: MouseEvent
  ): void {

    if (
      event.target ===
      event.currentTarget
    ) {

      this.closeModal();

    }

  }


  /* ============================================================
     VALIDATION
     ============================================================ */

  isInvalid(
    controlName: string
  ): boolean {

    const control =
      this.employeeForm.get(
        controlName
      );


    return !!(
      control &&
      control.invalid &&
      (
        control.dirty ||
        control.touched
      )
    );

  }


  /* ============================================================
     SUCCESS TOAST
     ============================================================ */

  private showSuccess(
    message: string
  ): void {

    this.successMessage =
      message;

    this.showSuccessToast = true;


    if (this.toastTimer) {
      clearTimeout(
        this.toastTimer
      );
    }


    this.toastTimer =
      setTimeout(() => {

        this.showSuccessToast =
          false;

      }, 3000);

  }


  /* ============================================================
     ERROR TOAST
     ============================================================ */

  private showError(
    message: string
  ): void {

    this.errorMessage =
      message;

    this.showErrorToast = true;

    if (this.errorToastTimer) {
      clearTimeout(
        this.errorToastTimer
      );
    }

    this.errorToastTimer =
      setTimeout(() => {

        this.showErrorToast =
          false;

      }, 4000);

  }


  /* ============================================================
     ADD ANOTHER - YES
     ============================================================ */

  onAddAnotherYes(): void {

    this.askAddAnother = false;

    this.showSuccessToast = false;

    this.openAddModal();

  }


  /* ============================================================
     ADD ANOTHER - NO
     ============================================================ */

  onAddAnotherNo(): void {

    this.askAddAnother = false;

    this.showSuccessToast = true;


    if (this.toastTimer) {
      clearTimeout(
        this.toastTimer
      );
    }


    this.toastTimer =
      setTimeout(() => {

        this.showSuccessToast =
          false;

      }, 3000);

  }

}