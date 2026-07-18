import type { Metadata } from "next";
import { Inter } from "next/font/google";
import LicenseGate from "@/components/LicenseGate";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <LicenseGate>{children}</LicenseGate>
      </body>
    </html>
  );
}
