import { Component, OnDestroy, OnInit, effect, signal, inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('frontend');
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  protected readonly router = inject(Router);
  protected readonly role = signal('');
  protected readonly userName = signal('Admin');
  protected readonly avatarUrl = signal<string | null>(null);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    effect(() => {
      if (this.authService.authState()) {
        const storedRole = this.normalizeRole(localStorage.getItem('role'));
        if (storedRole) {
          this.role.set(storedRole);
        }
        this.loadUserInfo();
      } else {
        this.role.set('');
      }
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.addEventListener('avatar-change', this.onAvatarChange);
    this.checkAuthAndLoadUser();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('avatar-change', this.onAvatarChange);
    }
  }

  private onAvatarChange = () => {
    if (this.authService.isAuthenticated()) {
      const storedAvatar = this.authService.getUserAvatar();
      this.avatarUrl.set(storedAvatar);
    }
  };

  private normalizeRole(role: string | null): string {
    if (!role) {
      return '';
    }
    const normalized = role.toLowerCase().trim();
    return normalized === 'citizen' ? 'citoyen' : normalized;
  }

  private checkAuthAndLoadUser(): void {
    if (this.authService.isAuthenticated()) {
      this.loadUserInfo();
    }
  }

  private loadUserInfo(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const storedAvatar = this.authService.getUserAvatar();
    if (storedAvatar) {
      this.avatarUrl.set(storedAvatar);
    }
    const storedRole = this.normalizeRole(localStorage.getItem('role'));
    if (storedRole) {
      this.role.set(storedRole);
    }
    this.authService.fetchUser().subscribe({
      next: (user) => {
        if (user?.name) {
          this.userName.set(user.name);
        }
        if (user?.role) {
          this.role.set(this.normalizeRole(user.role));
        }
      },
      error: () => {
        this.userName.set('Admin');
      }
    });
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  logout(): void {
    this.authService.logout();
    this.userName.set('Admin');
    this.avatarUrl.set(null);
    this.router.navigate(['/login']);
  }
}
