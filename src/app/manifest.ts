import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Giallo-Aria",
    short_name: "Giallo-Aria",
    description:
      "Giallo-Aria è la piattaforma di giochi da festa con un solo telefono condiviso.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon.png",
        sizes: "287x283",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "287x283",
        type: "image/png",
      },
    ],
  };
}
