export interface Parking {
  id: number;
  name: string;
  location: string;
  capacity: number;
  available_places: number;
  date: string;
  reserved?: number;
  created_at: string;
  updated_at: string;
}
