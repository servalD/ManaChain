import axios from 'axios';
import { toast } from '@/lib/toast';
import { ApiService } from './api.service';
import AuthService from './auth.service';
import {
  CreateLikeResponse,
  GetLikesResponse,
  GetBrandLikesResponse,
} from '@/types/like.types';

const API_URL = ApiService.baseURL;

class LikeService {
  /**
   * Create a like for a brand
   */
  async createLike(brandId: string): Promise<CreateLikeResponse | null> {
    try {
      const token = AuthService.getToken();
      if (!token) {
        // This shouldn't happen if user is authenticated, but handle gracefully
        console.error('No token found - user should be redirected by RoleProtectedRoute');
        return null;
      }

      const response = await axios.post(
        `${API_URL}/likes`,
        { brandId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: 'Brand Liked!',
        description: 'You have successfully liked this brand.',
        variant: 'success',
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to like brand. Please try again.';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
      return null;
    }
  }

  /**
   * Remove a like (dislike) - user can only remove their own like
   */
  async deleteLike(likeId: string): Promise<{ success: boolean; message?: string } | null> {
    try {
      const token = AuthService.getToken();
      if (!token) {
        return null;
      }

      await axios.delete(`${API_URL}/likes/${likeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'Like removed',
        description: "You've removed this brand from your liked list.",
        variant: 'success',
      });
      return { success: true };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to remove like. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
      return null;
    }
  }

  /**
   * Get current user's likes
   */
  async getUserLikes(): Promise<GetLikesResponse | null> {
    try {
      const token = AuthService.getToken();
      if (!token) {
        return null;
      }

      const response = await axios.get(`${API_URL}/likes/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching user likes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your liked brands.',
        variant: 'error',
      });
      return null;
    }
  }

  /**
   * Get likes for a brand (brand owner only)
   */
  async getBrandLikes(brandId: string): Promise<GetBrandLikesResponse | null> {
    try {
      const token = AuthService.getToken();
      if (!token) {
        return null;
      }

      const response = await axios.get(`${API_URL}/likes/brand/${brandId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching brand likes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch brand likes.',
        variant: 'error',
      });
      return null;
    }
  }
}

export default new LikeService();
