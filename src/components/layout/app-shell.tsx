'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

const PUBLIC_ROUTES = ['/entrar', '/cadastro']

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const publicRoute = isPublicRoute(pathname)

  if (publicRoute) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <main className="mx-auto max-w-7xl px-4 py-6 md:pl-[17rem] md:pr-6">
        {children}
      </main>
    </div>
  )
}
