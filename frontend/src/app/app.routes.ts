import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ParkingComponent } from './pages/parking/parking.component';
import { TrafficComponent } from './pages/traffic/traffic.component';
import { SensorsComponent } from './pages/sensors/sensors.component';
import { ComplaintsComponent } from './pages/complaints/complaints.component';
import { ReportComponent } from './pages/report/report.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'report', component: ReportComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'parking', component: ParkingComponent, canActivate: [AuthGuard] },
  { path: 'traffic', component: TrafficComponent, canActivate: [AuthGuard] },
  { path: 'sensors', component: SensorsComponent, canActivate: [AuthGuard] },
  { path: 'complaints', component: ComplaintsComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
];
