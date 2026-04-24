export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  last_login?: string | null;
  role?: string;
  first_name?: string;
  photo?: string;
}
