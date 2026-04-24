import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TrafficService } from '../../services/traffic.service';
import { Traffic } from '../../models';
import { WeatherService, WeatherData } from '../../services/weather.service';
import { formatDateLabel } from '../../utils/date-metrics';

@Component({
  selector: 'app-traffic',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <section class="traffic-shell">
      <header class="traffic-hero">
        <div>
          <p class="eyebrow">Traffic</p>
          <h1>Sousse Traffic Control</h1>
          <p>Realtime traffic overview with Google Maps and color-coded route alerts.</p>
        </div>
        <div class="hero-meta">
          <div>
            <span>Dernière mise à jour</span>
            <strong>{{ today }}</strong>
          </div>
          <div class="status-pill">Actif</div>
        </div>
      </header>

      <div class="quick-stats">
        <article class="stat-card">
          <span>Monitored routes</span>
          <strong>{{ monitoredRoutes }}</strong>
        </article>
        <article class="stat-card">
          <span>Average congestion</span>
          <strong>{{ averageLevel }}</strong>
        </article>
        <article class="stat-card">
          <span>High congestion routes</span>
          <strong>{{ highRoutes }}</strong>
        </article>
        <article class="stat-card">
          <span>Active alerts</span>
          <strong>{{ activeAlerts }}</strong>
        </article>
      </div>

      <div class="traffic-form panel">
        <div class="panel-header">
          <h2>{{ isCreating ? 'Ajouter un trafic' : 'Modifier un trafic' }}</h2>
          <span>{{ isCreating ? 'Remplissez le formulaire pour créer une nouvelle route.' : 'Mettez à jour la route sélectionnée.' }}</span>
        </div>

        <form [formGroup]="trafficForm" (ngSubmit)="saveTraffic()">
          <div class="form-row">
            <label>
              Nom de la route
              <input formControlName="location" placeholder="Avenue Habib Bourguiba" />
            </label>
            <label>
              Niveau de trafic
              <select formControlName="level">
                <option value="1">Faible (🟢)</option>
                <option value="2">Faible à moyen</option>
                <option value="3">Moyen (🟠)</option>
                <option value="4">Moyen à élevé</option>
                <option value="5">Élevé (🔴)</option>
                <option value="6">Très élevé</option>
                <option value="7">Critique</option>
                <option value="8">Bloqué</option>
                <option value="9">Fermé</option>
                <option value="10">Inconnu</option>
              </select>
            </label>
          </div>

          <div *ngIf="trafficForm.touched && trafficForm.invalid" class="error">
            <div *ngIf="trafficForm.get('location')?.hasError('required')">Le nom de la route est requis.</div>
            <div *ngIf="trafficForm.get('level')?.hasError('required')">Le niveau de trafic est requis.</div>
          </div>

          <div class="form-actions">
            <button class="btn add" type="submit" [disabled]="trafficForm.invalid">{{ isCreating ? 'Créer' : 'Enregistrer' }}</button>
            <button class="btn modify" type="button" (click)="startNewTraffic()">Nouveau</button>
            <button class="btn cancel" type="button" *ngIf="!isCreating" (click)="deleteTraffic()" [disabled]="!editingTraffic">Supprimer</button>
          </div>
        </form>
      </div>

      <div class="traffic-layout">
        <section class="panel map-panel">
          <div class="panel-header">
            <h2>Carte trafic live de Sousse</h2>
            <span>Trafic en temps réel</span>
          </div>
          <div class="map-frame">
            <iframe
              class="traffic-map"
              loading="lazy"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
              [src]="trafficMapUrl"
            ></iframe>
          </div>
          <div class="map-help">
            <p class="map-copy">Les lignes colorées sur la carte indiquent l'état réel de circulation à Sousse.</p>
            <div class="legend-strip">
              <div class="legend-pill high"><span></span> Embouteillage / circulation très lente</div>
              <div class="legend-pill moderate"><span></span> Trafic moyen / ralentissements</div>
              <div class="legend-pill low"><span></span> Circulation fluide</div>
              <div class="legend-pill good"><span></span> Trafic normal</div>
            </div>
          </div>
        </section>

        <section class="panel routes-list-panel">
          <div class="panel-header-enhanced">
            <div>
              <h2>Liste des Routes</h2>
              <span>{{ trafficList.length }} route(s)</span>
            </div>
            <div class="filter-controls">
              <div class="search-wrapper">
                <input type="text" placeholder="🔍 Rechercher une route..." class="search-input" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" />
              </div>
              <button class="search-btn" type="button" (click)="searchTraffic()">Recherche</button>
              <button class="reset-btn" *ngIf="searchTerm" (click)="resetSearch()">↺ Réinitialiser</button>
            </div>
            <div class="search-status" *ngIf="searchStatusMessage">
              <span [ngClass]="searchStatusClass">{{ searchStatusMessage }}</span>
            </div>
          </div>
          <div class="traffic-list">
            <div *ngIf="filteredTraffic.length === 0" class="empty-state">
              <p>{{ emptyMessage || 'Aucune route ne correspond à votre recherche' }}</p>
            </div>
            <div class="traffic-item" *ngFor="let traffic of filteredTraffic" (click)="selectTraffic(traffic)" [class.active]="selectedTraffic?.id === traffic.id">
              <div class="traffic-header">
                <div class="traffic-info">
                  <div class="traffic-details">
                    <strong class="traffic-name">{{ traffic.location }}</strong>
                    <div class="traffic-meta">
                      <span class="traffic-level" [ngClass]="getStatusClass(traffic.level)">{{ getLevelText(traffic.level) }}</span>
                    </div>
                  </div>
                </div>
                <div class="traffic-status">
                  <span class="status-chip" [ngClass]="getStatusClass(traffic.level)">
                    {{ getLevelText(traffic.level) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside class="panel summary-panel">
          <div class="panel-header">
            <h2>Traffic Status</h2>
            <span>Route conditions</span>
          </div>
          <div class="route-meta">
            <p>Carte centrée sur : <strong>{{ selectedLocation }}</strong></p>
            <p *ngIf="weather">Météo actuelle : <strong>{{ weather.temperature }}°C</strong> / {{ weather.condition }} / Vent {{ weather.windSpeed }} km/h</p>
          </div>
          <div class="route-table">
            <div class="route-row header-row">
              <span>Location</span>
              <span>Traffic Level</span>
            </div>
            <div class="route-row" *ngFor="let traffic of trafficList" (click)="updateMapLocation(traffic.location)">
              <span>{{ traffic.location }}</span>
              <span>
                <span class="status-chip" [ngClass]="getStatusClass(traffic.level)">
                  {{ getLevelText(traffic.level) }}
                </span>
                <div class="row-actions">
                  <button class="btn edit" (click)="editTraffic(traffic); $event.stopPropagation()">✏️</button>
                  <button class="btn delete" (click)="deleteTrafficDirect(traffic); $event.stopPropagation()">🗑️</button>
                </div>
              </span>
            </div>
          </div>
          <div class="traffic-insight">
            <p>Key corridors are monitored using Google Maps live overlay. The colors above match the map traffic legend for Sousse.</p>
          </div>
        </aside>
      </div>

      <div class="traffic-layout secondary-layout">
        <section class="panel alerts-panel">
          <div class="panel-header">
            <h2>Traffic Alerts</h2>
            <span>Incidents and notices</span>
          </div>
          <div class="alert-list">
            <div class="alert-card" *ngFor="let alert of trafficAlerts">
              <div class="alert-icon">{{ alert.icon }}</div>
              <div>
                <strong>{{ alert.title }}</strong>
                <p>{{ alert.description }}</p>
              </div>
              <span class="alert-badge" [ngClass]="alert.severity">{{ alert.severity }}</span>
            </div>
          </div>
        </section>

        <section class="panel neighborhoods-panel">
          <div class="panel-header">
            <h2>Zone overview</h2>
            <span>Sousse hotspots</span>
          </div>
          <div class="zone-grid">
            <div class="zone-card">
              <h3>Centre-Ville</h3>
              <p>Average congestion is high near the market and city center.</p>
              <strong>Red routes</strong>
            </div>
            <div class="zone-card">
              <h3>Corniche</h3>
              <p>Traffic is moderate along the coastal boulevard.</p>
              <strong>Orange routes</strong>
            </div>
            <div class="zone-card">
              <h3>Sahloul</h3>
              <p>Industrial traffic remains steady with few delays.</p>
              <strong>Yellow routes</strong>
            </div>
          </div>
        </section>
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

    .traffic-shell {
      padding: 2rem;
      max-width: 1280px;
      margin: 0 auto;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 2.5rem;
      border: 1px solid rgba(148, 163, 184, 0.14);
      box-shadow: 0 40px 80px rgba(15, 23, 42, 0.12);
      backdrop-filter: blur(18px);
    }

    .traffic-hero {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.14), rgba(255, 255, 255, 0.96));
      border-radius: 2rem;
      padding: 1.75rem 2rem;
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: 0 28px 60px rgba(15, 23, 42, 0.1);
    }

    .eyebrow {
      margin: 0 0 0.5rem;
      color: #2563eb;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.8rem;
    }

    .traffic-hero h1 {
      margin: 0;
      font-size: clamp(2rem, 2.5vw, 2.5rem);
      line-height: 1.05;
    }

    .traffic-hero p {
      margin: 1rem 0 0;
      color: #475569;
      max-width: 540px;
      font-size: 1rem;
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

    .update-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .update-label {
      font-size: 0.85rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .update-date {
      font-size: 1.5rem;
      color: #0f172a;
      font-weight: 700;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      width: fit-content;
      justify-self: flex-end;
    }

    .status-badge.active {
      background: rgba(34, 197, 94, 0.14);
      color: #16a34a;
    }

    .hero-meta strong {
      color: #0f172a;
      font-size: 1.05rem;
    }

    .status-pill {
      background: #22c55e;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 999px;
      font-size: 0.9rem;
      font-weight: 700;
    }

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
    }

    .quick-stats .stat-card {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .quick-stats .stat-card:hover {
      transform: translateY(-2px);
      border-color: rgba(37, 99, 235, 0.3);
    }

    .stat-card {
      background: #f8fafc;
      border-radius: 1.75rem;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      border: 1px solid rgba(148, 163, 184, 0.14);
    }

    .stat-card span {
      font-size: 0.85rem;
      color: #64748b;
    }

    .stat-card strong {
      font-size: 1.5rem;
      color: #0f172a;
    }

    .traffic-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
      margin-bottom: 2rem;
    }

    .secondary-layout {
      grid-template-columns: 1.5fr 1fr;
      gap: 2.5rem;
      margin-bottom: 2rem;
    }

    .panel {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 2rem;
      padding: 1.75rem;
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      backdrop-filter: blur(12px);
      margin-bottom: 2rem;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .panel-header h2 {
      margin: 0;
      font-size: 1.1rem;
    }

    .panel-header span {
      color: #64748b;
      font-size: 0.9rem;
    }

    .panel-header-enhanced {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .panel-header-enhanced h2 {
      margin: 0;
      font-size: 1.1rem;
    }

    .panel-header-enhanced span {
      color: #64748b;
      font-size: 0.9rem;
    }

    .filter-controls {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .search-input,
    .filter-select {
      padding: 0.65rem 1rem;
      border: 1px solid rgba(148, 163, 184, 0.3);
      border-radius: 0.75rem;
      background: white;
      font-size: 0.9rem;
      color: #0f172a;
      transition: all 0.2s ease;
    }

    .search-input {
      min-width: 200px;
      flex: 1;
    }

    .search-input::placeholder {
      color: #94a3b8;
    }

    .search-wrapper {
      position: relative;
      flex: 1;
    }

    .search-input:focus,
    .filter-select:focus {
      outline: none;
      border-color: rgba(37, 99, 235, 0.5);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      background: #f8fafc;
    }

    .search-btn,
    .reset-btn {
      min-width: 120px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.3);
      background: white;
      color: #0f172a;
      font-size: 0.95rem;
      padding: 0.7rem 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .search-btn:hover,
    .reset-btn:hover {
      background: rgba(37, 99, 235, 0.08);
      border-color: rgba(37, 99, 235, 0.4);
    }

    .search-status {
      margin-top: 0.75rem;
    }

    .search-success {
      color: #166534;
      font-weight: 700;
    }

    .search-error {
      color: #dc2626;
      font-weight: 700;
    }

    .route-meta {
      margin-bottom: 1rem;
      color: #64748b;
      display: grid;
      gap: 0.35rem;
    }

    .route-row {
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
    }

    .route-row:hover {
      background: rgba(37, 99, 235, 0.06);
      transform: translateY(-1px);
    }

    .panel-header span {
      color: #64748b;
      font-size: 0.9rem;
    }

    .map-frame {
      position: relative;
      width: 100%;
      min-height: 420px;
      border-radius: 1.5rem;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.14);
    }

    .traffic-map {
      width: 100%;
      height: 100%;
      min-height: 500px;
    }

    .map-error {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      text-align: center;
      background: rgba(255, 255, 255, 0.92);
      color: #111827;
      font-weight: 700;
      z-index: 1;
    }

    .map-help {
      margin-top: 1.3rem;
      padding: 1.25rem;
      border-radius: 1.5rem;
      background: #f8fafc;
      border: 1px solid rgba(148, 163, 184, 0.16);
    }

    :host-context(body.dark) .map-help,
    :host-context(html.dark) .map-help {
      background: #111827 !important;
      border-color: rgba(71, 85, 105, 0.35) !important;
    }

    .map-copy {
      margin: 0 0 1rem;
      color: #475569;
      line-height: 1.7;
      font-size: 0.95rem;
    }

    :host-context(body.dark) .map-copy,
    :host-context(html.dark) .map-copy {
      color: #e2e8f0 !important;
    }

    .legend-strip {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
      margin-top: 1.25rem;
    }

    .legend-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.9rem 1rem;
      border-radius: 999px;
      font-size: 0.95rem;
      font-weight: 700;
      color: white;
    }

    .legend-pill span {
      width: 0.85rem;
      height: 0.85rem;
      border-radius: 999px;
      display: inline-block;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }

    .legend-pill.high { background: #ef4444; }
    .legend-pill.moderate { background: #f59e0b; }
    .legend-pill.low { background: #22c55e; }
    .legend-pill.good { background: #2563eb; }

    .summary-panel,
    .alerts-panel,
    .neighborhoods-panel {
      display: flex;
      flex-direction: column;
    }

    .route-table {
      display: grid;
      gap: 0.75rem;
    }

    .route-row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      padding: 0.95rem 1rem;
      border-radius: 1.25rem;
      background: #f8fafc;
      color: #0f172a;
      font-size: 0.95rem;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.45rem 0.85rem;
      border-radius: 999px;
      color: white;
      font-weight: 700;
      text-transform: capitalize;
      min-width: 90px;
      text-align: center;
    }

    .status-chip.low { background: #22c55e; }
    .status-chip.moderate { background: #f59e0b; }
    .status-chip.high { background: #ef4444; }

    .alert-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .alert-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 1rem;
      align-items: center;
      padding: 1rem 1.25rem;
      border-radius: 1.5rem;
      background: #f8fafc;
      border: 1px solid rgba(148, 163, 184, 0.15);
    }

    .alert-icon {
      font-size: 1.7rem;
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 1rem;
      background: rgba(37, 99, 235, 0.12);
    }

    .alert-card strong {
      display: block;
      font-size: 1rem;
      margin-bottom: 0.3rem;
    }

    .alert-card p {
      margin: 0;
      color: #475569;
      font-size: 0.92rem;
    }

    .alert-badge {
      text-transform: uppercase;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.55rem 0.8rem;
      border-radius: 999px;
      color: white;
      min-width: 70px;
      text-align: center;
    }

    .alert-badge.low { background: #22c55e; }
    .alert-badge.moderate { background: #f59e0b; }
    .alert-badge.high { background: #ef4444; }

    .traffic-form {
      background: #f8fafc;
      border-radius: 2rem;
      padding: 2rem;
      border: 1px solid rgba(148, 163, 184, 0.16);
      margin-bottom: 2rem;
    }

    .traffic-form .form-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .traffic-form label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      color: #475569;
      font-size: 0.95rem;
      flex: 1;
    }

    .traffic-form input,
    .traffic-form select {
      width: 100%;
      padding: 0.9rem 1rem;
      border-radius: 0.95rem;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: white;
      font-size: 0.95rem;
    }

    .traffic-form .form-actions {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 1.5rem;
    }

    .traffic-form .error {
      color: #b91c1c;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    .row-actions {
      display: flex;
      gap: 0.5rem;
      margin-left: 1rem;
    }

    .btn.edit,
    .btn.delete {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: background 0.2s;
    }

    .btn.edit:hover { background: rgba(37, 99, 235, 0.1); }
    .btn.delete:hover { background: rgba(239, 68, 68, 0.1); }

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

    .zone-grid {
      display: grid;
      gap: 1rem;
    }

    .zone-card {
      background: #f8fafc;
      border-radius: 1.5rem;
      padding: 1.25rem;
      border: 1px solid rgba(148, 163, 184, 0.14);
    }

    .zone-card h3 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
    }

    .zone-card p {
      margin: 0;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 0.75rem;
    }

    .zone-card strong {
      color: #0f172a;
    }

    @media (max-width: 1024px) {
      .traffic-layout,
      .secondary-layout {
        grid-template-columns: 1fr;
      }

      .quick-stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .traffic-form .form-row {
        grid-template-columns: 1fr;
      }

      .traffic-form .form-actions {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .traffic-shell {
        padding: 1rem;
      }

      .traffic-hero {
        flex-direction: column;
        align-items: flex-start;
      }

      .quick-stats {
        grid-template-columns: 1fr;
      }
    }
  `,
  standalone: true,
})
export class TrafficComponent implements OnInit {
  private trafficService = inject(TrafficService);
  private weatherService = inject(WeatherService);
  private sanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder);

  today = formatDateLabel();
  selectedDate = this.formatDateForInput(new Date());
  lastUpdated = 'Live updates';
  trafficData: Traffic[] = [];
  loading = true;
  error = '';
  editingTraffic: Traffic | null = null;
  isCreating = true;
  backendAvailable = true;
  weather: WeatherData | null = null;
  trafficMapUrl: SafeResourceUrl = this.createMapUrl('Sousse Tunisia');
  selectedLocation = 'Sousse Tunisia';
  selectedTraffic: Traffic | null = null;
  searchTerm = '';
  filteredTraffic: Traffic[] = [];
  searchStatusMessage = '';
  searchStatusClass = '';
  searchError = false;
  emptyMessage = '';

  private formatDateForInput(date: Date = new Date()): string {
    return date.toISOString().slice(0, 10);
  }

  trafficForm = this.fb.group({
    location: ['', Validators.required],
    level: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
  });

  defaultTraffic: Traffic[] = [
    { id: 1, location: 'Sousse Centre', level: 8, date: this.selectedDate, created_at: '', updated_at: '' },
    { id: 2, location: 'Avenue Hédi Chaker', level: 7, date: this.selectedDate, created_at: '', updated_at: '' },
    { id: 3, location: 'Boulevard 14 Janvier 2011', level: 5, date: this.selectedDate, created_at: '', updated_at: '' },
    { id: 4, location: 'Corniche de Sousse', level: 3, date: this.selectedDate, created_at: '', updated_at: '' },
    { id: 5, location: 'Kantaoui Roundabout', level: 2, date: this.selectedDate, created_at: '', updated_at: '' },
  ];

  trafficAlerts = [
    { icon: '🚧', title: 'Road construction', description: 'Work on Rue Imam Malik slows traffic.', severity: 'moderate' },
    { icon: '⚠️', title: 'Traffic accident', description: 'Crash near Boulevard 14 Janvier 2011.', severity: 'high' },
    { icon: '📡', title: 'Camera offline', description: 'Live feed at Corniche is currently unavailable.', severity: 'low' },
  ];

  get trafficList(): Traffic[] {
    return this.trafficData.length ? this.trafficData : this.defaultTraffic;
  }

  get monitoredRoutes(): number {
    return this.trafficList.length;
  }

  get averageLevel(): number {
    const total = this.trafficList.reduce((sum, item) => sum + item.level, 0);
    return Math.round(total / this.trafficList.length);
  }

  get highRoutes(): number {
    return this.trafficList.filter((item) => item.level >= 6).length;
  }

  get activeAlerts(): number {
    return this.trafficAlerts.length;
  }

  ngOnInit(): void {
    this.loadTraffic();
    this.initWeather();
  }

  private loadTraffic(): void {
    this.loading = true;
    this.trafficService.getTraffic(this.selectedDate).subscribe({
      next: (data) => {
        this.trafficData = data;
        this.backendAvailable = true;
        this.loading = false;
        this.applyFilters();
      },
      error: () => {
        this.backendAvailable = false;
        this.error = 'Failed to load traffic data';
        this.loading = false;
        this.applyFilters();
      },
    });
  }

  private initWeather(): void {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          this.selectedLocation = `Current location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
          this.trafficMapUrl = this.createMapUrl(this.selectedLocation);
          this.loadWeather(latitude, longitude);
        },
        () => {
          this.selectedLocation = 'Sousse Tunisia';
          this.trafficMapUrl = this.createMapUrl(this.selectedLocation);
          this.loadWeather(35.8287, 10.6367);
        },
        { timeout: 10000 }
      );
    } else {
      this.loadWeather(35.8287, 10.6367);
    }
  }

  private loadWeather(latitude: number, longitude: number): void {
    this.weatherService.getWeather(latitude, longitude).subscribe({
      next: (data) => {
        this.weather = data;
      },
      error: () => {
        this.weather = {
          temperature: 0,
          humidity: 0,
          windSpeed: 0,
          condition: 'Unavailable',
          lastUpdated: 'N/A',
          daily: [],
        };
      },
    });
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  private createMapUrl(location: string): SafeResourceUrl {
    const query = encodeURIComponent(location);
    const url = `https://www.google.com/maps?q=${query}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  updateMapLocation(location: string): void {
    this.selectedLocation = location;
    this.trafficMapUrl = this.createMapUrl(location);
  }

  selectTraffic(traffic: Traffic): void {
    this.selectedTraffic = traffic;
    if (traffic.date) {
      this.selectedDate = traffic.date.slice(0, 10);
    }
  }

  applyFilters(): void {
    const query = this.searchTerm.trim().toLowerCase();
    this.filteredTraffic = this.trafficList.filter((item) => item.location.toLowerCase().includes(query));

    if (!query) {
      this.searchStatusMessage = '';
      this.searchStatusClass = '';
      this.searchError = false;
      this.emptyMessage = '';
      return;
    }

    if (this.filteredTraffic.length === 0) {
      this.searchStatusMessage = 'Aucune route ne correspond à votre recherche';
      this.searchStatusClass = 'error';
      this.searchError = true;
      this.emptyMessage = 'Aucune route ne correspond à votre recherche';
    } else {
      this.searchStatusMessage = `${this.filteredTraffic.length} route${this.filteredTraffic.length > 1 ? 's' : ''} trouvée${this.filteredTraffic.length > 1 ? 's' : ''}`;
      this.searchStatusClass = 'success';
      this.searchError = false;
      this.emptyMessage = '';
    }
  }

  searchTraffic(): void {
    this.applyFilters();

    if (!this.searchTerm.trim()) {
      this.searchStatusMessage = 'Saisissez le nom d\'une route pour lancer la recherche';
      this.searchStatusClass = 'info';
      this.searchError = false;
      return;
    }
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
    this.searchStatusMessage = '';
    this.searchStatusClass = '';
    this.searchError = false;
    this.emptyMessage = '';
  }

  getLevelText(level: number): string {
    if (level < 3) return 'Low';
    if (level < 6) return 'Moderate';
    return 'High';
  }

  getStatusClass(level: number): string {
    return this.getLevelText(level).toLowerCase();
  }

  startNewTraffic(): void {
    this.editingTraffic = null;
    this.isCreating = true;
    this.trafficForm.reset({
      location: '',
      level: 1,
    });
  }

  onTrafficDateChange(newDate: string): void {
    this.selectedDate = newDate;
    this.loadTraffic();
  }

  editTraffic(traffic: Traffic): void {
    this.editingTraffic = traffic;
    this.isCreating = false;
    this.trafficForm.patchValue({
      location: traffic.location,
      level: traffic.level,
    });
  }

  saveTraffic(): void {
    if (this.trafficForm.invalid) {
      this.trafficForm.markAllAsTouched();
      return;
    }

    const payload = {
      location: this.trafficForm.value.location ?? '',
      level: Number(this.trafficForm.value.level ?? 1),
      date: this.selectedDate,
    };

    if (this.isCreating) {
      this.trafficService.createTraffic(payload).subscribe({
        next: () => {
          this.loadTraffic();
          this.startNewTraffic();
        },
        error: () => {
          this.error = 'Failed to create traffic';
        },
      });
    } else if (this.editingTraffic) {
      this.trafficService.updateTraffic(this.editingTraffic.id, payload).subscribe({
        next: () => {
          this.loadTraffic();
        },
        error: () => {
          this.error = 'Failed to update traffic';
        },
      });
    }
  }

  deleteTraffic(): void {
    if (!this.editingTraffic) return;

    this.trafficService.deleteTraffic(this.editingTraffic.id).subscribe({
      next: () => {
        this.loadTraffic();
        this.startNewTraffic();
      },
      error: () => {
        this.error = 'Failed to delete traffic';
      },
    });
  }

  deleteTrafficDirect(traffic: Traffic): void {
    this.trafficService.deleteTraffic(traffic.id).subscribe({
      next: () => {
        this.loadTraffic();
      },
      error: () => {
        this.error = 'Failed to delete traffic';
      },
    });
  }
}
