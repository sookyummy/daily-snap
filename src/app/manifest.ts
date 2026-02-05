import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily Snap",
    short_name: "DailySnap",
    description: "Daily photo missions with your group",
    start_url: "/home",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF6B35",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
