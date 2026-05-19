'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calculator,
  FileText,
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const MENU_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/socios', label: 'Sócios', icon: Users },
  { href: '/receitas', label: 'Receitas', icon: TrendingUp },
  { href: '/despesas', label: 'Despesas', icon: TrendingDown },
  { href: '/fechamento', label: 'Fechamento', icon: Calculator },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
] as const

export function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-md bg-primary/10 p-2 text-primary">
        <Calculator className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">FinanceS</p>
        <p className="text-xs text-muted-foreground">Financeiro</p>
      </div>
    </div>
  )
}

export function NavLinks({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void
  compact?: boolean
}) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex flex-col gap-1', compact && 'gap-0.5')}>
      {MENU_ITEMS.map((item) => {
        const active = pathname === item.href
        return (
          <Button
            key={item.href}
            variant={active ? 'secondary' : 'ghost'}
            asChild
            className={cn(
              'w-full justify-start gap-2 transition-colors',
              !active && 'hover:bg-muted',
            )}
          >
            <Link href={item.href} onClick={onNavigate}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background md:flex md:flex-col">
      <div className="border-b px-5 py-4">
        <BrandMark />
      </div>
      <div className="flex-1 px-3 py-4">
        <NavLinks />
      </div>
      <div className="border-t px-3 py-3">
        <SignOutButton />
      </div>
    </aside>
  )
}
