import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Suspense } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import './globals.css'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
})

const THEME_INIT_SCRIPT = `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = stored === 'dark' || ((stored === null || stored === 'system') && prefersDark);
    if (useDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch {}
})();`

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
    <html lang="pt-BR" className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Suspense fallback={<main className="min-h-screen" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  )
}
