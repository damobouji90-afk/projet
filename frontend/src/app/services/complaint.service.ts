import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Complaint } from '../models';

export interface CreateComplaintPayload {
  image: string;
  description: string;
  location: string;
  category?: 'éclairage' | 'infrastructure' | 'trafic' | 'parking' | 'sensors' | 'déchets';
  problem_type?: string;
  priority?: 'low' | 'medium' | 'high';
}

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private complaintCreatedSubject = new ReplaySubject<void>(1);
  complaintCreated$ = this.complaintCreatedSubject.asObservable();
  private readonly localStorageKey = 'local_complaints';

  constructor(
    private readonly api: ApiService,
    private readonly authService: AuthService
  ) {}

  getComplaints(): Observable<Complaint[]> {
    console.log('ComplaintService: getComplaints called');
    return this.api.get<Complaint[]>('complaints', false).pipe(
      map((data) => this.mergeUniqueComplaints(data, this.getLocalComplaints())),
      catchError((error) => {
        console.warn('ComplaintService: getComplaints fallback to local', error);
        return of(this.getLocalComplaints());
      }),
      tap((data) => console.log('ComplaintService: getComplaints response:', data))
    );
  }

  createComplaint(payload: FormData): Observable<Complaint> {
    return this.api.post<Complaint>('complaints', payload, true).pipe(
      tap((complaint) => {
        if (!this.hasLocalComplaint(complaint.id)) {
          this.addLocalComplaint(complaint);
        }
        this.complaintCreatedSubject.next();
      }),
      catchError((error) => {
        console.warn('ComplaintService: createComplaint fallback to local', error);
        const localComplaint = this.createLocalComplaintFromFormData(payload);
        this.addLocalComplaint(localComplaint);
        this.complaintCreatedSubject.next();
        return of(localComplaint);
      })
    );
  }

  updateComplaint(id: number, payload: Partial<Complaint>): Observable<Complaint> {
    return this.api.put<Complaint>(`complaints/${id}`, payload, true);
  }

  deleteComplaint(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`complaints/${id}`, true);
  }

  private getLocalComplaints(): Complaint[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored) as Complaint[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveLocalComplaints(complaints: Complaint[]): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(this.localStorageKey, JSON.stringify(complaints));
  }

  private addLocalComplaint(complaint: Complaint): void {
    const complaints = this.getLocalComplaints();
    complaints.unshift(complaint);
    this.saveLocalComplaints(complaints);
  }

  private hasLocalComplaint(id: number): boolean {
    return this.getLocalComplaints().some((complaint) => complaint.id === id);
  }

  private mergeUniqueComplaints(serverComplaints: Complaint[], localComplaints: Complaint[]): Complaint[] {
    const complaintsMap = new Map<number, Complaint>();
    localComplaints.forEach((complaint) => complaintsMap.set(complaint.id, complaint));
    serverComplaints.forEach((complaint) => complaintsMap.set(complaint.id, complaint));
    return Array.from(complaintsMap.values()).sort((a, b) => b.id - a.id);
  }

  private createLocalComplaintFromFormData(formData: FormData): Complaint {
    const currentUser = this.authService.getCurrentUser();
    const userPhoto = this.authService.getUserAvatar() ?? '';
    const now = new Date();

    return {
      id: Date.now(),
      image: (formData.get('image_preview') as string) || '',
      image_preview: (formData.get('image_preview') as string) || '',
      description: (formData.get('description') as string) || '',
      location: (formData.get('location') as string) || '',
      latitude: Number(formData.get('latitude') ?? 0),
      longitude: Number(formData.get('longitude') ?? 0),
      date: now.toISOString().split('T')[0],
      status: 'pending',
      category: (formData.get('category') as Complaint['category']) || 'infrastructure',
      problem_type: (formData.get('problem_type') as string) || '',
      type_probleme: (formData.get('type_probleme') as string) || '',
      priority: 'medium',
      resolution: undefined,
      user: {
        id: currentUser?.id ?? 0,
        name: currentUser?.name ?? 'Citoyen',
        email: currentUser?.email ?? '',
        photo: userPhoto || undefined,
      }
    };
  }
}
