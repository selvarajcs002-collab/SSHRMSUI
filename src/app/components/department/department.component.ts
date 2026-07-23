import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmsApiService } from '../../services/ems-api.service';

interface Department {
  id?: string;
  name: string;
  description: string;
  createdAt?: string;
}

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="department-container">
      
      <!-- Top Action Bar -->
      <div class="action-bar">
        <div class="title-section">
          <h2>Department Directory</h2>
          <p class="subtitle">Manage company departments, descriptions, and structural organization.</p>
        </div>
        
        <div class="actions">
          <button (click)="exportToCSV()" class="btn btn-secondary">
            <i class="fa-solid fa-file-csv text-accent"></i> Export CSV
          </button>
          <button (click)="openModal()" class="btn btn-primary">
            <i class="fa-solid fa-plus"></i> Add Department
          </button>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="glass-card table-card">
        
        <!-- Search and Filter -->
        <div class="table-header">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="filterDepartments()" 
              placeholder="Search departments..." 
            />
          </div>
          <span class="count-indicator">Showing {{ filteredDepartments.length }} department(s)</span>
        </div>

        <div *ngIf="isLoading" class="loading-state">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <span>Loading departments...</span>
        </div>

        <div *ngIf="!isLoading && filteredDepartments.length === 0" class="empty-state">
          <i class="fa-solid fa-folder-open"></i>
          <span>No departments found. Click 'Add Department' to create one.</span>
        </div>

        <!-- Directory Table -->
        <div *ngIf="!isLoading && filteredDepartments.length > 0" class="table-responsive">
          <table class="ems-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Description</th>
                <th>Created Date</th>
                <th class="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let dept of filteredDepartments" class="dept-row">
                <td>
                  <div class="dept-name-cell">
                    <div class="dept-icon"><i class="fa-solid fa-folder"></i></div>
                    <span class="dept-name">{{ dept.name }}</span>
                  </div>
                </td>
                <td class="desc-cell">{{ dept.description || 'No description provided.' }}</td>
                <td>{{ dept.createdAt | date:'mediumDate' }}</td>
                <td class="actions-cell">
                  <button (click)="openModal(dept)" class="action-btn edit-btn" title="Edit Department">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button (click)="deleteDepartment(dept)" class="action-btn delete-btn" title="Delete Department">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal (Glassmorphism overlay) -->
      <div class="modal-overlay" *ngIf="isModalOpen">
        <div class="modal-card glass-card animate-scale-up">
          <div class="modal-header">
            <h3>{{ isEditMode ? 'Modify Department' : 'Create New Department' }}</h3>
            <button (click)="closeModal()" class="close-btn"><i class="fa-solid fa-xmark"></i></button>
          </div>
          
          <form (ngSubmit)="saveDepartment()" #deptForm="ngForm">
            <div class="modal-body">
              <div class="form-group">
                <label for="name">Department Name *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  [(ngModel)]="currentDept.name" 
                  required 
                  placeholder="e.g. Engineering, HR, Production"
                  #nameInput="ngModel"
                  [class.invalid]="nameInput.invalid && nameInput.touched"
                />
                <span class="error-text" *ngIf="nameInput.invalid && nameInput.touched">
                  Department name is required.
                </span>
              </div>

              <div class="form-group">
                <label for="description">Description</label>
                <textarea 
                  id="description" 
                  name="description" 
                  [(ngModel)]="currentDept.description" 
                  rows="4" 
                  placeholder="Describe the department responsibilities, operations, and purpose..."
                ></textarea>
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="deptForm.invalid || isSaving"
              >
                <i class="fa-solid fa-circle-notch fa-spin" *ngIf="isSaving"></i>
                <span *ngIf="!isSaving">{{ isEditMode ? 'Save Changes' : 'Create Department' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .department-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Action Bar */
    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .action-bar h2 {
      font-size: 1.65rem;
      margin-bottom: 0.25rem;
    }
    .subtitle {
      color: var(--text-secondary);
      font-size: 0.925rem;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Table Card */
    .table-card {
      padding: 1.75rem;
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .search-box {
      position: relative;
      width: 280px;
    }
    .search-icon {
      position: absolute;
      left: 0.95rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .search-box input {
      padding-left: 2.25rem;
      font-size: 0.85rem;
    }
    .count-indicator {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 600;
    }

    /* Table Styling */
    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    .ems-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .ems-table th {
      font-family: var(--font-family-title);
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      border-bottom: 1.5px solid var(--border-color);
      padding: 1rem 1.25rem;
    }
    .ems-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: 0.9rem;
    }
    .dept-row {
      transition: var(--transition);
    }
    .dept-row:hover {
      background-color: var(--bg-main);
    }

    /* Table Cells */
    .dept-name-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .dept-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background-color: var(--color-primary-glow);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
    }
    .dept-name {
      font-weight: 700;
      color: var(--text-primary);
    }
    .desc-cell {
      color: var(--text-secondary);
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Actions Column */
    .actions-col {
      width: 100px;
      text-align: center;
    }
    .actions-cell {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }
    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background-color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.85rem;
      transition: var(--transition);
    }
    .edit-btn {
      color: var(--color-accent);
    }
    .edit-btn:hover {
      background-color: var(--color-accent-glow);
      border-color: var(--color-accent);
    }
    .delete-btn {
      color: var(--color-error);
    }
    .delete-btn:hover {
      background-color: var(--color-error-bg);
      border-color: var(--color-error);
    }

    /* Modal Styling */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-card {
      width: 100%;
      max-width: 500px;
      background: #ffffff;
      padding: 0;
      overflow: hidden;
      box-shadow: var(--shadow-xl);
    }
    .modal-header {
      padding: 1.5rem 1.75rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: var(--bg-main);
    }
    .modal-header h3 {
      font-size: 1.2rem;
      font-weight: 700;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: var(--text-muted);
      transition: var(--transition);
    }
    .close-btn:hover {
      color: var(--text-primary);
    }
    .modal-body {
      padding: 1.75rem;
    }
    .modal-footer {
      padding: 1.25rem 1.75rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      background-color: var(--bg-main);
    }
    input.invalid {
      border-color: var(--color-error);
      box-shadow: 0 0 0 3px var(--color-error-bg);
    }

    /* States */
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;
      color: var(--text-secondary);
    }
    .loading-state i {
      font-size: 2.25rem;
      color: var(--color-primary);
    }
    .empty-state i {
      font-size: 3rem;
      color: var(--text-muted);
    }
    .empty-state span {
      font-weight: 600;
    }

    /* Keyframes */
    .animate-scale-up {
      animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes scaleUp {
      0% { transform: scale(0.95); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class DepartmentComponent implements OnInit {
  isLoading = true;
  isSaving = false;
  isModalOpen = false;
  isEditMode = false;
  searchQuery = '';

  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  currentDept: Department = { name: '', description: '' };

  constructor(private apiService: EmsApiService) {}

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.isLoading = true;
    this.apiService.getDepartments().subscribe(
      (data) => {
        this.departments = data || [];
        this.filterDepartments();
        this.isLoading = false;
      },
      (err) => {
        console.error('Error fetching departments:', err);
        this.isLoading = false;
      }
    );
  }

  filterDepartments() {
    if (!this.searchQuery.trim()) {
      this.filteredDepartments = [...this.departments];
    } else {
      const q = this.searchQuery.toLowerCase().trim();
      this.filteredDepartments = this.departments.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }
  }

  openModal(dept?: Department) {
    if (dept) {
      this.isEditMode = true;
      this.currentDept = { ...dept };
    } else {
      this.isEditMode = false;
      this.currentDept = { name: '', description: '' };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveDepartment() {
    if (!this.currentDept.name.trim()) return;

    this.isSaving = true;
    if (this.isEditMode && this.currentDept.id) {
      this.apiService.updateDepartment(this.currentDept.id, this.currentDept).subscribe(
        () => {
          this.isSaving = false;
          this.closeModal();
          this.loadDepartments();
        },
        (err) => {
          alert('Failed to update department: ' + (err.error?.message || err.message));
          this.isSaving = false;
        }
      );
    } else {
      this.apiService.createDepartment(this.currentDept).subscribe(
        () => {
          this.isSaving = false;
          this.closeModal();
          this.loadDepartments();
        },
        (err) => {
          alert('Failed to create department: ' + (err.error?.message || err.message));
          this.isSaving = false;
        }
      );
    }
  }

  deleteDepartment(dept: Department) {
    if (!dept.id) return;
    const confirmDelete = confirm(`Are you sure you want to delete the "${dept.name}" department? This action cannot be undone.`);
    if (confirmDelete) {
      this.apiService.deleteDepartment(dept.id).subscribe(
        () => {
          this.loadDepartments();
        },
        (err) => {
          alert('Failed to delete department: ' + (err.error?.message || err.message));
        }
      );
    }
  }

  exportToCSV() {
    const headers = ['Department Name', 'Description', 'Created Date'];
    const rows = this.departments.map(d => [
      d.name,
      d.description || 'No description',
      d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A'
    ]);

    // Bold title at the top
    let csvContent = 'DEPARTMENT DIRECTORY REPORT\n\n';
    csvContent += headers.join(',') + '\n';
    
    rows.forEach((row: any[]) => {
      const escapedRow = row.map((val: any) => {
        let str = String(val);
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      });
      csvContent += escapedRow.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Departments_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
