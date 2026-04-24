import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DailyWeather, WeatherData, WeatherService } from '../../services/weather.service';
import { dateFloat, dateMetric, formattedMinutesAgo, formatDateLabel, trafficLevelFromDate } from '../../utils/date-metrics';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <section class="dashboard-shell">
      <header class="dashboard-hero">
        <div>
          <p class="eyebrow">Welcome back to Sousse!</p>
          <h1>Sousse Smart City Dashboard</h1>
          <p class="hero-copy">Overview of Sousse sensors, parking availability and traffic conditions in real time.</p>
        </div>
        <div class="hero-meta">
          <div>
            <span>Today</span>
            <strong>{{ today }}</strong>
          </div>
          <div class="status-pill">Live</div>
        </div>
      </header>

      <section class="panel traffic-map-panel">
        <div class="panel-header">
          <h2>Traffic Map</h2>
          <span>Live traffic conditions in Sousse</span>
        </div>
        <div class="traffic-map-embed">
          <iframe
            loading="lazy"
            allowfullscreen
            referrerpolicy="no-referrer-when-downgrade"
            [src]="trafficMapUrl"
          ></iframe>
        </div>
      </section>

      <div class="stats-grid">
        <article class="stat-card blue">
          <div class="stat-icon">🌡️</div>
          <div>
            <p class="stat-label">Temperature</p>
            <strong>{{ avgTemperatureDisplay }}</strong>
          </div>
        </article>
        <article class="stat-card cyan">
          <div class="stat-icon">💧</div>
          <div>
            <p class="stat-label">Humidity</p>
            <strong>{{ avgHumidityDisplay }}</strong>
          </div>
        </article>
        <article class="stat-card green">
          <div class="stat-icon">⛅</div>
          <div>
            <p class="stat-label">Weather</p>
            <strong>{{ weather.condition }}</strong>
          </div>
        </article>
        <article class="stat-card violet">
          <div class="stat-icon">📡</div>
          <div>
            <p class="stat-label">Connected Sensors</p>
            <strong>{{ connectedSensors }}</strong>
          </div>
        </article>
      </div>

      <div class="dashboard-grid">
        <aside class="panel side-panel">
          <div class="panel-header">
            <h2>Parking Status</h2>
            <span>Availability</span>
          </div>
          <div class="parking-list">
            <div class="parking-row" *ngFor="let row of parkingRows">
              <div class="parking-icon">🚗</div>
              <div>
                <strong>{{ row.name }}</strong>
                <p>{{ row.spots }} spots</p>
              </div>
              <span class="status {{ row.status }}">{{ row.spots }}</span>
            </div>
          </div>

          <div class="panel-footer">
            <div>
              <span>Average occupancy</span>
              <strong>{{ averageOccupancy }}%</strong>
            </div>
            <button class="action-btn" (click)="goToParking()">View all parkings</button>
          </div>
          <div class="weather-tag">
            <span>Traffic condition adjusted for {{ weather.condition }}</span>
          </div>
        </aside>
      </div>

      <section class="panel forecast-panel" *ngIf="dailyForecast.length">
        <div class="panel-header">
          <h2>Prévisions journalières</h2>
          <span>Weather forecast for the next days</span>
        </div>
        <div class="forecast-grid">
          <article class="forecast-card" *ngFor="let item of dailyForecast">
            <span class="forecast-date">{{ item.date | date:'EEE d MMM' }}</span>
            <strong>{{ item.maxTemp }}° / {{ item.minTemp }}°</strong>
            <span>{{ item.condition }}</span>
            <span>{{ item.precipitation }} mm</span>
          </article>
        </div>
      </section>

      <div class="dashboard-grid secondary-grid">
        <section class="panel sensor-panel">
          <div class="panel-header">
            <h2>Sensor Health</h2>
            <span>Last 24 hours</span>
          </div>
          <div class="sensor-stats">
            <div class="sensor-card" *ngFor="let stat of sensorStats">
              <div class="sensor-card-icon">{{ stat.icon }}</div>
              <div>
                <p>{{ stat.label }}</p>
                <strong>{{ stat.value }}</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="panel traffic-panel">
          <div class="panel-header">
            <div>
              <h2>Traffic Trend Today</h2>
              <span>Traffic evolution in Sousse</span>
            </div>
            <div class="traffic-level-badge">
              <span>Traffic Level</span>
              <strong>{{ trafficLevel }}</strong>
            </div>
          </div>
          <div class="traffic-chart-full">
            <div class="traffic-status-row">
              <div>
                <span>Live Google Traffic</span>
                <strong>Red / Orange congestion</strong>
              </div>
              <div>
                <span>Data range</span>
                <strong>00H - 24H</strong>
              </div>
            </div>
            <svg class="traffic-curve-full" viewBox="0 0 840 320" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="trafficGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#2563eb;stop-opacity:0.8" />
                  <stop offset="100%" style="stop-color:#2563eb;stop-opacity:0.1" />
                </linearGradient>
                <linearGradient id="trafficStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#22c55e" />
                  <stop offset="40%" stop-color="#f59e0b" />
                  <stop offset="70%" stop-color="#f97316" />
                  <stop offset="100%" stop-color="#dc2626" />
                </linearGradient>
              </defs>
              <line x1="0" y1="240" x2="840" y2="240" stroke="#e2e8f0" stroke-width="1"/>
              <line x1="0" y1="190" x2="840" y2="190" stroke="#e2e8f0" stroke-width="1"/>
              <line x1="0" y1="140" x2="840" y2="140" stroke="#e2e8f0" stroke-width="1"/>
              <line x1="0" y1="90" x2="840" y2="90" stroke="#e2e8f0" stroke-width="1"/>
              <path d="M 0 250 Q 70 220 140 210 T 210 200 T 280 180 T 350 160 T 420 150 T 490 145 T 560 155 T 630 150 T 700 135 T 770 120 T 840 110"
                    stroke="url(#trafficStrokeGradient)"
                    stroke-width="5"
                    fill="none"
                    stroke-linecap="round"/>
              <path d="M 0 320 L 0 250 Q 70 220 140 210 T 210 200 T 280 180 T 350 160 T 420 150 T 490 145 T 560 155 T 630 150 T 700 135 T 770 120 T 840 110 L 840 320 Z"
                    fill="url(#trafficGradient)"/>
              <circle cx="0" cy="250" r="6" fill="#22c55e"/>
              <circle cx="140" cy="210" r="6" fill="#84cc16"/>
              <circle cx="280" cy="180" r="6" fill="#f59e0b"/>
              <circle cx="420" cy="150" r="6" fill="#f97316"/>
              <circle cx="560" cy="155" r="6" fill="#f97316"/>
              <circle cx="700" cy="135" r="6" fill="#f43f5e"/>
              <circle cx="840" cy="110" r="6" fill="#dc2626"/>
            </svg>
            <div class="traffic-legend-full">
              <span>0H</span>
              <span>2H</span>
              <span>4H</span>
              <span>6H</span>
              <span>8H</span>
              <span>10H</span>
              <span>12H</span>
              <span>14H</span>
              <span>16H</span>
              <span>18H</span>
              <span>20H</span>
              <span>22H</span>
              <span>24H</span>
            </div>
            <div class="traffic-legend-bar">
              <span class="traffic-level low">Low</span>
              <span class="traffic-level moderate">Moderate</span>
              <span class="traffic-level high">High</span>
              <span class="traffic-level severe">Severe</span>
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

    .dashboard-shell {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      color: #0f172a;
    }

    .dashboard-hero {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
    }

    .login-info-card {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(37, 99, 235, 0.16);
      border-radius: 1.5rem;
      padding: 1rem 1.25rem;
      margin: 1.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      color: #0f172a;
    }

    .login-info-card p {
      margin: 0;
      font-weight: 700;
    }

    .login-credentials {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      color: #475569;
      font-size: 0.95rem;
    }

    .eyebrow {
      margin: 0 0 0.5rem;
      color: #2563eb;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.8rem;
    }

    .dashboard-hero h1 {
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
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-radius: 1.5rem;
      border: 1px solid rgba(148,163,184,0.2);
    }

    .weather-summary-panel {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .weather-summary-item {
      background: #eff6ff;
      border-radius: 1.5rem;
      padding: 1rem 1.25rem;
      border: 1px solid rgba(37, 99, 235, 0.12);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .weather-summary-item span {
      color: #64748b;
      font-size: 0.9rem;
    }

    .weather-summary-item strong {
      font-size: 1.15rem;
      color: #0f172a;
    }

    .weather-error {
      margin-top: 1rem;
      padding: 0.9rem 1.25rem;
      border-radius: 1.25rem;
      background: #fef2f2;
      color: #991b1b;
      font-weight: 600;
      border: 1px solid #fecaca;
    }

    .hero-meta div {
      text-align: right;
    }

    .hero-meta span {
      display: block;
      color: #64748b;
      font-size: 0.9rem;
    }

    .hero-meta strong {
      display: block;
      font-size: 1.05rem;
      color: #0f172a;
      margin-top: 0.25rem;
    }

    .status-pill {
      background: #dcfce7;
      color: #166534;
      border-radius: 999px;
      padding: 0.7rem 1.1rem;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 2rem;
      color: #0f172a;
      box-shadow: 0 18px 40px rgba(15,23,42,0.06);
      border: 1px solid rgba(148,163,184,0.18);
      background: white;
    }

    .stat-icon {
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      background: rgba(37,99,235,0.12);
      font-size: 1.35rem;
    }

    .stat-label {
      margin: 0 0 0.35rem;
      font-size: 0.95rem;
      color: #64748b;
    }

    .stat-card.blue { background: #eff6ff; }
    .stat-card.cyan { background: #ecfeff; }
    .stat-card.green { background: #ecfdf5; }
    .stat-card.violet { background: #f5f3ff; }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2.25rem;
      margin-bottom: 2rem;
    }

    .side-panel {
      width: 100%;
    }

    .secondary-grid {
      grid-template-columns: 1fr 1fr;
      gap: 2.25rem;
      margin-bottom: 2rem;
    }

    .panel {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 2rem;
      padding: 1.75rem;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      border: 1px solid rgba(148, 163, 184, 0.16);
      backdrop-filter: blur(12px);
    }

    :host-context(body.dark) .panel,
    :host-context(html.dark) .panel,
    :host-context(body.dark) .hero-meta,
    :host-context(html.dark) .hero-meta,
    :host-context(body.dark) .parking-row,
    :host-context(html.dark) .parking-row,
    :host-context(body.dark) .sensor-card,
    :host-context(html.dark) .sensor-card,
    :host-context(body.dark) .traffic-status-row div,
    :host-context(html.dark) .traffic-status-row div,
    :host-context(body.dark) .map-embed,
    :host-context(html.dark) .map-embed,
    :host-context(body.dark) .map-footer div,
    :host-context(html.dark) .map-footer div,
    :host-context(body.dark) .map-placeholder,
    :host-context(html.dark) .map-placeholder,
    :host-context(body.dark) .traffic-chart-full,
    :host-context(html.dark) .traffic-chart-full,
    :host-context(body.dark) .traffic-chart,
    :host-context(html.dark) .traffic-chart,
    :host-context(body.dark) .stat-card,
    :host-context(html.dark) .stat-card,
    :host-context(body.dark) .stat-icon,
    :host-context(html.dark) .stat-icon,
    :host-context(body.dark) .status-pill,
    :host-context(html.dark) .status-pill {
      background: #111827 !important;
      border-color: rgba(71, 85, 105, 0.4) !important;
      color: #f8fafc !important;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45) !important;
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

    .map-embed,
    .traffic-map-embed {
      min-height: 400px;
      height: 400px;
      border-radius: 1.75rem;
      overflow: hidden;
      background: #f8fafc;
      border: 1px solid rgba(148,163,184,0.14);
    }

    .map-embed iframe,
    .traffic-map-embed iframe {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
    }

    .forecast-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .forecast-card {
      background: #f8fafc;
      border-radius: 1.5rem;
      padding: 1.15rem;
      border: 1px solid rgba(148, 163, 184, 0.14);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .forecast-date {
      color: #64748b;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .forecast-card strong {
      font-size: 1.2rem;
      display: block;
      color: #0f172a;
    }

    .forecast-card span {
      color: #475569;
      font-size: 0.95rem;
    }

    .traffic-level-badge {
      display: inline-flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
      color: #0f172a;
    }

    .traffic-level-badge span {
      color: #64748b;
      font-size: 0.85rem;
    }

    .traffic-status-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .traffic-status-row div {
      background: #f8fafc;
      border-radius: 1rem;
      padding: 1rem;
      border: 1px solid rgba(148,163,184,0.14);
    }

    .traffic-status-row span {
      display: block;
      font-size: 0.85rem;
      color: #64748b;
    }

    .traffic-status-row strong {
      display: block;
      margin-top: 0.35rem;
      font-size: 1rem;
      color: #0f172a;
    }

    .map-placeholder {
      min-height: 260px;
      border-radius: 1.75rem;
      background: linear-gradient(180deg, #eef2ff 0%, #e2e8f0 100%);
      display: grid;
      place-items: center;
      position: relative;
      overflow: hidden;
      text-align: center;
    }

    .map-pin {
      font-size: 2.2rem;
      margin-bottom: 0.5rem;
    }

    .map-label {
      color: #334155;
      font-weight: 700;
      font-size: 1rem;
    }

    .map-footer {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .weather-tag {
      margin-top: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 1.25rem;
      background: #eef2ff;
      color: #1d4ed8;
      font-size: 0.95rem;
      border: 1px solid rgba(37, 99, 235, 0.14);
    }

    .map-footer div {
      background: #f8fafc;
      border-radius: 1.25rem;
      padding: 1rem;
      border: 1px solid rgba(148,163,184,0.14);
    }

    .map-footer span {
      display: block;
      color: #64748b;
      font-size: 0.85rem;
    }

    .map-footer strong {
      display: block;
      margin-top: 0.35rem;
      font-size: 1.05rem;
      color: #0f172a;
    }

    .parking-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .parking-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      background: #f8fafc;
      border-radius: 1.5rem;
      padding: 1rem 1.25rem;
      border: 1px solid rgba(148,163,184,0.15);
    }

    .parking-icon {
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      background: rgba(37,99,235,0.12);
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .parking-row strong {
      display: block;
      color: #0f172a;
    }

    .parking-row p {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .status {
      min-width: 4.5rem;
      height: 4.5rem;
      display: grid;
      place-items: center;
      text-align: center;
      border-radius: 999px;
      color: white;
      font-weight: 700;
      font-size: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease;
    }

    .status:hover {
      transform: scale(1.08);
    }

    .status.green { background: #16a34a; }
    .status.yellow { background: #d97706; }
    .status.red { background: #dc2626; }

    .panel-footer {
      margin-top: 1.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .panel-footer strong {
      display: block;
      font-size: 1.1rem;
    }

    .action-btn {
      padding: 0.95rem 1.4rem;
      border-radius: 999px;
      border: none;
      background: #2563eb;
      color: white;
      cursor: pointer;
      font-weight: 700;
      box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
      transition: background 0.2s ease, transform 0.2s ease;
    }

    .action-btn:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }

    .sensor-stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
    }

    .sensor-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #f8fafc;
      border-radius: 1.5rem;
      padding: 1.2rem;
      border: 1px solid rgba(148,163,184,0.16);
      text-align: left;
    }

    .sensor-card-icon {
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      background: rgba(37,99,235,0.12);
      font-size: 1.2rem;
    }

    .sensor-card p {
      margin: 0;
      color: #64748b;
      font-size: 0.95rem;
    }

    .sensor-card strong {
      display: block;
      margin-top: 0.7rem;
      font-size: 1.45rem;
      color: #0f172a;
    }

    .traffic-chart {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;
      min-height: 180px;
      padding: 1rem 0.5rem 0;
      border-radius: 1.5rem;
      background: linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%);
    }

    .chart-bar {
      width: 100%;
      background: #c7d2fe;
      border-radius: 999px 999px 0 0;
      position: relative;
      display: grid;
      place-items: end center;
      padding-bottom: 0.4rem;
      transition: height 0.4s ease;
    }

    .chart-bar.filled { background: #2563eb; }

    .chart-value {
      font-size: 0.75rem;
      color: white;
      font-weight: 700;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
    }

    .traffic-legend {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 0.75rem;
      margin-top: 1rem;
      font-size: 0.8rem;
      color: #64748b;
      text-align: center;
    }

    .traffic-chart-full {
      background: linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%);
      border-radius: 1.5rem;
      padding: 1.75rem;
      border: 1px solid rgba(148,163,184,0.14);
    }

    .traffic-status-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .traffic-status-row div {
      background: #f8fafc;
      border-radius: 1rem;
      padding: 1rem;
      border: 1px solid rgba(148,163,184,0.14);
    }

    .traffic-status-row span {
      display: block;
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .traffic-status-row strong {
      display: block;
      font-size: 1rem;
      color: #0f172a;
    }

    .traffic-curve-full {
      width: 100%;
      min-height: 320px;
      border-radius: 0.75rem;
    }

    .traffic-legend-full {
      display: grid;
      grid-template-columns: repeat(13, minmax(0, 1fr));
      gap: 0.5rem;
      margin-top: 1.25rem;
      font-size: 0.75rem;
      color: #64748b;
      text-align: center;
    }

    .traffic-legend-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    .traffic-level {
      flex: 1;
      min-width: 6rem;
      padding: 0.65rem 0.85rem;
      border-radius: 999px;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: white;
    }

    .traffic-level.low { background: #22c55e; }
    .traffic-level.moderate { background: #f59e0b; }
    .traffic-level.high { background: #f97316; }
    .traffic-level.severe { background: #dc2626; }

    @media (max-width: 1024px) {
      .dashboard-grid,
      .secondary-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .dashboard-shell {
        padding: 1rem;
      }

      .dashboard-hero,
      .panel,
      .stats-grid,
      .map-footer,
      .hero-meta {
        width: 100%;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .sensor-stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
  standalone: true,
})
export class DashboardComponent implements OnInit {
  today = formatDateLabel();
  dashboardLocation = 'Sousse, Tunisia';
  dashboardMapUrl: SafeResourceUrl;
  trafficMapUrl: SafeResourceUrl;
  weatherLoading = true;
  weatherError: string | null = null;
  weather: WeatherData = {
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    condition: '',
    lastUpdated: 'N/A',
    daily: [],
  };

  get weatherSummary(): string {
    return this.weatherLoading ? 'Loading...' : `${this.weather.condition} · ${this.weather.temperature}°C`;
  }

  get weatherTemperature(): string {
    return this.weatherLoading ? '—' : `${this.weather.temperature}°C`;
  }

  get weatherHumidity(): string {
    return this.weatherLoading ? '—' : `${this.weather.humidity}%`;
  }

  get weatherCondition(): string {
    return this.weather.condition || '—';
  }
  connectedSensors = dateMetric(65, 92, 4);
  lastSync = formattedMinutesAgo();
  trafficLevel = trafficLevelFromDate();

  parkingRows = [
    { name: 'Parking Centre', detail: 'Sousse Centre', spots: dateMetric(45, 70, 5), status: 'green' },
    { name: 'Parking Sahloul', detail: 'Zone Sahloul', spots: dateMetric(18, 35, 6), status: 'yellow' },
    { name: 'Parking Hamem Sousse', detail: 'Route de la Corniche', spots: dateMetric(8, 18, 7), status: 'red' },
  ];

  averageOccupancy = dateMetric(52, 82, 8);
  dailyForecast: DailyWeather[] = [];
  sensorStats = [
    { icon: '✅', label: 'Active', value: dateMetric(60, 80, 9) },
    { icon: '📴', label: 'Offline', value: dateMetric(4, 10, 10) },
    { icon: '⚠️', label: 'Alerts', value: dateMetric(1, 6, 11) },
    { icon: '🔋', label: 'Battery Health', value: `${dateMetric(80, 95, 12)}%` },
    { icon: '📶', label: 'Signal Strength', value: `${dateMetric(3, 5, 13)} / 5` },
    { icon: '⏱️', label: 'Last Sync', value: formattedMinutesAgo() },
    { icon: '🌡️', label: 'Avg Temperature', value: `${dateFloat(25, 31, 14)}°C` },
    { icon: '💧', label: 'Avg Humidity', value: `${dateMetric(50, 70, 15)}%` },
    { icon: '🎯', label: 'Data Accuracy', value: `${dateMetric(96, 99, 16)}%` },
    { icon: '❌', label: 'Error Rate', value: `${(100 - dateMetric(94, 99, 17)) / 10}%` },
    { icon: '📡', label: 'Network Coverage', value: `${dateMetric(92, 99, 18)}%` },
    { icon: '⚡', label: 'Response Time', value: `${dateMetric(180, 260, 19)}ms` },
  ];

  get avgTemperatureDisplay(): string {
    const value = this.sensorStats.find((stat) => stat.label === 'Avg Temperature')?.value;
    return value !== undefined ? `${value}` : '—';
  }

  get avgHumidityDisplay(): string {
    const value = this.sensorStats.find((stat) => stat.label === 'Avg Humidity')?.value;
    return value !== undefined ? `${value}` : '—';
  }

  constructor(private router: Router, private weatherService: WeatherService, private sanitizer: DomSanitizer) {
    this.dashboardMapUrl = this.createMapUrl(this.dashboardLocation);
    this.trafficMapUrl = this.createTrafficMapUrl('Sousse Tunisia');
  }

  ngOnInit(): void {
    this.initWeather();
  }

  private initWeather(): void {
    console.log('Dashboard initWeather', typeof navigator, typeof window, navigator?.geolocation);
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          console.log('Dashboard geolocation success', latitude, longitude);
          this.dashboardLocation = `Current location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
          this.dashboardMapUrl = this.createMapUrl(this.dashboardLocation);
          this.loadWeather(latitude, longitude);
        },
        (err) => {
          console.warn('Dashboard geolocation failed, fallback to default', err);
          this.dashboardLocation = 'Sousse, Tunisia';
          this.dashboardMapUrl = this.createMapUrl(this.dashboardLocation);
          this.loadWeather(35.8287, 10.6367);
        },
        { timeout: 10000 }
      );
    } else {
      console.warn('Navigator geolocation not available, fallback to default');
      this.loadWeather(35.8287, 10.6367);
    }
  }

  private loadWeather(latitude: number, longitude: number): void {
    console.log('Dashboard loadWeather', latitude, longitude);
    this.weatherError = null;
    this.weatherService.getWeather(latitude, longitude).subscribe({
      next: (data) => {
        console.log('Dashboard weather data', data);
        this.weather = data;
        this.dailyForecast = data.daily;
        this.dashboardMapUrl = this.createMapUrl(`${this.dashboardLocation} ${data.condition} traffic`);
        this.trafficLevel = this.computeTrafficLevel(data);
        this.parkingRows = this.buildParkingRows(data);
        this.averageOccupancy = this.computeAverageOccupancy(this.parkingRows);
        this.weatherLoading = false;
      },
      error: (err) => {
        console.error('Dashboard weather load error', err);
        this.weatherError = 'Impossible de charger la météo pour le moment.';
        this.weather = {
          temperature: 0,
          humidity: 0,
          windSpeed: 0,
          condition: 'Unavailable',
          lastUpdated: 'N/A',
          daily: [],
        };
        this.dailyForecast = [];
        this.parkingRows = this.buildParkingRows(this.weather);
        this.averageOccupancy = this.computeAverageOccupancy(this.parkingRows);
        this.weatherLoading = false;
      },
    });
  }

  private createMapUrl(location: string): SafeResourceUrl {
    const query = encodeURIComponent(`${location}`);
    const url = `https://www.google.com/maps?q=${query}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private createTrafficMapUrl(location: string): SafeResourceUrl {
    const query = encodeURIComponent(location);
    const url = `https://www.google.com/maps?q=${query}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private computeTrafficLevel(weather: WeatherData): string {
    if (/thunderstorm|rain|snow|freezing/i.test(weather.condition)) {
      return 'High';
    }
    if (/cloud|fog|drizzle/i.test(weather.condition)) {
      return 'Moderate';
    }
    return 'Low';
  }

  private buildParkingRows(weather: WeatherData): Array<{ name: string; detail: string; spots: number; status: string }> {
    const rainy = /rain|thunderstorm|snow|freezing/i.test(weather.condition);
    const cloudy = /cloud|fog|drizzle/i.test(weather.condition);

    const factor = rainy ? 1.2 : cloudy ? 1.1 : 0.95;
    const createSpots = (base: number, offset: number) => {
      const spots = Math.round(Math.max(5, Math.min(95, dateMetric(base, base + 20, offset) * factor)));
      return spots;
    };

    const rows = [
      { name: 'Parking Centre', detail: 'Sousse Centre', spots: createSpots(45, 5), status: '' },
      { name: 'Parking Sahloul', detail: 'Zone Sahloul', spots: createSpots(30, 6), status: '' },
      { name: 'Parking Hamem Sousse', detail: 'Route de la Corniche', spots: createSpots(18, 7), status: '' },
    ];

    return rows.map((row) => ({
      ...row,
      status: this.getParkingStatus(row.spots),
    }));
  }

  private getParkingStatus(spots: number): string {
    if (spots <= 20) return 'red';
    if (spots <= 40) return 'yellow';
    return 'green';
  }

  private computeAverageOccupancy(rows: Array<{ name: string; detail: string; spots: number; status: string }>): number {
    if (!rows.length) {
      return 0;
    }
    const total = rows.reduce((sum, row) => sum + row.spots, 0);
    return Math.round(total / rows.length);
  }

  goToParking() {
    this.router.navigate(['/parking']);
  }
}
