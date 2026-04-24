import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Parking } from '../models';

export interface CreateParkingPayload {
  name: string;
  available_places: number;
}

@Injectable({ providedIn: 'root' })
export class ParkingService {
  constructor(private readonly api: ApiService) {}

  getParkings(date?: string): Observable<Parking[]> {
    const path = date ? `parkings?date=${date}` : 'parkings';
    return this.api.get<Parking[]>(path, true);
  }

  createParking(payload: CreateParkingPayload): Observable<Parking> {
    return this.api.post<Parking>('parkings', payload, true);
  }

  updateParking(id: number, payload: Partial<CreateParkingPayload>): Observable<Parking> {
    return this.api.put<Parking>(`parkings/${id}`, payload, true);
  }

  deleteParking(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`parkings/${id}`, true);
  }
}
