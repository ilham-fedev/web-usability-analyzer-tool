import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Web Usability Analyzer - Don\'t Make Me Think',
  description: 'Analyze your website using Steve Krug\'s usability principles. Get AI-powered insights and actionable recommendations.',
  keywords: 'web usability, UX analysis, website analysis, usability testing, Steve Krug, Don\'t Make Me Think',
  authors: [{ name: 'Web Usability Analyzer' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Web Usability Analyzer',
    description: 'Analyze your website using Steve Krug\'s usability principles',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web Usability Analyzer',
    description: 'Analyze your website using Steve Krug\'s usability principles',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  )
}