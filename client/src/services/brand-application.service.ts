import axios from "axios";
import { ApiService } from "./api.service";
import { toast } from "@/lib/toast";
import {
  BrandApplication,
  CreateBrandApplicationData,
  GetBrandApplicationsParams,
  GetBrandApplicationsResponse,
  ApproveBrandApplicationResponse,
  RejectBrandApplicationData,
  RejectBrandApplicationResponse,
} from "@/types/brand-application.types";

export default class BrandApplicationService {
  /**
   * Create a new brand application (public endpoint)
   */
  static async createApplication(
    data: CreateBrandApplicationData
  ): Promise<BrandApplication | null> {
    try {
      const res = await axios.post(
        `${ApiService.baseURL}/brands/applications`,
        data
      );

      if (res.status === 201) {
        toast({
          title: "Application submitted",
          description: "Your brand application has been submitted successfully. We'll review it soon!",
          variant: "success",
        });

        return res.data.application;
      }
      return null;
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        switch (status) {
          case 400:
            if (data?.required) {
              toast({
                title: "Missing required fields",
                description: `Please fill in: ${data.required.join(", ")}`,
                variant: "error",
              });
            } else {
              toast({
                title: "Validation error",
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
              title: "Application error",
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
          title: "Application error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }

  /**
   * Get all brand applications with pagination and filters (admin only)
   */
  static async getAllApplications(
    params?: GetBrandApplicationsParams
  ): Promise<GetBrandApplicationsResponse | null> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.limit) {
        queryParams.append("limit", params.limit.toString());
      }
      if (params?.offset) {
        queryParams.append("offset", params.offset.toString());
      }
      if (params?.status) {
        queryParams.append("status", params.status);
      }
      if (params?.search) {
        queryParams.append("search", params.search);
      }

      const url = `${ApiService.baseURL}/brands/applications${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      });

      if (res.status === 200) {
        return res.data;
      }
      return null;
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        switch (status) {
          case 401:
            toast({
              title: "Unauthorized",
              description: "You must be logged in as an admin to view applications",
              variant: "error",
            });
            break;
          case 403:
            toast({
              title: "Forbidden",
              description: "You don't have permission to view applications",
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
              title: "Error",
              description: data?.error || "Failed to fetch applications",
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
          title: "Error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }

  /**
   * Get brand application by ID (admin only)
   */
  static async getApplicationById(
    id: string
  ): Promise<BrandApplication | null> {
    try {
      const res = await axios.get(
        `${ApiService.baseURL}/brands/applications/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
        }
      );

      if (res.status === 200) {
        return res.data.application;
      }
      return null;
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        switch (status) {
          case 401:
            toast({
              title: "Unauthorized",
              description: "You must be logged in as an admin",
              variant: "error",
            });
            break;
          case 403:
            toast({
              title: "Forbidden",
              description: "You don't have permission to view this application",
              variant: "error",
            });
            break;
          case 404:
            toast({
              title: "Not found",
              description: "Application not found",
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
              title: "Error",
              description: data?.error || "Failed to fetch application",
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
          title: "Error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }

  /**
   * Approve a brand application (admin only)
   */
  static async approveApplication(
    id: string
  ): Promise<ApproveBrandApplicationResponse | null> {
    try {
      const res = await axios.put(
        `${ApiService.baseURL}/brands/applications/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
        }
      );

      if (res.status === 200) {
        toast({
          title: "Application approved",
          description: "The brand application has been approved successfully. A user account has been created.",
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
            toast({
              title: "Validation error",
              description: data?.error || "Unable to approve application",
              variant: "error",
            });
            break;
          case 401:
            toast({
              title: "Unauthorized",
              description: "You must be logged in as an admin",
              variant: "error",
            });
            break;
          case 403:
            toast({
              title: "Forbidden",
              description: "You don't have permission to approve applications",
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
              title: "Error",
              description: data?.error || "Failed to approve application",
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
          title: "Error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }

  /**
   * Reject a brand application (admin only)
   */
  static async rejectApplication(
    id: string,
    data: RejectBrandApplicationData
  ): Promise<RejectBrandApplicationResponse | null> {
    try {
      const res = await axios.put(
        `${ApiService.baseURL}/brands/applications/${id}/reject`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
        }
      );

      if (res.status === 200) {
        toast({
          title: "Application rejected",
          description: "The brand application has been rejected.",
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
            if (data?.error?.includes("rejection_reason")) {
              toast({
                title: "Missing rejection reason",
                description: "Please provide a reason for rejection",
                variant: "error",
              });
            } else {
              toast({
                title: "Validation error",
                description: data?.error || "Unable to reject application",
                variant: "error",
              });
            }
            break;
          case 401:
            toast({
              title: "Unauthorized",
              description: "You must be logged in as an admin",
              variant: "error",
            });
            break;
          case 403:
            toast({
              title: "Forbidden",
              description: "You don't have permission to reject applications",
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
              title: "Error",
              description: data?.error || "Failed to reject application",
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
          title: "Error",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return null;
    }
  }
}
