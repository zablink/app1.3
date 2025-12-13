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
  title: 'Zablink - ค้นหาร้านอาหารใกล้คุณ',
  description: 'ค้นหาร้านอาหารและเครื่องดื่มในพื้นที่ของคุณ - ช่วยเติมฝันและลมหายใจของคุณ',
  
  // ⭐ เพิ่มส่วนนี้!
  openGraph: {
    title: 'Zablink - ค้นหาร้านอาหารใกล้คุณ',
    description: 'ค้นหาร้านอาหารและเครื่องดื่มในพื้นที่ของคุณ',
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
    title: 'Zablink - ค้นหาร้านอาหารใกล้คุณ',
    description: 'ค้นหาร้านอาหารและเครื่องดื่มในพื้นที่ของคุณ',
    images: ['/og-image.png'],
  },
  
  // ⭐ Favicon (optional)
  icons: {
    icon: '/favicon.png',
    apple: '/zablink-logo-cir.png',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={prompt.variable}>
      <body className={`${prompt.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}