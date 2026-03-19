import { SignInForm } from '@/components/auth/sign-in-form'
import { connection } from 'next/server'
import { requireGuest } from '@/lib/session'

export default async function EntrarPage() {
  await connection()
  await requireGuest()

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <SignInForm />
    </div>
  )
}
