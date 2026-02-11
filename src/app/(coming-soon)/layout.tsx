// /src/app/coming-soon/layout.tsx

import type { Metadata } from 'next';
import Footer from '@/components/layout/Footer';
import '../globals.css'; // Import CSS จาก parent folder

export const metadata: Metadata = {
  title: 'Zablink - Coming Soon',
  description: 'เว็บที่ช่วยให้เติมฝันและลมหายใจของคุณ',
};

export default function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="antialiased min-h-screen flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}