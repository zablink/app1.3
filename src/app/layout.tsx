// src/app/layout.tsx
import './globals.css'
import SessionProvider from '@/components/SessionProvider'

export const metadata = {
  title: 'Zablink App',
  description: 'Your app description',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
