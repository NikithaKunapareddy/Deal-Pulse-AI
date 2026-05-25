import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DealPulse AI - Smart Opportunity Stage Predictor',
  description: 'AI-powered deal stage prediction for sales teams',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-dark text-white">{children}</body>
    </html>
  )
}
