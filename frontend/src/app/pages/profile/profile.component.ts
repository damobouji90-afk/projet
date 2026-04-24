import { Component, OnInit, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="profile-page">
      <ng-container *ngIf="user; else loadingTemplate">
        <div class="profile-grid">
          <div class="profile-overview card">
            <div class="profile-hero">
              <div class="avatar-block" [class.empty]="!avatarUrl">
                <img *ngIf="avatarUrl" [src]="avatarUrl" alt="Avatar utilisateur" />
                <span *ngIf="!avatarUrl">{{ user.name.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="hero-meta">
                <h1>{{ user.name }}</h1>
                <p class="hero-email">{{ user.email }}</p>
                <p class="hero-copy">Personnalisez votre profil, mettez à jour vos informations et gérez votre image de compte.</p>
              </div>
            </div>

            <div class="photo-actions">
              <label class="upload-button">
                + Changer la photo
                <input type="file" accept="image/*" (change)="onPhotoSelected($event)" />
              </label>
              <button type="button" class="secondary-button" (click)="removePhoto()" [disabled]="!avatarUrl">Supprimer la photo</button>
            </div>

            <div class="profile-stats">
              <div class="stat-card">
                <span class="stat-label">Membre depuis</span>
                <span class="stat-value">{{ user.created_at ? (user.created_at | date:'dd/MM/yyyy') : '—' }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Email vérifié</span>
                <span class="stat-value">{{ user.email_verified_at ? 'Oui' : 'Non' }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Dernière connexion</span>
                <span class="stat-value">{{ getLastLogin() }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Statut</span>
                <span class="stat-value">Actif</span>
              </div>
            </div>
          </div>

          <div class="profile-form-card card">
            <div class="card-header">
              <div>
                <p class="section-label">Informations du compte</p>
                <h2>Paramètres du profil</h2>
              </div>
              <span class="status-chip">Actif</span>
            </div>

            <form (ngSubmit)="saveProfile()" class="profile-form">
              <div class="form-group">
                <label for="name">Prénom</label>
                <input id="name" name="name" type="text" [(ngModel)]="user.name" required />
              </div>

              <div class="form-group">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" [(ngModel)]="user.email" required />
              </div>

              <div class="form-group">
                <label for="password">Nouveau mot de passe</label>
                <input id="password" name="password" type="password" [(ngModel)]="password" placeholder="Laisser vide pour conserver le mot de passe actuel" />
              </div>

              <div class="form-actions">
                <button type="submit" class="submit-button">Enregistrer</button>
              </div>

              <p *ngIf="message" class="success-message">{{ message }}</p>
              <p *ngIf="error" class="error-message">{{ error }}</p>
            </form>
          </div>
        </div>
      </ng-container>

      <ng-template #loadingTemplate>
        <div class="loading-card card">
          <p *ngIf="error" class="error-message">{{ error }}</p>
          <div *ngIf="!error" class="loading-message">Chargement du profil…</div>
        </div>
      </ng-template>
    </section>
  `,
  styles: [
    `:host {
      display: block;
      min-height: 100vh;
      padding: 2rem 1rem;
      background: linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%);
      background-image: url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      color: #0f172a;
    }

    .profile-page {
      max-width: 1120px;
      margin: 0 auto;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 1.3fr 0.9fr;
      gap: 2rem;
      justify-items: stretch;
      align-items: start;
    }

    .profile-overview,
    .profile-form-card {
      justify-self: stretch;
    }

    .card {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 2rem;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
      padding: 2rem;
      backdrop-filter: blur(12px);
    }

    .profile-hero {
      display: flex;
      gap: 1.75rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .avatar-block {
      width: 150px;
      height: 150px;
      border-radius: 1.75rem;
      background: linear-gradient(180deg, #eff6ff, #dbeafe);
      display: grid;
      place-items: center;
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.04);
      overflow: hidden;
      flex-shrink: 0;
      font-size: 2rem;
      font-weight: 700;
      color: #1d4ed8;
    }

    .avatar-block img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 1.25rem;
    }

    .hero-meta {
      flex: 1;
      min-width: 220px;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.85rem;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .hero-meta h1 {
      margin: 0;
      font-size: 2.1rem;
      line-height: 1.05;
      color: #0f172a;
    }

    .hero-email {
      margin: 0.6rem 0 1rem;
      color: #64748b;
      font-size: 0.98rem;
    }

    .hero-copy {
      margin: 0;
      color: #475569;
      line-height: 1.7;
      max-width: 620px;
    }

    .photo-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 2rem;
    }

    .upload-button,
    .secondary-button,
    .submit-button {
      border-radius: 1rem;
      font-weight: 700;
      transition: all 0.2s ease;
    }

    .upload-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 3rem;
      padding: 0 1.5rem;
      background: #2563eb;
      color: #fff;
      border: none;
      cursor: pointer;
    }

    .upload-button:hover {
      background: #1d4ed8;
    }

    .upload-button input {
      display: none;
    }

    .secondary-button {
      min-width: 160px;
      padding: 0 1.25rem;
      background: #f8fafc;
      color: #475569;
      border: 1px solid #cbd5e1;
      cursor: pointer;
    }

    .secondary-button:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #94a3b8;
    }

    .secondary-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .profile-stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }

    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 1.25rem;
      padding: 1.25rem 1.5rem;
    }

    .stat-label {
      display: block;
      margin-bottom: 0.5rem;
      color: #64748b;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
    }

    .profile-form-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .section-label {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
    }

    .card-header h2 {
      margin: 0.5rem 0 0;
      font-size: 1.5rem;
      color: #0f172a;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.55rem 1rem;
      border-radius: 999px;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 700;
      font-size: 0.82rem;
    }

    .profile-form {
      display: grid;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      color: #0f172a;
      font-weight: 700;
      font-size: 0.95rem;
    }

    .form-group input {
      width: 100%;
      min-height: 3rem;
      padding: 1rem;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #0f172a;
      font-size: 0.95rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-group input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
      background: #fff;
    }

    .form-actions {
      display: flex;
      justify-content: flex-start;
    }

    .submit-button {
      min-width: 170px;
      height: 3rem;
      background: #2563eb;
      color: #fff;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 1.5rem;
      font-size: 1rem;
    }

    .submit-button:hover {
      background: #1d4ed8;
    }

    .success-message,
    .error-message {
      border-radius: 1rem;
      padding: 1rem 1.25rem;
      font-weight: 700;
      margin: 0;
    }

    .success-message {
      color: #166534;
      background: #ecfdf5;
      border: 1px solid #bbf7d0;
    }

    .error-message {
      color: #991b1b;
      background: #fee2e2;
      border: 1px solid #fecaca;
    }

    .loading-card {
      max-width: 560px;
      margin: 0 auto;
      text-align: center;
      padding: 2rem;
    }

    .loading-message {
      color: #475569;
      font-size: 1rem;
      font-weight: 600;
    }

    @media (max-width: 900px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }

      .profile-hero {
        flex-direction: column;
        align-items: flex-start;
      }

      .profile-stats {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      :host {
        padding: 1rem 0.75rem;
      }

      .card {
        padding: 1.5rem;
      }

      .photo-actions {
        flex-direction: column;
      }

      .upload-button,
      .secondary-button,
      .submit-button {
        width: 100%;
      }
    }
    `
  ]
})
export class ProfileComponent implements OnInit {
  protected user: User = {
    id: 1,
    name: 'Utilisateur Test',
    email: 'test@example.com',
    email_verified_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: null
  };
  protected password = '';
  protected message = '';
  protected error = '';
  protected avatarUrl: string | null = null;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  ngOnInit(): void {
    this.loadAvatar();
    this.loadUserData();
  }

  private loadUserData(): void {
    this.authService.fetchUser()
      .pipe(
        timeout(5000),
        catchError((err) => {
          console.error('Error loading user:', err);
          return of(this.user);
        })
      )
      .subscribe((user) => {
        this.user = user;
        console.log('User loaded:', user);
      });
  }

  private getDefaultUser(): User {
    return {
      id: 1,
      name: 'Utilisateur Test',
      email: 'test@example.com',
      email_verified_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null
    };
  }

  private loadAvatar(): void {
    this.avatarUrl = this.authService.getUserAvatar();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.ngZone.run(() => {
        this.avatarUrl = reader.result as string;
        this.authService.setUserAvatar(this.avatarUrl);
      });
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.avatarUrl = null;
    this.authService.removeUserAvatar();
  }

  saveProfile(): void {
    if (!this.user) {
      return;
    }

    this.error = '';
    this.message = '';

    const payload = {
      name: this.user.name,
      email: this.user.email,
      password: this.password || undefined
    };

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.password = '';
        this.message = 'Profil mis à jour avec succès.';
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.error = err?.error?.message || 'Impossible de mettre à jour le profil.';
      }
    });
  }

  getLastLogin(): string {
    if (!this.user || !this.user.last_login) {
      return '—';
    }

    const loginDate = new Date(this.user.last_login);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = loginDate.toDateString() === today.toDateString();
    const isYesterday = loginDate.toDateString() === yesterday.toDateString();

    if (isToday) {
      // Format: "Aujourd'hui à HH:MM"
      return `Aujourd'hui à ${loginDate.getHours().toString().padStart(2, '0')}:${loginDate.getMinutes().toString().padStart(2, '0')}`;
    } else if (isYesterday) {
      // Format: "Hier à HH:MM"
      return `Hier à ${loginDate.getHours().toString().padStart(2, '0')}:${loginDate.getMinutes().toString().padStart(2, '0')}`;
    } else {
      // Format: "DD/MM/YYYY HH:MM"
      const day = loginDate.getDate().toString().padStart(2, '0');
      const month = (loginDate.getMonth() + 1).toString().padStart(2, '0');
      const year = loginDate.getFullYear();
      const hours = loginDate.getHours().toString().padStart(2, '0');
      const minutes = loginDate.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} à ${hours}:${minutes}`;
    }
  }
}
