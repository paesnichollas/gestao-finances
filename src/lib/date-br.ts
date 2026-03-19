/**
 * Datas no front em pt-BR: exibição e entrada como dd/mm/aaaa;
 * envio ao servidor em yyyy-mm-dd (compatível com input HTML date e Prisma).
 */

/** Trecho yyyy-mm-dd de uma ISO → dd/mm/yyyy */
export function isoYmdToBr(iso: string): string {
  const ymd = iso.split('T')[0] ?? ''
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

/** dd/mm/yyyy válido no calendário → yyyy-mm-dd; inválido → null */
export function brDateToIsoYmd(br: string): string | null {
  const trimmed = br.trim()
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)
  if (!match) {
    return null
  }
  const dd = Number(match[1])
  const mm = Number(match[2])
  const yyyy = Number(match[3])
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return null
  }
  const dt = new Date(yyyy, mm - 1, dd)
  if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) {
    return null
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${yyyy}-${pad(mm)}-${pad(dd)}`
}

/** Máscara dd/mm/aaaa a partir de dígitos (digitação ou colar) */
export function maskDateBrInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) {
    return digits
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}
