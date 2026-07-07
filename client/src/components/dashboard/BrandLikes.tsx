"use client";

import { useBrandLikes } from "@/hooks/api/useLikes";
import { Heart } from "lucide-react";

interface BrandLikesProps {
  brandId: string;
}

export function BrandLikes({ brandId }: BrandLikesProps) {
  const { data: likes = [], isLoading } = useBrandLikes(brandId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-violet-500 fill-violet-500" />
          </div>
          <div>
            <h3 className="text-3xl font-bold">{likes.length}</h3>
            <p className="text-muted-foreground">
              Total {likes.length === 1 ? "Like" : "Likes"} Received
            </p>
          </div>
        </div>
      </div>

      {/* Likes List */}
      {likes.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg mb-2">No likes yet</p>
          <p className="text-sm text-muted-foreground">
            Your brand will appear in the discover section soon!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Users Who Liked Your Brand</h3>
          <div className="grid gap-4">
            {likes.map((like) => (
              <div
                key={like.likeId}
                className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* User Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {like.user.firstName[0]}{like.user.lastName[0]}
                    </div>

                    {/* User Info */}
                    <div>
                      <h4 className="font-semibold">
                        {like.user.firstName} {like.user.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">@{like.user.username}</p>
                    </div>
                  </div>

                  {/* Like Date */}
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(like.likedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(like.likedAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
