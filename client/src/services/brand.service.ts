import axios from "axios";
import { ApiService } from "./api.service";
import { toast } from "@/lib/toast";
import AuthService from "./auth.service";
import { BrandFromAPI, GetBrandsResponse, BrandStats } from "@/types/brand.types";
import { BrandMedia, ConfirmBrandMediaRequest, GetBrandMediaResponse } from "@/types/brand-media.types";


class BrandService {
  /**
   * Get all brands with pagination
   */
  async getAllBrands(
    limit: number = 50,
    offset: number = 0,
    excludeBrandIds?: string[]
  ): Promise<GetBrandsResponse | null> {
    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Nest attend des clés répétées (`excludeBrandIds=a&excludeBrandIds=b`),
      // pas le format `excludeBrandIds[]=` qu'axios produit par défaut pour un
      // tableau : on construit la query string nous-mêmes.
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      excludeBrandIds?.forEach((id) => params.append("excludeBrandIds", id));

      const response = await axios.get<GetBrandsResponse>(
        `${ApiService.baseURL}/brands`,
        { params, headers }
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

      const response = await axios.get<BrandFromAPI>(
        `${ApiService.baseURL}/brands/${brandId}`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error fetching brand:", error);
      return null;
    }
  }

  /**
   * Get current user's brand
   */
  async getMyBrand(): Promise<BrandFromAPI | null> {
    try {
      const token = AuthService.getToken();
      if (!token) {
        return null;
      }

      const response = await axios.get<BrandFromAPI>(
        `${ApiService.baseURL}/brands/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error fetching my brand:", error);
      if (error.response?.status === 404) {
        // Brand not found for this user
        return null;
      }
      return null;
    }
  }

  /**
   * Get brand statistics (token holders, total raised, etc.)
   */
  async getBrandStats(brandId: string): Promise<BrandStats | null> {
    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get<BrandStats>(
        `${ApiService.baseURL}/brands/${brandId}/stats`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error fetching brand stats:", error);
      if (error.response?.status === 404) {
        // Brand stats not found (no token yet)
        return null;
      }
      return null;
    }
  }

  /**
   * Confirm and save a brand media that was already uploaded to Pinata
   */
  async confirmBrandMedia(brandId: string, ipfsHash: string, ipfsUrl: string): Promise<BrandMedia | null> {
    try {
      const token = AuthService.getToken();
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to confirm media",
          variant: "error",
        });
        return null;
      }

      const request: ConfirmBrandMediaRequest = { ipfsHash, imageUrl: ipfsUrl };
      const response = await axios.post<BrandMedia>(
        `${ApiService.baseURL}/brands/${brandId}/media/confirm`,
        request,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error confirming brand media:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to confirm media. Please try again.",
        variant: "error",
      });
      return null;
    }
  }

  /**
   * Get all media for a brand
   */
  async getBrandMedia(brandId: string): Promise<BrandMedia[]> {
    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get<GetBrandMediaResponse>(
        `${ApiService.baseURL}/brands/${brandId}/media`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error fetching brand media:", error);
      return [];
    }
  }

  /**
   * Delete a brand media
   */
  async deleteBrandMedia(brandId: string, mediaId: string): Promise<boolean> {
    try {
      const token = AuthService.getToken();
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to delete media",
          variant: "error",
        });
        return false;
      }

      await axios.delete(
        `${ApiService.baseURL}/brands/${brandId}/media/${mediaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return true;
    } catch (error: any) {
      console.error("Error deleting brand media:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete media. Please try again.",
        variant: "error",
      });
      return false;
    }
  }
}

export default new BrandService();
