import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { NavbarPublic } from "@/modules/shared/ui/NavbarPublic";

import { Metadata } from 'next';
import { FooterPublic } from "@/modules/landing/components/FooterPublic";

export const metadata: Metadata = {
  title: 'Cerca Trova - Inmobiliaria',
  description: 'Tu aliado en cada inversión inmobiliaria en Córdoba',
  icons: {
    // Añadimos ?v=1 al final para romper la caché
     icon: '/favicon.png?v=2', 
  },
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable}`}>
        <NavbarPublic />
        {children}
        <FooterPublic/>
      </body>
    </html>
  );
}
