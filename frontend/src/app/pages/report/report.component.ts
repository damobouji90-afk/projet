/// <reference types="leaflet" />
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '../../services/complaint.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';
import * as L from 'leaflet';

interface ProblemCategory {
  key: 'trafic' | 'parking' | 'éclairage' | 'infrastructure' | 'déchets' | 'sensors';
  name: string;
  icon: string;
  problems: ProblemType[];
  details: string[];
  objective?: string;
}

interface ProblemType {
  label: string;
  value: string;
}

@Component({
  selector: 'app-report',
  imports: [CommonModule, FormsModule],
  templateUrl: './report.html',
  styleUrls: ['./report.css'],
})
export class ReportComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  map: L.Map | null = null;
  marker: L.Marker | null = null;
  selectedFile: File | null = null;
  imagePreview = '';
  description = '';
  selectedCategory: ProblemCategory['key'] | '' = '';
  selectedProblem = '';
  latitude: number | null = null;
  longitude: number | null = null;
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';
  locationMessage = 'Cliquez sur la carte ou utilisez votre position actuelle.';

  readonly categories: ProblemCategory[] = [
    {
      key: 'trafic',
      name: 'Trafic',
      icon: '🚗',
      problems: [
        { label: '🚗 Embouteillage', value: 'Embouteillage' },
        { label: '🚑 Accident de circulation', value: 'Accident de circulation' },
        { label: '🚦 Feux de signalisation en panne', value: 'Feux de signalisation en panne' },
        { label: '🚧 Route bloquée', value: 'Route bloquée' }
      ],
      details: [
        '🚗 Embouteillage',
        '🚑 Accident de circulation',
        '🚦 Feux de signalisation en panne',
        '🚧 Route bloquée'
      ]
    },
    {
      key: 'parking',
      name: 'Parking',
      icon: '🅿️',
      problems: [
        { label: '🅿️ Parking saturé', value: 'Parking saturé' },
        { label: '🚫 Stationnement illégal', value: 'Stationnement illégal' },
        { label: '❌ Manque de places', value: 'Manque de places' },
        { label: '📍 Mauvaise gestion des zones', value: 'Mauvaise gestion des zones' }
      ],
      details: [
        '🅿️ Parking saturé',
        '🚫 Stationnement illégal',
        '❌ Manque de places',
        '📍 Mauvaise gestion des zones'
      ],
      objective: ''
    },
    {
      key: 'éclairage',
      name: 'Éclairage public',
      icon: '💡',
      problems: [
        { label: '💡 Lampadaire cassé', value: 'Lampadaire cassé' },
        { label: '🌑 Rue sans lumière', value: 'Rue sans lumière' },
        { label: '⚡ Panne électrique d’éclairage', value: 'Panne électrique d’éclairage' },
        { label: '🔦 Éclairage faible', value: 'Éclairage faible' }
      ],
      details: [
        '💡 Lampadaire cassé',
        '🌑 Rue sans lumière',
        '⚡ Panne électrique d’éclairage',
        '🔦 Éclairage faible'
      ]
    },
    {
      key: 'infrastructure',
      name: 'Infrastructure',
      icon: '🚧',
      problems: [
        { label: '🕳️ Trous dans la route', value: 'Trous dans la route' },
        { label: '🧱 Trottoirs cassés', value: 'Trottoirs cassés' },
        { label: '🚧 Routes dégradées', value: 'Routes dégradées' },
        { label: '🏚️ Infrastructure abîmée', value: 'Infrastructure abîmée' }
      ],
      details: [
        '🕳️ Trous dans la route',
        '🧱 Trottoirs cassés',
        '🚧 Routes dégradées',
        '🏚️ Infrastructure abîmée'
      ]
    },
    {
      key: 'déchets',
      name: 'Déchets / Propreté',
      icon: '🗑️',
      problems: [
        { label: '🗑️ Poubelles pleines', value: 'Poubelles pleines' },
        { label: '🧴 Déchets dans la rue', value: 'Déchets dans la rue' },
        { label: '🚛 Retard de collecte', value: 'Retard de collecte' },
        { label: '🧹 Mauvaise hygiène urbaine', value: 'Mauvaise hygiène urbaine' }
      ],
      details: [
        '🗑️ Poubelles pleines',
        '🧴 Déchets dans la rue',
        '🚛 Retard de collecte',
        '🧹 Mauvaise hygiène urbaine'
      ]
    },
    {
      key: 'sensors',
      name: 'Sensors (Smart City)',
      icon: '🌡️',
      problems: [
        { label: '📉 Données incorrectes', value: 'Données incorrectes' },
        { label: '🔌 Capteur en panne', value: 'Capteur en panne' },
        { label: '⚠️ Système hors service', value: 'Système hors service' },
        { label: '📡 Problème de communication', value: 'Problème de communication' }
      ],
      details: [
        '📉 Données incorrectes',
        '🔌 Capteur en panne',
        '⚠️ Système hors service',
        '📡 Problème de communication'
      ],
      objective: ''
    }
  ];

  constructor(
    private readonly complaintService: ComplaintService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const role = localStorage.getItem('role');
    if (role !== 'citoyen' && role !== 'citizen') {
      this.router.navigate(['/dashboard']);
      return;
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  initMap(): void {
    if (!this.mapContainer?.nativeElement) {
      return;
    }

    this.map = L.map(this.mapContainer.nativeElement).setView([35.8256, 10.6084], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.map.on('click', (event: any) => {
      const latitude = event.latlng.lat;
      const longitude = event.latlng.lng;

      const map = this.map;
      if (!map || latitude == null || longitude == null) {
        return;
      }

      this.latitude = latitude;
      this.longitude = longitude;
      this.locationMessage = `Position sélectionnée: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      if (this.marker) {
        map.removeLayer(this.marker);
      }

      this.marker = L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(`📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        .openPopup();
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.submitError = 'Géolocalisation non supportée par votre navigateur.';
      return;
    }

    this.submitError = '';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const map = this.map;
        if (!map) {
          return;
        }

        this.latitude = latitude;
        this.longitude = longitude;
        this.locationMessage = 'Position actuelle détectée.';
        map.setView([latitude, longitude], 16);

        if (this.marker) {
          map.removeLayer(this.marker);
        }

        this.marker = L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup(`📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
          .openPopup();
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        this.submitError = 'Impossible d\'obtenir la localisation. Autorisez la géolocalisation.';
      }
    );
  }

  onCategoryChange(): void {
    this.selectedProblem = '';
  }

  private getStoredCurrentUser(): User | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const stored = localStorage.getItem('current_user');
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }

  sendSignal(): void {
    console.log('sendSignal called');

    if (!this.selectedFile || !this.selectedCategory || !this.selectedProblem) {
      console.log('sendSignal validation failed', {
        selectedFile: !!this.selectedFile,
        selectedCategory: this.selectedCategory,
        selectedProblem: this.selectedProblem,
      });
      this.submitError = 'Tous les champs obligatoires doivent être remplis : photo, catégorie et type de problème.';
      this.submitSuccess = false;
      return;
    }

    if (this.latitude === null || this.longitude === null) {
      console.log('sendSignal missing location', { latitude: this.latitude, longitude: this.longitude });
      this.submitError = 'Veuillez sélectionner une localisation sur la carte ou utiliser la localisation GPS.';
      this.submitSuccess = false;
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = false;

    const formData = new FormData();
    formData.append('description', this.description.trim() || this.selectedProblem || 'Signalement sans description');
    formData.append('location', `${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)}`);
    formData.append('type_probleme', this.selectedProblem);
    formData.append('problem_type', this.selectedProblem);
    formData.append('category', this.selectedCategory);
    formData.append('latitude', this.latitude.toString());
    formData.append('longitude', this.longitude.toString());
    formData.append('image', this.selectedFile);

    const currentUser = this.authService.getCurrentUser() || this.getStoredCurrentUser();
    const citizenFirstName = currentUser?.first_name || currentUser?.name || 'Citoyen';
    const citizenPhoto = this.authService.getUserAvatar() || currentUser?.photo || '';

    formData.append('citizen_first_name', citizenFirstName);
    formData.append('citizen_photo', citizenPhoto);

    console.log('FormData ready for sendSignal', {
      description: this.description,
      location: `${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)}`,
      type_probleme: this.selectedProblem,
      problem_type: this.selectedProblem,
      category: this.selectedCategory,
      latitude: this.latitude,
      longitude: this.longitude,
      citizen_first_name: citizenFirstName,
      citizen_photo: citizenPhoto,
      image: this.selectedFile?.name,
    });

    this.complaintService.createComplaint(formData).subscribe({
      next: () => {
        console.log('API response received: success');
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.submitError = '';
        this.resetForm();
      },
      error: (error) => {
        console.log('API response received: error', error);
        this.isSubmitting = false;
        this.submitSuccess = false;
        this.submitError = error.error?.message || 'Erreur lors de l\'envoi du signalement.';
        console.error(error);
      }
    });
  }

  private resetForm(): void {
    this.selectedFile = null;
    this.imagePreview = '';
    this.description = '';
    this.selectedCategory = '';
    this.selectedProblem = '';
    this.latitude = null;
    this.longitude = null;
    this.locationMessage = 'Cliquez sur la carte ou utilisez votre position actuelle.';

    if (this.marker && this.map) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
  }
}