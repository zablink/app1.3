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
  description: 'เว็บที่ช่วยให้เติมฝันและลมหายใจของคุณ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={prompt.variable}>
      <body className={`${prompt.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}