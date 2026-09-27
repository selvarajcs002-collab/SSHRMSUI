import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { EmployeeRegistrationComponent } from './pages/employee-registration/employee-registration.component';
import { AssignShiftComponent } from './pages/assign-shift/assign-shift.component';
import { AttendanceManagementComponent } from './pages/attendance-management/attendance-management.component';
import { SalaryManagementComponent } from './pages/salary-management/salary-management.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'employee-registration', component: EmployeeRegistrationComponent },
      { path: 'assign-shift', component: AssignShiftComponent },
      { path: 'attendance-management', component: AttendanceManagementComponent },
      { path: 'salary-management', component: SalaryManagementComponent },
      { path: '', redirectTo: 'employee-registration', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
