import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '池田牧場 飼料在庫管理',
  description: '池田牧場の飼料在庫管理システム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-green-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
