// /src/app/coming-soon/layout.tsx

import type { Metadata } from 'next';
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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}