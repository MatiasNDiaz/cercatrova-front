import { Metadata } from 'next';
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/modules/shared/context/AuthContext";
import { FooterSelector } from "@/modules/shared/ui/FooterSelector";
import { AppToaster } from '@/modules/shared/ui/AppToaster';
import { NavbarSelector } from '@/modules/shared/ui/NavbarSelector';
import { VisitTracker } from '@/modules/shared/ui/VisitTracker';
import { PendingNotificationsToast } from '@/modules/shared/ui/PendingNotificationsToast';
import "./globals.css";

export const metadata: Metadata = {
  title: 'Cerca Trova - Inmobiliaria',
  description: 'Tu aliado en cada inversión inmobiliaria en Córdoba',
  icons: {
    // Añadimos ?v=1 al final para romper la caché
    icon: '/icon.png?v=1', 
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
            {/* Telemetría de visitas y tiempo en página — no renderiza nada */}
            <VisitTracker />
            {/* Aviso de notificaciones sin leer al iniciar sesión. Va DENTRO
                del AuthProvider porque necesita la sesión; no renderiza nada. */}
            <PendingNotificationsToast />
            <NavbarSelector />
              {children}
              <FooterSelector/>
          </AuthProvider>
          <AppToaster />
      </body>
    </html>
  );
}
