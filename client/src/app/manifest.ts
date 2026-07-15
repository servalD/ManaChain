import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mana Chain - Community Engagement Platform",
    short_name: "Mana Chain",
    description:
      "Redefine the relationship between brands and communities. Create your community token, unite your audience, and generate revenue differently.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
