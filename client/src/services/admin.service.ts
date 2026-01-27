import axios from "axios";
import { ApiService } from "./api.service";
import { BrandFromAPI } from "@/types/brand.types";
import { GetUsersParams, GetUsersResponse, GetActiveBrandsParams, GetActiveBrandsResponse } from "@/types/admin.types";

export default class AdminService {
  /**
   * Get all users with pagination and search (admin only)
   */
  static async getUsers(params: GetUsersParams = {}, token: string): Promise<GetUsersResponse | null> {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.role) queryParams.append('role', params.role);

      const res = await axios.get(
        `${ApiService.baseURL}/users?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return res.data;
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
