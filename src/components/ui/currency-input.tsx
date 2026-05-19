'use client'

import * as React from 'react'
import { Input, type InputProps } from '@/components/ui/input'
import {
  centsToDecimalString,
  decimalStringToCents,
  formatCentsToBRL,
} from '@/lib/decimal'

export type CurrencyInputProps = Omit<InputProps, 'value' | 'onChange' | 'type'> & {
  value: string
  onValueChange: (decimalString: string) => void
  allowEmpty?: boolean
}

const MAX_DIGITS = 13

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, allowEmpty = false, placeholder, ...rest }, ref) => {
    const cents = decimalStringToCents(value)
    const isEmpty = allowEmpty && (!value || cents === '0')
    const display = isEmpty ? '' : formatCentsToBRL(cents)

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS)
      const newCents = digits.replace(/^0+(?=\d)/, '') || '0'
      onValueChange(centsToDecimalString(newCents))
    }

    return (
      <Input
        {...rest}
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        placeholder={placeholder ?? 'R$ 0,00'}
        aria-label={rest['aria-label'] ?? `Valor em reais: ${display || 'R$ 0,00'}`}
      />
    )
  },
)
CurrencyInput.displayName = 'CurrencyInput'
