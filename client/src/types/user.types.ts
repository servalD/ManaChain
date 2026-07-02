export interface IUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  ageRange: string;
  blockchainAddress: string | null;
  verified: boolean;
  isBrand: boolean;
  role: 'CLIENT' | 'BRANDUSER' | 'ADMIN';
  passwordChanged: boolean;
  createdAt: string;
}

export interface RegisterData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  ageRange: string;
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
