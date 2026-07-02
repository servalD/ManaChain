import axios from "axios";
import { ApiService } from "./api.service";
import { GetUsersParams, GetUsersResponse, GetActiveBrandsParams, GetActiveBrandsResponse, User } from "@/types/admin.types";

export default class AdminService {
  /**
   * Get all users, filtered/paginated client-side (admin only).
   * The back exposes `GET /users` as a flat, unpaginated admin listing.
   */
  static async getUsers(params: GetUsersParams = {}, token: string): Promise<GetUsersResponse | null> {
    try {
      const res = await axios.get<User[]>(`${ApiService.baseURL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let users = res.data;
      if (params.role) {
        users = users.filter((u) => u.role === params.role);
      }
      if (params.search) {
        const search = params.search.toLowerCase();
        users = users.filter(
          (u) =>
            u.username.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search) ||
            u.id.toLowerCase().includes(search)
        );
      }

      const total = users.length;
      const offset = params.offset ?? 0;
      const limit = params.limit ?? total;
      return { users: users.slice(offset, offset + limit), total };
    } catch (err: any) {
      console.error('Error fetching users:', err);
      return null;
    }
  }

  /**
   * Get all active brands with pagination and search (admin only)
   */
  static async getActiveBrands(params: GetActiveBrandsParams = {}, token: string): Promise<GetActiveBrandsResponse | null> {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.search) queryParams.append('search', params.search);

      const res = await axios.get(
        `${ApiService.baseURL}/brands/admin/active?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return res.data;
    } catch (err: any) {
      console.error('Error fetching active brands:', err);
      return null;
    }
  }
}
