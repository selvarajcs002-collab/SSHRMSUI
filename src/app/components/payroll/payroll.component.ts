import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmsApiService } from '../../services/ems-api.service';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx-js-style';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payroll-container animate-fade-in">
      
      <!-- Header -->
        <div class="section-title-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h2>Payroll & Settlements</h2>
          </div>
          <div class="action-buttons-header" style="margin-left: auto;">
            <button (click)="openExportModal()" class="btn btn-export-excel" style="background-color: #10b981; color: white; border: none; padding: 0.6rem 1.2rem; font-weight: 600; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3), 0 2px 4px -1px rgba(16, 185, 129, 0.2); transition: all 0.2s ease;">
              <i class="fa-solid fa-file-excel" style="margin-right: 0.4rem;"></i> Export Paid Rolls
            </button>
          </div>
        </div>

      <!-- Monthly Controls Removed -->

      <!-- Top Statistics Cards -->
      <div class="dashboard-stats-grid">
        <div class="stat-widget-card">
          <div class="stat-icon-wrapper badge-blue">
            <i class="fa-solid fa-users"></i>
          </div>
          <div class="stat-info">
            <span>Total Employees</span>
            <h3>{{ employees.length }}</h3>
            <div class="stat-trend text-muted">Active Staff</div>
          </div>
        </div>
        
        <div class="stat-widget-card">
          <div class="stat-icon-wrapper badge-green">
            <i class="fa-solid fa-money-bill-wave"></i>
          </div>
          <div class="stat-info">
            <span>Total Payroll</span>
            <h3>INR {{ (summary?.totalNetPayable || 0) | number }}</h3>
            <div class="stat-trend text-muted">Aggregate Gross</div>
          </div>
        </div>

        <div class="stat-widget-card">
          <div class="stat-icon-wrapper badge-purple">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div class="stat-info">
            <span>Paid Payouts</span>
            <h3>{{ summary?.paidCount || 0 }}</h3>
            <div class="stat-trend trend-up">
              INR {{ (summary?.totalPaid || 0) | number }} Paid
            </div>
          </div>
        </div>

        <div class="stat-widget-card">
          <div class="stat-icon-wrapper badge-orange">
            <i class="fa-solid fa-circle-exclamation"></i>
          </div>
          <div class="stat-info">
            <span>Unpaid Payouts</span>
            <h3>{{ summary?.unpaidCount || 0 }}</h3>
            <div class="stat-trend trend-down">
              INR {{ (summary?.totalUnpaid || 0) | number }} Awaiting
            </div>
          </div>
        </div>
      </div>

      <!-- Workspace: Employee Payout Grid -->
      <div class="workspace-section mt-4">
        <div *ngIf="isLoading" class="loading-state glass-card py-5">
          <i class="fa-solid fa-circle-notch fa-spin text-accent"></i>
          <span>Loading employee payroll rosters...</span>
        </div>

        <div *ngIf="!isLoading && employees.length === 0" class="empty-state glass-card py-5">
          <i class="fa-solid fa-users-slash"></i>
          <span>No active employees registered.</span>
        </div>

        <div *ngIf="!isLoading && employees.length > 0" class="payroll-grid">
          <div *ngFor="let emp of employees" class="glass-card employee-payroll-card animate-fade-in">
            <div class="card-payout-header">
              <span class="badge" [class]="getPayoutStatusBadgeClass(emp.id)">
                {{ getPayoutStatusLabel(emp.id) }}
              </span>
              <code class="code-lbl-small">{{ emp.employeeCode }}</code>
            </div>

            <div class="card-payout-body">
              <div class="avatar-cell">
                <div class="avatar-circle">
                  <img 
                    *ngIf="emp.profilePicture && emp.profilePicture !== 'undefined' && emp.profilePicture !== 'null'" 
                    [src]="emp.profilePicture" 
                    alt="Profile" 
                    class="avatar-img"
                  />
                  <span *ngIf="!emp.profilePicture || emp.profilePicture === 'undefined' || emp.profilePicture === 'null'">
                    {{ getInitials(emp.fullName) }}
                  </span>
                </div>
                <div class="emp-meta">
                  <span class="emp-name">{{ emp.fullName }}</span>
                  <span class="emp-dept">{{ emp.designation || 'N/A' }}</span>
                </div>
              </div>

              <div class="payout-details-lines mt-3">
                <div class="payout-line">
                  <span class="lbl">Base Salary</span>
                  <span class="val font-semibold">INR {{ emp.salaryPerMonth | number }}</span>
                </div>
                <div class="payout-line" *ngIf="getPayrollRecord(emp.id) as record">
                  <span class="lbl">Net Payable</span>
                  <span class="val text-accent font-bold">INR {{ record.netPayable | number }}</span>
                </div>
              </div>
            </div>

            <div class="card-payout-footer mt-3 pt-2">
              <button (click)="openPayrollModal(emp)" class="btn btn-secondary btn-sm w-full btn-manage">
                <i class="fa-solid fa-gears"></i> Manage Payout
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Payroll Details Modal Dialog -->
      <div *ngIf="showModal" class="modal-overlay">
        <div class="modal-card modal-wide animate-fade-in" style="max-width: 550px;">
          <div class="modal-header py-3 px-4 border-b">
            <h3 style="font-weight: 700; color: #1e293b;">Payroll Details</h3>
            <button (click)="closeModal()" class="btn-close-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="modal-body p-4">
            <!-- Employee Mini Summary -->
            <div class="employee-mini-summary mb-3" style="display: flex; justify-content: space-between; align-items: center; background: none; border-bottom: none; padding-bottom: 0;">
              <div class="avatar-cell" style="gap: 1rem;">
                <div class="avatar-circle">
                  <img 
                    *ngIf="selectedEmployeeForModal.profilePicture && selectedEmployeeForModal.profilePicture !== 'undefined' && selectedEmployeeForModal.profilePicture !== 'null'" 
                    [src]="selectedEmployeeForModal.profilePicture" 
                    alt="Profile" 
                    class="avatar-img"
                  />
                  <span *ngIf="!selectedEmployeeForModal.profilePicture || selectedEmployeeForModal.profilePicture === 'undefined' || selectedEmployeeForModal.profilePicture === 'null'">
                    {{ getInitials(selectedEmployeeForModal.fullName) }}
                  </span>
                </div>
                <div class="emp-meta">
                  <span class="emp-name" style="font-size: 1.1rem;">{{ selectedEmployeeForModal.fullName }}</span>
                  <span class="emp-dept" style="color: #64748b; font-size: 0.85rem;">
                    {{ selectedEmployeeForModal.employeeCode }} • {{ selectedEmployeeForModal.designation || 'N/A' }}
                  </span>
                </div>
              </div>
              <div class="period-badge-lbl" style="text-align: right;">
                <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Month</div>
                <div style="color: #2563eb; font-weight: 700; font-size: 0.95rem;">{{ months[selectedMonth-1].name }} {{ selectedYear }}</div>
              </div>
            </div>

            <!-- Particulars Calculation Table -->
            <div class="particulars-container" style="margin-top: 1.5rem; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <table class="particulars-table" style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <tr>
                    <th style="text-align: left; padding: 0.85rem 1rem; color: #475569; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Particulars</th>
                    <th style="text-align: right; padding: 0.85rem 1rem; color: #475569; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 1rem; color: #334155; font-weight: 600; font-size: 0.9rem;">Per Month Salary</td>
                    <td style="text-align: right; padding: 1rem; color: #334155; font-weight: 600;">{{ selectedEmployeeForModal.salaryPerMonth | number:'1.2-2' }}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 1rem; color: #22c55e; font-weight: 600; font-size: 0.9rem;">Present Days <span style="margin-left: 1rem; color: #22c55e; background: #dcfce7; padding: 0.1rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">{{ modalData.presentDays }}</span></td>
                    <td style="text-align: right; padding: 1rem; color: #22c55e; font-weight: 600;">{{ modalData.presentProportion | number:'1.2-2' }}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 1rem; color: #ef4444; font-weight: 600; font-size: 0.9rem;">Absent Days <span style="margin-left: 1rem; color: #ef4444; background: #fee2e2; padding: 0.1rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">{{ modalData.absentDays }}</span></td>
                    <td style="text-align: right; padding: 1rem; color: #ef4444; font-weight: 600;">-{{ modalData.absentDeduction | number:'1.2-2' }}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 1rem; color: #f59e0b; font-weight: 600; font-size: 0.9rem;">Incentive</td>
                    <td style="text-align: right; padding: 1rem;">
                      <input *ngIf="!modalData.isPaid" type="number" [(ngModel)]="modalData.incentives" (input)="recalculateModalNet()" class="modal-num-input" style="text-align: right; width: 100px; padding: 0.35rem; font-weight: 600; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; transition: border-color 0.2s;" placeholder="0" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#cbd5e1'" />
                      <span *ngIf="modalData.isPaid" style="color: #f59e0b; font-weight: 600;">{{ modalData.incentives | number:'1.2-2' }}</span>
                    </td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 1rem; color: #f59e0b; font-weight: 600; font-size: 0.9rem;">Advance Deduction</td>
                    <td style="text-align: right; padding: 1rem;">
                      <div style="display: flex; align-items: center; justify-content: flex-end;">
                        <span *ngIf="!modalData.isPaid" style="margin-right: 6px; color: #64748b; font-weight: 700;">-</span>
                        <input *ngIf="!modalData.isPaid" type="number" [(ngModel)]="modalData.advances" (input)="recalculateModalNet()" class="modal-num-input" style="text-align: right; width: 100px; padding: 0.35rem; font-weight: 600; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; transition: border-color 0.2s;" placeholder="0" onfocus="this.style.borderColor='#ef4444'" onblur="this.style.borderColor='#cbd5e1'" />
                      </div>
                      <span *ngIf="modalData.isPaid" style="color: #ef4444; font-weight: 600;">-{{ modalData.advances | number:'1.2-2' }}</span>
                    </td>
                  </tr>
                  <tr style="background: #eff6ff;">
                    <td style="padding: 1.25rem 1rem; color: #1d4ed8; font-weight: 800; font-size: 1.05rem;">Total Net Salary</td>
                    <td style="text-align: right; padding: 1.25rem 1rem; color: #1d4ed8; font-weight: 800; font-size: 1.15rem;">₹ {{ modalData.netPayable | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="modal-footer py-3 px-4 border-t justify-between" style="display: flex; align-items: center; justify-content: space-between;">
            <div class="left-actions">
              <button *ngIf="modalData.isPaid" (click)="downloadPayslip()" class="btn btn-outline btn-sm" style="color: #3b82f6; border-color: #bfdbfe;"><i class="fa-solid fa-print"></i> Print</button>
            </div>
            <div class="right-actions" style="display: flex; gap: 0.5rem;">
              <button *ngIf="!modalData.isPaid" (click)="savePayroll(false)" [disabled]="isSaving" class="btn btn-primary btn-sm" style="background: #3b82f6; border-color: #3b82f6; color: white;">
                <i class="fa-solid fa-floppy-disk"></i> Draft
              </button>
              <button *ngIf="!modalData.isPaid" (click)="savePayroll(true)" [disabled]="isSaving" class="btn btn-success btn-sm" style="background: #22c55e; border-color: #22c55e; color: white;">
                <i class="fa-solid fa-circle-check"></i> Completed
              </button>
              <button *ngIf="modalData.isPaid" class="btn btn-success btn-sm" style="background: #22c55e; border-color: #22c55e; color: white;" disabled>
                <i class="fa-solid fa-circle-check"></i> Completed
              </button>
              <button (click)="closeModal()" class="btn btn-secondary btn-sm" style="background: white; border: 1px solid #cbd5e1; color: #475569;">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <div class="modal-overlay animate-fade-in" *ngIf="isExportModalOpen">
      <div class="modal-card modal-wide animate-fade-in" style="max-width: 550px; background: white; border-radius: 8px; padding: 20px;">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
          <h3>Export Payroll Report</h3>
          <button class="icon-btn" (click)="closeExportModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="padding: 20px 0;">
          <div class="form-group">
            <label>From Period (MM/YYYY)</label>
            <input type="text" [(ngModel)]="exportFromPeriod" placeholder="01/2026" class="form-control" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>
          <div class="form-group mt-3" style="margin-top: 15px;">
            <label>To Period (MM/YYYY)</label>
            <input type="text" [(ngModel)]="exportToPeriod" placeholder="12/2026" class="form-control" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>
          <small class="text-muted mt-2 d-block" style="display: block; margin-top: 10px; color: #64748b; font-size: 0.85rem;">Filters the paid payroll records in the system.</small>
        </div>
        <div class="modal-footer" style="display: flex; gap: 1rem; justify-content: flex-end; padding-top: 15px; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-secondary" (click)="closeExportModal()" style="padding: 8px 16px; border: 1px solid #cbd5e1; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button class="btn btn-success" (click)="downloadExcelReport()" style="padding: 8px 16px; border: none; background: #10b981; color: white; border-radius: 4px; cursor: pointer;">
            <i class="fa-solid fa-file-excel"></i> Download
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payroll-container {
      width: 100%;
    }
    .floor-controls {
      background: #ffffff;
    }
    .controls-wrapper {
      display: flex;
      gap: 2.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .control-item {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }
    .period-selectors {
      display: flex;
      gap: 0.5rem;
    }
    .select-small {
      padding: 0.45rem 0.75rem;
      font-size: 0.85rem;
      width: auto;
      background: var(--bg-input);
    }
    .simulate-toggle-lbl {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.825rem;
      cursor: pointer;
      color: var(--text-secondary);
      background: var(--bg-input);
      border: 1.5px solid var(--border-color);
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-md);
      transition: var(--transition);
      user-select: none;
    }
    .simulate-toggle-lbl:hover {
      border-color: var(--border-hover);
    }
    .simulate-toggle-lbl input {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--color-primary);
    }

    /* Payout roster grid */
    .payroll-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    .employee-payroll-card {
      background: #ffffff;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1.25rem;
      transition: var(--transition);
    }
    .card-payout-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .code-lbl-small {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-primary);
      background: var(--color-primary-glow);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-family: monospace;
    }
    .payout-details-lines {
      border-top: 1px dashed var(--border-color);
      padding-top: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }
    .payout-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
    }
    .payout-line .lbl {
      color: var(--text-secondary);
    }
    .payout-line .val {
      color: var(--text-primary);
    }
    .font-semibold {
      font-weight: 600;
    }
    .font-bold {
      font-weight: 700;
    }
    .w-full {
      width: 100%;
    }
    .btn-manage {
      background: transparent;
      border: 1.5px solid var(--border-color);
      color: var(--text-secondary);
    }
    .btn-manage:hover {
      background: var(--color-primary-glow);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    /* Premium Modal Styling */
    .modal-card {
      background: #ffffff;
      width: 700px;
      max-width: 95%;
      border-radius: var(--radius-lg);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-color);
    }
    .modal-header {
      background: #f8fafc;
      padding: 1rem 1.5rem;
      border-top-left-radius: var(--radius-lg);
      border-top-right-radius: var(--radius-lg);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0;
    }
    .btn-close-modal {
      border: none;
      background: transparent;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--text-secondary);
      transition: var(--transition);
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .btn-close-modal:hover {
      background: var(--bg-input);
      color: var(--text-primary);
    }
    .employee-mini-summary {
      background: #f1f5f9;
      padding: 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--border-color);
    }
    .emp-meta {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .emp-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .emp-dept {
      font-size: 0.725rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .emp-code {
      font-family: monospace;
      color: var(--color-primary);
      font-weight: 700;
    }

    /* Particulars Table inside Modal */
    .particulars-container {
      width: 100%;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .particulars-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;
    }
    .particulars-table th {
      background: var(--bg-main);
      padding: 0.65rem 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1.5px solid var(--border-color);
    }
    .particulars-table td {
      padding: 0.65rem 0.85rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
      vertical-align: middle;
    }
    .particulars-table tr:hover td {
      background: #f8fafc;
    }
    .text-success-desc {
      color: var(--color-success);
      font-weight: 600;
    }
    .text-success-desc i {
      font-size: 0.8rem;
    }
    .text-danger-desc {
      color: var(--color-error);
      font-weight: 600;
    }
    .text-danger-desc i {
      font-size: 0.8rem;
    }
    .text-success {
      color: var(--color-success);
      font-weight: 700;
    }
    .text-danger {
      color: var(--color-error);
      font-weight: 700;
    }
    .modal-num-input {
      width: 100px;
      padding: 0.3rem 0.5rem;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-sm);
      text-align: right;
      font-size: 0.825rem;
      background: var(--bg-input);
      outline: none;
      transition: var(--transition);
    }
    .modal-num-input:focus {
      border-color: var(--color-primary);
      background: #ffffff;
    }
    .modal-num-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .net-payable-row {
      background: var(--color-primary-glow);
    }
    .net-payable-row td {
      font-size: 0.9rem;
      border-bottom: none;
      color: var(--text-primary);
    }

    /* Modal footer */
    .modal-footer {
      display: flex;
      align-items: center;
      border-top: 1.5px solid var(--border-color);
    }
    .left-actions, .right-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .border-b {
      border-bottom: 1.5px solid var(--border-color);
    }
    .border-t {
      border-top: 1.5px solid var(--border-color);
    }
    .lock-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 5rem 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    .loading-state i {
      font-size: 2rem;
    }
    .empty-state i {
      font-size: 2rem;
      color: var(--text-muted);
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
  `]
})
export class PayrollComponent implements OnInit {
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  
  employees: any[] = [];
  
  isExportModalOpen = false;
  exportFromPeriod: string = '';
  exportToPeriod: string = '';

  payrolls: any[] = [];
  summary: any = null;
  attendanceSummaryMap: { [empId: string]: any } = {};

  isLoading = false;
  isSaving = false;
  isLastWeek = false;

  showModal = false;
  selectedEmployeeForModal: any = null;
  modalData: any = {};

  months = [
    { val: 1, name: 'January' },
    { val: 2, name: 'February' },
    { val: 3, name: 'March' },
    { val: 4, name: 'April' },
    { val: 5, name: 'May' },
    { val: 6, name: 'June' },
    { val: 7, name: 'July' },
    { val: 8, name: 'August' },
    { val: 9, name: 'September' },
    { val: 10, name: 'October' },
    { val: 11, name: 'November' },
    { val: 12, name: 'December' }
  ];

  constructor(private apiService: EmsApiService) {}

  ngOnInit() {
    this.checkIfLastWeek();
    this.loadEmployeesAndPayroll();
  }

  checkIfLastWeek() {
    const today = new Date();
    const day = today.getDate();
    const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    this.isLastWeek = day >= (totalDays - 7);
  }

  onPeriodChange() {
    this.loadEmployeesAndPayroll();
  }

  loadEmployeesAndPayroll() {
    this.isLoading = true;
    
    // 1. Fetch active employees
    this.apiService.getEmployees(1, 1000).subscribe({
      next: (empRes) => {
        this.employees = empRes.items.filter((e: any) => e.status === 'Active');
        
        // 2. Fetch monthly attendance summary for absent calculations
        this.apiService.getMonthlyAttendanceSummary(this.selectedMonth, this.selectedYear).subscribe({
          next: (attRes) => {
            this.attendanceSummaryMap = {};
            attRes.forEach((sum: any) => {
              this.attendanceSummaryMap[sum.employeeId] = sum;
            });

            // 3. Fetch payroll summary stats and individual payrolls
            this.loadPayrollSummaryAndHistory();
          },
          error: () => {
            this.loadPayrollSummaryAndHistory();
          }
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadPayrollSummaryAndHistory() {
    this.apiService.getMonthlyPayrollSummary(this.selectedMonth, this.selectedYear).subscribe({
      next: (sumRes) => {
        this.summary = sumRes;
        
        // Fetch specific records for each employee in parallel
        const promises = this.employees.map(emp => {
          return this.apiService.getEmployeePayrollHistory(emp.id).toPromise().then((history: any) => {
            const match = history?.find((p: any) => p.month === Number(this.selectedMonth) && p.year === Number(this.selectedYear));
            return match;
          }).catch(() => null);
        });

        Promise.all(promises).then((list) => {
          this.payrolls = list.filter(p => p !== null && p !== undefined);
          this.isLoading = false;
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getPayrollRecord(empId: string): any {
    return this.payrolls.find(p => p.employeeId === empId);
  }

  getPayoutStatusLabel(empId: string): string {
    const record = this.getPayrollRecord(empId);
    if (!record) return 'Draft';
    return record.isPaid ? 'Paid' : 'Unpaid';
  }

  getPayoutStatusBadgeClass(empId: string): string {
    const record = this.getPayrollRecord(empId);
    if (!record) return 'badge-blue';
    return record.isPaid ? 'badge-green' : 'badge-orange';
  }

  openPayrollModal(emp: any) {
    this.selectedEmployeeForModal = emp;
    const attSum = this.attendanceSummaryMap[emp.id];
    
    // Present, Absent and Total Days
    const presentDays = attSum ? attSum.presentCount : 30; // default to full month present
    const absentDays = attSum ? attSum.absentCount : 0;
    const totalDays = presentDays + absentDays;
    const daysForDiv = totalDays || 30;

    // Proportions
    const presentProportion = Math.round((emp.salaryPerMonth / daysForDiv) * presentDays);
    const absentDeduction = Math.round((emp.salaryPerMonth / daysForDiv) * absentDays);

    const record = this.getPayrollRecord(emp.id);
    let incentives = 0;
    let allowances = 0;
    let advances = 0;
    let isPaid = false;
    let payrollId = null;
    let paidDate = null;

    if (record) {
      incentives = record.incentives;
      // allowances back-calculated: record stores (allowances - absentDeduction) in DB
      allowances = record.allowances + absentDeduction;
      advances = record.advancePayments;
      isPaid = record.isPaid;
      payrollId = record.id;
      paidDate = record.paidDate;
    }

    this.modalData = {
      presentDays,
      absentDays,
      totalDays,
      presentProportion,
      absentDeduction,
      incentives,
      allowances,
      advances,
      netPayable: 0,
      isPaid,
      payrollId,
      paidDate
    };

    this.recalculateModalNet();
    this.showModal = true;
  }

  recalculateModalNet() {
    const base = this.selectedEmployeeForModal.salaryPerMonth;
    const absent = this.modalData.absentDeduction;
    const inc = this.modalData.incentives || 0;
    const alw = this.modalData.allowances || 0;
    const adv = this.modalData.advances || 0;
    
    this.modalData.netPayable = base - absent + inc + alw - adv;
  }

  closeModal() {
    this.showModal = false;
    this.selectedEmployeeForModal = null;
    this.modalData = {};
  }

  savePayroll(markPaid: boolean) {
    this.isSaving = true;

    // payload adjust allowances to store deduction in DB
    const payload = {
      incentives: this.modalData.incentives || 0,
      allowances: (this.modalData.allowances || 0) - this.modalData.absentDeduction,
      advancePayments: this.modalData.advances || 0
    };

    this.apiService.generatePayroll(
      this.selectedEmployeeForModal.id,
      this.selectedMonth,
      this.selectedYear,
      payload
    ).subscribe({
      next: (newRecord: any) => {
        const payId = newRecord.id;
        
        if (markPaid) {
          this.apiService.markPayrollPaid(payId).subscribe({
            next: () => {
              this.isSaving = false;
              this.modalData.isPaid = true;
              this.modalData.payrollId = payId;
              this.modalData.paidDate = new Date().toISOString();
              alert('Payroll generated and marked as PAID successfully!');
              this.loadEmployeesAndPayroll();
            },
            error: (err) => {
              this.isSaving = false;
              alert(err.error?.message || 'Error marking payroll as paid.');
            }
          });
        } else {
          this.isSaving = false;
          this.showModal = false;
          alert('Payroll generated as draft successfully!');
          this.loadEmployeesAndPayroll();
        }
      },
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Error saving payroll record.');
      }
    });
  }

  downloadPayslip() {
    if (!this.modalData.payrollId) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'cm',
      format: [14, 20]
    });

    const empCode = this.selectedEmployeeForModal.employeeCode;
    const empName = this.selectedEmployeeForModal.fullName;
    const period = `${this.selectedMonth.toString().padStart(2, '0')}/${this.selectedYear}`;
    const today = this.modalData.paidDate ? new Date(this.modalData.paidDate).toLocaleDateString('en-GB') : '';
    
    const baseSalary = (this.selectedEmployeeForModal.salaryPerMonth || 0).toFixed(2);
    const incentives = (this.modalData.incentives || 0).toFixed(2);
    const allowances = (this.modalData.allowances || 0).toFixed(2);
    const advances = (this.modalData.advances || 0).toFixed(2);
    const netPayable = (this.modalData.netPayable || 0).toFixed(2);
    
    const presentDays = this.modalData.presentDays || 0;
    const absentDays = this.modalData.absentDays || 0;

    // Outer Border
    doc.setDrawColor(0);
    doc.setLineWidth(0.02);
    doc.rect(0.5, 0.5, 13, 19);

    // Company Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Shift EMS Manager Workspace", 7, 1.8, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("No. 123, 2nd Floor, Tech Park, Whitefield, Bengaluru - 560066", 7, 2.4, { align: "center" });
    doc.text("GSTIN : 29ABCDE1234F1Z5", 7, 2.8, { align: "center" });

    // First horizontal divider
    doc.setLineWidth(0.04);
    doc.line(1, 3.2, 13, 3.2);

    // PAYSLIP Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PAYSLIP", 7, 3.8, { align: "center" });

    const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const displayMonth = monthNames[this.selectedMonth - 1];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${displayMonth} ${this.selectedYear}`, 7, 4.3, { align: "center" });

    // Second horizontal divider
    doc.line(1, 4.7, 13, 4.7);

    let y = 5.5;
    const labelX = 1.2;
    const colonX1 = 4.5;
    const valueX1 = 5.0;
    const rowSpacing = 0.8;

    doc.setFontSize(9);

    const printRow1 = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, labelX, y);
      doc.setFont("helvetica", "normal");
      doc.text(":", colonX1, y);
      doc.text(value, valueX1, y);
      y += rowSpacing;
    };

    printRow1("Employee Code", empCode);
    printRow1("Employee Name", empName);
    printRow1("Period", period);
    printRow1("Paid Date", today);
    printRow1("Present Days", presentDays.toString());
    printRow1("Absent Days", absentDays.toString());

    // Third horizontal divider
    y += 0.2;
    doc.line(1, y, 13, y);
    y += Math.max(rowSpacing, 1.0);

    const colonX2 = 10.0;
    const valueX2 = 10.5;

    const printRow2 = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, labelX, y);
      doc.setFont("helvetica", "normal");
      doc.text(":", colonX2, y);
      doc.text(`INR ${value}`, valueX2, y);
      y += rowSpacing;
    };

    printRow2("Base Salary", baseSalary);
    printRow2("Incentives", incentives);
    printRow2("Allowances", allowances);
    printRow2("Advances Paid", advances);

    // Fourth horizontal divider
    y += 0.2;
    doc.line(1, y, 13, y);
    y += 0.6;

    // NET PAYABLE Box
    doc.setLineWidth(0.04);
    doc.rect(1.0, y, 12.0, 1.2);
    
    y += 0.8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("NET PAYABLE", labelX + 0.2, y);
    doc.text(":", colonX1 + 0.5, y);
    doc.setFontSize(11);
    doc.text(`INR ${netPayable}`, valueX1 + 0.5, y);
    
    y += 1.2;

    // Status
    // doc.setFontSize(9);
    // doc.setFont("helvetica", "bold");
    // doc.text("Status", labelX, y);
    // doc.setFont("helvetica", "normal");
    // doc.text(":", colonX1, y);
    // doc.text("PAID", valueX1, y);

    // Signatures
    doc.setLineWidth(0.02);
    doc.line(1.5, 18.0, 5.0, 18.0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Receiver Sign", 3.25, 18.5, { align: "center" });

    doc.line(9.0, 18.0, 12.5, 18.0);
    doc.text("Manager Sign", 10.75, 18.5, { align: "center" });

    doc.save(`Payslip_${empCode}_${period.replace('/', '_')}.pdf`);
  }


  openExportModal() {
    const currentPeriodStr = `${this.selectedMonth.toString().padStart(2, '0')}/${this.selectedYear}`;
    this.exportToPeriod = currentPeriodStr;
    this.exportFromPeriod = currentPeriodStr;
    this.isExportModalOpen = true;
  }

  closeExportModal() {
    this.isExportModalOpen = false;
  }

  async downloadExcelReport() {
    this.closeExportModal();
    
    if (!this.exportFromPeriod || !this.exportToPeriod) {
      alert('Please enter both From Period and To Period.');
      return;
    }

    const [fromM, fromY] = this.exportFromPeriod.split('/').map(Number);
    const [toM, toY] = this.exportToPeriod.split('/').map(Number);

    let allPayrolls: any[] = [];
    try {
      allPayrolls = await this.apiService.getPayrollsByRange(fromM, fromY, toM, toY).toPromise();
    } catch (e) {
      console.error(e);
      alert('Failed to fetch payroll data for the selected range.');
      return;
    }

    const paidList = allPayrolls.filter(p => p.isPaid === true);
    if (paidList.length === 0) {
      alert('No paid payrolls to export for this period.');
      return;
    }

    const rows: any[][] = [];
    const setCell = (r: number, c: number, val: any, style: any = {}) => {
      if (!rows[r]) rows[r] = [];
      rows[r][c] = { v: val, t: typeof val === 'number' ? 'n' : 's', s: style };
    };

    let totalBase = 0; let totalInc = 0; let totalAll = 0; let totalAdv = 0;
    let totalPres = 0; let totalAbs = 0; let totalNet = 0;
    
    paidList.forEach(p => {
      const attSum = this.attendanceSummaryMap[p.employeeId];
      p._presentDays = attSum ? attSum.presentCount : 30;
      p._absentDays = attSum ? attSum.absentCount : 0;

      totalBase += (p.baseSalary || 0);
      totalInc += (p.incentives || 0);
      totalAll += (p.allowances || 0);
      totalAdv += (p.advancePayments || 0);
      totalPres += p._presentDays;
      totalAbs += p._absentDays;
      totalNet += (p.netPayable || 0);
    });

    const titleStyle = { font: { bold: true, sz: 16, color: { rgb: "002060" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "385623" } }, bottom: { style: "thin", color: { rgb: "385623" } }, left: { style: "thin", color: { rgb: "385623" } }, right: { style: "thin", color: { rgb: "385623" } } } };
    const subTitleStyle = { font: { bold: true, sz: 11, color: { rgb: "385623" } }, alignment: { horizontal: "center", vertical: "center" } };
    const metaStyle = { font: { bold: true, sz: 9 } };
    const metaValStyle = { font: { sz: 9 } };
    const lineStyle = { top: { style: "thin", color: { rgb: "002060" } } };
    
    const sumHeadStyle = { font: { bold: true, sz: 9, color: { rgb: "385623" } }, fill: { fgColor: { rgb: "E2EFDA" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const sumValStyle = { font: { bold: true, sz: 11 }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };

    const tableTitleStyle = { font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "002060" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const thStyle = { font: { bold: true, sz: 9, color: { rgb: "002060" } }, fill: { fgColor: { rgb: "D9E1F2" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const tdStyle = { font: { sz: 9 }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "A6A6A6" } }, bottom: { style: "thin", color: { rgb: "A6A6A6" } }, left: { style: "thin", color: { rgb: "A6A6A6" } }, right: { style: "thin", color: { rgb: "A6A6A6" } } } };
    const tdLeftStyle = { ...tdStyle, alignment: { horizontal: "left", vertical: "center" } };
    const grandTotalStyle = { font: { bold: true, sz: 9, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "385623" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };

    for (let i = 0; i < 20; i++) rows[i] = [];

    setCell(0, 0, "S.S. EMBROIDERY", titleStyle);
    for(let c=1; c<12; c++) setCell(0, c, "", titleStyle);
    setCell(1, 0, "PAYROLL REPORT (SIZE BASED)", subTitleStyle);
    for(let c=1; c<12; c++) setCell(1, c, "", subTitleStyle);

    const todayStr = new Date().toLocaleString('en-IN');
    setCell(3, 1, "From Period:", metaStyle); setCell(3, 2, this.exportFromPeriod, metaValStyle);
    setCell(3, 8, "Generated On :", metaStyle); setCell(3, 9, todayStr, metaValStyle);
    setCell(4, 1, "To Period  :", metaStyle); setCell(4, 2, this.exportToPeriod, metaValStyle);
    setCell(4, 8, "Generated By :", metaStyle); setCell(4, 9, "Admin", metaValStyle);

    rows[5] = [];
    for(let c=0; c<12; c++) setCell(5, c, "", { border: lineStyle });

    const summaries = [
      { c: 0, title: "TOTAL RECORDS", val: paidList.length },
      { c: 2, title: "BASE SALARY", val: totalBase },
      { c: 4, title: "INCENTIVE", val: totalInc },
      { c: 6, title: "ADVANCE DED.", val: totalAdv },
      { c: 8, title: "PRESENT DAYS", val: totalPres },
      { c: 10, title: "NET PAYABLE", val: totalNet }
    ];

    summaries.forEach(s => {
      setCell(7, s.c, s.title, sumHeadStyle);
      setCell(7, s.c + 1, "", sumHeadStyle);
      setCell(8, s.c, s.val, sumValStyle);
      setCell(8, s.c + 1, "", sumValStyle);
    });

    setCell(10, 0, "PAYROLL DETAILS (PAID WISE)", tableTitleStyle);
    for(let c=1; c<12; c++) setCell(10, c, "", tableTitleStyle);

    const headers = ["S.NO", "EMP CODE", "NAME", "PERIOD", "BASE SALARY", "INCENTIVES", "ALLOWANCES", "ADVANCES", "PRESENT", "ABSENT", "NET PAYABLE", "PAID DATE"];
    headers.forEach((h, c) => setCell(11, c, h, thStyle));

    let r = 12;
    paidList.forEach((p, i) => {
      setCell(r, 0, i + 1, tdStyle);
      setCell(r, 1, p.employeeCode || 'EMP', tdStyle);
      setCell(r, 2, p.employeeName || 'Unknown Employee', tdLeftStyle);
      setCell(r, 3, p.month + '/' + p.year, tdStyle);
      setCell(r, 4, p.baseSalary || 0, tdStyle);
      setCell(r, 5, p.incentives || 0, tdStyle);
      setCell(r, 6, p.allowances || 0, tdStyle);
      setCell(r, 7, p.advancePayments || 0, tdStyle);
      setCell(r, 8, p._presentDays || "-", tdStyle);
      setCell(r, 9, p._absentDays || "-", tdStyle);
      setCell(r, 10, p.netPayable || 0, tdStyle);
      const paidDateStr = p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-GB') : '-';
      setCell(r, 11, paidDateStr, tdStyle);
      r++;
    });

    setCell(r, 0, "GRAND TOTAL", grandTotalStyle);
    for(let c=1; c<4; c++) setCell(r, c, "", grandTotalStyle);
    setCell(r, 4, totalBase, grandTotalStyle);
    setCell(r, 5, totalInc, grandTotalStyle);
    setCell(r, 6, totalAll, grandTotalStyle);
    setCell(r, 7, totalAdv, grandTotalStyle);
    setCell(r, 8, totalPres, grandTotalStyle);
    setCell(r, 9, totalAbs, grandTotalStyle);
    setCell(r, 10, totalNet, grandTotalStyle);
    setCell(r, 11, "", grandTotalStyle);
    r += 2;
    setCell(r, 0, 'Note : "-" Represents zero / not applicable.', { font: { sz: 8, color: { rgb: "0000FF" } } });

    const ws: any = {};
    const range = { s: { c: 0, r: 0 }, e: { c: 11, r: r } };
    for(let R = range.s.r; R <= range.e.r; ++R) {
      for(let C = range.s.c; C <= range.e.c; ++C) {
        const cell = rows[R] && rows[R][C];
        if(!cell) continue;
        const cellRef = XLSX.utils.encode_cell({c:C, r:R});
        ws[cellRef] = cell;
      }
    }
    ws['!ref'] = XLSX.utils.encode_range(range);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
      { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } },
      { s: { r: 7, c: 2 }, e: { r: 7, c: 3 } },
      { s: { r: 7, c: 4 }, e: { r: 7, c: 5 } },
      { s: { r: 7, c: 6 }, e: { r: 7, c: 7 } },
      { s: { r: 7, c: 8 }, e: { r: 7, c: 9 } },
      { s: { r: 7, c: 10 }, e: { r: 7, c: 11 } },
      { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } },
      { s: { r: 8, c: 2 }, e: { r: 8, c: 3 } },
      { s: { r: 8, c: 4 }, e: { r: 8, c: 5 } },
      { s: { r: 8, c: 6 }, e: { r: 8, c: 7 } },
      { s: { r: 8, c: 8 }, e: { r: 8, c: 9 } },
      { s: { r: 8, c: 10 }, e: { r: 8, c: 11 } },
      { s: { r: 10, c: 0 }, e: { r: 10, c: 11 } },
      { s: { r: r - 2, c: 0 }, e: { r: r - 2, c: 3 } }
    ];
    ws['!cols'] = [
      { wch: 6 },  // S.NO
      { wch: 15 }, // EMP CODE
      { wch: 30 }, // NAME
      { wch: 12 }, // PERIOD
      { wch: 15 }, // BASE SALARY
      { wch: 15 }, // INCENTIVES
      { wch: 15 }, // ALLOWANCES
      { wch: 15 }, // ADVANCES
      { wch: 12 }, // PRESENT
      { wch: 12 }, // ABSENT
      { wch: 15 }, // NET PAYABLE
      { wch: 15 }  // PAID DATE
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll Report");
    XLSX.writeFile(wb, `Payroll_Report_${this.exportFromPeriod.replace('/', '-')}_to_${this.exportToPeriod.replace('/', '-')}.xlsx`);
  }

  getInitials(name: string): string {
    if (!name) return 'EE';
    const trimmed = name.trim();
    if (!trimmed) return 'EE';
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  getMockInfo(emp: any): { dept: string, badgeClass: string } {
    const depts = [
      { dept: 'Engineering', badgeClass: 'badge-blue' },
      { dept: 'HR', badgeClass: 'badge-purple' },
      { dept: 'Marketing', badgeClass: 'badge-orange' },
      { dept: 'Finance', badgeClass: 'badge-green' },
      { dept: 'Sales', badgeClass: 'badge-pink' },
      { dept: 'Support', badgeClass: 'badge-yellow' }
    ];
    const hash = emp.id.split('-').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const index = Math.abs(hash) % depts.length;
    return depts[index];
  }
}


