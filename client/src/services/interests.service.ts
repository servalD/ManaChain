import axios from "axios";
import { ApiService } from "./api.service";
import { toast } from "@/lib/toast";
import { Interest } from "@/types/interest.types";
import { asAxiosError } from "@/lib/api-error";

export default class InterestsService {
  /**
   * Get all available interests
   */
  static async getAllInterests(): Promise<Interest[]> {
    try {
      const res = await axios.get(`${ApiService.baseURL}/interests`);

      if (res.status === 200) {
        return res.data || [];
      }
      return [];
    } catch (err) {
      const axiosErr = asAxiosError(err);
      if (axiosErr?.response) {
        const status = axiosErr.response.status;
        const data = axiosErr.response.data;

        switch (status) {
          case 404:
            toast({
              title: "Interests not found",
              description: "Unable to load available interests",
              variant: "error",
            });
            break;
          case 500:
            toast({
              title: "Server error",
              description: "Temporary issue loading interests",
              variant: "error",
            });
            break;
          default:
            toast({
              title: "Error loading interests",
              description: data?.message || "An unexpected error occurred",
              variant: "error",
            });
        }
      } else if (axiosErr?.request) {
        toast({
          title: "Connection error",
          description: "Unable to reach the server",
          variant: "error",
        });
      } else {
        toast({
          title: "Error loading interests",
          description: "An unexpected error occurred",
          variant: "error",
        });
      }
      return [];
    }
  }
}
