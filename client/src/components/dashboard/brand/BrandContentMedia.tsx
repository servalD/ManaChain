"use client";

import { useState } from "react";
import { Image as ImageIcon, Upload, Trash2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import PinataService from "@/services/pinata.service";
import { useBrandMedia, useConfirmBrandMedia, useRemoveBrandMedia } from "@/hooks/api/useBrands";
import { useAuth } from "@/hooks/useAuth";

interface PendingMedia {
  id: string;
  ipfsHash: string;
  ipfsUrl: string;
  previewUrl: string;
  fileName: string;
  fileSize: number;
}

interface BrandContentMediaProps {
  brandId?: string;
}

export function BrandContentMedia({ brandId }: BrandContentMediaProps) {
  const { user } = useAuth();
  const { data: confirmedMedia = [], isLoading } = useBrandMedia(brandId);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const confirmBrandMedia = useConfirmBrandMedia();
  const removeBrandMedia = useRemoveBrandMedia();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "error",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "error",
      });
      return;
    }

    setIsUploading(true);
    const tempId = Date.now().toString();
    
    try {
      // Upload immediately to Pinata
      const ipfsUrl = await PinataService.uploadFile(file);
      const ipfsHash = PinataService.extractIpfsHash(ipfsUrl);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      // Add to pending media
      const newPendingMedia: PendingMedia = {
        id: tempId,
        ipfsHash,
        ipfsUrl,
        previewUrl,
        fileName: file.name,
        fileSize: file.size,
      };

      setPendingMedia((prev) => [...prev, newPendingMedia]);
      
      toast({
        title: "Upload successful",
        description: "Image uploaded to IPFS. Please confirm to save it.",
        variant: "success",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred while uploading the image",
        variant: "error",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  const handleConfirmMedia = (pendingItem: PendingMedia) => {
    if (!brandId) {
      toast({
        title: "Error",
        description: "Brand ID is required",
        variant: "error",
      });
      return;
    }

    setConfirmingIds((prev) => new Set(prev).add(pendingItem.id));

    confirmBrandMedia.mutate(
      { id: brandId, data: { ipfsHash: pendingItem.ipfsHash, imageUrl: pendingItem.ipfsUrl } },
      {
        onSuccess: () => {
          // Remove from pending (confirmed media comes back via query invalidation)
          setPendingMedia((prev) => prev.filter((item) => item.id !== pendingItem.id));

          // Clean up preview URL
          URL.revokeObjectURL(pendingItem.previewUrl);

          toast({
            title: "Media confirmed",
            description: "Your image has been saved",
            variant: "success",
          });
        },
        onSettled: () => {
          setConfirmingIds((prev) => {
            const next = new Set(prev);
            next.delete(pendingItem.id);
            return next;
          });
        },
      }
    );
  };

  const handleCancelMedia = async (pendingItem: PendingMedia) => {
    try {
      // Unpin from Pinata
      await PinataService.deleteFile(pendingItem.ipfsHash);
      
      // Remove from pending
      setPendingMedia((prev) => prev.filter((item) => item.id !== pendingItem.id));
      
      // Clean up preview URL
      URL.revokeObjectURL(pendingItem.previewUrl);

      toast({
        title: "Upload cancelled",
        description: "The image has been removed from IPFS",
        variant: "success",
      });
    } catch (error) {
      console.error("Error cancelling media:", error);
      // Still remove from pending even if unpin fails
      setPendingMedia((prev) => prev.filter((item) => item.id !== pendingItem.id));
      URL.revokeObjectURL(pendingItem.previewUrl);
    }
  };

  const handleDeleteMedia = (mediaId: string) => {
    if (!brandId) return;

    // Find the media to get ipfsHash
    const media = confirmedMedia.find((m) => m.id === mediaId);
    if (!media) {
      toast({
        title: "Error",
        description: "Media not found",
        variant: "error",
      });
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(mediaId));

    const deleteFromBackend = () => {
      removeBrandMedia.mutate(
        { id: brandId, mediaId },
        {
          onSuccess: () => {
            toast({
              title: "Media deleted",
              description: "The media item has been removed",
              variant: "success",
            });
          },
          onSettled: () => {
            setDeletingIds((prev) => {
              const next = new Set(prev);
              next.delete(mediaId);
              return next;
            });
          },
        }
      );
    };

    // Unpin from Pinata first (frontend); still delete from DB even if unpin fails.
    PinataService.deleteFile(media.ipfsHash)
      .catch((error) => console.error("Error unpinning media from Pinata:", error))
      .finally(deleteFromBackend);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const allMedia = [...pendingMedia, ...confirmedMedia];
  const hasMedia = allMedia.length > 0;

  return (
    <div className="space-y-4 pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold">Content & Media</h2>
      </div>

      {/* Upload Area */}
      <div className="border border-border rounded-lg p-6">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading || !brandId}
            className="hidden"
          />
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-violet-500/50 transition-colors">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      )}

      {/* Media Grid */}
      {!isLoading && !hasMedia && (
        <div className="border border-border rounded-lg p-12 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">No media uploaded yet</p>
        </div>
      )}

      {!isLoading && hasMedia && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Pending Media */}
          {pendingMedia.map((item) => (
            <div
              key={item.id}
              className="group relative border-2 border-dashed border-yellow-500/50 rounded-lg overflow-hidden bg-yellow-500/5"
            >
              <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden relative">
                <img
                  src={item.previewUrl}
                  alt={item.fileName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-yellow-500 text-yellow-950 text-xs font-semibold px-2 py-1 rounded">
                  Pending
                </div>
              </div>
              <div className="p-3 bg-background">
                <p className="text-xs font-medium truncate mb-1">{item.fileName}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{formatFileSize(item.fileSize)}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleConfirmMedia(item)}
                    disabled={confirmingIds.has(item.id) || !brandId}
                    variant="default"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                  >
                    {confirmingIds.has(item.id) ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    onClick={() => handleCancelMedia(item)}
                    disabled={confirmingIds.has(item.id)}
                    variant="destructive"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Confirmed Media */}
          {confirmedMedia.map((item) => (
            <div
              key={item.id}
              className="group relative border border-border rounded-lg overflow-hidden hover:border-violet-500/50 transition-colors"
            >
              <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                <img
                  src={PinataService.normalizeIpfsUrl(item.imageUrl)}
                  alt={`Media ${item.id}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '';
                    target.style.display = 'none';
                  }}
                />
              </div>
              <div className="p-3 bg-background">
                <p className="text-xs font-medium truncate mb-1">Media {item.id.slice(0, 8)}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={() => handleDeleteMedia(item.id)}
                  disabled={deletingIds.has(item.id)}
                  variant="destructive"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {deletingIds.has(item.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
