import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { SensorService } from '../../services/sensor.service';
import { Sensor } from '../../models';
import { formatDateLabel } from '../../utils/date-metrics';

@Component({
  selector: 'app-sensors',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <section class="sensors-shell">
      <header class="sensors-hero">
        <div>
          <p class="eyebrow">Sousse Smart City Network</p>
          <h1>Gestion des Capteurs</h1>
          <p class="hero-copy">Surveiller et gérer tous les capteurs déployés dans Sousse pour la collecte de données environnementales et de trafic.</p>
        </div>
        <div class="hero-meta">
          <div>
            <span>Dernière mise à jour</span>
            <strong>{{ lastUpdated }}</strong>
          </div>
          <div class="status-pill">Actif</div>
        </div>
      </header>

      <div class="stats-grid">
        <article class="stat-card blue">
          <div class="stat-icon">📡</div>
          <div>
            <p class="stat-label">Capteurs totaux</p>
            <strong>{{ totalSensors }}</strong>
          </div>
        </article>
        <article class="stat-card cyan">
          <div class="stat-icon">✅</div>
          <div>
            <p class="stat-label">Opérationnels</p>
            <strong>{{ operationalSensors }}</strong>
          </div>
        </article>
        <article class="stat-card green">
          <div class="stat-icon">🚫</div>
          <div>
            <p class="stat-label">Inactifs</p>
            <strong>{{ inactiveSensors }}</strong>
          </div>
        </article>
        <article class="stat-card violet">
          <div class="stat-icon">📊</div>
          <div>
            <p class="stat-label">Types</p>
            <strong>{{ sensorTypes }}</strong>
          </div>
        </article>
      </div>

      <div class="sensor-form panel" [class.form-invalid]="sensorForm.touched && sensorForm.invalid">
        <div class="panel-header">
          <h2>{{ isCreating ? 'Ajouter un capteur' : 'Modifier un capteur' }}</h2>
          <span>{{ isCreating ? 'Remplissez le formulaire pour créer un nouveau capteur.' : 'Mettez à jour le capteur sélectionné.' }}</span>
        </div>

        <form [formGroup]="sensorForm" (ngSubmit)="saveSensor()">
          <div class="form-row">
            <label>
              Nom du capteur
              <input formControlName="name" placeholder="" />
            </label>
            <label>
              Type
              <select formControlName="type">
                <option value="trafic">Trafic</option>
                <option value="parking">Parking</option>
                <option value="pollution">Pollution</option>
              </select>
            </label>
          </div>

          <div class="form-row">
            <label>
              Localisation
              <input formControlName="location" placeholder="" />
            </label>
            <label>
              Statut
              <select formControlName="status">
                <option [ngValue]="true">Actif</option>
                <option [ngValue]="false">Inactif</option>
              </select>
            </label>
          </div>

          <div *ngIf="sensorForm.touched && sensorForm.invalid" class="error">
            <div *ngIf="sensorForm.get('name')?.hasError('required')">Le nom est requis.</div>
            <div *ngIf="sensorForm.get('type')?.hasError('required')">Le type est requis.</div>
            <div *ngIf="sensorForm.get('location')?.hasError('required')">La localisation est requise.</div>
          </div>

          <div *ngIf="error" class="error-message">
            <strong>❌ Erreur:</strong> {{ error }}
          </div>

          <div class="form-actions">
            <button class="btn add" type="submit" [disabled]="sensorForm.invalid">
              {{ isCreating ? 'Créer' : 'Enregistrer' }}
            </button>
            <button class="btn modify" type="button" (click)="startNewSensor()">Nouveau</button>
            <button class="btn cancel" type="button" *ngIf="!isCreating" (click)="deleteSensor()" [disabled]="!editingSensor">Supprimer</button>
          </div>
        </form>
      </div>

      <div class="sensors-grid">
        <section class="panel sensor-list-panel">
          <div class="panel-header-enhanced">
            <div>
              <h2>Liste des Capteurs</h2>
              <span>{{ totalSensors }} capteur(s)</span>
            </div>
            <div class="filter-controls">
              <div class="search-wrapper">
                <input type="text" placeholder="🔍 Rechercher un capteur..." class="search-input" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" />
              </div>
              <select class="filter-select" [(ngModel)]="filterType" (ngModelChange)="applyFilters()">
                <option value="">Tous les types</option>
                <option value="trafic">Trafic</option>
                <option value="parking">Parking</option>
                <option value="pollution">Pollution</option>
              </select>
              <button class="search-btn" type="button" (click)="searchSensor()">Recherche</button>
              <button class="reset-btn" *ngIf="searchTerm || filterType" (click)="resetFilters()">↺ Réinitialiser</button>
            </div>
            <div class="search-status" *ngIf="searchStatusMessage">
              <span [ngClass]="searchStatusClass">{{ searchStatusMessage }}</span>
            </div>
          </div>
          <div class="sensor-list">
            <div *ngIf="filteredSensors.length === 0" class="empty-state" [class.empty-error]="searchError">
              <p>{{ emptyMessage || 'Aucun capteur ne correspond à votre recherche' }}</p>
            </div>
            <div class="sensor-item" *ngFor="let sensor of filteredSensors" (click)="selectSensor(sensor)" [class.active]="selectedSensor?.id === sensor.id">
              <div class="sensor-header">
                <div class="sensor-info">
                  <div class="sensor-badge" [ngClass]="sensor.type">{{ getTypeIcon(sensor.type) }}</div>
                  <div class="sensor-details">
                    <strong class="sensor-name">{{ sensor.name }}</strong>
                    <p class="sensor-location">{{ sensor.location }}</p>
                    <div class="sensor-meta">
                      <span class="sensor-type" [ngClass]="'type-' + sensor.type">{{ sensor.type | titlecase }}</span>
                      <span class="sensor-uptime">✓ 99.8% uptime</span>
                    </div>
                  </div>
                </div>
                <div class="sensor-status">
                  <div class="signal-indicator" [ngClass]="sensor.status ? 'strong' : 'weak'">
                    <span class="signal-dot"></span>
                    <span class="signal-text">{{ sensor.status ? 'Actif' : 'Inactif' }}</span>
                  </div>
                </div>
              </div>
              <div class="sensor-footer">
                <div class="sensor-health">
                  <div class="health-bar">
                    <div class="health-fill" [style.width.%]="94"></div>
                  </div>
                  <span class="health-label">Signal 94%</span>
                </div>
                <div class="action-buttons">
                  <button class="btn-icon edit" (click)="editSensor(sensor)" title="Modifier">✏️</button>
                  <button class="btn-icon delete" (click)="deleteSensorDirect(sensor)" title="Supprimer">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="panel sensor-map-panel">
          <div class="panel-header">
            <h2>Carte Google Maps</h2>
            <span>{{ selectedSensor?.location || selectedSensorLocation }}</span>
          </div>
          <div class="map-frame">
            <iframe
              [src]="sensorMapUrl"
              loading="lazy"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div class="map-note">Cliquez sur un capteur dans la liste pour mettre à jour la carte selon sa localisation.</div>
        </section>
      </div>

      <div class="sensors-grid">
        <section class="panel sensor-type-panel">
          <div class="panel-header">
            <h2>Temperature Sensors</h2>
            <span>Environmental</span>
          </div>
          <div class="sensor-list">
            <div class="sensor-item" *ngFor="let sensor of temperatureSensors">
              <div class="sensor-name">
                <div class="sensor-badge">🌡️</div>
                <div>
                  <strong>{{ sensor.title }}</strong>
                  <p>{{ sensor.subtitle }}</p>
                </div>
              </div>
              <div class="sensor-metrics">
                <span class="temp">{{ sensor.value }}</span>
                <span class="status-dot active"></span>
              </div>
            </div>
          </div>
        </section>

        <section class="panel sensor-type-panel">
          <div class="panel-header">
            <h2>Traffic Sensors</h2>
            <span>Road Monitoring</span>
          </div>
          <div class="sensor-list">
            <div class="sensor-item" *ngFor="let sensor of trafficSensors">
              <div class="sensor-name">
                <div class="sensor-badge">🚗</div>
                <div>
                  <strong>{{ sensor.title }}</strong>
                  <p>{{ sensor.subtitle }}</p>
                </div>
              </div>
              <div class="sensor-metrics">
                <span class="traffic-level {{ sensor.level | lowercase }}">{{ sensor.level }}</span>
                <span class="status-dot active"></span>
              </div>
            </div>
          </div>
        </section>

        <section class="panel sensor-type-panel">
          <div class="panel-header">
            <h2>Air Quality Sensors</h2>
            <span>Pollution Monitoring</span>
          </div>
          <div class="sensor-list">
            <div class="sensor-item" *ngFor="let sensor of aqiSensors">
              <div class="sensor-name">
                <div class="sensor-badge">💨</div>
                <div>
                  <strong>{{ sensor.title }}</strong>
                  <p>{{ sensor.subtitle }}</p>
                </div>
              </div>
              <div class="sensor-metrics">
                <span class="aqi-level {{ sensor.level | lowercase }}">{{ sensor.level }}</span>
                <span class="status-dot active"></span>
              </div>
            </div>
          </div>
        </section>

        <section class="panel sensor-status-panel">
          <div class="panel-header">
            <h2>Sensor Status Overview</h2>
            <span>Real-time Status</span>
          </div>
          <div class="status-cards">
            <div class="status-card" *ngFor="let status of sensorStatusCards">
              <div class="status-icon">{{ status.icon }}</div>
              <div>
                <p>{{ status.label }}</p>
                <strong>{{ status.value }}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="sensors-grid secondary-grid">
        <section class="panel trends-panel">
          <div class="panel-header">
            <h2>Sensor Trends - Sousse</h2>
            <span>Last 7 days</span>
          </div>
          <div class="trends-chart">
            <svg class="trend-curve" viewBox="0 0 920 380" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.05"/>
                </linearGradient>
                <linearGradient id="humidityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.05"/>
                </linearGradient>
                <linearGradient id="pollutionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#ef4444" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#ef4444" stop-opacity="0.05"/>
                </linearGradient>
              </defs>
              
              <!-- Y-axis labels -->
              <text x="5" y="35" font-size="11" fill="#64748b" text-anchor="start">High</text>
              <text x="5" y="110" font-size="11" fill="#64748b" text-anchor="start">Mid</text>
              <text x="5" y="185" font-size="11" fill="#64748b" text-anchor="start">Avg</text>
              <text x="5" y="260" font-size="11" fill="#64748b" text-anchor="start">Low</text>
              
              <!-- Grid (Major) -->
              <line x1="80" y1="60" x2="900" y2="60" stroke="#e2e8f0" stroke-width="2"/>
              <line x1="80" y1="135" x2="900" y2="135" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3"/>
              <line x1="80" y1="210" x2="900" y2="210" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3"/>
              <line x1="80" y1="285" x2="900" y2="285" stroke="#e2e8f0" stroke-width="2"/>
              
              <!-- Y-axis -->
              <line x1="80" y1="30" x2="80" y2="310" stroke="#cbd5e1" stroke-width="2"/>
              <!-- X-axis -->
              <line x1="80" y1="310" x2="900" y2="310" stroke="#cbd5e1" stroke-width="2"/>
              
              <!-- Temperature Line -->
              <path d="M 80 220 Q 150 190 220 170 T 360 150 T 500 130 T 640 120 T 780 110 T 900 100"
                    stroke="#f59e0b" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M 80 310 L 80 220 Q 150 190 220 170 T 360 150 T 500 130 T 640 120 T 780 110 T 900 100 L 900 310 Z"
                    fill="url(#tempGradient)"/>
              
              <!-- Humidity Line -->
              <path d="M 80 250 Q 150 220 220 200 T 360 180 T 500 160 T 640 150 T 780 140 T 900 130"
                    stroke="#3b82f6" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M 80 310 L 80 250 Q 150 220 220 200 T 360 180 T 500 160 T 640 150 T 780 140 T 900 130 L 900 310 Z"
                    fill="url(#humidityGradient)"/>
              
              <!-- Pollution Line -->
              <path d="M 80 280 Q 150 250 220 230 T 360 210 T 500 190 T 640 180 T 780 170 T 900 160"
                    stroke="#ef4444" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M 80 310 L 80 280 Q 150 250 220 230 T 360 210 T 500 190 T 640 180 T 780 170 T 900 160 L 900 310 Z"
                    fill="url(#pollutionGradient)"/>
              
              <!-- Temperature Data points with values -->
              <circle cx="80" cy="220" r="5" fill="#f59e0b" stroke="white" stroke-width="2"/>
              <text x="80" y="215" font-size="10" fill="#f59e0b" text-anchor="middle" font-weight="bold">28°</text>
              <circle cx="220" cy="170" r="5" fill="#f59e0b" stroke="white" stroke-width="2"/>
              <text x="220" y="155" font-size="10" fill="#f59e0b" text-anchor="middle" font-weight="bold">29°</text>
              <circle cx="360" cy="150" r="5" fill="#f59e0b" stroke="white" stroke-width="2"/>
              <circle cx="500" cy="130" r="5" fill="#f59e0b" stroke="white" stroke-width="2"/>
              <circle cx="640" cy="120" r="5" fill="#f59e0b" stroke="white" stroke-width="2"/>
              <circle cx="780" cy="110" r="5" fill="#f59e0b" stroke="white" stroke-width="2"/>
              <circle cx="900" cy="100" r="5" fill="#f59e0b" stroke="white" stroke-width="2"/>
              <text x="900" y="95" font-size="10" fill="#f59e0b" text-anchor="middle" font-weight="bold">31°</text>
              
              <!-- Humidity Data points with values -->
              <circle cx="80" cy="250" r="5" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <text x="80" y="330" font-size="10" fill="#3b82f6" text-anchor="middle" font-weight="bold">50%</text>
              <circle cx="220" cy="200" r="5" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <circle cx="360" cy="180" r="5" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <circle cx="500" cy="160" r="5" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <circle cx="640" cy="150" r="5" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <circle cx="780" cy="140" r="5" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <circle cx="900" cy="130" r="5" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <text x="900" y="325" font-size="10" fill="#3b82f6" text-anchor="middle" font-weight="bold">68%</text>
              
              <!-- Pollution Data points -->
              <circle cx="80" cy="280" r="5" fill="#ef4444" stroke="white" stroke-width="2"/>
              <circle cx="220" cy="230" r="5" fill="#ef4444" stroke="white" stroke-width="2"/>
              <circle cx="360" cy="210" r="5" fill="#ef4444" stroke="white" stroke-width="2"/>
              <circle cx="500" cy="190" r="5" fill="#ef4444" stroke="white" stroke-width="2"/>
              <circle cx="640" cy="180" r="5" fill="#ef4444" stroke="white" stroke-width="2"/>
              <circle cx="780" cy="170" r="5" fill="#ef4444" stroke="white" stroke-width="2"/>
              <circle cx="900" cy="160" r="5" fill="#ef4444" stroke="white" stroke-width="2"/>
              
              <!-- X-axis labels (Days) -->
              <text x="80" y="335" font-size="12" fill="#0f172a" text-anchor="middle" font-weight="600">Mon</text>
              <text x="220" y="335" font-size="12" fill="#0f172a" text-anchor="middle" font-weight="600">Tue</text>
              <text x="360" y="335" font-size="12" fill="#0f172a" text-anchor="middle" font-weight="600">Wed</text>
              <text x="500" y="335" font-size="12" fill="#0f172a" text-anchor="middle" font-weight="600">Thu</text>
              <text x="640" y="335" font-size="12" fill="#0f172a" text-anchor="middle" font-weight="600">Fri</text>
              <text x="780" y="335" font-size="12" fill="#0f172a" text-anchor="middle" font-weight="600">Sat</text>
              <text x="900" y="335" font-size="12" fill="#0f172a" text-anchor="middle" font-weight="600">Sun</text>
            </svg>
            <div class="trends-legend">
              <div class="legend-item">
                <span class="legend-color" style="background: #f59e0b;"></span>
                <span>🌡️ Temperature (°C)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: #3b82f6;"></span>
                <span>💧 Humidity (%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: #ef4444;"></span>
                <span>💨 Pollution Level</span>
              </div>
            </div>
          </div>
        </section>

        <section class="panel data-quality-panel">
          <div class="panel-header">
            <h2>Data Quality Metrics</h2>
            <span>Last 24 hours</span>
          </div>
          <div class="quality-grid">
            <div class="quality-card" *ngFor="let metric of qualityMetrics">
              <div class="quality-header">
                <span class="quality-label">{{ metric.label }}</span>
                <span class="quality-value" [ngClass]="'score-' + (getMetricValue(metric.value) >= 95 ? 'high' : getMetricValue(metric.value) >= 90 ? 'med' : 'low')">{{ metric.value }}</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="getMetricValue(metric.value)" [ngClass]="'fill-' + (getMetricValue(metric.value) >= 95 ? 'high' : getMetricValue(metric.value) >= 90 ? 'med' : 'low')"></div>
                </div>
              </div>
              <div class="quality-indicator">
                <span class="indicator-dot" [ngClass]="'dot-' + (getMetricValue(metric.value) >= 95 ? 'high' : getMetricValue(metric.value) >= 90 ? 'med' : 'low')"></span>
                <span class="indicator-text" [ngClass]="'text-' + (getMetricValue(metric.value) >= 95 ? 'high' : getMetricValue(metric.value) >= 90 ? 'med' : 'low')">{{ getMetricStatus(metric.value) }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="panel sensor-network-panel">
          <div class="panel-header">
            <h2>Network Distribution</h2>
            <span>Sensor Deployment</span>
          </div>
          <div class="network-grid">
            <div class="network-item" *ngFor="let item of networkStats">
              <div class="network-card">
                <div class="network-icon">📍</div>
                <div class="network-content">
                  <span class="network-label">{{ item.label }}</span>
                  <div class="network-stats-row">
                    <span class="network-count">{{ item.count }}</span>
                    <span class="network-unit">sensors</span>
                  </div>
                </div>
                <div class="network-bar">
                  <div class="bar-fill" [style.width.%]="getNetworkBarWidth(item.count)"></div>
                </div>
              </div>
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

    .sensors-shell {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      color: #0f172a;
      background: rgba(255, 255, 255, 0.88);
      border-radius: 2.5rem;
      box-shadow: 0 40px 80px rgba(15, 23, 42, 0.12);
      border: 1px solid rgba(148, 163, 184, 0.14);
      backdrop-filter: blur(18px);
    }

    .sensors-hero {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(255, 255, 255, 0.96));
      border-radius: 2rem;
      padding: 2rem;
      box-shadow: 0 28px 60px rgba(15, 23, 42, 0.1);
      border: 1px solid rgba(148, 163, 184, 0.16);
    }

    .eyebrow {
      margin: 0 0 0.5rem;
      color: #2563eb;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.8rem;
    }

    .sensors-hero h1 {
      margin: 0;
      font-size: clamp(2rem, 2.5vw, 2.8rem);
      line-height: 1.05;
    }

    .hero-copy {
      margin: 1rem 0 0;
      color: #475569;
      max-width: 600px;
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

    .status-pill {
      background: #22c55e;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 999px;
      font-size: 0.9rem;
      font-weight: 700;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.96);
      border-radius: 1.75rem;
      padding: 1.5rem;
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      border-color: rgba(37, 99, 235, 0.3);
    }

    .stat-card.blue { border-color: rgba(37,99,235,0.3); }
    .stat-card.cyan { border-color: rgba(6,182,212,0.3); }
    .stat-card.green { border-color: rgba(34,197,94,0.3); }
    .stat-card.violet { border-color: rgba(139,92,246,0.3); }

    .stat-icon {
      font-size: 2rem;
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      background: rgba(37,99,235,0.1);
    }

    .stat-card.cyan .stat-icon { background: rgba(6,182,212,0.1); }
    .stat-card.green .stat-icon { background: rgba(34,197,94,0.1); }
    .stat-card.violet .stat-icon { background: rgba(139,92,246,0.1); }

    .stat-label {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .stat-card strong {
      font-size: 1.8rem;
      color: #0f172a;
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

    :host-context(body.dark) .sensors-shell,
    :host-context(html.dark) .sensors-shell,
    :host-context(body.dark) .sensors-hero,
    :host-context(html.dark) .sensors-hero,
    :host-context(body.dark) .quality-card,
    :host-context(html.dark) .quality-card,
    :host-context(body.dark) .stat-card,
    :host-context(html.dark) .stat-card,
    :host-context(body.dark) .panel,
    :host-context(html.dark) .panel,
    :host-context(body.dark) .sensor-form,
    :host-context(html.dark) .sensor-form,
    :host-context(body.dark) .sensor-item,
    :host-context(html.dark) .sensor-item,
    :host-context(body.dark) .network-card,
    :host-context(html.dark) .network-card,
    :host-context(body.dark) .sensor-status-panel .status-card,
    :host-context(html.dark) .sensor-status-panel .status-card,
    :host-context(body.dark) .sensor-status-panel .status-card:hover,
    :host-context(html.dark) .sensor-status-panel .status-card:hover,
    :host-context(body.dark) .sensor-status-panel .status-icon,
    :host-context(html.dark) .sensor-status-panel .status-icon {
      background: #111827 !important;
      border-color: rgba(71, 85, 105, 0.4) !important;
      color: #e2e8f0 !important;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45) !important;
    }

    :host-context(body.dark) .quality-card .quality-header .quality-label,
    :host-context(html.dark) .quality-card .quality-header .quality-label,
    :host-context(body.dark) .quality-card .quality-header .quality-value,
    :host-context(html.dark) .quality-card .quality-header .quality-value,
    :host-context(body.dark) .quality-indicator .indicator-text,
    :host-context(html.dark) .quality-indicator .indicator-text,
    :host-context(body.dark) .sensor-status-panel .status-card p,
    :host-context(html.dark) .sensor-status-panel .status-card p,
    :host-context(body.dark) .sensor-status-panel .status-card strong,
    :host-context(html.dark) .sensor-status-panel .status-card strong {
      color: #e2e8f0 !important;
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
      border: 1px solid rgba(148,163,184,0.3);
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
      border-color: rgba(37,99,235,0.5);
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
      background: #f8fafc;
    }

    .search-btn,
    .reset-btn {
      min-width: 120px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,0.3);
      background: white;
      color: #0f172a;
      font-size: 0.95rem;
      padding: 0.7rem 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .search-btn:hover,
    .reset-btn:hover {
      background: rgba(37,99,235,0.08);
      border-color: rgba(37,99,235,0.4);
    }

    .search-status {
      margin-top: 0.75rem;
    }

    .search-success {
      color: #166534;
      font-weight: 700;
    }

    .search-error {
      color: #b91c1c;
      font-weight: 700;
      color: #dc2626;
    }


    .sensor-form {
      background: #f8fafc;
      border-radius: 2rem;
      padding: 2rem;
      border: 1px solid rgba(148,163,184,0.16);
      margin-bottom: 2rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .sensor-form.form-invalid {
      border-color: #ef4444;
      box-shadow: 0 0 0 1px rgba(239,68,68,0.18);
    }

    .sensor-form.form-invalid .form-row input,
    .sensor-form.form-invalid .form-row select {
      border-color: #ef4444;
    }

    .sensor-form .form-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .sensor-form label {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      color: #475569;
      font-size: 0.95rem;
      flex: 1;
    }

    .sensor-form input,
    .sensor-form select {
      width: 100%;
      padding: 0.9rem 1rem;
      border-radius: 0.95rem;
      border: 1px solid rgba(148,163,184,0.25);
      background: white;
      font-size: 0.95rem;
    }

    .sensor-form .form-actions {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 1.5rem;
    }

    .sensor-form .error {
      color: #b91c1c;
      font-size: 0.9rem;
      margin-top: 0.75rem;
    }

    .error-message {
      background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05));
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 0.75rem;
      padding: 1rem;
      color: #7f1d1d;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sensors-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2.25rem;
      margin-bottom: 2rem;
    }

    .sensor-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .sensor-item {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 1.25rem;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid rgba(148,163,184,0.2);
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }

    .sensor-item:hover {
      transform: translateY(-2px);
      border-color: rgba(37,99,235,0.4);
      box-shadow: 0 8px 16px rgba(37,99,235,0.12);
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    }

    .sensor-item {
      cursor: pointer;
    }

    .sensor-item.active {
      border-color: #2563eb;
      box-shadow: 0 18px 40px rgba(37, 99, 235, 0.16);
    }

    .map-frame {
      width: 100%;
      height: 360px;
      border-radius: 1.5rem;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.14);
      margin-bottom: 1rem;
    }

    .map-frame iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }

    .map-note {
      color: #475569;
      font-size: 0.95rem;
    }

    .sensor-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .sensor-info {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      flex: 1;
    }

    .sensor-badge {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 1rem;
      display: grid;
      place-items: center;
      font-size: 1.75rem;
      flex-shrink: 0;
    }

    .sensor-badge.trafic { 
      background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05));
      border: 1px solid rgba(245,158,11,0.3);
    }
    .sensor-badge.parking { 
      background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05));
      border: 1px solid rgba(34,197,94,0.3);
    }
    .sensor-badge.pollution { 
      background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05));
      border: 1px solid rgba(239,68,68,0.3);
    }

    .sensor-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .sensor-name {
      display: block;
      color: #0f172a;
      font-size: 1.05rem;
      font-weight: 700;
    }

    .sensor-location {
      margin: 0;
      color: #64748b;
      font-size: 0.95rem;
    }

    .sensor-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }

    .sensor-type {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .sensor-type.type-trafic {
      background: rgba(245,158,11,0.2);
      color: #92400e;
    }
    .sensor-type.type-parking {
      background: rgba(34,197,94,0.2);
      color: #166534;
    }
    .sensor-type.type-pollution {
      background: rgba(239,68,68,0.2);
      color: #7f1d1d;
    }

    .sensor-uptime {
      font-size: 0.8rem;
      color: #22c55e;
      font-weight: 600;
    }

    .sensor-status {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .signal-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.9rem;
      background: rgba(34,197,94,0.1);
      color: #166534;
    }

    .signal-indicator.weak {
      background: rgba(239,68,68,0.1);
      color: #7f1d1d;
    }

    .signal-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse 2s ease-in-out infinite;
    }

    .signal-indicator.weak .signal-dot {
      background: #ef4444;
      animation: none;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .sensor-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(148,163,184,0.1);
    }

    .sensor-health {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .health-bar {
      flex: 1;
      height: 0.35rem;
      background: rgba(148,163,184,0.2);
      border-radius: 999px;
      overflow: hidden;
    }

    .health-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e 0%, #10b981 100%);
      border-radius: 999px;
    }

    .health-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
    }

    .btn-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(148,163,184,0.2);
      background: white;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      border-color: rgba(37,99,235,0.4);
      background: rgba(37,99,235,0.05);
    }

    .btn-icon.delete:hover {
      border-color: rgba(239,68,68,0.4);
      background: rgba(239,68,68,0.05);
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
      color: #94a3b8;
      font-size: 1rem;
    }

    .empty-state.empty-error {
      color: #b91c1c;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.18);
      border-radius: 1rem;
    }

    .sensor-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-badge {
      padding: 0.5rem 0.9rem;
      border-radius: 999px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      color: white;
    }

    .status-badge.active { background: #22c55e; }
    .status-badge.inactive { background: #ef4444; }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
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

    .btn.edit:hover { background: rgba(37,99,235,0.1); }
    .btn.delete:hover { background: rgba(239,68,68,0.1); }

    /* Status Cards Styling */
    .sensor-status-panel {
      background: transparent;
    }

    .sensor-status-panel .panel-header {
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .sensor-status-panel .panel-header h2 {
      font-size: 1.25rem;
      color: #0f172a;
    }

    .sensor-status-panel .panel-header span {
      color: #64748b;
    }

    .sensor-status-panel .status-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }

    .sensor-status-panel .status-card {
      background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(244,246,248,0.95));
      border: 1px solid rgba(148,163,184,0.18);
      border-radius: 1.75rem;
      padding: 1.75rem;
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 1rem;
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
      box-shadow: 0 14px 30px rgba(15,23,42,0.08);
      min-height: 140px;
    }

    .sensor-status-panel .status-card:hover {
      transform: translateY(-4px);
      border-color: rgba(37,99,235,0.35);
      box-shadow: 0 20px 40px rgba(15,23,42,0.14);
      background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    }

    .sensor-status-panel .status-icon {
      font-size: 2.6rem;
      width: 3.5rem;
      height: 3.5rem;
      display: grid;
      place-items: center;
      background: rgba(59,130,246,0.12);
      border-radius: 1rem;
      color: #1d4ed8;
    }

    .sensor-status-panel .status-card p {
      margin: 0;
      color: #475569;
      font-size: 0.95rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.01em;
    }

    .sensor-status-panel .status-card strong {
      display: block;
      font-size: 2.5rem;
      color: #0f172a;
      margin-top: 0.45rem;
      line-height: 1;
    }

    /* Sensor Type Panel Improvements */
    .sensor-type-panel {
      background: linear-gradient(180deg, rgba(248,250,252,0.9), rgba(241,245,249,0.9));
      border: 1px solid rgba(148,163,184,0.14);
      padding: 1.5rem;
      border-radius: 1.75rem;
    }

    .sensor-type-panel .sensor-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      padding: 1.5rem;
      background: white;
      border-radius: 1.5rem;
      border: 1px solid rgba(148,163,184,0.12);
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
      gap: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 10px 24px rgba(15,23,42,0.06);
    }

    .sensor-type-panel .sensor-item:last-child {
      margin-bottom: 0;
    }

    .sensor-type-panel .sensor-item:hover {
      transform: translateY(-3px);
      border-color: rgba(37,99,235,0.2);
      box-shadow: 0 16px 28px rgba(15,23,42,0.1);
    }

    .sensor-name {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .sensor-name .sensor-badge {
      width: 3rem;
      height: 3rem;
      background: rgba(37,99,235,0.1);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .sensor-name strong {
      display: block;
      color: #0f172a;
      font-size: 1rem;
    }

    .sensor-name p {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .sensor-metrics {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .sensor-metrics .temp,
    .sensor-metrics .traffic-level,
    .sensor-metrics .aqi-level {
      font-weight: 700;
      font-size: 1.1rem;
      padding: 0.5rem 1rem;
      border-radius: 0.75rem;
    }

    .sensor-metrics .temp {
      color: #ea580c;
      background: rgba(234,88,12,0.1);
    }

    .sensor-metrics .traffic-level {
      color: #0891b2;
      background: rgba(8,145,178,0.1);
    }

    .sensor-metrics .traffic-level.high {
      color: #dc2626;
      background: rgba(220,38,38,0.1);
    }

    .sensor-metrics .traffic-level.medium {
      color: #f59e0b;
      background: rgba(245,158,11,0.1);
    }

    .sensor-metrics .traffic-level.low {
      color: #22c55e;
      background: rgba(34,197,94,0.1);
    }

    .sensor-metrics .aqi-level {
      color: #7c3aed;
      background: rgba(124,58,237,0.1);
    }

    .sensor-metrics .aqi-level.good {
      color: #22c55e;
      background: rgba(34,197,94,0.1);
    }

    .sensor-metrics .aqi-level.moderate {
      color: #f59e0b;
      background: rgba(245,158,11,0.1);
    }

    .sensor-metrics .aqi-level.poor {
      color: #dc2626;
      background: rgba(220,38,38,0.1);
    }

    .status-dot {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      background: #64748b;
    }

    .status-dot.active {
      background: #22c55e;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @media (max-width: 1024px) {
      .status-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .status-cards {
        grid-template-columns: 1fr;
      }

      .sensor-type-panel .sensor-item {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .sensor-form .form-row {
        grid-template-columns: 1fr;
      }

      .sensor-form .form-actions {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .sensors-shell {
        padding: 1rem;
      }

      .sensors-hero {
        flex-direction: column;
        align-items: flex-start;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .sensor-item {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .sensor-actions {
        justify-content: space-between;
      }
    }

    /* Data Quality & Network Metrics Improvements */
    .quality-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }

    .quality-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 1.5rem;
      padding: 1.5rem;
      border: 1px solid rgba(148, 163, 184, 0.15);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .quality-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
    }

    .quality-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .quality-label {
      font-size: 0.9rem;
      color: #64748b;
      font-weight: 600;
    }

    .quality-value {
      font-size: 1.4rem;
      font-weight: 800;
      min-width: 60px;
      text-align: right;
      color: #0f172a;
    }

    .quality-value.score-high { color: #22c55e; }
    .quality-value.score-med { color: #f59e0b; }
    .quality-value.score-low { color: #ef4444; }

    .progress-bar-container {
      margin: 1rem 0;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.6s ease;
    }

    .progress-fill.fill-high { background: linear-gradient(90deg, #22c55e, #16a34a); }
    .progress-fill.fill-med { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .progress-fill.fill-low { background: linear-gradient(90deg, #ef4444, #dc2626); }

    .quality-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      display: inline-block;
    }

    .indicator-dot.dot-high { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.6); }
    .indicator-dot.dot-med { background: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.6); }
    .indicator-dot.dot-low { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.6); }

    .indicator-text {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .indicator-text.text-high { color: #22c55e; }
    .indicator-text.text-med { color: #f59e0b; }
    .indicator-text.text-low { color: #ef4444; }

    .network-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .network-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 1.5rem;
      padding: 1.5rem 1.25rem;
      border: 1px solid rgba(148, 163, 184, 0.15);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .network-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
    }

    .network-icon {
      font-size: 1.8rem;
      width: fit-content;
    }

    .network-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .network-label {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.4;
    }

    .network-stats-row {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .network-count {
      font-size: 1.8rem;
      font-weight: 700;
      color: #2563eb;
    }

    .network-unit {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .network-bar {
      width: 100%;
      height: 6px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563eb, #1d4ed8);
      border-radius: 999px;
      transition: width 0.6s ease;
    }
  `,
  standalone: true,
})
export class SensorsComponent implements OnInit {
  private sensorService = inject(SensorService);
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  lastUpdated = formatDateLabel();
  sensors: Sensor[] = [];
  selectedSensor: Sensor | null = null;
  selectedSensorLocation = 'Sousse Tunisia';
  sensorMapUrl: SafeResourceUrl = this.createMapUrl(this.selectedSensorLocation);
  filteredSensors: Sensor[] = [];
  searchTerm: string = '';
  filterType: string = '';
  searchStatusMessage: string = '';
  searchStatusClass: string = '';
  searchError = false;
  emptyMessage = '';
  searchSuggestions: string[] = [];
  loading = true;
  error = '';
  editingSensor: Sensor | null = null;
  isCreating = true;
  backendAvailable = true;

  sensorForm = this.fb.group({
    name: ['', Validators.required],
    type: ['trafic', Validators.required],
    location: ['', Validators.required],
    status: [true, Validators.required],
  });

  ngOnInit(): void {
    this.resetFilters();
    this.loadSensors();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterType = '';
    this.searchStatusMessage = '';
    this.searchStatusClass = '';
    this.applyFilters();
  }

  private loadSensors(): void {
    this.loading = true;
    console.log('📡 Chargement des capteurs...');
    this.sensorService.getSensors().subscribe({
      next: (data) => {
        console.log('✅ Capteurs chargés:', data);
        this.sensors = data;
        this.updateSearchSuggestions();
        this.applyFilters();
        if (this.filteredSensors.length > 0) {
          this.selectSensor(this.filteredSensors[0]);
        }
        this.backendAvailable = true;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement capteurs:', err);
        this.backendAvailable = false;
        this.error = 'Impossible de charger les capteurs';
        this.loading = false;
      },
    });
  }

  private getApiUrl(): string {
    return 'http://localhost:8000/api';
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredSensors = this.sensors.filter(sensor => {
      const matchesSearch = !term ||
        sensor.name.toLowerCase().includes(term) ||
        sensor.location.toLowerCase().includes(term);
      const matchesType = !this.filterType || sensor.type === this.filterType;
      return matchesSearch && matchesType;
    });
  }

  searchSensor(): void {
    this.applyFilters();
    this.emptyMessage = '';
    this.searchError = false;

    if (!this.searchTerm.trim() && !this.filterType) {
      this.searchStatusMessage = '';
      this.searchStatusClass = '';
      return;
    }

    if (this.filteredSensors.length > 0) {
      this.searchStatusMessage = 'Capteur trouvé';
      this.searchStatusClass = 'search-success';
      this.selectSensor(this.filteredSensors[0]);
    } else {
      this.searchStatusMessage = '';
      this.searchStatusClass = '';
      this.searchError = true;
      if (this.searchTerm.trim() && this.filterType) {
        this.emptyMessage = 'Aucun capteur avec ce nom et ce type';
      } else if (this.searchTerm.trim()) {
        this.emptyMessage = 'Aucun capteur avec ce nom';
      } else {
        this.emptyMessage = `Aucun capteur de type ${this.filterType}`;
      }
      this.selectedSensor = null;
    }
  }

  updateSearchSuggestions(): void {
    const suggestions = new Set<string>();

    const addSuggestion = (value: string | undefined): void => {
      if (value && value.trim().length > 0) {
        suggestions.add(value.trim());
      }
    };

    this.sensors.forEach(sensor => {
      addSuggestion(sensor.name);
      addSuggestion(sensor.location);
    });

    this.temperatureSensors.forEach(sensor => {
      addSuggestion(sensor.title);
      addSuggestion(sensor.subtitle);
    });

    this.trafficSensors.forEach(sensor => {
      addSuggestion(sensor.title);
      addSuggestion(sensor.subtitle);
    });

    this.aqiSensors.forEach(sensor => {
      addSuggestion(sensor.title);
      addSuggestion(sensor.subtitle);
    });

    this.searchSuggestions = Array.from(suggestions).sort();
  }

  get totalSensors(): number {
    return this.sensors.length;
  }

  private createMapUrl(location: string): SafeResourceUrl {
    const query = encodeURIComponent(`${location} Sousse Tunisia`);
    const url = `https://www.google.com/maps?q=${query}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  updateMapLocation(location: string): void {
    this.selectedSensorLocation = location;
    this.sensorMapUrl = this.createMapUrl(location);
  }

  private createLocalSensor(payload: { name: string; type: string; location: string; status: boolean }): Sensor {
    const nextId = this.sensors.reduce((max, sensor) => Math.max(max, sensor.id), 0) + 1;
    return {
      id: nextId,
      name: payload.name,
      type: payload.type,
      location: payload.location,
      status: payload.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  selectSensor(sensor: Sensor): void {
    this.selectedSensor = sensor;
    this.updateMapLocation(sensor.location || this.selectedSensorLocation);
  }

  get operationalSensors(): number {
    return this.sensors.filter(sensor => sensor.status).length;
  }

  get inactiveSensors(): number {
    return this.sensors.filter(sensor => !sensor.status).length;
  }

  get sensorTypes(): number {
    const types = new Set(this.sensors.map(sensor => sensor.type));
    return types.size;
  }

  temperatureSensors = [
    { title: 'Avenue Habib Bourguiba', subtitle: 'Centre-Ville', value: '31°C', status: 'active' },
    { title: 'Plage de Sousse', subtitle: 'Corniche Est', value: '29°C', status: 'active' },
    { title: 'Zone Industrielle Sahloul', subtitle: 'Route Industrielle', value: '30°C', status: 'active' },
  ];

  trafficSensors = [
    { title: 'Avenue Hédi Chaker', subtitle: 'Intersection Sud', level: 'High', status: 'active' },
    { title: 'Boulevard 14 Janvier 2011', subtitle: 'Rond-point', level: 'Moderate', status: 'active' },
    { title: 'Rue Imam Malik', subtitle: 'Centre-Ville', level: 'Low', status: 'active' },
  ];

  aqiSensors = [
    { title: 'Place 7 Novembre', subtitle: 'AQI Monitoring', level: 'Good', status: 'active' },
    { title: 'Zone Industrielle Sahloul', subtitle: 'AQI Monitoring', level: 'Moderate', status: 'active' },
    { title: 'Corniche de Sousse', subtitle: 'AQI Monitoring', level: 'Good', status: 'active' },
  ];

  sensorStatusCards = [
    { icon: '✅', label: 'Active & Online', value: '122' },
    { icon: '⚠️', label: 'Degraded Signal', value: '8' },
    { icon: '📴', label: 'Offline', value: '5' },
    { icon: '🔧', label: 'Maintenance', value: '3' },
  ];

  qualityMetrics = [
    { label: 'Average Uptime', value: '98%' },
    { label: 'Data Accuracy', value: '97%' },
    { label: 'Sync Success Rate', value: '95%' },
    { label: 'Signal Quality', value: '96%' },
  ];

  networkStats = [
    { label: 'Centre-Ville Sousse', count: '32' },
    { label: 'Kantaoui & Ezzouhour', count: '45' },
    { label: 'Corniche & Port', count: '28' },
    { label: 'Sahloul Industrial', count: '12' },
  ];

  getTypeIcon(type: string): string {
    switch (type) {
      case 'trafic': return '🚗';
      case 'parking': return '🅿️';
      case 'pollution': return '💨';
      default: return '📡';
    }
  }

  startNewSensor(): void {
    this.editingSensor = null;
    this.isCreating = true;
    this.error = '';
    this.sensorForm.reset({
      name: '',
      type: 'trafic',
      location: '',
      status: true,
    });
  }

  editSensor(sensor: Sensor): void {
    this.editingSensor = sensor;
    this.isCreating = false;
    this.sensorForm.patchValue({
      name: sensor.name,
      type: sensor.type,
      location: sensor.location,
      status: sensor.status,
    });
  }

  saveSensor(): void {
    // Effacer les messages précédents
    this.error = '';

    // Marquer tous les champs comme touchés pour afficher les erreurs
    this.sensorForm.markAllAsTouched();

    if (this.sensorForm.invalid) {
      this.error = 'Veuillez remplir tous les champs obligatoires';
      console.warn('❌ Formulaire invalide:', this.sensorForm.errors);
      return;
    }

    const formValue = this.sensorForm.value;
    const rawStatus = formValue.status as boolean | string | null | undefined;
    const payload = {
      name: formValue.name?.trim() ?? '',
      type: formValue.type ?? 'trafic',
      location: formValue.location?.trim() ?? '',
      status: rawStatus === true || rawStatus === 'true',
    };

    // Valider les champs avant envoi
    if (!payload.name) {
      this.error = 'Le nom du capteur est obligatoire';
      return;
    }

    if (!payload.location) {
      this.error = 'La localisation est obligatoire';
      return;
    }

    if (!payload.type || !['trafic', 'parking', 'pollution'].includes(payload.type)) {
      this.error = 'Veuillez sélectionner un type valide';
      return;
    }

    console.log('📤 Envoi du payload:', payload);

    if (this.isCreating) {
      const handleCreatedSensor = (createdSensor: Sensor, local = false) => {
        this.sensors.push(createdSensor);
        this.updateSearchSuggestions();
        this.searchTerm = '';
        this.filterType = '';
        this.applyFilters();
        this.selectSensor(createdSensor);
        this.searchStatusMessage = local ? 'Capteur créé localement' : 'Capteur créé';
        this.searchStatusClass = 'search-success';
        this.searchError = false;
        this.emptyMessage = '';
        this.startNewSensor();
      };

      if (!this.backendAvailable) {
        const localSensor = this.createLocalSensor(payload);
        handleCreatedSensor(localSensor, true);
        this.error = 'Backend indisponible, capteur créé localement.';
        return;
      }

      this.sensorService.createSensor(payload).subscribe({
        next: (data) => {
          console.log('✅ Capteur créé avec succès:', data);
          handleCreatedSensor(data);
        },
        error: (err) => {
          console.error('❌ Erreur création complète:', err);
          this.backendAvailable = false;
          const errorMessage = err?.error?.message || err?.message || 'Erreur lors de la création du capteur';
          this.error = `❌ ${errorMessage}. Capteur créé localement.`;
          const localSensor = this.createLocalSensor(payload);
          handleCreatedSensor(localSensor, true);
        },
      });
    } else if (this.editingSensor) {
      this.sensorService.updateSensor(this.editingSensor.id, payload).subscribe({
        next: () => {
          console.log('✅ Capteur mis à jour');
          this.loadSensors();
          this.startNewSensor();
        },
        error: (err) => {
          console.error('❌ Erreur update:', err);
          this.error = `❌ ${err?.error?.message || 'Erreur lors de la mise à jour du capteur'}`;
        },
      });
    }
  }

  deleteSensor(): void {
    if (!this.editingSensor) return;

    this.sensorService.deleteSensor(this.editingSensor.id).subscribe({
      next: () => {
        this.loadSensors();
        this.startNewSensor();
      },
      error: () => {
        this.error = 'Failed to delete sensor';
      },
    });
  }

  deleteSensorDirect(sensor: Sensor): void {
    this.sensorService.deleteSensor(sensor.id).subscribe({
      next: () => {
        this.loadSensors();
      },
      error: () => {
        this.error = 'Failed to delete sensor';
      },
    });
  }

  getMetricValue(value: string): number {
    return parseInt(value, 10);
  }

  getMetricClass(value: string): string {
    const num = parseInt(value, 10);
    if (num >= 95) return 'dot-high';
    if (num >= 90) return 'dot-med';
    return 'dot-low';
  }

  getMetricStatus(value: string): string {
    const num = parseInt(value, 10);
    if (num >= 95) return 'Excellent';
    if (num >= 90) return 'Good';
    return 'Fair';
  }

  getNetworkBarWidth(count: string): number {
    return (parseInt(count, 10) / 45) * 100;
  }
}
