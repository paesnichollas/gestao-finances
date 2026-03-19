import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gestão financeira',
  description: 'Sistema de controle financeiro para projetos com múltiplos sócios',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Suspense fallback={<main className="min-h-screen" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  )
}
