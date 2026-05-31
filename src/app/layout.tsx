import type { Metadata } from "next";
import { Toaster } from "sonner";
import { BrandLoader } from "@/components/BrandLoader";
import { OnboardingLoader } from "@/components/OnboardingLoader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arratia Cotizador",
  description: "Sistema de cotizaciones de equipos de protección personal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <BrandLoader>
          <OnboardingLoader>{children}</OnboardingLoader>
        </BrandLoader>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
