import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modern-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modern-dropdown.component.html',
  styleUrls: ['./modern-dropdown.component.css']
})
export class ModernDropdownComponent {
  @Input() options: string[] = [];
  @Input() value: string = '';
  @Input() placeholder: string = 'Select an option';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectOption(option: string, event: Event) {
    event.stopPropagation();
    this.value = option;
    this.valueChange.emit(this.value);
    this.isOpen = false;
  }
}
