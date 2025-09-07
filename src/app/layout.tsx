// src/app/layout.tsx
import type { Metadata } from 'next';
import AppLayout from '@/components/AppLayout';
import SessionProvider from '@/components/SessionProvider';

import './globals.css';

export const metadata: Metadata = {
  title: 'ZabLink แหล่งอาหารเครื่องดื่มสำหรับทุกคน',
  description: 'แพลตฟอร์มค้นหาร้านอาหารและเครื่องดื่มที่ดีที่สุดสำหรับทุกคน',
  keywords: ['อาหาร', 'เครื่องดื่ม', 'ร้านอาหาร', 'delivery', 'food'],
  authors: [{ name: 'ZabLink Team' }],
  creator: 'ZabLink',
  publisher: 'ZabLink',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/site.webmanifest',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  openGraph: {
    title: 'ZabLink แหล่งอาหารเครื่องดื่มสำหรับทุกคน',
    description: 'แพลตฟอร์มค้นหาร้านอาหารและเครื่องดื่มที่ดีที่สุดสำหรับทุกคน',
    url: 'https://yourwebsite.com',
    siteName: 'ZabLink',
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZabLink แหล่งอาหารเครื่องดื่มสำหรับทุกคน',
    description: 'แพลตฟอร์มค้นหาร้านอาหารและเครื่องดื่มที่ดีที่สุดสำหรับทุกคน',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        {/* Additional meta tags if needed */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <SessionProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </SessionProvider>
      </body>
    </html>
  );
}