import { Metadata } from 'next';
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/modules/shared/context/AuthContext";
import { FooterPublic } from "@/modules/landing/components/FooterPublic";
import { Toaster } from 'sonner';
import { NavbarSelector } from '@/modules/shared/ui/NavbarSelector';
import "./globals.css";

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
          <AuthProvider>
            <NavbarSelector />
              {children}
              <FooterPublic/>
          </AuthProvider>
          <Toaster
  position="bottom-right"
  offset={40}
  duration={3000}
  toastOptions={{
    style: {
      
      fontSize: '0.875rem',
      fontWeight: '400',
      padding: '14px 18px',
      borderRadius: '10px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
      border: '1px solid #e5e7eb',
      minWidth: '340px',
      backgroundColor: '#ffffff',
    },
    classNames: {
      error: '!border-l-4 !border-l-red-500 !text-red-700',
      success: '!border-l-4 !border-l-green-600 !text-green-800',
    },
  }}
/>
      </body>
    </html>
  );
}
