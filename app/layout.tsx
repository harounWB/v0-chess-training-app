import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/AuthContext'
import { GameProvider } from '@/lib/GameContext'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeSync } from '@/components/ThemeSync'
import { SupportButton } from '@/components/SupportButton'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://openingmaster.xyz'),
  title: 'OpeningMaster',
  description: 'Master chess openings with interactive training. Upload PGN files and train with multiple modes.',
  generator: 'v0.app',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        url: '/icon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system">
          <GameProvider>
              <ThemeSync />
            {children}
            <SupportButton />
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </GameProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

