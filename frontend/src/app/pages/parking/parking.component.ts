import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ParkingService } from '../../services/parking.service';
import { Parking } from '../../models';
import { formatDateLabel } from '../../utils/date-metrics';

type ExtendedParking = Parking & { capacity: number; reserved: number; location: string };

@Component({
  selector: 'app-parking',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <section class="parking-shell">
      <header class="parking-hero">
        <div>
          <p class="eyebrow">Sousse Parkings</p>
          <h1>Parkings détectés sur Google Maps</h1>
          <p>Cette liste reprend les parkings de Sousse identifiés à partir d'une recherche Google Maps pour <strong>parking Sousse</strong>.</p>
        </div>
        <div class="hero-meta">
          <div>
            <span>Dernière mise à jour</span>
            <strong>{{ today }}</strong>
          </div>
          <div class="status-pill">Actif</div>
        </div>
      </header>

      <div class="dashboard-grid">
        <div class="summary-panel panel">
          <div class="summary-header">
            <h2>Statistiques globales</h2>
            <span>Parkings Sousse</span>
          </div>
          <div class="summary-grid">
            <div class="summary-card">
              <span>Total parkings</span>
              <strong>{{ totalParkings }}</strong>
            </div>
            <div class="summary-card">
              <span>Places totales</span>
              <strong>{{ totalCapacity }}</strong>
            </div>
            <div class="summary-card">
              <span>Places disponibles</span>
              <strong>{{ totalAvailable }}</strong>
            </div>
            <div class="summary-card">
              <span>Parkings complets</span>
              <strong>{{ fullParkings }}</strong>
            </div>
          </div>
        </div>

        <div class="map-panel panel">
          <div class="panel-header">
            <h2>Carte Parkings</h2>
            <span>Vue Google Maps - Parkings de Sousse</span>
          </div>
          <div class="map-frame">
            <iframe
              [src]="parkingMapUrl"
              loading="lazy"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div class="map-footer">
            <div>
              <span>Ville</span>
              <strong>{{ parkingCity }}</strong>
            </div>
            <div>
              <span>Requête</span>
              <strong>{{ parkingSearchQuery }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="parking-form panel">
        <div class="summary-header">
          <h2>{{ isCreating ? 'Ajouter un parking' : 'Modifier un parking' }}</h2>
          <span>{{ isCreating ? 'Remplissez le formulaire pour créer un nouveau parking.' : 'Mettez à jour le parking sélectionné.' }}</span>
        </div>

        <form [formGroup]="parkingForm" (ngSubmit)="saveParking()">
          <div class="form-row">
            <label>
              Nom du parking
              <input formControlName="name" placeholder="" />
            </label>
            <label>
              Localisation
              <input formControlName="location" placeholder="" />
            </label>
          </div>

          <div class="form-row">
            <label>
              Capacité totale
              <input type="number" formControlName="capacity" min="1" />
            </label>
            <label>
              Places disponibles
              <input type="number" formControlName="available_places" min="0" />
            </label>
          </div>

          <div *ngIf="parkingForm.touched && parkingForm.invalid" class="error">
            <div *ngIf="parkingForm.get('name')?.hasError('required')">Le nom est requis.</div>
            <div *ngIf="parkingForm.get('location')?.hasError('required')">La localisation est requise.</div>
            <div *ngIf="parkingForm.get('capacity')?.hasError('required') || parkingForm.get('capacity')?.hasError('min')">
              La capacité doit être au moins 1.
            </div>
            <div *ngIf="parkingForm.get('available_places')?.hasError('required') || parkingForm.get('available_places')?.hasError('min')">
              Les places disponibles doivent être au moins 0.
            </div>
            <div *ngIf="parkingForm.hasError('availableGreaterThanCapacity')">
              Les places disponibles ne peuvent pas être supérieures à la capacité.
            </div>
          </div>

          <div class="form-actions">
            <button class="btn add" type="submit" [disabled]="parkingForm.invalid">{{ isCreating ? 'Créer' : 'Enregistrer' }}</button>
            <button class="btn modify" type="button" (click)="startNewParking()">Nouveau</button>
            <button class="btn cancel" type="button" *ngIf="!isCreating" (click)="deleteParking()" [disabled]="!editingParking">Supprimer</button>
          </div>
        </form>
      </div>

      <section class="panel parking-list-panel">
        <div class="panel-header-enhanced">
          <div>
            <h2>Liste des Parkings</h2>
            <span>{{ filteredParkings.length }} parking(s)</span>
          </div>
          <div class="filter-controls">
            <div class="search-wrapper">
              <input type="text" placeholder="🔍 Rechercher un parking..." class="search-input" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" />
            </div>
            <button class="search-btn" type="button" (click)="searchParking()">Recherche</button>
            <button class="reset-btn" *ngIf="searchTerm" (click)="resetSearch()">↺ Réinitialiser</button>
          </div>
          <div class="search-status" *ngIf="searchStatusMessage">
            <span [ngClass]="searchStatusClass">{{ searchStatusMessage }}</span>
          </div>
        </div>
        <div class="parking-list">
          <div *ngIf="filteredParkings.length === 0" class="empty-state">
            <p>{{ emptyMessage || 'Aucun parking ne correspond à votre recherche' }}</p>
          </div>
          <div class="parking-item" *ngFor="let parking of filteredParkings" (click)="selectParking(parking)" [class.active]="selectedParking?.id === parking.id">
            <div class="parking-header">
              <div class="parking-info">
                <div class="parking-details">
                  <strong class="parking-name">{{ parking.name }}</strong>
                  <p class="parking-location">{{ parking.location }}</p>
                  <div class="parking-meta">
                    <span class="parking-capacity">📍 {{ parking.capacity }} places</span>
                    <span class="parking-available">{{ parking.available_places }} libres</span>
                  </div>
                </div>
              </div>
              <div class="parking-status">
                <span class="status-badge" [ngClass]="parking.available_places === 0 ? 'full' : 'open'">
                  {{ parking.available_places === 0 ? 'COMPLET' : 'OUVERT' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background-image: url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .parking-shell {
      padding: 2rem;
      max-width: 1300px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      color: #0f172a;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 2.5rem;
      border: 1px solid rgba(148, 163, 184, 0.14);
      box-shadow: 0 40px 80px rgba(15, 23, 42, 0.12);
      backdrop-filter: blur(18px);
    }

    .parking-hero {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      padding: 2rem;
      border-radius: 1.75rem;
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(255, 255, 255, 0.96));
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: 0 28px 60px rgba(15, 23, 42, 0.1);
    }

    .eyebrow {
      margin: 0 0 0.5rem;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .parking-hero h1 {
      margin: 0;
      font-size: clamp(2rem, 2.5vw, 2.6rem);
      line-height: 1.05;
    }

    .parking-hero p {
      margin: 1rem 0 0;
      max-width: 540px;
      color: #475569;
      line-height: 1.75;
    }

    .hero-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .hero-meta div {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .hero-meta span {
      color: #64748b;
      font-size: 0.9rem;
    }

    .hero-meta strong {
      color: #0f172a;
      font-size: 1.1rem;
    }

    .status-pill {
      background: #22c55e;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 999px;
      font-size: 0.9rem;
      font-weight: 700;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 2.25rem;
      margin-bottom: 2rem;
    }

    .panel {
      background: rgba(255, 255, 255, 0.96);
      border-radius: 1.75rem;
      padding: 1.5rem;
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      backdrop-filter: blur(12px);
      margin-bottom: 2rem;
    }

    .summary-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .summary-header h2 {
      margin: 0;
      font-size: 1.05rem;
    }

    .summary-header span {
      color: #64748b;
      font-size: 0.9rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    .summary-card {
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 1.5rem;
      border: 1px solid rgba(148, 163, 184, 0.14);
    }

    .summary-card span {
      display: block;
      color: #64748b;
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
    }

    .summary-card strong {
      font-size: 1.7rem;
      color: #0f172a;
    }

    .map-frame {
      width: 100%;
      height: 360px;
      border-radius: 1.5rem;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.14);
    }

    .map-frame iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }

    .parking-form {
      background: #f8fafc;
      border-radius: 1.75rem;
      padding: 2rem;
      border: 1px solid rgba(148, 163, 184, 0.16);
      margin-bottom: 2rem;
    }

    .action-panel {
      background: white;
      border-radius: 1.75rem;
      padding: 1.75rem;
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
      margin-bottom: 2rem;
    }

    .action-text {
      margin: 0 0 1.25rem;
      color: #475569;
      line-height: 1.7;
    }

    .parking-layout {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      gap: 3rem;
      margin-bottom: 2.5rem;
    }

    .parking-list {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(148, 163, 184, 0.16);
    }

    .parking-item {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 1.35rem;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .parking-item:hover {
      transform: translateY(-1px);
      border-color: rgba(37, 99, 235, 0.4);
    }

    .parking-item.active {
      border-color: #2563eb;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.12);
    }

    .parking-item h4 {
      margin: 0;
      font-size: 1rem;
    }

    .parking-item .location {
      margin: 0.35rem 0 0;
      font-size: 0.86rem;
    }

    .status-badge {
      padding: 0.5rem 0.9rem;
      border-radius: 999px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      color: white;
    }

    .parking-item .status-badge.open {
      background: #22c55e;
    }

    .parking-item .status-badge.full {
      background: #ef4444;
    }

    .selected-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .selected-card {
      background: #f8fafc;
      border-radius: 1.75rem;
      padding: 1.5rem;
      border: 1px solid rgba(148, 163, 184, 0.16);
    }

    .empty-selection {
      padding: 2rem;
      border-radius: 1.5rem;
      border: 1px dashed rgba(148, 163, 184, 0.5);
      color: #475569;
      background: #f8fafc;
      min-height: 180px;
      display: grid;
      place-content: center;
      text-align: center;
    }

    .legend {
      display: flex;
      gap: 1rem;
      align-items: center;
      color: #475569;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    .legend .dot {
      width: 0.85rem;
      height: 0.85rem;
      border-radius: 999px;
      display: inline-block;
      margin-right: 0.5rem;
    }

    .legend .open { background: #22c55e; }
    .legend .full { background: #ef4444; }

    .parking-card {
      background: #f8fafc;
      border-radius: 1.5rem;
      padding: 1.25rem;
      border: 1px solid rgba(148, 163, 184, 0.14);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1rem;
    }

    .location {
      margin: 0.35rem 0 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .status-badge {
      padding: 0.5rem 0.9rem;
      border-radius: 999px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      color: white;
    }

    .status-badge.open { background: #22c55e; }
    .status-badge.full { background: #ef4444; }

    .parking-info {
      display: grid;
      gap: 0.55rem;
      color: #475569;
      font-size: 0.95rem;
    }

    .parking-info strong {
      color: #0f172a;
    }

    .parking-actions {
      display: grid;
      gap: 0.75rem;
    }

    .btn {
      width: 100%;
      border: none;
      border-radius: 999px;
      padding: 0.95rem 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn.add { background: #2563eb; color: white; }
    .btn.cancel { background: #ef4444; color: white; }
    .btn.modify { background: #f59e0b; color: white; }

    .transfer-card {
      border-top: 1px solid rgba(148, 163, 184, 0.16);
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .transfer-controls {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .transfer-controls label,
    .parking-form label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      color: #475569;
      font-size: 0.95rem;
      flex: 1;
    }

    .transfer-controls select,
    .parking-form input {
      width: 100%;
      padding: 0.9rem 1rem;
      border-radius: 0.95rem;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: white;
      font-size: 0.95rem;
    }

    .action-message {
      margin-top: 1rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 1rem 1.25rem;
      border-radius: 1rem;
      color: #166534;
    }

    .parkings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .small {
      color: #64748b;
      font-size: 0.9rem;
    }

    .parking-form {
      margin-bottom: 1.5rem;
    }

    .parking-form .form-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .parking-form .form-actions {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 1rem;
    }

    .parking-form .error {
      color: #b91c1c;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    .parking-list {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .parking-item {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 1.35rem;
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .parking-item:hover {
      transform: translateY(-2px);
      border-color: rgba(37, 99, 235, 0.4);
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.08);
    }

    .parking-item.active {
      border-color: #2563eb;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.12);
      background: rgba(37, 99, 235, 0.02);
    }

    .parking-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 1rem;
    }

    .parking-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .parking-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .parking-name {
      margin: 0;
      font-size: 1.05rem;
      color: #0f172a;
    }

    .parking-location {
      margin: 0;
      font-size: 0.9rem;
      color: #64748b;
    }

    .parking-meta {
      display: flex;
      gap: 1rem;
      align-items: center;
      font-size: 0.9rem;
      color: #475569;
      margin-top: 0.25rem;
    }

    .parking-capacity,
    .parking-available {
      display: inline-flex;
      gap: 0.35rem;
    }

    .parking-status {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      white-space: nowrap;
    }

    .empty-state {
      padding: 2rem;
      border-radius: 1.5rem;
      border: 1px dashed rgba(148, 163, 184, 0.5);
      color: #475569;
      background: #f8fafc;
      text-align: center;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.95rem;
    }

    .filter-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-wrapper {
      flex: 1;
      min-width: 250px;
      display: flex;
      align-items: center;
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 0.9rem 1rem;
      padding-left: 2.5rem;
      border-radius: 0.95rem;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: white;
      font-size: 0.95rem;
      transition: border-color 0.2s ease;
    }

    .search-input::placeholder {
      color: #cbd5e1;
    }

    .search-input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .search-btn,
    .reset-btn {
      padding: 0.9rem 1.25rem;
      border-radius: 0.95rem;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .search-btn {
      background: #2563eb;
      color: white;
    }

    .search-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }

    .reset-btn {
      background: #e2e8f0;
      color: #475569;
    }

    .reset-btn:hover {
      background: #cbd5e1;
    }

    .search-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      padding: 0.75rem 1rem;
      border-radius: 0.95rem;
      background: #f8fafc;
    }

    .search-success {
      color: #22c55e;
      font-weight: 600;
    }

    .search-error {
      color: #ef4444;
      font-weight: 600;
    }

    .panel-header-enhanced {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(148, 163, 184, 0.16);
    }

    .panel-header-enhanced > div:first-child {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
    }

    .panel-header-enhanced h2 {
      margin: 0;
      font-size: 1.05rem;
    }

    .panel-header-enhanced span {
      color: #64748b;
      font-size: 0.9rem;
    }

    @media (max-width: 1024px) {
      .dashboard-grid,
      .traffic-layout,
      .secondary-layout,
      .action-grid,
      .parking-form .form-row {
        grid-template-columns: 1fr;
      }

      .filter-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .search-wrapper {
        min-width: auto;
      }
    }

    @media (max-width: 640px) {
      .parking-shell {
        padding: 1rem;
      }

      .parking-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .parking-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .parking-status {
        align-self: flex-start;
      }
    }
  `,
  standalone: true,
})
export class ParkingComponent implements OnInit {
  private parkingService = inject(ParkingService);
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  parkings: ExtendedParking[] = [];
  loading = true;
  error = '';
  selectedLocation = 'Centre-Ville';
  parkingCity = 'Sousse, Tunisia';
  parkingMapUrl: SafeResourceUrl = this.createMapUrl(this.parkingCity);
  today = formatDateLabel();
  selectedDate = this.formatDateForInput(new Date());
  actionMessage = '';

  get parkingSearchQuery(): string {
    return `parking ${this.parkingCity}`;
  }
  selectedParking: ExtendedParking | null = null;
  transferSource: ExtendedParking | null = null;
  transferTarget: ExtendedParking | null = null;
  editingParking: ExtendedParking | null = null;
  isCreating = true;
  backendAvailable = true;
  searchTerm = '';
  filteredParkings: ExtendedParking[] = [];
  searchStatusMessage = '';
  searchStatusClass = '';
  emptyMessage = '';

  private availablePlacesValidator = (group: FormGroup) => {
    const capacity = Number(group.get('capacity')?.value ?? 0);
    const available = Number(group.get('available_places')?.value ?? 0);
    return available <= capacity ? null : { availableGreaterThanCapacity: true };
  };

  parkingForm = this.fb.group(
    {
      name: ['', Validators.required],
      location: ['', Validators.required],
      capacity: [1, [Validators.required, Validators.min(1)]],
      available_places: [0, [Validators.required, Validators.min(0)]],
    },
    { validators: [this.availablePlacesValidator] }
  );

  ngOnInit(): void {
    this.loadParkings();
  }

  private loadParkings(): void {
    this.loading = true;
    this.parkingService.getParkings(this.selectedDate).subscribe({
      next: (data) => {
        this.parkings = data.length ? this.buildParkingData(data) : this.buildDefaultParkings();
        this.filteredParkings = [...this.parkings];
        this.selectedParking = this.parkings[0] ?? null;
        this.editingParking = this.selectedParking;
        if (this.selectedParking) {
          this.patchForm(this.selectedParking);
          this.updateMapLocation(this.selectedParking.location);
        }
        this.backendAvailable = true;
        this.loading = false;
      },
      error: () => {
        this.backendAvailable = false;
        this.actionMessage = 'Aucune donnée dynamique. Affichage des parkings Sousse par défaut.';
        this.parkings = this.buildDefaultParkings();
        this.filteredParkings = [...this.parkings];
        this.selectedParking = this.parkings[0] ?? null;
        this.editingParking = this.selectedParking;
        if (this.selectedParking) {
          this.patchForm(this.selectedParking);
          this.updateMapLocation(this.selectedParking.location);
        }
        this.loading = false;
      },
    });
  }

  private buildParkingData(data: Parking[]): ExtendedParking[] {
    return data.map((parking) => ({
      ...parking,
      capacity: parking.capacity ?? parking.available_places,
      available_places: parking.available_places ?? 0,
      reserved: Math.max((parking.capacity ?? 0) - (parking.available_places ?? 0), 0),
      location: parking.location || 'Centre-Ville',
    }));
  }

  private buildDefaultParkings(): ExtendedParking[] {
    const defaults: Array<Parking & { capacity: number; location: string; date: string }> = [
      { id: 1, name: 'Parking Centre Ville', location: 'Centre-Ville', available_places: 30, capacity: 100, date: this.selectedDate, created_at: '', updated_at: '' },
      { id: 2, name: 'Parking Sahloul', location: 'Sahloul District', available_places: 15, capacity: 25, date: this.selectedDate, created_at: '', updated_at: '' },
      { id: 3, name: 'Parking Hamem', location: 'Hamem Sousse', available_places: 12, capacity: 20, date: this.selectedDate, created_at: '', updated_at: '' },
      { id: 4, name: 'Parking Foire Internationale', location: 'Centre-Ville', available_places: 8, capacity: 25, date: this.selectedDate, created_at: '', updated_at: '' },
      { id: 5, name: 'Parking Payant', location: 'Centre-Ville', available_places: 10, capacity: 20, date: this.selectedDate, created_at: '', updated_at: '' },
      { id: 6, name: 'Parking Lot', location: 'Centre-Ville', available_places: 5, capacity: 15, date: this.selectedDate, created_at: '', updated_at: '' },
    ];

    return defaults.map((parking) => ({
      ...parking,
      reserved: parking.capacity - parking.available_places,
    }));
  }

  get totalParkings(): number {
    return this.parkings.length;
  }

  get totalCapacity(): number {
    return this.parkings.reduce((sum, parking) => sum + parking.capacity, 0);
  }

  get totalAvailable(): number {
    return this.parkings.reduce((sum, parking) => sum + parking.available_places, 0);
  }

  get fullParkings(): number {
    return this.parkings.filter((parking) => parking.available_places === 0).length;
  }

  get availableTargets(): ExtendedParking[] {
    return this.parkings.filter((parking) => parking.available_places > 0 && parking !== this.transferSource);
  }

  applyFilters(): void {
    const term = this.searchTerm?.trim().toLowerCase();
    this.filteredParkings = this.parkings.filter((parking) => {
      if (!term) {
        return true;
      }
      return parking.name.toLowerCase().includes(term) || parking.location.toLowerCase().includes(term);
    });
    if (!term) {
      this.searchStatusMessage = '';
      this.searchStatusClass = '';
      this.emptyMessage = '';
      return;
    }
    if (this.filteredParkings.length === 0) {
      this.searchStatusMessage = 'Aucun parking ne correspond à votre recherche.';
      this.searchStatusClass = 'search-error';
      this.emptyMessage = 'Aucun parking ne correspond à votre recherche.';
      return;
    }
    this.searchStatusMessage = `${this.filteredParkings.length} parking(s) trouvé(s)`;
    this.searchStatusClass = 'search-success';
    this.emptyMessage = '';
  }

  searchParking(): void {
    this.applyFilters();
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  selectParking(parking: ExtendedParking): void {
    this.selectedParking = parking;
    this.editingParking = parking;
    this.isCreating = false;
    this.patchForm(parking);
    this.updateMapLocation(parking.location);
    this.actionMessage = `Parking sélectionné : ${parking.name}. Vous pouvez maintenant modifier ou supprimer ce parking.`;
  }

  startNewParking(): void {
    this.selectedParking = null;
    this.editingParking = null;
    this.isCreating = true;
    this.parkingForm.reset({
      name: '',
      location: '',
      capacity: 1,
      available_places: 0,
    });
    this.actionMessage = 'Créez un nouveau parking en remplissant le formulaire ci-dessous.';
  }

  private createLocalParking(payload: { name: string; location: string; capacity: number; available_places: number }): ExtendedParking {
    const nextId = this.parkings.reduce((max, parking) => Math.max(max, parking.id), 0) + 1;
    const timestamp = new Date().toISOString();
    return {
      id: nextId,
      name: payload.name,
      location: payload.location,
      capacity: payload.capacity,
      available_places: payload.available_places,
      date: this.selectedDate,
      reserved: Math.max(payload.capacity - payload.available_places, 0),
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  saveParking(): void {
    if (this.parkingForm.invalid) {
      this.parkingForm.markAllAsTouched();
      this.actionMessage = 'Veuillez corriger les erreurs avant de sauvegarder.';
      return;
    }

    const payload = this.buildPayload();

    const handleCreatedParking = (parking: ExtendedParking, local = false): void => {
      this.parkings.push(parking);
      this.selectedParking = parking;
      this.editingParking = parking;
      this.isCreating = false;
      this.actionMessage = local ? 'Parking créé localement.' : 'Parking créé avec succès.';
      this.startNewParking();
    };

    if (this.isCreating) {
      if (!this.backendAvailable) {
        const localParking = this.createLocalParking(payload);
        handleCreatedParking(localParking, true);
        return;
      }

      this.parkingService.createParking(payload).subscribe({
        next: (data) => {
          const createdParking = this.buildParkingData([data])[0];
          handleCreatedParking(createdParking);
          this.loadParkings();
        },
        error: () => {
          const localParking = this.createLocalParking(payload);
          handleCreatedParking(localParking, true);
        },
      });
      return;
    }

    if (!this.editingParking) {
      this.actionMessage = 'Aucun parking sélectionné pour la modification.';
      return;
    }

    this.parkingService.updateParking(this.editingParking.id, payload).subscribe({
      next: () => {
        this.actionMessage = 'Parking mis à jour avec succès.';
        this.loadParkings();
      },
      error: () => {
        this.actionMessage = 'Impossible de mettre à jour le parking. Vérifiez la connexion.';
      },
    });
  }

  deleteParking(): void {
    if (!this.editingParking) {
      return;
    }

    this.parkingService.deleteParking(this.editingParking.id).subscribe({
      next: () => {
        this.actionMessage = 'Parking supprimé avec succès.';
        this.startNewParking();
        this.loadParkings();
      },
      error: () => {
        this.actionMessage = 'Impossible de supprimer le parking. Vérifiez la connexion.';
      },
    });
  }

  reserveSpot(parking: ExtendedParking): void {
    if (parking.available_places === 0) {
      this.actionMessage = 'Ce parking est complet, vous ne pouvez pas ajouter de voiture.';
      return;
    }

    const nextAvailable = parking.available_places - 1;
    parking.available_places = nextAvailable;
    parking.reserved += 1;

    if (this.backendAvailable) {
      this.parkingService.updateParking(parking.id, { available_places: nextAvailable }).subscribe({
        next: () => {
          this.actionMessage = `Réservation ajoutée pour ${parking.name}.`;
          this.refreshSelected(parking.id);
        },
        error: () => {
          this.actionMessage = 'Réservation ajoutée localement, mais impossible de synchroniser avec le serveur.';
        },
      });
      return;
    }

    this.actionMessage = `Réservation ajoutée pour ${parking.name}.`;
  }

  cancelReservation(parking: ExtendedParking): void {
    if (parking.reserved === 0) {
      this.actionMessage = 'Aucune réservation à annuler pour ce parking.';
      return;
    }

    const nextAvailable = parking.available_places + 1;
    parking.available_places = nextAvailable;
    parking.reserved -= 1;

    if (this.backendAvailable) {
      this.parkingService.updateParking(parking.id, { available_places: nextAvailable }).subscribe({
        next: () => {
          this.actionMessage = `Réservation annulée pour ${parking.name}.`;
          this.refreshSelected(parking.id);
          this.resetTransfer();
        },
        error: () => {
          this.actionMessage = 'Annulation traitée localement, mais impossible de synchroniser avec le serveur.';
        },
      });
      return;
    }

    this.actionMessage = `Réservation annulée pour ${parking.name}.`;
    this.resetTransfer();
  }

  prepareTransfer(parking: ExtendedParking): void {
    this.transferSource = parking;
    this.transferTarget = null;
    this.actionMessage = `Sélectionnez un autre parking pour transférer une réservation depuis ${parking.name}.`;
  }

  selectTarget(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const targetId = Number(target.value);
    this.transferTarget = this.parkings.find((parking) => parking.id === targetId) ?? null;
  }

  transferReservation(): void {
    if (!this.transferSource || !this.transferTarget) {
      this.actionMessage = 'Choisissez un parking de destination avec des places libres.';
      return;
    }
    if (this.transferSource.reserved === 0) {
      this.actionMessage = 'Aucune réservation disponible à transférer.';
      return;
    }
    if (this.transferTarget.available_places === 0) {
      this.actionMessage = 'Le parking de destination est complet.';
      return;
    }

    this.transferSource.reserved -= 1;
    this.transferSource.available_places += 1;
    this.transferTarget.reserved += 1;
    this.transferTarget.available_places -= 1;

    if (this.backendAvailable) {
      this.parkingService.updateParking(this.transferSource.id, { available_places: this.transferSource.available_places }).subscribe({
        next: () => {
          this.parkingService.updateParking(this.transferTarget!.id, { available_places: this.transferTarget!.available_places }).subscribe({
            next: () => {
              this.actionMessage = `Réservation transférée de ${this.transferSource?.name} vers ${this.transferTarget?.name}.`;
              this.refreshSelected(this.transferSource!.id);
              this.resetTransfer();
            },
            error: () => {
              this.actionMessage = 'Transfert effectué localement, mais impossible de synchroniser le parking de destination.';
            },
          });
        },
        error: () => {
          this.actionMessage = 'Transfert effectué localement, mais impossible de synchroniser le parking source.';
        },
      });
      return;
    }

    this.actionMessage = `Réservation transférée de ${this.transferSource.name} vers ${this.transferTarget.name}.`;
    this.resetTransfer();
  }

  resetTransfer(): void {
    this.transferSource = null;
    this.transferTarget = null;
  }

  private refreshSelected(id: number): void {
    const parking = this.parkings.find((item) => item.id === id);
    if (parking) {
      this.selectedParking = parking;
      this.editingParking = parking;
      this.patchForm(parking);
    }
  }

  private patchForm(parking: ExtendedParking): void {
    this.parkingForm.patchValue({
      name: parking.name,
      location: parking.location,
      capacity: parking.capacity,
      available_places: parking.available_places,
    });
  }

  private createMapUrl(location: string): SafeResourceUrl {
    const query = encodeURIComponent(`parking ${location}`);
    const url = `https://www.google.com/maps?q=${query}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  updateMapLocation(location: string): void {
    this.selectedLocation = location;
  }

  onParkingDateChange(newDate: string): void {
    this.selectedDate = newDate;
    this.loadParkings();
  }

  private buildPayload() {
    const value = this.parkingForm.value;
    return {
      name: value.name?.trim() ?? '',
      location: value.location?.trim() ?? '',
      capacity: Number(value.capacity),
      available_places: Number(value.available_places),
      date: this.selectedDate,
    };
  }

  private formatDateForInput(date: Date = new Date()): string {
    return date.toISOString().slice(0, 10);
  }
}
