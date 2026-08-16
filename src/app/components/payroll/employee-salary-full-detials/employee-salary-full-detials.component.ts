import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-salary-full-detials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-salary-full-detials.component.html',
  styleUrls: ['./employee-salary-full-detials.component.scss']
})
export class EmployeeSalaryFullDetialsComponent {
  @Input() employee: any;
  @Input() modalData: any;
  @Input() monthName: string = '';
  @Input() selectedYear: number = 0;
  @Input() isSaving: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() recalculate = new EventEmitter<void>();
  @Output() saveDraft = new EventEmitter<void>();
  @Output() markCompleted = new EventEmitter<void>();
  @Output() updateCompleted = new EventEmitter<void>();
  @Output() downloadPayslip = new EventEmitter<void>();

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  onRecalculate() {
    this.recalculate.emit();
  }
}
