/**
 * Normaliza SSL para evitar warning do `pg` com aliases legados de sslmode.
 */
export function postgresUrlForNodePg(url: string): string {
  const legacySslModeRegex =
    /([?&]sslmode=)(prefer|require|verify-ca)(?=(&|$))/i

  if (legacySslModeRegex.test(url)) {
    return url.replace(legacySslModeRegex, '$1verify-full')
  }

  if (/[?&]sslmode=/i.test(url)) return url

  try {
    const u = new URL(url.replace(/^postgresql:/, 'http:'))
    if (
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.hostname === '::1'
    ) {
      return url
    }
  } catch {
    return url
  }

  return url.includes('?')
    ? `${url}&sslmode=verify-full`
    : `${url}?sslmode=verify-full`
}
