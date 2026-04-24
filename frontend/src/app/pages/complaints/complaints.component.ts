import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '../../services/complaint.service';
import { Complaint } from '../../models';

@Component({
  selector: 'app-complaints',
  imports: [CommonModule, FormsModule],
  templateUrl: './complaints.html',
  styleUrls: ['./complaints.css'],
})
export class ComplaintsComponent implements OnInit {
  private complaintService = inject(ComplaintService);

  complaints: Complaint[] = [];
  filteredComplaints: Complaint[] = [];
  loading = true;
  error = '';
  statusMessage = '';

  searchTerm = '';
  filterCategory = '';
  filterStatus = '';
  filterPriority = '';

  ngOnInit(): void {
    console.log('ComplaintsComponent initialized');
    this.loadComplaints();
    this.complaintService.complaintCreated$.subscribe(() => {
      console.log('New complaint created, reloading...');
      this.loadComplaints();
    });
  }

  private loadComplaints(): void {
    console.log('Starting to load complaints...');
    this.loading = true;
    this.error = '';
    this.statusMessage = 'Chargement des signalements...';

    this.complaintService.getComplaints().subscribe({
      next: (data) => {
        console.log('Loaded complaints successfully:', data);
        console.log('Number of complaints:', data.length);
        this.complaints = data;
        this.filteredComplaints = [...this.complaints];
        console.log('complaints set:', this.complaints);
        console.log('filteredComplaints set:', this.filteredComplaints);
        this.applyFilters();
        this.loading = false;
        if (data.length === 0) {
          this.statusMessage = 'Aucun signalement trouvé pour le moment.';
        } else {
          this.statusMessage = `Chargé ${data.length} signalement(s).`;
        }
      },
      error: (err) => {
        console.error('Error loading complaints:', err);
        this.error = 'Erreur lors du chargement des plaintes';
        this.statusMessage = 'Impossible de charger les signalements.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredComplaints = this.complaints.filter(complaint => {
      const matchesSearch = !this.searchTerm ||
        complaint.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        complaint.location.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = !this.filterCategory || complaint.category === this.filterCategory;
      const matchesStatus = !this.filterStatus || complaint.status === this.filterStatus;
      const matchesPriority = !this.filterPriority || complaint.priority === this.filterPriority;

      return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
    });
  }

  private categoryStyles: Record<string, { icon: string; label: string; color: string }> = {
    'trafic': { icon: '🚗', label: 'Trafic', color: '#e74c3c' },
    'parking': { icon: '🅿️', label: 'Parking', color: '#3498db' },
    'éclairage': { icon: '💡', label: 'Éclairage public', color: '#f1c40f' },
    'infrastructure': { icon: '🚧', label: 'Infrastructure', color: '#7f8c8d' },
    'sensors': { icon: '🌡️', label: 'Sensors (capteurs)', color: '#9b59b6' },
    'déchets': { icon: '🗑️', label: 'Déchets', color: '#2ecc71' }
  };

  getCategoryColor(category: string): string {
    return this.categoryStyles[category]?.color || '#94a3b8';
  }

  getCategoryLabel(category: string): string {
    const style = this.categoryStyles[category];
    return style ? `${style.icon} ${style.label}` : category;
  }

  getComplaintImage(complaint: Complaint): string {
    const imageSource = complaint.image_preview || complaint.image;
    if (!imageSource) {
      return '';
    }
    if (imageSource.startsWith('data:') || imageSource.startsWith('http')) {
      return imageSource;
    }
    return `http://localhost:8000/uploads/${imageSource}`;
  }

  getCitizenAvatar(complaint: Complaint): string | null {
    const avatar = complaint.user?.photo;
    if (!avatar) {
      return null;
    }
    if (avatar.startsWith('data:') || avatar.startsWith('http')) {
      return avatar;
    }
    return `http://localhost:8000/uploads/${avatar}`;
  }

  getSeverityLabel(complaint: Complaint): string {
    const problem = (complaint.problem_type || complaint.description || '').toLowerCase();
    switch (complaint.category) {
      case 'trafic':
        if (problem.includes('accident') || problem.includes('route bloquée')) return '🔴 Élevé';
        if (problem.includes('embouteillage')) return '🟠 Moyen';
        return '🟢 Faible';
      case 'parking':
        if (problem.includes('parking saturé')) return '🔴 Élevé';
        if (problem.includes('stationnement') || problem.includes('illégal')) return '🟠 Moyen';
        return '🟢 Faible';
      case 'éclairage':
        if (problem.includes('lumière éteinte')) return '🔴 Élevé';
        if (problem.includes('panne électrique') || problem.includes('lampadaire cassé')) return '🟠 Moyen';
        return '🟢 Faible';
      case 'infrastructure':
        if (problem.includes('chaussée dégradée')) return '🔴 Élevé';
        if (problem.includes('trottoir cassé') || problem.includes('trous')) return '🟠 Moyen';
        return '🟢 Faible';
      case 'sensors':
        if (problem.includes('panne')) return '🔴 Élevé';
        if (problem.includes('capteur') || problem.includes('instable')) return '🟠 Moyen';
        return '🟢 Faible';
      case 'déchets':
        if (problem.includes('retard')) return '🔴 Élevé';
        if (problem.includes('déchets') || problem.includes('rue')) return '🟠 Moyen';
        return '🟢 Faible';
      default:
        return '';
    }
  }

  getSeverityLevel(complaint: Complaint): string {
    const label = this.getSeverityLabel(complaint);
    if (label.startsWith('🔴')) return 'severity-high';
    if (label.startsWith('🟠')) return 'severity-medium';
    if (label.startsWith('🟢')) return 'severity-low';
    return '';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'pending';
      case 'in_progress': return 'in-progress';
      case 'resolved': return 'resolved';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return '⏳ En attente';
      case 'in_progress': return '🔄 En cours';
      case 'resolved': return '✅ Résolu';
      default: return '';
    }
  }

  onStatusChange(complaint: Complaint): void {
    if (complaint.status !== 'resolved') {
      complaint.resolution = undefined;
    }
  }

  saveComplaint(complaint: Complaint): void {
    this.complaintService.updateComplaint(complaint.id, complaint).subscribe({
      next: () => {
        // Success - maybe show a message
        console.log('Plainte mise à jour');
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour', err);
      }
    });
  }

  testApiConnection(): void {
    console.log('Testing API connection...');
    this.complaintService.getComplaints().subscribe({
      next: (data) => {
        console.log('API test successful:', data);
        alert('API fonctionne! Nombre de plaintes: ' + data.length);
      },
      error: (err) => {
        console.error('API test failed:', err);
        alert('Erreur API: ' + JSON.stringify(err));
      }
    });
  }
}
