import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const user = this.authService.getCurrentUser();
    const storedRole = localStorage.getItem('role');
    const role = this.authService.normalizeRole(user?.role || storedRole || '');
    if (!user || !role) {
      this.router.navigate(['/login']);
      return false;
    }

    const path = route.routeConfig?.path || '';
    const allowedRoutesForCitizen = ['report', 'profile'];
    const allowedRoutesForAdmin = ['dashboard', 'parking', 'traffic', 'sensors', 'complaints', 'profile'];
    const isCitizen = role === 'citoyen';
    const isAdmin = role === 'admin';

    if (isCitizen) {
      if (!allowedRoutesForCitizen.includes(path)) {
        this.router.navigate(['/report']);
        return false;
      }
      return true;
    }

    if (isAdmin) {
      if (!allowedRoutesForAdmin.includes(path)) {
        this.router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
