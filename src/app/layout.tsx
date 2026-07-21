import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SfondoDecorativo } from "@/components/ui";
import { HomeButton } from "@/components/layout/HomeButton";
import { ContentButton } from "@/components/layout/ContentButton";

const FALLBACK_SITE_URL = "https://giallo-aria.mogicato.ch";

// Tolerate a malformed / multi-value env var: take the first token and fall
// back to the production domain if it is not a valid absolute URL.
function resolveSiteUrl(): URL {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").split(",")[0]?.trim();
  try {
    return new URL(raw || FALLBACK_SITE_URL);
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: {
    default: "Giallo-Aria",
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
