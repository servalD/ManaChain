import axios from "axios";
import { ServiceResult, ServiceErrorCode } from "./service.result";
import { IUser, RegisterData, AuthResponse } from "@/types/user.types";
import { ApiService } from "./api.service";
import { toast } from "@/lib/toast";
import { asAxiosError } from "@/lib/api-error";

export default class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthResponse | null> {
    try {
      const res = await axios.post(`${ApiService.baseURL}/auth/register`, {
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        ageRange: data.ageRange,
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
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const status = axiosErr.response.status;
        const data = axiosErr.response.data;

        switch (status) {
          case 409:
            if (data?.error === "EmailAlreadyRegisteredError") {
              toast({
                title: "Email already in use",
                description: "This email is already associated with an account",
                variant: "error",
              });
            } else if (data?.error === "UsernameAlreadyTakenError") {
              toast({
                title: "Username already taken",
                description: "Please choose another username",
                variant: "error",
              });
            } else {
              toast({
                title: "Conflict",
                description: data?.message || "Please check your information",
                variant: "error",
              });
            }
            break;
          case 400:
            toast({
              title: "Input error",
              description: data?.message || "Please check your information",
              variant: "error",
            });
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
              description: data?.message || "An unexpected error occurred",
              variant: "error",
            });
        }
      } else if (axiosErr?.request) {
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
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const status = axiosErr.response.status;
        const data = axiosErr.response.data;

        switch (data?.error) {
          case "EmailNotVerifiedError":
            toast({
              title: "Account not verified",
              description: data.message || "Please verify your email address before logging in",
              variant: "warning",
            });
            break;
          case "InvalidCredentialsError":
            toast({
              title: "Authentication failed",
              description: "Incorrect email or password",
              variant: "error",
            });
            break;
          default:
            switch (status) {
              case 500:
                toast({
                  title: "Server error",
                  description: "Temporary issue, please try again",
                  variant: "error",
                });
                break;
              default:
                toast({
                  title: "Connection error",
                  description: data?.message || "An unexpected error occurred",
                  variant: "error",
                });
            }
        }
      } else if (axiosErr?.request) {
        toast({
          title: "Connection error",
          description: "Unable to reach the server. Check your internet connection.",
          variant: "error",
        });
      } else {
        toast({
          title: "Connection error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }

  /**
   * Check if user is logged in and return user data
   */
  static async isLogged(): Promise<ServiceResult<IUser>> {
    try {
      const token = localStorage.getItem("Token");
      if (token == null) {
        return ServiceResult.notFound();
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const res = await axios.get(`${ApiService.baseURL}/users/me`);

      if (res.status === 200) {
        return ServiceResult.success(res.data);
      }
      return ServiceResult.notFound();
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const status = axiosErr.response.status;

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
      } else if (axiosErr?.request) {
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
    } catch {
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
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const data = axiosErr.response.data;
        toast({
          title: "Verification error",
          description: data?.message || "The verification link is invalid or expired",
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
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const data = axiosErr.response.data;
        toast({
          title: "Sending error",
          description: data?.message || "Unable to send verification email",
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
        { newPassword },
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
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const data = axiosErr.response.data;
        toast({
          title: "Modification error",
          description: data?.message || "Unable to change password",
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
        { token, newPassword }
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
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const data = axiosErr.response.data;
        toast({
          title: "Reset failed",
          description: data?.message || "Unable to reset password. The link may have expired.",
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
    } catch {
      toast({
        title: "Check your email",
        description: "If an account exists with this email, you will receive a password reset link.",
        variant: "default",
      });
      return true;
    }
  }

  /**
   * Update current user profile (firstName, lastName, username, avatarUrl)
   */
  static async updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    username?: string;
    avatarUrl?: string;
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

      if (response.data?.id) {
        toast({
          title: 'Profile updated',
          description: 'Your profile has been saved.',
          variant: 'success',
        });
        return response.data;
      }
      return null;
    } catch (error) {
      const msg = asAxiosError(error)?.response?.data?.message || 'Failed to update profile. Please try again.';
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
        { blockchainAddress },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return !!response.data?.id;
    } catch (error) {
      const message = asAxiosError(error)?.response?.data?.message;
      if (message) {
        toast({
          title: 'Error',
          description: message,
          variant: 'error',
        });
      }
      return false;
    }
  }
}
