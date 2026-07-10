"use client";

import { useTranslations, useLocale } from "next-intl";
import { useMyLikes, useDeleteLike } from "@/hooks/api/useLikes";
import PinataService from "@/services/pinata.service";
import { ExternalLink, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserLikes() {
  const t = useTranslations("dashboard.client.userLikes");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  const { data: likes = [], isLoading } = useMyLikes();
  const deleteLike = useDeleteLike();

  const handleDislike = (likeId: string) => {
    deleteLike.mutate({ likeId });
  };

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
        <p className="text-muted-foreground text-lg mb-2">{t("noLikedTitle")}</p>
        <p className="text-sm text-muted-foreground">
          {t("noLikedSubtitle")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-8">
      <div>
        <h2 className="text-xl font-bold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("brandsCount", { count: likes.length })}
        </p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columnBrand")}</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columnLikedOn")}</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">{t("columnActions")}</th>
              </tr>
            </thead>
            <tbody>
              {likes.map((like, index) => (
                <tr
                  key={like.likeId}
                  className={`border-b border-border hover:bg-muted/20 transition-colors ${
                    index === likes.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {like.brand.logoUrl ? (
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 p-1.5 border border-border">
                          <img
                            src={PinataService.normalizeIpfsUrl(like.brand.logoUrl)}
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
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
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
                      {new Date(like.likedAt).toLocaleDateString(dateLocale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {like.brand.websiteUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 text-xs"
                        >
                          <a
                            href={like.brand.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t("visitWebsite")}
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        <MoreHorizontal className="h-3 w-3 mr-1" />
                        {t("moreDetails")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleDislike(like.likeId)}
                        disabled={deleteLike.isPending && deleteLike.variables?.likeId === like.likeId}
                        aria-label={t("removeAriaLabel")}
                      >
                        {deleteLike.isPending && deleteLike.variables?.likeId === like.likeId ? (
                          <span className="inline-block w-4 h-4 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" />
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            {t("dislike")}
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
