'use client'

import * as React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'
const ORDER: Theme[] = ['light', 'dark', 'system']
const LABELS: Record<Theme, string> = {
  light: 'Tema claro',
  dark: 'Tema escuro',
  system: 'Tema do sistema',
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const value = window.localStorage.getItem(STORAGE_KEY)
  if (value === 'light' || value === 'dark' || value === 'system') return value
  return 'system'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>('system')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    setTheme(getStoredTheme())
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    applyTheme(resolveTheme(theme))
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme, mounted])

  React.useEffect(() => {
    if (!mounted || theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(media.matches ? 'dark' : 'light')
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [theme, mounted])

  function cycle() {
    setTheme((current) => {
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
      return next ?? 'system'
    })
  }

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={cycle}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      suppressHydrationWarning
    >
      {mounted ? <Icon className="h-4 w-4" /> : <Monitor className="h-4 w-4 opacity-0" />}
    </Button>
  )
}
