import { User } from './user.model';

export interface Complaint {
  id: number;
  image: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  date: string;
  status: 'pending' | 'in_progress' | 'resolved';
  category: 'éclairage' | 'infrastructure' | 'trafic' | 'parking' | 'sensors' | 'déchets';
  problem_type?: string;
  type_probleme?: string;
  priority: 'low' | 'medium' | 'high';
  resolution?: string;
  image_preview?: string;
  user?: User;
}