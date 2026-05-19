'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp } from '@/lib/auth-client'

export function SignUpForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signUpError } = await signUp.email({
      name,
      email,
      password,
      callbackURL: '/',
    })

    if (signUpError) {
      setError(signUpError.message ?? 'Não foi possível concluir o cadastro.')
      setLoading(false)
      return
    }

    router.replace('/')
    router.refresh()
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md border-white/15 bg-card/90 shadow-2xl backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-6 text-center">
        <div className="mx-auto w-full max-w-[250px]">
          <Image
            src="/brand/zerohum-logo.png"
            alt="Zero Hum Extreme Sports"
            width={900}
            height={635}
            className="h-auto w-full"
            priority
          />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>Cadastro aberto para este ambiente.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11"
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <Button type="submit" className="h-11 w-full font-semibold" disabled={loading}>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Criando...' : 'Criar conta'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/entrar" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
