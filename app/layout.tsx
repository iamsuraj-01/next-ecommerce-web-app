import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRUD Operation App',
  description: 'Complete CRUD operations with Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

