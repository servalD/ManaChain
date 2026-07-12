import { axiosInstance } from "@/lib/api/mutator";
import { toast } from "@/lib/toast";
import { asAxiosError } from "@/lib/api-error";

/**
 * Justificatif d'immatriculation : stocké en base côté back (jamais sur
 * IPFS/Pinata — contrairement au logo, il peut contenir des données
 * sensibles), lisible uniquement par un admin. Upload temporaire tant que la
 * candidature n'existe pas encore ; `uploadId` est ensuite consommé par
 * `POST /brands/applications`.
 */
export default class BrandApplicationProofService {
  private static readonly UPLOAD_TIMEOUT = 30000;

  static async upload(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axiosInstance.post<{ uploadId: string }>(
        "/api/brands/applications/registration-proof",
        formData,
        {
          timeout: this.UPLOAD_TIMEOUT,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      toast({
        title: "Upload successful",
        description: "Your registration proof has been uploaded",
        variant: "success",
      });
      return data.uploadId;
    } catch (error) {
      const axiosErr = asAxiosError(error);
      toast({
        title: "Upload failed",
        description: axiosErr?.response?.data?.message || "Could not upload the file",
        variant: "error",
      });
      throw error;
    }
  }

  static async remove(uploadId: string): Promise<void> {
    try {
      await axiosInstance.delete(`/api/brands/applications/registration-proof/${uploadId}`, {
        timeout: 10000,
      });
    } catch (error) {
      // 404 means already consumed/expired — treat as success either way.
      if (asAxiosError(error)?.response?.status !== 404) {
        console.error("Error removing registration proof upload:", error);
      }
    }
  }
}
