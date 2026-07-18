import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import LicenseGate from "@/components/LicenseGate";
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
      </body>
    </html>
  );
}
