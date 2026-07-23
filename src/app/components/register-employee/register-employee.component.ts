import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmsApiService } from '../../services/ems-api.service';

@Component({
  selector: 'app-register-employee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="employee-section-wrapper animate-fade-in">
      
      <!-- MODE 1: EMPLOYEE DIRECTORY (LIST VIEW) -->
      <div *ngIf="viewMode === 'list'" class="directory-container">
        
        <!-- Header -->
        <div class="section-title-bar">
          <div>
            <h2>Employee Directory</h2>
          </div>
          <div class="action-buttons-header">
            <button (click)="exportEmployeesToCSV()" class="btn btn-secondary">
              <i class="fa-solid fa-file-csv text-accent"></i> Export Directory
            </button>
            <button (click)="switchToWizard()" class="btn btn-primary">
              <i class="fa-solid fa-plus"></i> Add Employee
            </button>
          </div>
        </div>

        <!-- Top Widgets -->
        <div class="dashboard-stats-grid mt-3">
          <div class="stat-widget-card">
            <div class="stat-icon-wrapper badge-purple">
              <i class="fa-solid fa-users"></i>
            </div>
            <div class="stat-info">
              <span>Total Employees</span>
              <h3>{{ totalCount }}</h3>
              <div class="stat-trend trend-up">
                <i class="fa-solid fa-arrow-trend-up"></i> Active directory roster
              </div>
            </div>
          </div>

          <div class="stat-widget-card">
            <div class="stat-icon-wrapper badge-green">
              <i class="fa-solid fa-user-check"></i>
            </div>
            <div class="stat-info">
              <span>Active Staff</span>
              <h3>{{ activeCount }}</h3>
              <div class="stat-trend trend-up">
                <i class="fa-solid fa-user-clock text-success"></i> Fully operational
              </div>
            </div>
          </div>

          <div class="stat-widget-card">
            <div class="stat-icon-wrapper badge-orange">
              <i class="fa-solid fa-user-minus"></i>
            </div>
            <div class="stat-info">
              <span>Inactive / Pending</span>
              <h3>{{ pendingCount }}</h3>
              <div class="stat-trend trend-down">
                <i class="fa-solid fa-hourglass-half"></i> Registration in progress
              </div>
            </div>
          </div>
        </div>

        <!-- Table Card -->
        <div class="mt-4 p-0 list-panel" style="background: transparent; border: none; box-shadow: none;">
          <div class="panel-header" style="background: transparent; padding-left: 0; padding-right: 0;">
            <h3>Registered Roster ({{ totalCount }})</h3>
            
            <div class="filter-bar">
              <div class="search-input-box">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input 
                  type="text" 
                  [(ngModel)]="searchQuery" 
                  (input)="onSearch()" 
                  placeholder="Search employees by name, code or phone..." 
                />
              </div>
              
              <!--
              <select [(ngModel)]="selectedDept" (change)="onFilterChange()" class="select-dept-filter">
                <option value="">All Departments</option>
                <option *ngFor="let dept of departmentsList" [value]="dept.name">{{ dept.name }}</option>
                <option *ngIf="departmentsList.length === 0" value="Engineering">Engineering</option>
                <option *ngIf="departmentsList.length === 0" value="HR">HR</option>
                <option *ngIf="departmentsList.length === 0" value="Production">Production</option>
                <option *ngIf="departmentsList.length === 0" value="Quality">Quality</option>
                <option *ngIf="departmentsList.length === 0" value="Sales">Sales</option>
              </select>
              -->
            </div>
          </div>

          <div *ngIf="isLoading" class="table-loading">
            <i class="fa-solid fa-circle-notch fa-spin text-accent"></i>
            <span>Loading database records...</span>
          </div>

          <div *ngIf="!isLoading && employeesList.length === 0" class="table-empty">
            <i class="fa-solid fa-user-slash"></i>
            <span>No employees found matching the filters.</span>
          </div>

          <div *ngIf="!isLoading && employeesList.length > 0" class="ems-table-container">
            <table class="ems-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Employee Code</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let emp of employeesList">
                  <td>
                    <div class="table-profile-img-container">
                      <img 
                        *ngIf="emp.profilePicture && emp.profilePicture !== 'undefined' && emp.profilePicture !== 'null'" 
                        [src]="emp.profilePicture" 
                        alt="Profile" 
                        class="table-profile-img"
                      />
                      <div *ngIf="!emp.profilePicture || emp.profilePicture === 'undefined' || emp.profilePicture === 'null'" class="table-profile-avatar">
                        {{ emp.fullName.charAt(0) }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <code class="emp-code-badge">{{ emp.employeeCode || 'PENDING' }}</code>
                  </td>
                  <td><strong>{{ emp.fullName }}</strong></td>
                  <td>
                    <span class="badge badge-blue">
                      {{ emp.departmentName || 'N/A' }}
                    </span>
                  </td>
                  <td>{{ emp.designation || 'N/A' }}</td>
                  <td>{{ emp.phoneNumber }}</td>
                  <td>
                    <span class="badge" [class.badge-green]="emp.status === 'Active' || emp.status === 1" [class.badge-orange]="emp.status !== 'Active' && emp.status !== 1">
                      {{ emp.status === 1 || emp.status === 'Active' ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                      <button (click)="onEdit(emp)" class="action-btn text-accent" title="Edit Employee">
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button (click)="onDeactivate(emp.id)" *ngIf="emp.status === 'Active' || emp.status === 1" class="action-btn text-orange" title="Deactivate Employee">
                        <i class="fa-solid fa-user-xmark"></i>
                      </button>
                      <button (click)="onHardDelete(emp.id)" class="action-btn text-error" title="Delete Employee">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                      <span *ngIf="emp.status !== 'Active' && emp.status !== 1" class="text-muted text-xs">Deact.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div class="panel-footer" *ngIf="totalCount > 0">
            <span class="footer-entries-info">
              Showing {{ (pageNumber - 1) * pageSize + 1 }} to {{ Math.min(pageNumber * pageSize, totalCount) }} of {{ totalCount }} entries
            </span>
            <div class="pagination-controls">
              <button [disabled]="pageNumber === 1" (click)="goToPage(pageNumber - 1)" class="page-ctrl-btn">
                <i class="fa-solid fa-chevron-left"></i> Previous
              </button>
              <span class="page-num-display">{{ pageNumber }} / {{ totalPages }}</span>
              <button [disabled]="pageNumber >= totalPages" (click)="goToPage(pageNumber + 1)" class="page-ctrl-btn">
                Next <i class="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODE 2: WIZARD FLOW (ADD EMPLOYEE) -->
      <div *ngIf="viewMode === 'wizard'" class="wizard-container">
        
        <!-- Header -->
        <div class="section-title-bar">
          <div class="breadcrumb-trail">
            <span class="crumb-link" (click)="switchToDirectory()"><i class="fa-solid fa-arrow-left-long"></i> Back to Employee List</span>
            <i class="fa-solid fa-chevron-right separator-icon"></i>
            <span class="active-crumb">{{ isEditing ? 'Edit Employee Details' : 'Add Employee' }}</span>
          </div>
          <button (click)="switchToDirectory()" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-table-list"></i> View Directory
          </button>
        </div>

        <!-- Step Indicator -->
        <div class="steps-bar glass-card mt-3">
          <div class="step" [class.active]="currentStep === 1" [class.completed]="currentStep > 1">
            <div class="step-num">
              <i *ngIf="currentStep > 1" class="fa-solid fa-check"></i>
              <span *ngIf="currentStep <= 1">1</span>
            </div>
            <span>Personal Information</span>
          </div>
          <div class="step-line" [class.completed]="currentStep > 1"></div>
          
          <div class="step" [class.active]="currentStep === 2" [class.completed]="currentStep > 2">
            <div class="step-num">
              <i *ngIf="currentStep > 2" class="fa-solid fa-check"></i>
              <span *ngIf="currentStep <= 2">2</span>
            </div>
            <span>Employment Information</span>
          </div>
          <div class="step-line" [class.completed]="currentStep > 2"></div>

          <div class="step" [class.active]="currentStep === 3" [class.completed]="currentStep > 3">
            <div class="step-num">
              <i *ngIf="currentStep > 3" class="fa-solid fa-check"></i>
              <span *ngIf="currentStep <= 3">3</span>
            </div>
            <span>Account Information</span>
          </div>
          <div class="step-line" [class.completed]="currentStep > 3"></div>

          <div class="step" [class.active]="currentStep === 4" [class.completed]="registrationConfirmed">
            <div class="step-num">
              <i *ngIf="registrationConfirmed" class="fa-solid fa-circle-check"></i>
              <span *ngIf="!registrationConfirmed">4</span>
            </div>
            <span>Additional Information</span>
          </div>
        </div>

        <!-- Alert messages -->
        <div *ngIf="errorMessage" class="alert-error mt-3 animate-fade-in">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>{{ errorMessage }}</span>
        </div>
        <div *ngIf="successMessage" class="alert-success mt-3 animate-fade-in">
          <i class="fa-solid fa-circle-check"></i>
          <span>{{ successMessage }}</span>
        </div>

        <!-- Form Cards -->
        <div class="glass-card mt-3 content-panel">
          
          <!-- STEP 1: PERSONAL INFORMATION -->
          <div *ngIf="currentStep === 1" class="step-content">
            <div class="form-section-title">
              <i class="fa-regular fa-user section-icon"></i>
              <div>
                <h3>Personal Information</h3>
                <p>Enter employee personal details, photo, and structural assignment.</p>
              </div>
            </div>

            <form #basicForm="ngForm" class="grid-layout mt-3">
              
              <!-- Profile Picture Section -->
              <div class="profile-pic-section">
                <div class="profile-pic-uploader">
                  <img 
                    *ngIf="basic.profilePicture && basic.profilePicture !== 'undefined' && basic.profilePicture !== 'null'" 
                    [src]="basic.profilePicture" 
                    alt="Profile Preview" 
                    class="profile-preview-circle"
                  />
                  <div *ngIf="!basic.profilePicture || basic.profilePicture === 'undefined' || basic.profilePicture === 'null'" class="profile-avatar-placeholder">
                    <i class="fa-solid fa-user-tie"></i>
                  </div>
                  <div class="upload-badge-btn" title="Choose Photo">
                    <i class="fa-solid fa-camera"></i>
                    <input type="file" accept="image/*" (change)="onProfilePictureSelected($event)" />
                  </div>
                </div>
                <div class="profile-pic-info">
                  <h4>Employee Photo</h4>
                  <p>Upload a clear passport photo. Image will be compressed client-side to save database space (< 4KB).</p>
                  <button type="button" *ngIf="basic.profilePicture && basic.profilePicture !== 'undefined' && basic.profilePicture !== 'null'" (click)="basic.profilePicture = null" class="btn btn-secondary btn-xs mt-1 text-error">
                    Remove Photo
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>First Name *</label>
                <input type="text" name="firstName" [(ngModel)]="basic.firstName" required placeholder="e.g. Rahul" />
              </div>
              
              <div class="form-group">
                <label>Last Name *</label>
                <input type="text" name="lastName" [(ngModel)]="basic.lastName" required placeholder="e.g. Sharma" />
              </div>

              <div class="form-group">
                <label>Email Address (Optional)</label>
                <input type="email" name="email" [(ngModel)]="basic.email" placeholder="rahul.sharma@example.com" />
              </div>

              <div class="form-group">
                <label>Phone Number * (10 digits)</label>
                <input 
                  type="text" 
                  name="phoneNumber" 
                  [(ngModel)]="basic.phoneNumber" 
                  required 
                  maxlength="10"
                  (keypress)="onlyNumbers($event)"
                  (input)="onPhoneInput($event, 'basic')"
                  placeholder="e.g. 9876543210" 
                />
              </div>

              <div class="form-group">
                <label>Date of Birth * <i *ngIf="isEditing" class="fa-solid fa-lock ms-1" style="color: #6b7280; font-size: 0.8rem;" title="Identity fields cannot be modified after registration"></i></label>
                <input type="date" name="dob" [(ngModel)]="extra.dob" required [disabled]="isEditing" />
              </div>

              <div class="form-group">
                <label>Gender *</label>
                <select name="gender" [(ngModel)]="extra.gender" required>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <!-- Designation Selector -->
              <div class="form-group">
                <label>Designation *</label>
                <select name="designation" [(ngModel)]="basic.designation" required>
                  <option value="" disabled selected>Select Designation...</option>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Senior Software Engineer">Senior Software Engineer</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Production Operator">Production Operator</option>
                  <option value="Quality Control Inspector">Quality Control Inspector</option>
                  <option value="Technician">Technician</option>
                </select>
              </div>

              <div class="form-group">
                <label>Marital Status *</label>
                <select name="maritalStatus" [(ngModel)]="basic.maritalStatus" required>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>

              <div class="form-group">
                <label>Nationality *</label>
                <input type="text" name="nationality" [(ngModel)]="extra.nationality" required placeholder="e.g. Indian" />
              </div>

              <div class="form-group span-3">
                <label>Address *</label>
                <input type="text" name="address" [(ngModel)]="basic.address" required placeholder="123, Green Park, New Delhi - 110016" />
              </div>

              <!-- Required Compliance fields for API -->
              <div class="form-group">
                <label>Aadhaar Number * (12 digits) <i *ngIf="isEditing" class="fa-solid fa-lock ms-1" style="color: #6b7280; font-size: 0.8rem;" title="Identity fields cannot be modified after registration"></i></label>
                <input type="text" name="aadhaar" [(ngModel)]="basic.aadhaarNumber" required pattern="^[0-9]{12}$" placeholder="Aadhaar No." [disabled]="isEditing" />
              </div>

              <div class="form-group">
                <label>City *</label>
                <input type="text" name="city" [(ngModel)]="basic.city" required placeholder="City" />
              </div>

              <div class="form-group">
                <label>State *</label>
                <input type="text" name="state" [(ngModel)]="basic.state" required placeholder="State" />
              </div>

              <div class="form-group">
                <label>District *</label>
                <input type="text" name="district" [(ngModel)]="basic.district" required placeholder="District" />
              </div>

              <div class="form-group">
                <label>Pincode *</label>
                <input type="text" name="pincode" [(ngModel)]="basic.pincode" required placeholder="Pincode" />
              </div>

              <div class="form-group">
                <label>PAN Number <i *ngIf="isEditing" class="fa-solid fa-lock ms-1" style="color: #6b7280; font-size: 0.8rem;" title="Identity fields cannot be modified after registration"></i></label>
                <input type="text" name="pan" [(ngModel)]="basic.panNumber" placeholder="PAN Number" [disabled]="isEditing" />
              </div>

              <div class="form-group">
                <label>Blood Group</label>
                <input type="text" name="blood" [(ngModel)]="basic.bloodGroup" placeholder="e.g. O+" />
              </div>

              <div class="form-group">
                <label>Monthly Base Salary * (INR)</label>
                <input type="number" name="salary" [(ngModel)]="basic.salaryPerMonth" required min="1" placeholder="Salary Amount" />
              </div>

              <div class="form-group">
                <label>Referral</label>
                <input type="text" name="referral" [(ngModel)]="basic.referral" placeholder="Referral Source" />
              </div>
            </form>

            <div class="action-bar-wizard mt-4">
              <button (click)="switchToDirectory()" class="btn btn-secondary">Cancel</button>
              <button (click)="submitStep1(basicForm)" [disabled]="basicForm.invalid || isLoading" class="btn btn-primary">
                Next: Bank Account <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <!-- STEP 2: BANK DETAILS -->
          <div *ngIf="currentStep === 2" class="step-content">
            <div class="form-section-title">
              <i class="fa-solid fa-building-columns section-icon"></i>
              <div>
                <h3>Bank Details</h3>
                <p>Enter bank details for payroll processing (Optional, skip if not applicable).</p>
              </div>
            </div>

            <form #bankForm="ngForm" class="grid-layout mt-3">
              <div class="form-group">
                <label>Account Number</label>
                <input type="text" name="accNum" [(ngModel)]="bank.accountNumber" placeholder="Account Number" />
              </div>

              <div class="form-group">
                <label>IFSC Code</label>
                <input type="text" name="ifsc" [(ngModel)]="bank.ifscCode" placeholder="IFSC Code" />
              </div>

              <div class="form-group">
                <label>Banking Name</label>
                <input type="text" name="bankName" [(ngModel)]="bank.bankName" placeholder="Bank Name" />
              </div>

              <div class="form-group">
                <label>Associated Phone Number (10 digits)</label>
                <input 
                  type="text" 
                  name="bankPhone" 
                  [(ngModel)]="bank.phoneNumber" 
                  maxlength="10"
                  (keypress)="onlyNumbers($event)"
                  (input)="onPhoneInput($event, 'bank')"
                  placeholder="Associated Phone Number" 
                />
              </div>

              <div class="form-group span-2">
                <label>UPI ID (Optional)</label>
                <input type="text" name="upi" [(ngModel)]="bank.upiId" placeholder="e.g. UPI ID" />
              </div>
            </form>

            <div class="action-bar-wizard mt-4">
              <button (click)="prevStep()" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Back</button>
              <button (click)="submitStep2()" [disabled]="isLoading" class="btn btn-primary">
                Next: Documents <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <!-- STEP 3: DOCUMENT UPLOAD -->
          <div *ngIf="currentStep === 3" class="step-content">
            <div class="form-section-title">
              <i class="fa-regular fa-folder-open section-icon"></i>
              <div>
                <h3>Documents Upload</h3>
                <p>Upload mandatory verification files. Aadhaar is required. Bank statement is required if bank info is entered.</p>
              </div>
            </div>

            <div class="upload-grid mt-4">
              <!-- Aadhaar card -->
              <div class="upload-item-card">
                <h4>Aadhaar Card (Mandatory)</h4>
                <div class="custom-file-uploader" [class.uploaded]="aadharUploaded">
                  <i class="fa-regular" [class.fa-file-pdf]="!aadharUploaded" [class.fa-circle-check]="aadharUploaded"></i>
                  <span class="file-prompt" *ngIf="!aadharUploaded">Choose Aadhaar PDF or Image</span>
                  <span class="file-prompt success-prompt" *ngIf="aadharUploaded">Aadhaar Card Uploaded!</span>
                  <input type="file" (change)="onFileSelected($event, 'AadharCard')" />
                </div>
              </div>

              <!-- Bank passbook -->
              <div class="upload-item-card" *ngIf="hasEnteredBank">
                <h4>Bank Passbook Page (Mandatory)</h4>
                <div class="custom-file-uploader" [class.uploaded]="passbookUploaded">
                  <i class="fa-regular" [class.fa-image]="!passbookUploaded" [class.fa-circle-check]="passbookUploaded"></i>
                  <span class="file-prompt" *ngIf="!passbookUploaded">Choose Bank Front Page (PDF/Image)</span>
                  <span class="file-prompt success-prompt" *ngIf="passbookUploaded">Bank Passbook Uploaded!</span>
                  <input type="file" (change)="onFileSelected($event, 'BankPassbook')" />
                </div>
              </div>
            </div>

            <div class="action-bar-wizard mt-4">
              <button (click)="prevStep()" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Back</button>
              <button (click)="submitStep3()" [disabled]="isLoading" class="btn btn-primary">
                Next: Confirm <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <!-- STEP 4: CONFIRM & PREVIEW -->
          <div *ngIf="currentStep === 4" class="step-content">
            
            <div *ngIf="!registrationConfirmed">
              <div class="form-section-title">
                <i class="fa-regular fa-clipboard section-icon"></i>
                <div>
                  <h3>Review & Confirm</h3>
                  <p>Confirm the details of the employee before finalizing registration.</p>
                </div>
              </div>

              <div class="review-details-grid mt-3">
                <div class="review-block personal-review">
                  <div class="profile-pic-container-review" *ngIf="basic.profilePicture && basic.profilePicture !== 'undefined' && basic.profilePicture !== 'null'">
                    <img [src]="basic.profilePicture" alt="Profile" class="profile-pic-review" />
                  </div>
                  <div class="review-info-section">
                    <h4>Personal & Professional Details</h4>
                    <div class="review-row">
                      <span class="rev-lbl">Full Name:</span>
                      <span class="rev-val">{{ basic.firstName }} {{ basic.lastName }}</span>
                    </div>
                    <div class="review-row">
                      <span class="rev-lbl">Email Address:</span>
                      <span class="rev-val">{{ basic.email }}</span>
                    </div>
                    <div class="review-row">
                      <span class="rev-lbl">Designation:</span>
                      <span class="rev-val">{{ basic.designation }}</span>
                    </div>
                    <div class="review-row">
                      <span class="rev-lbl">Phone Number:</span>
                      <span class="rev-val">{{ basic.phoneNumber }}</span>
                    </div>
                    <div class="review-row">
                      <span class="rev-lbl">Gender:</span>
                      <span class="rev-val">{{ extra.gender }}</span>
                    </div>
                    <div class="review-row">
                      <span class="rev-lbl">Marital Status:</span>
                      <span class="rev-val">{{ basic.maritalStatus }}</span>
                    </div>
                    <div class="review-row">
                      <span class="rev-lbl">Address:</span>
                      <span class="rev-val">{{ basic.address }}, {{ basic.city }} - {{ basic.pincode }}</span>
                    </div>
                    <div class="review-row">
                      <span class="rev-lbl">Monthly Base Salary:</span>
                      <span class="rev-val text-success">INR {{ basic.salaryPerMonth | number }}</span>
                    </div>
                  </div>
                </div>

                <div class="review-block" *ngIf="hasEnteredBank">
                  <h4>Bank details</h4>
                  <div class="review-row">
                    <span class="rev-lbl">Account Number:</span>
                    <span class="rev-val">{{ bank.accountNumber }}</span>
                  </div>
                  <div class="review-row">
                    <span class="rev-lbl">IFSC Code:</span>
                    <span class="rev-val">{{ bank.ifscCode }}</span>
                  </div>
                  <div class="review-row">
                    <span class="rev-lbl">Bank Name:</span>
                    <span class="rev-val">{{ bank.bankName }}</span>
                  </div>
                </div>

                <div class="review-block">
                  <h4>Uploaded Files</h4>
                  <div *ngIf="!previewData?.documents || previewData.documents.length === 0" class="text-muted p-2">
                    No documents uploaded.
                  </div>
                  <div *ngIf="previewData?.documents && previewData.documents.length > 0" class="uploaded-docs-container">
                    <div *ngFor="let doc of previewData.documents" class="uploaded-doc-item">
                      <div class="doc-info">
                        <i class="fa-solid fa-file-pdf doc-icon" *ngIf="doc.contentType === 'application/pdf'"></i>
                        <i class="fa-solid fa-file-image doc-icon" *ngIf="doc.contentType !== 'application/pdf'"></i>
                        <div>
                          <span class="doc-type-label">{{ getDocumentTypeName(doc.documentType) }}</span>
                          <span class="doc-filename">{{ doc.fileName }}</span>
                        </div>
                      </div>
                      <div class="doc-actions">
                        <button type="button" (click)="viewDocument(doc)" class="btn btn-secondary btn-xs" title="View Document">
                          <i class="fa-solid fa-eye"></i> View
                        </button>
                        <button type="button" (click)="deleteDocument(doc)" class="btn btn-secondary btn-xs text-error" title="Delete Document">
                          <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="action-bar-wizard mt-4">
                <button (click)="prevStep()" [disabled]="isLoading" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <button (click)="confirmFinalRegistration()" [disabled]="isLoading" class="btn btn-success">
                  {{ isEditing ? 'Finish Editing' : 'Confirm & Activate Employee' }} <i class="fa-solid fa-check"></i>
                </button>
              </div>
            </div>

            <!-- SUCCESS CONFIRMED CARD -->
            <div *ngIf="registrationConfirmed" class="success-registration-view text-center animate-fade-in">
              <i class="fa-solid fa-circle-check final-success-icon"></i>
              <h2>{{ isEditing ? 'Update Completed!' : 'Registration Completed!' }}</h2>
              <p>{{ isEditing ? 'The employee details have been successfully updated.' : 'The employee account has been successfully verified, saved, and activated.' }}</p>

              <div class="credential-box mt-4">
                <div class="cred-row">
                  <span class="cred-lbl">Generated Employee Code</span>
                  <span class="cred-val text-primary">{{ confirmedEmployee?.employeeCode }}</span>
                </div>
                <div class="cred-row">
                  <span class="cred-lbl">Database UID</span>
                  <span class="cred-val font-mono">{{ confirmedEmployee?.id }}</span>
                </div>
              </div>

              <div class="mt-4" style="display:flex; justify-content:center; gap: 1rem;">
                <button (click)="switchToDirectory()" class="btn btn-secondary">
                  <i class="fa-solid fa-table-list"></i> Back to Directory
                </button>
                <button (click)="resetWizard()" class="btn btn-primary">
                  <i class="fa-solid fa-user-plus"></i> Add Another
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    /* Employee Management Header Bar */
    .section-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .section-title-bar h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .subtitle-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    .action-buttons-header {
      display: flex;
      gap: 0.75rem;
    }

    /* List mode cards & search */
    .list-panel {
      border-radius: var(--radius-lg);
      overflow: hidden;
      padding: 0;
    }
    .panel-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1.5px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      background: #ffffff;
    }
    .panel-header h3 {
      font-size: 1.05rem;
      font-weight: 700;
    }
    .filter-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-input-box {
      position: relative;
      width: 280px;
    }
    .search-input-box i {
      position: absolute;
      left: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .search-input-box input {
      padding-left: 2.25rem;
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
      font-size: 0.85rem;
    }
    .select-dept-filter {
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
      width: 180px;
    }

    /* Profile images in list directory */
    .table-profile-img-container {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;
      border: 1px solid var(--border-color);
    }
    .table-profile-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .table-profile-avatar {
      width: 100%;
      height: 100%;
      background-color: var(--color-primary-glow);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }

    /* Table styling specifics */
    .emp-code-badge {
      color: var(--color-primary);
      background: var(--color-primary-glow);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.75rem;
      letter-spacing: 0.02em;
    }
    .text-email {
      font-size: 0.825rem;
      color: var(--text-secondary);
    }
    .action-btn {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: var(--transition);
    }
    .action-btn:hover {
      background: var(--color-error-bg);
      transform: scale(1.1);
    }
    .table-loading, .table-empty {
      padding: 4rem 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    .table-loading i {
      font-size: 2.25rem;
    }
    .table-empty i {
      font-size: 2.5rem;
      color: var(--text-muted);
    }

    /* Pagination Footer */
    .panel-footer {
      padding: 1rem 1.5rem;
      border-top: 1.5px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-weight: 600;
      background: #ffffff;
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .page-ctrl-btn {
      background: #ffffff;
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .page-ctrl-btn:hover:not(:disabled) {
      background-color: var(--bg-main);
      border-color: var(--border-hover);
      color: var(--text-primary);
    }
    .page-ctrl-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .page-num-display {
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Wizard steps bar */
    .steps-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 2rem;
      box-shadow: var(--shadow-sm);
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      z-index: 2;
    }
    .step-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f1f5f9;
      border: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: var(--text-secondary);
      font-size: 0.8rem;
      transition: var(--transition);
    }
    .step span {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .step.active .step-num {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #ffffff;
      box-shadow: 0 0 8px var(--color-primary-glow);
    }
    .step.active span {
      color: var(--text-primary);
      font-weight: 700;
    }
    .step.completed .step-num {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #ffffff;
    }
    .step.completed span {
      color: var(--text-primary);
    }
    .step-line {
      flex: 1;
      height: 2px;
      background-color: var(--border-color);
      margin: 0 1rem;
      position: relative;
      top: -12px;
    }
    .step-line.completed {
      background-color: var(--color-primary);
    }

    /* Wizard forms content panel */
    .content-panel {
      padding: 2.25rem;
    }
    .form-section-title {
      display: flex;
      gap: 0.85rem;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .section-icon {
      font-size: 1.5rem;
      color: var(--color-primary);
    }
    .form-section-title h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .form-section-title p {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .grid-layout {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }
    .span-3 {
      grid-column: span 3;
    }
    .span-2 {
      grid-column: span 2;
    }

    /* Profile photo uploader styling */
    .profile-pic-section {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      grid-column: span 3;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      padding: 1.25rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
    }
    .profile-pic-uploader {
      position: relative;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 2.5px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      flex-shrink: 0;
    }
    .profile-preview-circle {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    .profile-avatar-placeholder {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: var(--color-primary-glow);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
    }
    .upload-badge-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 28px;
      height: 28px;
      background: var(--color-primary);
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      box-shadow: var(--shadow-md);
      cursor: pointer;
      border: 2px solid #ffffff;
      overflow: hidden;
    }
    .upload-badge-btn input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }
    .profile-pic-info h4 {
      font-size: 0.9rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .profile-pic-info p {
      font-size: 0.75rem;
      color: var(--text-secondary);
      max-width: 380px;
    }
    .btn-xs {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }

    @media (max-width: 900px) {
      .grid-layout {
        grid-template-columns: repeat(2, 1fr);
      }
      .span-3 {
        grid-column: span 2;
      }
    }
    @media (max-width: 600px) {
      .grid-layout {
        grid-template-columns: 1fr;
      }
      .span-3, .span-2 {
        grid-column: span 1;
      }
      .profile-pic-section {
        flex-direction: column;
        text-align: center;
      }
    }
    .action-bar-wizard {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
    }

    /* Document upload box style */
    .upload-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      .upload-grid {
        grid-template-columns: 1fr;
      }
    }
    .upload-item-card {
      background: #ffffff;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
    }
    .upload-item-card h4 {
      font-size: 0.85rem;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
      font-weight: 700;
    }
    .custom-file-uploader {
      position: relative;
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-md);
      padding: 2.25rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: var(--transition);
    }
    .custom-file-uploader:hover {
      border-color: var(--color-primary);
      background-color: #f8fafc;
    }
    .custom-file-uploader.uploaded {
      border-color: var(--color-success);
      background-color: var(--color-success-bg);
    }
    .custom-file-uploader i {
      font-size: 2.25rem;
      color: var(--text-muted);
    }
    .custom-file-uploader.uploaded i {
      color: var(--color-success);
    }
    .file-prompt {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .success-prompt {
      color: var(--color-success) !important;
    }
    .custom-file-uploader input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    /* Review details preview layout */
    .review-details-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .review-block {
      background-color: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
    }
    .personal-review {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
    }
    .profile-pic-container-review {
      width: 120px;
      height: 120px;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 2px solid var(--border-color);
      flex-shrink: 0;
    }
    .profile-pic-review {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .review-info-section {
      flex: 1;
    }
    .review-block h4 {
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 0.85rem;
      border-bottom: 1.5px solid var(--border-color);
      padding-bottom: 0.45rem;
    }
    .review-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      margin-bottom: 0.45rem;
      border-bottom: 1px dashed rgba(0,0,0,0.03);
      padding-bottom: 0.25rem;
    }
    .review-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    .rev-lbl {
      color: var(--text-secondary);
      font-weight: 600;
    }
    .rev-val {
      font-weight: 700;
      color: var(--text-primary);
    }
    .uploaded-files-list {
      list-style: none;
    }
    .uploaded-files-list li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 0.35rem;
    }
    .uploaded-files-list li i {
      color: var(--color-primary);
    }

    /* Success confirmation screen */
    .success-registration-view {
      padding: 3rem 1.5rem;
    }
    .final-success-icon {
      font-size: 4.5rem;
      color: var(--color-success);
      margin-bottom: 1.25rem;
      filter: drop-shadow(0 4px 10px rgba(16, 185, 129, 0.15));
    }
    .success-registration-view h2 {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
    }
    .success-registration-view p {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .credential-box {
      max-width: 460px;
      margin: 1.75rem auto;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: #ffffff;
      box-shadow: var(--shadow-sm);
    }
    .cred-row {
      padding: 0.85rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
    }
    .cred-row:last-child {
      border-bottom: none;
    }
    .cred-lbl {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
    }
    .cred-val {
      font-size: 1.05rem;
      font-weight: 800;
    }
    .font-mono {
      font-family: monospace;
      font-size: 0.85rem !important;
      color: var(--text-secondary) !important;
    }

    /* Breadcrumbs */
    .crumb-link {
      color: var(--text-muted);
      cursor: pointer;
      transition: var(--transition);
      font-weight: 700;
    }
    .crumb-link:hover {
      color: var(--color-primary);
    }

    /* Alerts styling overrides */
    .alert-error {
      background: var(--color-error-bg);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: var(--color-error);
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .alert-success {
      background: var(--color-success-bg);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: var(--color-success);
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    @media (max-width: 600px) {
      .personal-review {
        flex-direction: column;
        align-items: center;
      }
    }

    /* Uploaded document list styling */
    .uploaded-docs-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .uploaded-doc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      transition: var(--transition);
    }
    .uploaded-doc-item:hover {
      border-color: var(--border-hover);
      box-shadow: var(--shadow-sm);
    }
    .doc-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .doc-icon {
      font-size: 1.5rem;
      color: var(--color-primary);
    }
    .doc-type-label {
      display: block;
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--text-primary);
    }
    .doc-filename {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .doc-actions {
      display: flex;
      gap: 0.5rem;
    }
    .text-error {
      color: var(--color-error) !important;
    }
    .text-error:hover {
      background-color: var(--color-error-bg) !important;
    }
  `]
})
export class RegisterEmployeeComponent implements OnInit {
  viewMode: 'list' | 'wizard' = 'list';
  currentStep = 1;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  employeeId = '';
  hasEnteredBank = false;
  aadharUploaded = false;
  passbookUploaded = false;

  registrationConfirmed = false;
  confirmedEmployee: any = null;
  previewData: any = null;

  // Directory properties
  employeesList: any[] = [];
  searchQuery = '';
  selectedDept = '';
  pageNumber = 1;
  pageSize = 6;
  totalCount = 0;
  totalPages = 1;

  activeCount = 0;
  pendingCount = 0;
  Math = Math;

  departmentsList: any[] = [];

  isEditing = false;

  basic = {
    firstName: '',
    lastName: '',
    aadhaarNumber: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    district: '',
    pincode: '',
    panNumber: '',
    bloodGroup: '',
    maritalStatus: 'Single',
    salaryPerMonth: 0,
    referral: '',
    email: '',
    designation: '',
    dateOfBirth: null as string | null,
    gender: 'Male',
    nationality: 'Indian',
    profilePicture: null as string | null
  };

  bank = {
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    phoneNumber: '',
    upiId: ''
  };

  extra = {
    dob: '',
    gender: 'Male',
    nationality: 'Indian'
  };

  constructor(private apiService: EmsApiService) {}

  ngOnInit() {
    this.loadEmployeesList();
    this.loadDepartments();
  }

  loadDepartments() {
    this.apiService.getDepartments().subscribe({
      next: (depts) => {
        this.departmentsList = depts || [];
      },
      error: (err) => console.error('Error fetching departments in register component:', err)
    });
  }

  onlyNumbers(event: any) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode || event.which);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  onPhoneInput(event: any, target: 'basic' | 'bank') {
    const input = event.target;
    const val = input.value.replace(/\D/g, '').slice(0, 10);
    if (target === 'basic') {
      this.basic.phoneNumber = val;
    } else {
      this.bank.phoneNumber = val;
    }
  }

  loadEmployeesList() {
    this.isLoading = true;
    this.apiService.getEmployees(this.pageNumber, this.pageSize, this.searchQuery).subscribe({
      next: (res) => {
        let items = res.items || [];
        
        // Filter by department locally if select filter is set (matches mock filtering behaviour)
        if (this.selectedDept) {
          items = items.filter((emp: any) => emp.departmentName === this.selectedDept);
        }

        this.employeesList = items;
        this.totalCount = res.totalCount || items.length;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
        
        // Compute stats
        // status matches 'Active' (string) or 1 (number)
        this.activeCount = items.filter((e: any) => e.status === 'Active' || e.status === 1).length;
        this.pendingCount = items.filter((e: any) => e.status !== 'Active' && e.status !== 1).length;
        
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onSearch() {
    this.pageNumber = 1;
    this.loadEmployeesList();
  }

  onFilterChange() {
    this.pageNumber = 1;
    this.loadEmployeesList();
  }

  goToPage(page: number) {
    this.pageNumber = page;
    this.loadEmployeesList();
  }

  switchToWizard() {
    if (!this.isEditing) {
      this.resetWizard();
    }
    this.viewMode = 'wizard';
  }

  switchToDirectory() {
    this.viewMode = 'list';
    this.loadEmployeesList();
  }

  onProfilePictureSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Calculate center crop square
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;
          ctx.drawImage(img, x, y, size, size, 0, 0, 150, 150);
          // Compress to JPEG with 0.6 quality (creates lightweight Base64 string)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          this.basic.profilePicture = compressedBase64;
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  onDeactivate(id: string) {
    if (confirm('Are you sure you want to deactivate this employee?')) {
      this.isLoading = true;
      this.apiService.deleteEmployee(id).subscribe({
        next: () => {
          this.loadEmployeesList();
          alert('Employee deactivated successfully.');
        },
        error: (err) => {
          this.isLoading = false;
          alert(err.error?.message || 'Failed to deactivate employee.');
        }
      });
    }
  }

  onHardDelete(id: string) {
    if (confirm('Are you absolutely sure you want to PERMANENTLY delete this employee? This action cannot be undone.')) {
      this.isLoading = true;
      this.apiService.hardDeleteEmployee(id).subscribe({
        next: () => {
          this.loadEmployeesList();
          alert('Employee permanently deleted.');
        },
        error: (err) => {
          this.isLoading = false;
          alert(err.error?.message || 'Failed to delete employee.');
        }
      });
    }
  }

  onEdit(emp: any) {
    this.isLoading = true;
    this.apiService.getEmployeeById(emp.id).subscribe({
      next: (fullEmp: any) => {
        this.isLoading = false;
        this.employeeId = fullEmp.id;
        
        this.basic = fullEmp.basicDetails;
        this.extra = {
          dob: fullEmp.basicDetails?.dateOfBirth ? fullEmp.basicDetails.dateOfBirth.split('T')[0] : '',
          gender: fullEmp.basicDetails?.gender || 'Male',
          nationality: fullEmp.basicDetails?.nationality || 'Indian'
        };

        this.bank = fullEmp.bankDetails || { accountHolderName: '', accountNumber: '', bankName: '', ifscCode: '', phoneNumber: '', id: '' };
        this.aadharUploaded = fullEmp.documents?.some((d: any) => d.documentType === 'AadharCard' || d.documentType === 1);
        this.passbookUploaded = fullEmp.documents?.some((d: any) => d.documentType === 'BankPassbook' || d.documentType === 2);
        
        this.isEditing = true;
        this.currentStep = 1;
        this.registrationConfirmed = false;
        this.switchToWizard();
      },
      error: (err: any) => {
        this.isLoading = false;
        alert('Failed to fetch employee details.');
      }
    });
  }

  getDocumentTypeName(type: number | string): string {
    // EmsDocumentType enum: AadharCard = 1, BankPassbook = 2, Other = 3
    const t = typeof type === 'number' ? type : parseInt(type, 10);
    if (isNaN(t)) {
      const typeStr = String(type);
      if (typeStr === 'AadharCard') return 'Aadhaar Card';
      if (typeStr === 'BankPassbook') return 'Bank Passbook';
      return typeStr;
    }
    switch (t) {
      case 1: return 'Aadhaar Card';
      case 2: return 'Bank Passbook';
      default: return 'Other Document';
    }
  }

  // --- Wizard Logic ---

  submitStep1(form: any) {
    if (form.invalid) return;

    if (!this.basic.phoneNumber || this.basic.phoneNumber.length !== 10) {
      this.errorMessage = 'Phone Number must be exactly 10 digits.';
      return;
    }

    // Remove any logic related to "Other" designation as it is not used anymore


    this.isLoading = true;
    this.errorMessage = '';

    // Merge extra fields into basic before sending to API
    this.basic.dateOfBirth = this.extra.dob ? this.extra.dob : null;
    this.basic.gender = this.extra.gender;
    this.basic.nationality = this.extra.nationality;

    if (this.isEditing) {
      this.apiService.updateEmployee(this.employeeId, this.basic).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.currentStep = 2;
          this.successMessage = 'Personal details updated successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Error updating basic details.';
        }
      });
    } else {
      this.apiService.registerBasic(this.basic).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.employeeId = res.id;
          this.currentStep = 2;
          this.successMessage = 'Personal details saved successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Error saving basic details.';
        }
      });
    }
  }

  submitStep2() {
    const isFilled = this.bank.accountNumber || this.bank.ifscCode || this.bank.bankName || this.bank.phoneNumber;
    
    if (!isFilled) {
      this.hasEnteredBank = false;
      this.currentStep = 3;
      return;
    }

    if (this.bank.phoneNumber && this.bank.phoneNumber.length !== 10) {
      this.errorMessage = 'Bank Associated Phone Number must be exactly 10 digits.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.saveBankDetails(this.employeeId, this.bank).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.hasEnteredBank = true;
        this.currentStep = 3;
        this.successMessage = 'Bank account details saved successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error saving bank details. Ensure all fields are filled.';
      }
    });
  }

  onFileSelected(event: any, type: string) {
    const file = event.target.files[0];
    if (!file) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.uploadDocument(this.employeeId, type, file).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (type === 'AadharCard') this.aadharUploaded = true;
        if (type === 'BankPassbook') this.passbookUploaded = true;
        this.successMessage = `${type === 'AadharCard' ? 'Aadhaar Card' : 'Bank Passbook'} uploaded successfully!`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || `Error uploading document.`;
      }
    });
  }

  submitStep3() {
    if (!this.aadharUploaded) {
      this.errorMessage = 'Aadhaar Card upload is mandatory.';
      return;
    }

    if (this.hasEnteredBank && !this.passbookUploaded) {
      this.errorMessage = 'Bank Passbook upload is mandatory since bank details were provided.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getPreview(this.employeeId).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.previewData = res;
        this.currentStep = 4;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error loading preview.';
      }
    });
  }

  viewDocument(doc: any) {
    const docType = doc.documentType;
    const url = `${this.apiService.baseUrl}/employees/register/${this.employeeId}/document/${docType}`;
    window.open(url, '_blank');
  }

  deleteDocument(doc: any) {
    if (confirm(`Are you sure you want to delete the uploaded ${this.getDocumentTypeName(doc.documentType)}?`)) {
      this.isLoading = true;
      this.errorMessage = '';
      this.apiService.deleteDocument(this.employeeId, doc.documentType).subscribe({
        next: () => {
          this.isLoading = false;
          if (this.previewData && this.previewData.documents) {
            this.previewData.documents = this.previewData.documents.filter((d: any) => d.id !== doc.id);
          }
          
          // EmsDocumentType enum: AadharCard = 1, BankPassbook = 2
          const isAadhar = doc.documentType === 1 || doc.documentType === 'AadharCard';
          const isBank = doc.documentType === 2 || doc.documentType === 'BankPassbook';
          
          if (isAadhar) {
            this.aadharUploaded = false;
          }
          if (isBank) {
            this.passbookUploaded = false;
          }
          
          this.successMessage = 'Document deleted successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to delete document.';
        }
      });
    }
  }

  confirmFinalRegistration() {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.isEditing) {
      // During edit, the employee is already confirmed and data has been updated incrementally
      this.isLoading = false;
      this.registrationConfirmed = true;
      this.successMessage = 'Employee details updated successfully!';
    } else {
      this.apiService.confirmRegistration(this.employeeId).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.confirmedEmployee = res;
          this.registrationConfirmed = true;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to confirm registration.';
        }
      });
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  exportEmployeesToCSV() {
    this.apiService.getEmployees(1, 1000).subscribe({
      next: (res) => {
        const items = res.items || [];
        if (items.length === 0) {
          alert('No employees found to export in the directory.');
          return;
        }
        const headers = [
          'Employee Code',
          'Full Name',
          'Department',
          'Designation',
          'Phone Number',
          'City',
          'State',
          'Salary (Per Month)',
          'Status'
        ];

        const rows = items.map((emp: any) => [
          emp.employeeCode || 'PENDING',
          emp.fullName,
          emp.departmentName || 'N/A',
          emp.designation || 'N/A',
          emp.phoneNumber,
          emp.city,
          emp.state,
          emp.salaryPerMonth || 0,
          emp.status === 1 || emp.status === 'Active' ? 'Active' : 'Inactive'
        ]);

        let csvContent = 'EMPLOYEE DIRECTORY REPORT\n\n';
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
        link.setAttribute('download', `Employee_Directory_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      error: (err) => {
        alert('Failed to export employee directory: ' + err.message);
      }
    });
  }

  resetWizard() {
    this.currentStep = 1;
    this.employeeId = '';
    this.hasEnteredBank = false;
    this.aadharUploaded = false;
    this.passbookUploaded = false;
    this.registrationConfirmed = false;
    this.confirmedEmployee = null;
    this.previewData = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.departmentsList = [];
    
    this.basic = {
      firstName: '',
      lastName: '',
      aadhaarNumber: '',
      phoneNumber: '',
      address: '',
      city: '',
      state: '',
      district: '',
      pincode: '',
      panNumber: '',
      bloodGroup: '',
      maritalStatus: 'Single',
      salaryPerMonth: 0,
      referral: '',
      email: '',
      designation: '',
      dateOfBirth: null as string | null,
      gender: 'Male',
      nationality: 'Indian',
      profilePicture: null as string | null
    };

    this.bank = {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      phoneNumber: '',
      upiId: ''
    };

    this.extra = {
      dob: '',
      gender: 'Male',
      nationality: 'Indian'
    };
  }
}
