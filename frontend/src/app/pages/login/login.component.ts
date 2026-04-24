import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginPayload } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-shell" [ngClass]="{'dark': isDarkMode, 'light': !isDarkMode}">
      <div class="auth-card">
        <div class="logo-shell">
          <span class="logo-icon">🏙️</span>
        </div>
        <h1>Smart City</h1>
        <p class="subtitle">Connectez-vous à votre compte</p>

        <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="auth-form" autocomplete="off">
          <input
            type="text"
            name="fake-username"
            autocomplete="off"
            tabindex="-1"
            aria-hidden="true"
            style="position:absolute;opacity:0;height:0;width:0;border:0;margin:0;padding:0;"
          />
          <input
            type="password"
            name="fake-password"
            autocomplete="off"
            tabindex="-1"
            aria-hidden="true"
            style="position:absolute;opacity:0;height:0;width:0;border:0;margin:0;padding:0;"
          />
          <div class="input-group">
            <input
              id="email"
              name="username"
              type="email"
              formControlName="email"
              placeholder="votre@email.com"
              autocomplete="username"
              required
              [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
            />
            <div class="error-message" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              Email requis
            </div>
          </div>

          <div class="input-group">
            <input
              id="password"
              name="current-password"
              type="password"
              formControlName="password"
              placeholder="Mot de passe"
              autocomplete="current-password"
              required
              [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
            />
            <div class="error-message" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              Mot de passe requis
            </div>
          </div>

          <div class="error-message" *ngIf="errorMessage()">
            {{ errorMessage() }}
          </div>

          <button type="submit" class="primary-button" [disabled]="loginForm.invalid || isLoading()">
            {{ isLoading() ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <p class="switch-link">
          Pas de compte ? <a routerLink="/register">S'inscrire</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-image: url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    :host.dark {
      background-image: url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80');
      background-blend-mode: overlay;
      background-color: rgba(0, 0, 0, 0.3);
    }

    :host.light {
      background-image: url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80');
    }

    .page-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      padding: 1rem;
    }

    .page-shell.dark {
      background: rgba(0, 0, 0, 0.4) !important;
    }

    .page-shell.light {
      background: rgba(255, 255, 255, 0.1) !important;
    }

    .auth-card {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    :host.dark .auth-card {
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    :host.dark h1 {
      color: #ffffff;
    }

    :host.dark .subtitle {
      color: #e5e7eb;
    }

    :host.dark input {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }

    :host.dark input::placeholder {
      color: #9ca3af;
    }

    :host.dark input:focus {
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
    }

    :host.dark .error-message {
      color: #f87171;
    }

    :host.dark .switch-link {
      color: #d1d5db;
    }

    :host.dark .switch-link a {
      color: #60a5fa;
    }

    .logo-shell {
      margin-bottom: 1rem;
    }

    .logo-icon {
      font-size: 3rem;
    }

    h1 {
      color: #1f2937;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #6b7280;
      font-size: 0.95rem;
      margin-bottom: 2rem;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .input-group {
      text-align: left;
    }

    .input-group input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .input-group input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .input-group input.error {
      border-color: #ef4444;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }

    .primary-button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      width: 100%;
    }

    .primary-button:hover:not(:disabled) {
      background: #2563eb;
    }

    .primary-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .switch-link {
      color: #6b7280;
      font-size: 0.9rem;
      margin: 0;
    }

    .switch-link a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
    }

    .switch-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  get isDarkMode(): boolean {
    return this.themeService.darkMode();
  }

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Réinitialiser les champs du formulaire pour éviter l'autocomplete
    this.loginForm.reset();
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const payload: LoginPayload = this.loginForm.value;

      this.authService.login(payload).subscribe({
        next: (response) => {
          const role = response.role;
          const isCitizen = role === 'citoyen' || role === 'citizen';
          if (isCitizen) {
            this.router.navigate(['/report']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Erreur de connexion');
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
