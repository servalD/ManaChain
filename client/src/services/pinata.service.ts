import axios from "axios";
import { toast } from "@/lib/toast";
import { asAxiosError } from "@/lib/api-error";

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

    let lastError: unknown;
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
      } catch (error) {
        lastError = error;
        const axiosErr = asAxiosError(error);

        // Don't retry on specific errors
        if (axiosErr?.response?.status === 401 || axiosErr?.response?.status === 403) {
          toast({
            title: "Authentication error",
            description: "Invalid Pinata credentials",
            variant: "error",
          });
          throw error;
        }

        if (axiosErr?.response?.status === 400) {
          toast({
            title: "Invalid file",
            description: axiosErr.response?.data?.error || "File validation failed",
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
    const lastAxiosErr = asAxiosError(lastError);
    if (lastAxiosErr?.code === 'ECONNABORTED') {
      toast({
        title: "Upload timeout",
        description: "The upload took too long. Please try again.",
        variant: "error",
      });
    } else if (lastAxiosErr?.message?.includes('Network Error')) {
      toast({
        title: "Network error",
        description: "Unable to reach server. Check your internet connection.",
        variant: "error",
      });
    } else {
      toast({
        title: "Upload failed",
        description: lastAxiosErr?.response?.data?.error || "An unexpected error occurred",
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
    } catch (error) {
      // 404 means already deleted, consider as success
      if (asAxiosError(error)?.response?.status === 404) {
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

  /**
   * Normalize an IPFS URL to ensure it has the https:// protocol
   * This fixes issues where URLs are stored without the protocol and treated as relative
   * Also converts direct Pinata gateway URLs to use the proxy route for authenticated access
   * @param url - The URL to normalize
   * @returns The normalized URL (using proxy route if needed)
   */
  static normalizeIpfsUrl(url: string | null | undefined): string {
    if (!url) return '';
    
    // Helper to get proxy URL
    const getProxyUrl = (hash: string): string => {
      // Use absolute URL if we're in the browser, relative otherwise (for SSR)
      if (typeof window !== 'undefined') {
        return `${window.location.origin}/api/pinata/proxy?hash=${hash}`;
      }
      // For SSR, use relative URL (Next.js will handle it)
      return `/api/pinata/proxy?hash=${hash}`;
    };
    
    // If it's already a proxy route, ensure it's absolute if in browser
    if (url.startsWith('/api/pinata/proxy')) {
      if (typeof window !== 'undefined' && !url.startsWith('http')) {
        return `${window.location.origin}${url}`;
      }
      return url;
    }
    
    // Extract IPFS hash from URL if it's a full Pinata gateway URL
    const ipfsHashMatch = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    if (ipfsHashMatch && ipfsHashMatch[1]) {
      const ipfsHash = ipfsHashMatch[1];
      // Use proxy route for authenticated access
      return getProxyUrl(ipfsHash);
    }
    
    // If it's already a full URL with protocol and not a Pinata gateway, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Check if it's a Pinata gateway URL that we should proxy
      if (url.includes('pinata') && url.includes('/ipfs/')) {
        const hashMatch = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
        if (hashMatch && hashMatch[1]) {
          return getProxyUrl(hashMatch[1]);
        }
      }
      return url;
    }
    
    // If it starts with //, add https:
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    
    // If it's just a hash, use proxy route
    if (!url.includes('/') && url.length > 10) {
      return getProxyUrl(url);
    }
    
    // Otherwise, add https://
    return `https://${url}`;
  }
}
