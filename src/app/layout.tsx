// src/app/layout.tsx
import { Prompt } from "next/font/google";
import { LocationProvider } from '@/contexts/LocationContext';
import { ToastProvider } from '@/contexts/ToastContext';
import SessionProvider from "@/components/SessionProvider";
import { SiteSettingsProvider } from '@/hooks/useSiteSettings';
import Navbar from "@/components/layout/Navbar";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { getSiteMetadata } from '@/lib/settings';
import "./globals.css";

// Force dynamic rendering เพราะใช้ database
// Note: During build, metadata will use default values if database is unavailable
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prompt = Prompt({ 
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-prompt"
});

// Dynamic metadata from database settings
export async function generateMetadata() {
  try {
    const metadata = await getSiteMetadata();
    return {
      metadataBase: new URL('https://www.zablink.com'),
      ...metadata,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    // Return default metadata if database fails
    return {
      metadataBase: new URL('https://www.zablink.com'),
      title: 'Zablink',
      description: 'แพลตฟอร์มเชื่อมต่อร้านอาหารและนักรีวิว',
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={prompt.variable}>
      <body className={`${prompt.className} antialiased`}>
        <GoogleAnalytics />
        <SessionProvider>
          <SiteSettingsProvider>
            <LocationProvider>
              <ToastProvider>
                <Navbar />
                {children}
              </ToastProvider>
            </LocationProvider>
          </SiteSettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
