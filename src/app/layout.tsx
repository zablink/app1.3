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
      <head>
        <link rel="icon" href="/favicon.png" /> 
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
