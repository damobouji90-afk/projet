import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Traffic } from '../models';

export interface CreateTrafficPayload {
  location: string;
  level: number;
}

@Injectable({ providedIn: 'root' })
export class TrafficService {
  constructor(private readonly api: ApiService) {}

  getTraffic(date?: string): Observable<Traffic[]> {
    const path = date ? `traffic?date=${date}` : 'traffic';
    return this.api.get<Traffic[]>(path, true);
  }

  createTraffic(payload: CreateTrafficPayload): Observable<Traffic> {
    return this.api.post<Traffic>('traffic', payload, true);
  }

  updateTraffic(id: number, payload: CreateTrafficPayload): Observable<Traffic> {
    return this.api.put<Traffic>(`traffic/${id}`, payload, true);
  }

  deleteTraffic(id: number): Observable<void> {
    return this.api.delete<void>(`traffic/${id}`, true);
  }
}
