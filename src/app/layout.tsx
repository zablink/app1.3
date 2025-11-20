// src/app/layout.tsx
import { Inter } from "next/font/google";
import { LocationProvider } from '@/contexts/LocationContext';
import SessionProvider from "@/components/SessionProvider";
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
          <LocationProvider>
            <Navbar />
            {children}
          </LocationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}