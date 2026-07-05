import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/Providers'
import '../styles/globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Blog CMS', template: '%s | Blog CMS' },
  description: 'Your premier blog platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
      <body>
        <Providers>
          <Toaster position="top-right" toastOptions={{ duration: 3500, style: { borderRadius: '10px', fontSize: '0.9rem' } }} />
          {children}
        </Providers>
      </body>
    </html>
  )
}
