import { SignUpForm } from '@/components/auth/sign-up-form'
import { connection } from 'next/server'
import { requireGuest } from '@/lib/session'

export default async function CadastroPage() {
  await connection()
  await requireGuest()

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <SignUpForm />
    </div>
  )
}
