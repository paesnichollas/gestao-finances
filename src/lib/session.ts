import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { auth } from '@/lib/auth'

const getCachedSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
})

export async function getServerSession() {
  return getCachedSession()
}

export async function requireSession() {
  const session = await getServerSession()

  if (!session) {
    redirect('/entrar')
  }

  return session
}

export async function requireGuest() {
  const session = await getServerSession()

  if (session) {
    redirect('/')
  }
}
