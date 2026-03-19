'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await signOut()
    router.replace('/entrar')
    router.refresh()
    setLoading(false)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      onClick={handleSignOut}
      disabled={loading}
    >
      <LogOut className="h-4 w-4" />
      {loading ? 'Saindo...' : 'Sair'}
    </Button>
  )
}

