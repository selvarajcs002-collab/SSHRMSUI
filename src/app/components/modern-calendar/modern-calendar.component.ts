import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modern-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modern-calendar.component.html',
  styleUrls: ['./modern-calendar.component.css']
})
export class ModernCalendarComponent implements OnInit {
  @Input() selectedDate: Date = new Date();
  @Output() dateChange = new EventEmitter<Date>();

  currentMonth: Date = new Date();
  daysInMonth: { date: Date, isCurrentMonth: boolean, isToday: boolean, isSelected: boolean }[] = [];
  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    if (!this.selectedDate) {
      this.selectedDate = new Date();
    }
    this.currentMonth = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
    this.generateCalendar();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleCalendar() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.currentMonth = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
      this.generateCalendar();
    }
  }

  generateCalendar() {
    this.daysInMonth = [];
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    const today = new Date();

    // Previous month days
    for (let x = firstDayIndex; x > 0; x--) {
      const d = new Date(year, month - 1, prevLastDay - x + 1);
      this.daysInMonth.push({
        date: d,
        isCurrentMonth: false,
        isToday: this.isSameDate(d, today),
        isSelected: this.isSameDate(d, this.selectedDate)
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay; i++) {
      const d = new Date(year, month, i);
      this.daysInMonth.push({
        date: d,
        isCurrentMonth: true,
        isToday: this.isSameDate(d, today),
        isSelected: this.isSameDate(d, this.selectedDate)
      });
    }

    // Next month days to complete grid (42 cells total, 6 rows)
    const remainingDays = 42 - this.daysInMonth.length;
    for (let j = 1; j <= remainingDays; j++) {
      const d = new Date(year, month + 1, j);
      this.daysInMonth.push({
        date: d,
        isCurrentMonth: false,
        isToday: this.isSameDate(d, today),
        isSelected: this.isSameDate(d, this.selectedDate)
      });
    }
  }

  isSameDate(d1: Date, d2: Date): boolean {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  prevMonth(event: Event) {
    event.stopPropagation();
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(event: Event) {
    event.stopPropagation();
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  selectDate(day: any, event: Event) {
    event.stopPropagation();
    this.selectedDate = day.date;
    this.dateChange.emit(this.selectedDate);
    this.isOpen = false;
    this.generateCalendar();
  }

  setToday(event: Event) {
    event.stopPropagation();
    this.selectedDate = new Date();
    this.currentMonth = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
    this.dateChange.emit(this.selectedDate);
    this.isOpen = false;
    this.generateCalendar();
  }
}
