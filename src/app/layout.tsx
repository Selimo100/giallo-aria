import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SfondoDecorativo } from "@/components/ui";
import { HomeButton } from "@/components/layout/HomeButton";
import { ContentButton } from "@/components/layout/ContentButton";

export const metadata: Metadata = {
  title: {
    default: "Giallo-Aria — Giochi, risate e un soffio di follia",
    template: "%s · Giallo-Aria",
  },
  description:
    "Giallo-Aria è la piattaforma di giochi da festa con un solo telefono condiviso. L'Impostore, Chi è più probabile e tanto altro, tutto in italiano.",
  applicationName: "Giallo-Aria",
  icons: {
    icon: [
      { url: "/logo_icon.png", type: "image/png", sizes: "287x283" },
      { url: "/icon.png", type: "image/png", sizes: "287x283" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "287x283" }],
    shortcut: ["/logo_icon.png"],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="antialiased">
        <SfondoDecorativo />
        <HomeButton />
        <ContentButton />
        {children}
      </body>
    </html>
  );
}
