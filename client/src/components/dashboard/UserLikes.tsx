"use client";

import { useEffect, useState } from "react";
import { ILikeWithBrand } from "@/types/like.types";
import LikeService from "@/services/like.service";
import PinataService from "@/services/pinata.service";

export function UserLikes() {
  const [likes, setLikes] = useState<ILikeWithBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">My Liked Brands</h2>
        <p className="text-muted-foreground">
          {likes.length} {likes.length === 1 ? "brand" : "brands"} you've shown interest in
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {likes.map((like) => (
          <div
            key={like.id}
            className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            {/* Brand Logo */}
            {like.brand.logo_url && (
              <div className="relative w-full h-48 bg-accent/30">
                <img
                  src={PinataService.normalizeIpfsUrl(like.brand.logo_url)}
                  alt={like.brand.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Brand Info */}
            <div className="p-5 space-y-3">
              <div>
                <h3 className="font-semibold text-lg mb-1">{like.brand.name}</h3>
                {like.brand.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {like.brand.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Liked on</span>
                  <span>
                    {new Date(like.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {like.brand.website_url && (
                <a
                  href={like.brand.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2 px-4 bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 rounded-lg transition-colors text-sm font-medium"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
