'use client'

import * as React from 'react'
import { Menu } from 'lucide-react'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { BrandMark, NavLinks } from '@/components/layout/sidebar'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function AppHeader() {
  const [open, setOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:h-12 md:justify-end md:pl-[17rem] md:pr-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader>
              <SheetTitle asChild>
                <BrandMark />
              </SheetTitle>
              <SheetDescription className="sr-only">
                Menu de navegação principal
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t px-3 py-3">
              <SignOutButton />
            </div>
          </SheetContent>
        </Sheet>
        <BrandMark />
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  )
}
