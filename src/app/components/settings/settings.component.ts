import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmsApiService } from '../../services/ems-api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container animate-fade-in">
      <div class="settings-header">
        <h2><i class="fa-solid fa-sliders text-accent"></i> Configuration & Alert Settings</h2>
      </div>

      <div class="settings-grid">
        
        <!-- System Configuration Form -->
        <div class="glass-card config-card">
          <h3>System Settings</h3>
          <p class="subtitle">Modify general configurations for the EMS platform.</p>

          <div *ngIf="isLoading" class="loading-state">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span>Loading settings...</span>
          </div>

          <div *ngIf="!isLoading" class="config-fields">
            <div class="form-group" *ngFor="let s of settings">
              <label>{{ s.description || s.key }}</label>
              <div class="input-with-button">
                <input type="text" [(ngModel)]="s.value" />
                <button (click)="saveSetting(s.key, s.value)" class="btn btn-primary btn-sm">
                  <i class="fa-solid fa-floppy-disk"></i> Save
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Calculated Alert Reminders -->
        <div class="glass-card alert-card">
          <h3>Calculated Shift Reminders</h3>
          <p class="subtitle">Scheduled alerts executing at 9:00 AM and 9:00 PM local time.</p>

          <div class="refresh-indicator">
            <button (click)="loadNotificationSchedules()" class="btn btn-secondary btn-sm">
              <i class="fa-solid fa-rotate"></i> Recalculate
            </button>
          </div>

          <div class="alerts-list">
            <div class="alert-schedule animate-fade-in" *ngFor="let alert of schedules">
              <div class="alert-schedule-header">
                <h4>{{ alert.alertName }}</h4>
                <span class="countdown-badge">
                  <i class="fa-solid fa-hourglass-half"></i> {{ formatCountdown(alert.timeUntilAlertMinutes) }}
                </span>
              </div>
              
              <div class="alert-schedule-details">
                <p class="scheduled-time">
                  <i class="fa-regular fa-clock"></i> Next trigger: <strong>{{ alert.scheduledTime }}</strong>
                </p>
                <div class="msg-box">
                  <i class="fa-solid fa-envelope-open-text"></i>
                  <span>"{{ alert.alertMessage }}"</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      width: 100%;
    }
    .settings-header {
      margin-bottom: 2rem;
    }
    .settings-header h2 {
      font-size: 1.75rem;
      margin-bottom: 0.25rem;
    }
    .settings-header p {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    @media (max-width: 992px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
    }
    .subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 4.5rem 0;
      color: var(--text-secondary);
    }
    .loading-state i {
      font-size: 2.5rem;
    }
    .config-fields {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .input-with-button {
      display: flex;
      gap: 0.75rem;
    }
    .input-with-button input {
      flex: 1;
    }
    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
    }
    .refresh-indicator {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .alert-schedule {
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius-md);
      padding: 1.25rem;
    }
    .alert-schedule-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .alert-schedule-header h4 {
      font-size: 0.95rem;
      color: var(--text-primary);
    }
    .countdown-badge {
      background: rgba(0, 230, 255, 0.1);
      color: var(--color-accent);
      border: 1px solid rgba(0, 230, 255, 0.25);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .alert-schedule-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .scheduled-time {
      font-size: 0.85rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .scheduled-time strong {
      color: var(--text-primary);
    }
    .msg-box {
      background: rgba(255, 255, 255, 0.02);
      border-left: 3px solid var(--color-primary);
      padding: 0.75rem 1rem;
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
      font-size: 0.85rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-style: italic;
    }
    .msg-box i {
      color: var(--color-primary);
      font-size: 1.1rem;
    }
  `]
})
export class SettingsComponent implements OnInit, OnDestroy {
  settings: any[] = [];
  schedules: any[] = [];
  isLoading = false;
  private intervalId: any;

  constructor(private apiService: EmsApiService) {}

  ngOnInit() {
    this.loadSettings();
    this.loadNotificationSchedules();
    
    // Auto-update countdown values every minute
    this.intervalId = setInterval(() => {
      this.loadNotificationSchedules();
    }, 60000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  loadSettings() {
    this.isLoading = true;
    this.apiService.getSettings().subscribe({
      next: (res) => {
        this.settings = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  saveSetting(key: string, value: string) {
    this.apiService.updateSetting({ key, value }).subscribe({
      next: () => {
        alert(`Setting '${key}' updated successfully!`);
        this.loadSettings();
        this.loadNotificationSchedules();
      },
      error: () => {
        alert('Failed to update setting.');
      }
    });
  }

  loadNotificationSchedules() {
    this.apiService.getNotificationSchedules().subscribe({
      next: (res) => {
        this.schedules = res;
      }
    });
  }

  formatCountdown(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours} hrs ${mins} mins left`;
    }
    return `${mins} mins left`;
  }
}
