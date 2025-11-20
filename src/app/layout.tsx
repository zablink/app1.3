// src/app/layout.tsx
import { Inter } from "next/font/google";
import { LocationProvider } from '@/contexts/LocationContext';
import SessionProvider from "@/components/SessionProvider";
import { SiteSettingsProvider } from '@/hooks/useSiteSettings';
import Navbar from "@/components/layout/Navbar";
import { getSiteMetadata } from '@/lib/settings';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Dynamic metadata from database settings
export async function generateMetadata() {
  const metadata = await getSiteMetadata();
  return metadata;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <SessionProvider>
          <SiteSettingsProvider>
            <LocationProvider>
              <Navbar />
              {children}
            </LocationProvider>
          </SiteSettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}