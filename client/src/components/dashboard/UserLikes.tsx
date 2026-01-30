"use client";

import { useEffect, useState } from "react";
import { ILikeWithBrand } from "@/types/like.types";
import LikeService from "@/services/like.service";
import PinataService from "@/services/pinata.service";
import { ExternalLink, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserLikes() {
  const [likes, setLikes] = useState<ILikeWithBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dislikingId, setDislikingId] = useState<string | null>(null);

  const handleDislike = async (likeId: string) => {
    setDislikingId(likeId);
    const result = await LikeService.deleteLike(likeId);
    setDislikingId(null);
    if (result?.success) {
      setLikes((prev) => prev.filter((l) => l.id !== likeId));
    }
  };

  useEffect(() => {
    const fetchLikes = async () => {
      setIsLoading(true);
      const response = await LikeService.getUserLikes();
      if (response?.success) {
        setLikes(response.data);
      }
      setIsLoading(false);
    };

    fetchLikes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (likes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg mb-2">No liked brands yet</p>
        <p className="text-sm text-muted-foreground">
          Start swiping to discover brands you love!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-8">
      <div>
        <h2 className="text-xl font-bold">My Liked Brands</h2>
        <p className="text-sm text-muted-foreground">
          {likes.length} {likes.length === 1 ? "brand" : "brands"} you've shown interest in
        </p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Brand</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Liked On</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {likes.map((like, index) => (
                <tr
                  key={like.id}
                  className={`border-b border-border hover:bg-muted/20 transition-colors ${
                    index === likes.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {like.brand.logo_url ? (
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 p-1.5 border border-border">
                          <img
                            src={PinataService.normalizeIpfsUrl(like.brand.logo_url)}
                            alt={like.brand.name}
                            className="w-full h-full object-contain"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const parent = target.parentElement;
                              if (parent) {
                                target.style.display = 'none';
                                const placeholder = document.createElement('div');
                                placeholder.className = 'w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                                placeholder.textContent = like.brand.name.charAt(0);
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-violet-400">
                            {like.brand.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm">{like.brand.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-muted-foreground">
                      {new Date(like.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {like.brand.website_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 text-xs"
                        >
                          <a
                            href={like.brand.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit Website
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        <MoreHorizontal className="h-3 w-3 mr-1" />
                        More Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleDislike(like.id)}
                        disabled={dislikingId === like.id}
                        aria-label="Remove from liked"
                      >
                        {dislikingId === like.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" />
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Dislike
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
