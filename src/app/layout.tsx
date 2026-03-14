import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'LendFlow',
  description: 'AI-powered cloud lending origination platform for modern loan operations.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-slate-50 font-sans text-slate-900 antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className: '!rounded-2xl !border !border-slate-200 !bg-white !text-slate-900 !shadow-lg',
          }}
        />
      </body>
    </html>
  )
}
