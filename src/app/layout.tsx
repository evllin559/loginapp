import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import LicenseGate from "@/components/LicenseGate";
import InstallHint from "@/components/InstallHint";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Prospecção WhatsApp",
  description: "Sistema de prospecção com geolocalização e envio via WhatsApp",
  manifest: "/manifest.webmanifest",
  applicationName: "Prospecção WhatsApp",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Prospecção",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1f18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} ${sora.variable} font-sans`}>
        <LicenseGate>{children}</LicenseGate>
        <InstallHint />
      </body>
    </html>
  );
}
