import axios from "axios";
import { toast } from "@/lib/toast";
import { ApiService } from "./api.service";

export default class PinataService {
  private static readonly JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";
  private static readonly UPLOAD_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRIES = 2;

  /**
   * Upload a file to Pinata IPFS
   * @param file - The file to upload
   * @returns The IPFS URL of the uploaded file
   */
  static async uploadFile(file: File): Promise<string> {
    if (!this.JWT || !ApiService.PINATA_GATEWAY_URL) {
      toast({
        title: "Configuration error",
        description: "Pinata credentials are not configured",
        variant: "error",
      });
      throw new Error("Pinata credentials missing");
    }

    // Validate file size
    const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for PDFs
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSizeMB}MB`,
        variant: "error",
      });
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }

    let lastError: any;
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Add metadata
        const metadata = JSON.stringify({
          name: file.name,
          keyvalues: {
            uploadedAt: new Date().toISOString(),
            originalName: file.name,
            type: file.type,
          },
        });
        formData.append("pinataMetadata", metadata);

        // Add options
        const options = JSON.stringify({
          cidVersion: 1,
        });
        formData.append("pinataOptions", options);

        const response = await axios.post(
          `${ApiService.PINATA_API_URL}/pinning/pinFileToIPFS`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${this.JWT}`,
            },
            timeout: this.UPLOAD_TIMEOUT,
          }
        );

        if (response.data && response.data.IpfsHash) {
          const ipfsUrl = `${ApiService.PINATA_GATEWAY_URL}/ipfs/${response.data.IpfsHash}`;
          
          toast({
            title: "Upload successful",
            description: "Your file has been uploaded to IPFS",
            variant: "success",
          });

          return ipfsUrl;
        } else {
          throw new Error("Invalid response from Pinata");
        }
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on specific errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          toast({
            title: "Authentication error",
            description: "Invalid Pinata credentials",
            variant: "error",
          });
          throw error;
        }

        if (error.response?.status === 400) {
          toast({
            title: "Invalid file",
            description: error.response?.data?.error || "File validation failed",
            variant: "error",
          });
          throw error;
        }

        // Retry on network errors or timeouts
        if (attempt < this.MAX_RETRIES) {
          console.log(`Upload attempt ${attempt + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }
      }
    }

    // All retries failed
    if (lastError?.code === 'ECONNABORTED') {
      toast({
        title: "Upload timeout",
        description: "The upload took too long. Please try again.",
        variant: "error",
      });
    } else if (lastError?.message?.includes('Network Error')) {
      toast({
        title: "Network error",
        description: "Unable to reach Pinata. Check your internet connection.",
        variant: "error",
      });
    } else {
      toast({
        title: "Upload failed",
        description: lastError?.response?.data?.error || "An unexpected error occurred",
        variant: "error",
      });
    }

    throw lastError;
  }

  /**
   * Delete (unpin) a file from Pinata
   * @param ipfsHashOrUrl - The IPFS hash or full URL
   * @returns true if successful, false otherwise
   */
  static async deleteFile(ipfsHashOrUrl: string): Promise<boolean> {
    if (!this.JWT || !ApiService.PINATA_GATEWAY_URL) {
      console.error("Pinata credentials missing");
      return false;
    }

    try {
      const ipfsHash = this.extractIpfsHash(ipfsHashOrUrl);
      
      if (!ipfsHash) {
        console.error("Invalid IPFS hash or URL:", ipfsHashOrUrl);
        return false;
      }

      await axios.delete(
        `${ApiService.PINATA_API_URL}/pinning/unpin/${ipfsHash}`,
        {
          headers: {
            Authorization: `Bearer ${this.JWT}`,
          },
          timeout: 10000, // 10 seconds
        }
      );

      return true;
    } catch (error: any) {
      // Don't show error toast for delete failures (could be already deleted)
      console.error("Error deleting file from Pinata:", error);
      
      // Consider 404 as success (file already unpinned)
      if (error.response?.status === 404) {
        return true;
      }
      
      return false;
    }
  }

  /**
   * Extract IPFS hash from a URL or return the hash if already provided
   * @param ipfsHashOrUrl - The IPFS hash or full URL
   * @returns The extracted IPFS hash
   */
  static extractIpfsHash(ipfsHashOrUrl: string): string {
    if (!ipfsHashOrUrl) return "";

    // If it's already a hash (no slashes), return it
    if (!ipfsHashOrUrl.includes('/')) {
      return ipfsHashOrUrl;
    }

    // Extract from URL patterns like:
    // - https://gateway.pinata.cloud/ipfs/QmXXXXX
    // - ipfs://QmXXXXX
    // - /ipfs/QmXXXXX
    const ipfsMatch = ipfsHashOrUrl.match(/(?:ipfs\/|ipfs:\/\/)([a-zA-Z0-9]+)/);
    if (ipfsMatch && ipfsMatch[1]) {
      return ipfsMatch[1];
    }

    // If no pattern matched, return the original (might be a direct hash)
    return ipfsHashOrUrl;
  }

  /**
   * Check if a string is a valid IPFS URL
   * @param url - The URL to check
   * @returns true if it's a valid IPFS URL
   */
  static isIpfsUrl(url: string): boolean {
    if (!url) return false;
    return url.includes('/ipfs/') || url.startsWith('ipfs://');
  }
}
