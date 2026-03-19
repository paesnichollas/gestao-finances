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

const MENU_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/socios', label: 'Sócios', icon: Users },
  { href: '/receitas', label: 'Receitas', icon: TrendingUp },
  { href: '/despesas', label: 'Despesas', icon: TrendingDown },
  { href: '/fechamento', label: 'Fechamento', icon: Calculator },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
]

function NavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex gap-1', compact ? 'overflow-x-auto pb-1' : 'flex-col')}>
      {MENU_ITEMS.map((item) => {
        const active = pathname === item.href
        return (
          <Button
            key={item.href}
            variant={active ? 'secondary' : 'ghost'}
            asChild
            className={cn(
              'justify-start',
              compact ? 'h-9 whitespace-nowrap px-3' : 'w-full',
            )}
          >
            <Link href={item.href}>
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
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">FinanceS</p>
            <p className="text-xs text-muted-foreground">Financeiro</p>
          </div>
        </div>
        <div className="flex-1 px-3 py-4">
          <NavLinks />
        </div>
        <div className="border-t px-3 py-3">
          <SignOutButton />
        </div>
      </aside>

      <div className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="space-y-2">
          <NavLinks compact />
          <SignOutButton />
        </div>
      </div>
    </>
  )
}
