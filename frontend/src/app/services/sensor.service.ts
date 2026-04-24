import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Sensor } from '../models';

export interface CreateSensorPayload {
  name: string;
  type: string;
  location: string;
  status?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SensorService {
  constructor(private readonly api: ApiService) {}

  getSensors(): Observable<Sensor[]> {
    return this.api.get<Sensor[]>('sensors', false);
  }

  createSensor(payload: CreateSensorPayload): Observable<Sensor> {
    return this.api.post<Sensor>('sensors', payload, false);
  }

  updateSensor(id: number, payload: CreateSensorPayload): Observable<Sensor> {
    return this.api.put<Sensor>(`sensors/${id}`, payload, false);
  }

  deleteSensor(id: number): Observable<void> {
    return this.api.delete<void>(`sensors/${id}`, false);
  }
}
