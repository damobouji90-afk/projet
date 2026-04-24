import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  darkMode = signal(false);

  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();
      this.setupThemeEffect();
    }
  }

  private initializeTheme(): void {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('smartcity_theme') : null;
    const isDark = stored === 'dark';
    this.darkMode.set(isDark);
    this.applyTheme();
  }

  private setupThemeEffect(): void {
    effect(() => {
      this.applyTheme();
    });
  }

  toggleDarkMode(): void {
    this.darkMode.update(value => !value);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('smartcity_theme', this.darkMode() ? 'dark' : 'light');
    }
  }

  private applyTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const isDark = this.darkMode();
    const html = document.documentElement;
    const body = document.body;
    
    if (isDark) {
      // Apply dark mode
      html.classList.add('dark');
      html.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      // Apply light mode
      html.classList.remove('dark');
      html.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
    }
    
    console.log('Theme:', isDark ? 'DARK' : 'LIGHT');
  }
}
