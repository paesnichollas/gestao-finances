import { SignInForm } from '@/components/auth/sign-in-form'
import { connection } from 'next/server'
import { requireGuest } from '@/lib/session'

export default async function EntrarPage() {
  await connection()
  await requireGuest()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.58_0.16_259_/_0.24),transparent_42%),radial-gradient(circle_at_bottom_left,oklch(0.98_0.01_250_/_0.1),transparent_40%)]" />
      <div className="pointer-events-none absolute -left-20 top-[-5rem] h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-[-6rem] h-80 w-80 rounded-full bg-secondary/40 blur-3xl" />
      <div className="relative z-10 w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  )
}
