import type { MetadataRoute } from "next";
import { ApiService } from "@/services/api.service";

const siteUrl = ApiService.baseURL.replace(/\/api\/?$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/register`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/brand-application`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
