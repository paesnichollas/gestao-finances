import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/entrar', '/cadastro']

function isPublicRoute(pathname: string) {
  return (
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
    || pathname.startsWith('/api/auth')
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const hasSession = Boolean(getSessionCookie(request))

  if (!hasSession) {
    return NextResponse.redirect(new URL('/entrar', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
