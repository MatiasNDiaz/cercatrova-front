import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { NavbarPublic } from "@/modules/shared/ui/NavbarPublic";

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
      </body>
    </html>
  );
}
