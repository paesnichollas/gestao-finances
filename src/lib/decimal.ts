import Decimal from 'decimal.js'
import { Prisma } from '@prisma/client'

export type DecimalValue = Decimal.Value | null | undefined

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/

function sanitizeInput(value: string): string {
  const trimmed = value.trim().replace(/\s/g, '')
  if (!trimmed) {
    return '0'
  }

  if (trimmed.includes(',') && trimmed.includes('.')) {
    const commaLastIndex = trimmed.lastIndexOf(',')
    const dotLastIndex = trimmed.lastIndexOf('.')

    // pt-BR: 1.234,56
    if (commaLastIndex > dotLastIndex) {
      return trimmed.replace(/\./g, '').replace(',', '.')
    }

    // en-US: 1,234.56
    return trimmed.replace(/,/g, '')
  }

  if (trimmed.includes(',')) {
    return trimmed.replace(',', '.')
  }

  return trimmed
}

export function normalizeDecimalString(value: string): string {
  const sanitized = sanitizeInput(value)
  if (!DECIMAL_PATTERN.test(sanitized)) {
    throw new Error(`Valor decimal inválido: ${value}`)
  }

  return sanitized
}

export function toDecimal(value: DecimalValue, fallback = '0'): Decimal {
  if (value === null || value === undefined) {
    return new Decimal(fallback)
  }

  if (value instanceof Decimal) {
    return value
  }

  if (typeof value === 'string') {
    return new Decimal(normalizeDecimalString(value))
  }

  return new Decimal(value)
}

export function toMoneyDecimal(value: DecimalValue): Decimal {
  return toDecimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

export function toPercentageDecimal(value: DecimalValue): Decimal {
  return toDecimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

export function decimalToString(value: DecimalValue, scale = 2): string {
  return toDecimal(value).toDecimalPlaces(scale, Decimal.ROUND_HALF_UP).toFixed(scale)
}

export function decimalToNumber(value: DecimalValue): number {
  return Number(toDecimal(value).toString())
}

export function toPrismaDecimal(value: DecimalValue, scale = 2): Prisma.Decimal {
  return new Prisma.Decimal(decimalToString(value, scale))
}

export function sumDecimals(values: DecimalValue[], scale = 2): string {
  const total = values.reduce<Decimal>((acc, value) => acc.plus(toDecimal(value)), new Decimal(0))
  return total.toDecimalPlaces(scale, Decimal.ROUND_HALF_UP).toFixed(scale)
}

export function addDecimals(a: DecimalValue, b: DecimalValue, scale = 2): string {
  return toDecimal(a).plus(toDecimal(b)).toDecimalPlaces(scale, Decimal.ROUND_HALF_UP).toFixed(scale)
}

export function subtractDecimals(a: DecimalValue, b: DecimalValue, scale = 2): string {
  return toDecimal(a).minus(toDecimal(b)).toDecimalPlaces(scale, Decimal.ROUND_HALF_UP).toFixed(scale)
}

export function multiplyDecimals(a: DecimalValue, b: DecimalValue, scale = 2): string {
  return toDecimal(a).times(toDecimal(b)).toDecimalPlaces(scale, Decimal.ROUND_HALF_UP).toFixed(scale)
}

export function compareDecimals(a: DecimalValue, b: DecimalValue): number {
  return toDecimal(a).cmp(toDecimal(b))
}
