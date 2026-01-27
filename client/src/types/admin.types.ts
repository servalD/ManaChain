import { BrandFromAPI } from "./brand.types";

export interface GetUsersParams {
    limit?: number;
    offset?: number;
    search?: string;
    role?: 'ADMIN' | 'CLIENT' | 'BRANDUSER';
}

export interface GetUsersResponse {
    users: User[];
    total: number;
    limit: number;
    offset: number;
}

export interface User {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'CLIENT' | 'BRANDUSER' | 'ADMIN';
    verified: boolean;
    avatar_url: string | null;
    created_at: string;
}

export interface GetActiveBrandsParams {
    limit?: number;
    offset?: number;
    search?: string;
}

export interface GetActiveBrandsResponse {
    brands: BrandFromAPI[];
    total: number;
    limit: number;
    offset: number;
}