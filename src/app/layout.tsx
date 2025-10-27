// src/app/layout.tsx
import { Inter } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Zablink - แหล่งรวมร้านอาหารที่แซบๆ ใกล้คุณ",
  description: "แพลตฟอร์มเชื่อมต่อร้านอาหารและนักรีวิวทั่วประเทศไทย",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}