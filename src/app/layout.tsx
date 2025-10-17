import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers'; // ⭐ import Providers


export default function RootLayout({
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