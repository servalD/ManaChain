import axios from "axios";
import { ServiceResult, ServiceErrorCode } from "./service.result";
import { IUser, RegisterData, LoginData, AuthResponse } from "@/types/user.types";
import { ApiService } from "./api.service";
import { toast } from "@/lib/toast";

export default class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthResponse | null> {
    try {
      const res = await axios.post(`${ApiService.baseURL}/auth/register`, {
        email: data.email,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
        age_range: data.age_range,
        interests: data.interests,
      });

      if (res.status === 201) {
        // Don't store token - user must verify email first
        toast({
          title: "Registration successful",
          description: "Please check your email to confirm your account",
          variant: "success",
        });
        
        return res.data;
      }
      return null;
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        switch (status) {
          case 400:
            if (data?.error?.includes("email")) {
              toast({
                title: "Email already in use",
                description: "This email is already associated with an account",
                variant: "error",
              });
            } else if (data?.error?.includes("username")) {
              toast({
                title: "Username already taken",
                description: "Please choose another username",
                variant: "error",
              });
            } else {
              toast({
                title: "Input error",
                description: data?.error || "Please check your information",
                variant: "error",
              });
            }
            break;
          case 500:
            toast({
              title: "Server error",
              description: "Temporary issue, please try again",
              variant: "error",
            });
            break;
          default:
            toast({
              title: "Registration error",
              description: data?.error || "An unexpected error occurred",
              variant: "error",
            });
        }
      } else if (err.request) {
        toast({
          title: "Connection error",
          description: "Unable to reach the server. Check your internet connection.",
          variant: "error",
        });
      } else {
        toast({
          title: "Registration error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }

  /**
   * Login user
   */
  static async login(email: string, password: string): Promise<AuthResponse | null> {
    try {
      const res = await axios.post(`${ApiService.baseURL}/auth/login`, {
        email: email,
        password: password,
      });

      if (res.status === 200) {
        localStorage.setItem("Token", res.data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
        
        toast({
          title: "Login successful",
          description: `Welcome ${res.data.user.username}`,
          variant: "success",
        });
        
        return res.data;
      }
      return null;
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        switch (status) {
          case 400:
            if (data?.error?.includes("verify") || data?.error?.includes("verification")) {
              toast({
                title: "Account not verified",
                description: data.error || "Please verify your email address before logging in",
                variant: "warning",
              });
            } else {
              toast({
                title: "Input error",
                description: data?.error || "Please check your login credentials",
                variant: "error",
              });
            }
            break;
          case 401:
            if (data?.error?.includes("verify") || data?.error?.includes("verification")) {
              toast({
                title: "Account not verified",
                description: data.error || "Please verify your email address before logging in",
                variant: "warning",
              });
            } else {
              toast({
                title: "Authentication failed",
                description: "Incorrect email or password",
                variant: "error",
              });
            }
            break;
          case 404:
            toast({
              title: "User not found",
              description: "No account associated with this email",
              variant: "error",
            });
            break;
          case 500:
            if (data && typeof data === 'string') {
              if (data.includes("Invalid") || data.includes("incorrect")) {
                toast({
                  title: "Authentication failed",
                  description: "Incorrect email or password",
                  variant: "error",
                });
              } else {
                toast({
                  title: "Server error",
                  description: data,
                  variant: "error",
                });
              }
            } else {
              toast({
                title: "Server error",
                description: "Temporary issue, please try again",
                variant: "error",
              });
            }
            break;
          default:
            toast({
              title: "Connection error",
              description: data?.error || "An unexpected error occurred",
              variant: "error",
            });
        }
      } else if (err.request) {
        toast({
          title: "Connection error",
          description: "Unable to reach the server. Check your internet connection.",
          variant: "error",
        });
      } else {
        if (err.message && err.message.includes("Invalid")) {
          toast({
            title: "Authentication failed",
            description: "Incorrect email or password",
            variant: "error",
          });
        } else {
          toast({
            title: "Connection error",
            description: "An unexpected error occurred",
            variant: "error",
          });
        }
      }
      return null;
    }
  }

  /**
   * Check if user is logged in and return user data
   */
  static async isLogged(): Promise<ServiceResult<IUser>> {
    try {
      let token = localStorage.getItem("Token");
      if (token != null) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const res = await axios.get(`${ApiService.baseURL}/users/from-token/${token}`);
        
        if (res.status === 200) {
          return ServiceResult.success(res.data.user);
        } else {
          return ServiceResult.notFound();
        }
      } else {
        return ServiceResult.notFound();
      }
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;

        switch (status) {
          case 401:
            toast({
              title: "Session expired",
              description: "Please log in again",
              variant: "warning",
            });
            this.logout();
            break;
          case 403:
            toast({
              title: "Access denied",
              description: "You don't have the necessary permissions",
              variant: "error",
            });
            break;
          case 404:
            toast({
              title: "User not found",
              description: "Your account no longer exists",
              variant: "warning",
            });
            this.logout();
            break;
          default:
            toast({
              title: "Authentication error",
              description: "Problem verifying your session",
              variant: "error",
            });
        }
      } else if (err.request) {
        toast({
          title: "Connection error",
          description: "Unable to reach the server",
          variant: "error",
        });
      }
      return ServiceResult.failed();
    }
  }

  /**
   * Get the authentication token from localStorage
   */
  static getToken(): string | null {
    return localStorage.getItem("Token");
  }

  /**
   * Get current user or redirect to login
   */
  static async getUser(): Promise<IUser | undefined> {
    const user = await AuthService.isLogged();

    if (user && user.errorCode === ServiceErrorCode.success) {
      return user.result;
    } else {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return undefined;
    }
  }

  /**
   * Logout user
   */
  static async logout() {
    try {
      const token = localStorage.getItem("Token");
      
      // No server-side logout endpoint, just clear local storage
      localStorage.removeItem("Token");
      delete axios.defaults.headers.common["Authorization"];

      toast({
        title: "Logout successful",
        description: "See you soon on Mana Chain",
        variant: "default",
      });

      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.removeItem("Token");
      delete axios.defaults.headers.common["Authorization"];

      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }

  /**
   * Validate if token is still valid
   */
  static async validateToken(): Promise<boolean> {
    try {
      const token = localStorage.getItem("Token");
      if (!token) return false;

      const user = await this.isLogged();
      return user && user.errorCode === ServiceErrorCode.success;
    } catch (err) {
      return false;
    }
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<boolean> {
    try {
      const res = await axios.post(`${ApiService.baseURL}/auth/verify-email`, {
        token: token,
      });

      if (res.status === 200) {
        toast({
          title: "Email verified",
          description: "Your account has been successfully activated",
          variant: "success",
        });
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.response) {
        const data = err.response.data;
        toast({
          title: "Verification error",
          description: data?.error || "The verification link is invalid or expired",
          variant: "error",
        });
      } else {
        toast({
          title: "Connection error",
          description: "Unable to reach the server",
          variant: "error",
        });
      }
      return false;
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerification(email: string): Promise<boolean> {
    try {
      const res = await axios.post(`${ApiService.baseURL}/auth/resend-verification`, {
        email: email,
      });

      if (res.status === 200) {
        toast({
          title: "Email sent",
          description: "A new verification link has been sent",
          variant: "success",
        });
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.response) {
        const data = err.response.data;
        toast({
          title: "Sending error",
          description: data?.error || "Unable to send verification email",
          variant: "error",
        });
      } else {
        toast({
          title: "Connection error",
          description: "Unable to reach the server",
          variant: "error",
        });
      }
      return false;
    }
  }

  /**
   * Change password (authenticated user)
   */
  static async changePassword(newPassword: string): Promise<boolean> {
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        toast({
          title: "Not authenticated",
          description: "Please log in",
          variant: "error",
        });
        return false;
      }

      const res = await axios.post(
        `${ApiService.baseURL}/auth/change-password`,
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        toast({
          title: "Password changed",
          description: "Your password has been successfully updated",
          variant: "success",
        });
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.response) {
        const data = err.response.data;
        toast({
          title: "Modification error",
          description: data?.error || "Unable to change password",
          variant: "error",
        });
      } else {
        toast({
          title: "Connection error",
          description: "Unable to reach the server",
          variant: "error",
        });
      }
      return false;
    }
  }

  /**
   * Reset password with token (forgot password flow)
   */
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const res = await axios.post(
        `${ApiService.baseURL}/auth/reset-password`,
        { token, new_password: newPassword }
      );

      if (res.status === 200) {
        toast({
          title: "Password reset",
          description: "Your password has been successfully updated. You can now log in.",
          variant: "success",
        });
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.response) {
        const data = err.response.data;
        toast({
          title: "Reset failed",
          description: data?.error || "Unable to reset password. The link may have expired.",
          variant: "error",
        });
      } else {
        toast({
          title: "Connection error",
          description: "Unable to reach the server",
          variant: "error",
        });
      }
      return false;
    }
  }

  /**
   * Request password reset email (forgot password)
   */
  static async forgotPassword(email: string): Promise<boolean> {
    try {
      await axios.post(`${ApiService.baseURL}/auth/forgot-password`, { email });
      toast({
        title: "Check your email",
        description: "If an account exists with this email, you will receive a password reset link.",
        variant: "success",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Check your email",
        description: "If an account exists with this email, you will receive a password reset link.",
        variant: "default",
      });
      return true;
    }
  }

  /**
   * Update current user profile (first_name, last_name, username, avatar_url)
   */
  static async updateProfile(updates: {
    first_name?: string;
    last_name?: string;
    username?: string;
    avatar_url?: string;
  }): Promise<IUser | null> {
    try {
      const token = AuthService.getToken();
      if (!token) return null;

      const response = await axios.put(
        `${ApiService.baseURL}/users/me`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.user) {
        toast({
          title: 'Profile updated',
          description: 'Your profile has been saved.',
          variant: 'success',
        });
        return response.data.user;
      }
      return null;
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to update profile. Please try again.';
      toast({
        title: 'Error',
        description: msg,
        variant: 'error',
      });
      return null;
    }
  }

  /**
   * Update blockchain address
   */
  static async updateBlockchainAddress(blockchainAddress: string): Promise<boolean> {
    try {
      const token = localStorage.getItem("Token");
      if (!token) return false;

      const response = await axios.put(
        `${ApiService.baseURL}/users/me/blockchain-address`,
        { blockchain_address: blockchainAddress },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.user) {
        // Update local user cache
        const currentUser = this.getUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, blockchain_address: blockchainAddress };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return true;
      }
      return false;
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast({
          title: 'Error',
          description: error.response.data.error,
          variant: 'error',
        });
      }
      return false;
    }
  }
}
