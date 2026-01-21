import axios from "axios";
import { ApiService } from "./api.service";
import { toast } from "@/lib/toast";
import AuthService from "./auth.service";
import { BrandFromAPI, GetBrandsResponse } from "@/types/brand.types";

class BrandService {
  /**
   * Get all brands with pagination
   */
  async getAllBrands(limit: number = 50, offset: number = 0): Promise<GetBrandsResponse | null> {
    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get<GetBrandsResponse>(
        `${ApiService.baseURL}/brands`,
        {
          params: { limit, offset },
          headers,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error fetching brands:", error);
      toast({
        title: "Error",
        description: "Failed to load brands. Please try again.",
        variant: "error",
      });
      return null;
    }
  }

  /**
   * Get brand by ID
   */
  async getBrandById(brandId: string): Promise<BrandFromAPI | null> {
    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get<{ brand: BrandFromAPI }>(
        `${ApiService.baseURL}/brands/${brandId}`,
        { headers }
      );

      return response.data.brand;
    } catch (error: any) {
      console.error("Error fetching brand:", error);
      return null;
    }
  }
}

export default new BrandService();
