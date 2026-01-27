/**
 * Like Types
 * TypeScript interfaces for like-related data
 */

export interface ILike {
  id: string;
  user_id: string;
  brand_id: string;
  created_at: string;
}

export interface ILikeWithBrand extends ILike {
  brand: {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    website_url: string | null;
    business_registration_number: string | null;
    country: string;
    headquarters_street: string;
    headquarters_city: string;
    headquarters_zip_code: string;
    headquarters_address_complement: string | null;
    social_medias: Record<string, string> | null;
    created_at: string;
    updated_at: string;
  };
}

export interface ILikeWithUser extends ILike {
  user: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    age_range: string;
    blockchain_address: string | null;
    verified: boolean;
    is_brand: boolean;
    role: string;
    created_at: string;
    updated_at: string;
  };
}

export interface CreateLikeResponse {
  success: boolean;
  message: string;
  data?: ILike;
}

export interface GetLikesResponse {
  success: boolean;
  data: ILikeWithBrand[];
}

export interface GetBrandLikesResponse {
  success: boolean;
  data: ILikeWithUser[];
}
