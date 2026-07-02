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
}

export interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'CLIENT' | 'BRANDUSER' | 'ADMIN';
    verified: boolean;
    avatarUrl: string | null;
    createdAt: string;
}

export interface GetActiveBrandsParams {
    limit?: number;
    offset?: number;
    search?: string;
}

export interface GetActiveBrandsResponse {
    brands: BrandFromAPI[];
    total: number;
}
