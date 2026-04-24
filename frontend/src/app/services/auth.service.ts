
import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, throwError, tap, catchError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, User } from '../models';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  authState = signal(false); // Start as false, check token on init
  userRole = signal<string>(''); // Store role as a reactive signal
  private currentUser: User | null = null;

  private readonly defaultUsers = [
    { id: 1, name: 'Adem', email: 'adem@gmail.com', password: '12345', role: 'admin' },
    { id: 2, name: 'Yassmine', email: 'yassmine@gmail.com', password: '12345', role: 'admin' },
    { id: 3, name: 'Citoyen', email: 'citoyen@gmail.com', password: '12345', role: 'citoyen' }
  ];

  private validUsers = [...this.defaultUsers];

  constructor(private readonly api: ApiService) {
    this.checkAuthState();
    this.loadUserFromStorage();
    this.loadValidUsersFromStorage();
  }

  private loadValidUsersFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const stored = localStorage.getItem('valid_users');
    if (!stored) {
      this.saveValidUsersToStorage();
      return;
    }

    try {
      const users = JSON.parse(stored);
      if (!Array.isArray(users)) {
        throw new Error('Stored valid_users is not an array');
      }

      // Fusionner avec les utilisateurs par défaut pour éviter la perte de données
      users.forEach((user: any) => {
        const index = this.validUsers.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.validUsers[index] = {
            ...this.validUsers[index],
            ...user
          };
        }
      });
    } catch (e) {
      console.error('Error loading valid users, resetting defaults:', e);
      this.validUsers = [...this.defaultUsers];
      this.saveValidUsersToStorage();
    }
  }

  private saveValidUsersToStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('valid_users', JSON.stringify(this.validUsers));
    }
  }

  private checkAuthState(): void {
    const token = this.getToken();
    this.authState.set(!!token);
  }

  normalizeRole(role: string | null): string {
    if (!role) {
      return '';
    }

    const normalized = role.toLowerCase().trim();
    if (normalized === 'citizen') {
      return 'citoyen';
    }
    return normalized;
  }

  private loadUserFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('current_user');
      if (stored) {
        try {
          const user = JSON.parse(stored) as User;
          const storedRole = this.normalizeRole(localStorage.getItem('role'));
          if (storedRole) {
            user.role = storedRole;
          }
          this.currentUser = user;
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
    }
  }

  private getStoredUser(): User | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const stored = localStorage.getItem('current_user');
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored) as User;
    } catch (e) {
      console.error('Error parsing stored current_user:', e);
      return null;
    }
  }

  private saveUserToStorage(user: User): void {
    const existingUser = this.getStoredUser();
    const mergedUser = existingUser && existingUser.id === user.id ? { ...existingUser, ...user } : user;

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('current_user', JSON.stringify(mergedUser));
    }
    this.currentUser = mergedUser;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  private mergeUserWithStored(user: User): User {
    const stored = this.getStoredUser();
    if (!stored || stored.id !== user.id) {
      return {
        ...user,
        created_at: user.created_at ?? new Date().toISOString(),
        last_login: user.last_login ?? new Date().toISOString(),
        email_verified_at: user.email_verified_at ?? null
      };
    }

    return {
      ...stored,
      ...user,
      created_at: stored.created_at ?? user.created_at ?? new Date().toISOString(),
      last_login: user.last_login ?? stored.last_login ?? new Date().toISOString(),
      email_verified_at: user.email_verified_at ?? stored.email_verified_at ?? null
    };
  }

  private getAvatarStorageKey(userId: number): string {
    return `smartcity_avatar_${userId}`;
  }

  getUserAvatar(): string | null {
    if (!isPlatformBrowser(this.platformId) || !this.currentUser) {
      return null;
    }

    return localStorage.getItem(this.getAvatarStorageKey(this.currentUser.id))
      ?? localStorage.getItem('smartcity_avatar');
  }

  setUserAvatar(url: string): void {
    if (!isPlatformBrowser(this.platformId) || !this.currentUser) {
      return;
    }

    localStorage.setItem(this.getAvatarStorageKey(this.currentUser.id), url);
    if (this.currentUser) {
      this.currentUser.photo = url;
      this.saveUserToStorage(this.currentUser);
    }
    localStorage.removeItem('smartcity_avatar');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('avatar-change'));
    }
  }

  removeUserAvatar(): void {
    if (!isPlatformBrowser(this.platformId) || !this.currentUser) {
      return;
    }

    localStorage.removeItem(this.getAvatarStorageKey(this.currentUser.id));
    localStorage.removeItem('smartcity_avatar');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('avatar-change'));
    }
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('login', payload).pipe(
      tap((response) => {
        this.saveToken(response.token);
        const normalizedRole = this.normalizeRole(response.role);
        const userWithRole = this.mergeUserWithStored({
          ...response.user,
          role: normalizedRole,
          last_login: new Date().toISOString(),
          created_at: response.user.created_at ?? undefined
        });
        this.saveUserToStorage(userWithRole);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('role', normalizedRole);
        }
        this.authState.set(true);
      }),
      catchError(() => {
        // Fallback to local users if API fails
        const user = this.validUsers.find(u => u.email === payload.email && u.password === payload.password);
        if (user) {
          const normalizedRole = this.normalizeRole(user.role);
          const fallbackUser: User = this.mergeUserWithStored({
            ...(user as User),
            role: normalizedRole,
            last_login: new Date().toISOString(),
            created_at: (user as User).created_at ?? new Date().toISOString()
          });

          const response: AuthResponse = {
            token: 'local-token',
            user: fallbackUser,
            role: user.role
          };
          this.saveToken(response.token);
          this.saveUserToStorage(fallbackUser);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('role', normalizedRole);
          }

          const index = this.validUsers.findIndex(u => u.id === fallbackUser.id);
          if (index !== -1) {
            this.validUsers[index] = { ...this.validUsers[index], ...fallbackUser };
            this.saveValidUsersToStorage();
          }

          this.authState.set(true);
          return of(response);
        } else {
          return throwError(() => ({ error: { message: 'Invalid credentials' } }));
        }
      })
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('register', payload).pipe(
      tap((response) => {
        this.saveToken(response.token);
        this.authState.set(true);
      })
    );
  }

  fetchUser(): Observable<User> {
    if (this.currentUser) {
      return of(this.currentUser);
    }
    return throwError(() => ({ error: { message: 'No user found' } }));
  }

  updateProfile(payload: UpdateProfilePayload): Observable<User> {
    // Mettre à jour l'utilisateur dans la liste des utilisateurs valides
    const userIndex = this.validUsers.findIndex(u => u.email === this.currentUser?.email);
    const updatedUser: User = {
      ...(this.currentUser || this.getDefaultUser()),
      name: payload.name,
      email: payload.email,
      updated_at: new Date().toISOString()
    };

    if (userIndex !== -1) {
      if (payload.password) {
        this.validUsers[userIndex].password = payload.password;
      }
      this.validUsers[userIndex] = {
        ...this.validUsers[userIndex],
        ...updatedUser
      };
      this.saveValidUsersToStorage();
    }

    this.saveUserToStorage(updatedUser);

    // Retourner l'utilisateur mise à jour
    return of(updatedUser);
  }

  private getDefaultUser(): User {
    return {
      id: 0,
      name: '',
      email: '',
      email_verified_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null
    };
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('role');
      localStorage.removeItem('current_user');
    }
    this.currentUser = null;
    this.authState.set(false);
  }

  isAuthenticated(): boolean {
    return this.authState();
  }

  getToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('auth_token') : null;
  }

  private saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('auth_token', token);
    }
  }
}
