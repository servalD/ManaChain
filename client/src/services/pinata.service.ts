import axios from "axios";
import { toast } from "@/lib/toast";

export default class PinataService {
  private static readonly UPLOAD_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRIES = 2;

  /**
   * Upload a file to Pinata IPFS via Next.js API route
   * @param file - The file to upload
   * @returns The IPFS URL of the uploaded file
   */
  static async uploadFile(file: File): Promise<string> {
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

        const response = await axios.post(
          '/api/pinata/upload',
          formData,
          {
            timeout: this.UPLOAD_TIMEOUT,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (response.data?.ipfsUrl) {
          toast({
            title: "Upload successful",
            description: "Your file has been uploaded to IPFS",
            variant: "success",
          });

          return response.data.ipfsUrl;
        } else {
          throw new Error("Invalid response from server");
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
        description: "Unable to reach server. Check your internet connection.",
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
   * Delete (unpin) a file from Pinata via Next.js API route
   * @param ipfsHashOrUrl - The IPFS hash or full URL
   * @returns true if successful, false otherwise
   */
  static async deleteFile(ipfsHashOrUrl: string): Promise<boolean> {
    try {
      const ipfsHash = this.extractIpfsHash(ipfsHashOrUrl);
      
      if (!ipfsHash) {
        console.error("Invalid IPFS hash or URL:", ipfsHashOrUrl);
        return false;
      }

      await axios.delete(`/api/pinata/delete?hash=${ipfsHash}`, {
        timeout: 10000,
      });

      return true;
    } catch (error: any) {
      // 404 means already deleted, consider as success
      if (error.response?.status === 404) {
        return true;
      }
      
      // Don't show error toast for delete failures (could be already deleted)
      console.error("Error deleting file from Pinata:", error);
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
