<<<<<<< HEAD
import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers'; // ⭐ import Providers

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'], // น้ำหนักที่ต้องการใช้
  subsets: ['latin', 'thai'],                   // รองรับภาษาไทยและอังกฤษ
  display: 'swap',                              // แสดงฟอนต์อย่างรวดเร็ว
  variable: '--font-prompt',                    // CSS variable
});

export const metadata: Metadata = {
  title: 'Zablink - Coming Soon',
  description: 'ช่วยเติมฝันและลมหายใจของคุณ',
  
  // ⭐ เพิ่มส่วนนี้!
  openGraph: {
    title: 'Zablink - Coming Soon',
    description: 'ช่วยเติมฝันและลมหายใจของคุณ',
    url: 'https://zablink.vercel.app', // เปลี่ยนเป็น URL จริง
    siteName: 'Zablink',
    images: [
      {
        url: '/og-image.png', // path ของรูปใน public/
        width: 1200,
        height: 630,
        alt: 'Zablink Logo',
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
  
  // ⭐ สำหรับ Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Zablink - Coming Soon',
    description: 'ช่วยเติมฝันและลมหายใจของคุณ',
    images: ['/og-image.png'],
  },
  
  // ⭐ Favicon (optional)
  icons: {
    icon: '/favicon.png',
    apple: '/zablink-logo-cir.png',
  },
};
=======
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
>>>>>>> dev


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<<<<<<< HEAD
    <html lang="th" className={prompt.variable}>
      <body className={`${prompt.className} antialiased`}>
        {children}
=======
    <html lang="th">
      <body className={prompt.className}>
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
>>>>>>> dev
      </body>
    </html>
  );
}