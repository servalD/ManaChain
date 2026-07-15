import type { MetadataRoute } from "next";
import { ApiService } from "@/services/api.service";

const siteUrl = ApiService.baseURL.replace(/\/api\/?$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Tableaux de bord authentifiés et flux à token (reset/vérification) :
      // aucune valeur pour un crawler, et souvent invalides sans session/token.
      disallow: [
        "/admin",
        "/brand",
        "/dashboard",
        "/discover",
        "/events",
        "/profile",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/verify-brand-application",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
