export interface CreateUserRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  age_range: string;
  email_verification_token?: string;
  email_verification_expires?: string;
  verified?: boolean;
  is_brand?: boolean;
  interests?: string[];
}

export interface UpdateUserRequest {
  userId: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  age_range?: string;
  blockchain_address?: string;
}

export interface UpdateBlockchainAddressRequest {
  userId: string;
  blockchain_address: string;
}

export interface UpdateUserInterestsRequest {
  userId: string;
  interestIds: string[];
}

export interface GetUsersFilters {
  search?: string;
  role?: 'ADMIN' | 'CLIENT' | 'BRANDUSER';
}

export interface GetUsersRequest {
  limit: number;
  offset: number;
  filters?: GetUsersFilters;
}
