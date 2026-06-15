import * as React from 'react'
import { Input } from '@/components/ui/input'

type CurrencyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type' | 'inputMode'
> & {
  /** Valor numérico em reais (ex.: 5000 = R$ 5.000,00). */
  value: number | undefined
  /** Recebe o novo valor numérico, ou `undefined` quando o campo é esvaziado. */
  onChange: (value: number | undefined) => void
}

const formatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function format(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) return ''
  return formatter.format(value)
}

/**
 * Input com máscara monetária pt-BR. Usa o padrão "acumulador de centavos":
 * conta apenas os dígitos digitados e divide por 100, de modo que digitar
 * `5000` exibe `50,00` e `500000` exibe `5.000,00`. O valor exposto no form
 * permanece um `number` (reais), pronto para enviar ao backend sem parsing.
 */
export function CurrencyInput({ value, onChange, ...props }: CurrencyInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    if (digits === '') {
      onChange(undefined)
      return
    }
    onChange(Number(digits) / 100)
  }

  return (
    <Input
      inputMode="numeric"
      value={format(value)}
      onChange={handleChange}
      {...props}
    />
  )
}
