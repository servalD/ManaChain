export interface CreateUserRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password_hash: string;
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
}

export interface UpdateUserInterestsRequest {
  userId: string;
  interestIds: string[];
}
