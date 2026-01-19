export interface IUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  age_range: string;
  blockchain_address?: string;
  verified: boolean;
  is_brand: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  age_range: string;
  interests?: string[];
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUser;
  token: string | null;
  message?: string;
}
