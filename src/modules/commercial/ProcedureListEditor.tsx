import { useFieldArray, useWatch, type Control } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useProcedures } from '@/modules/catalog/procedure.queries'
import { formatCurrency } from '@/lib/utils'
import type { DealFormInput } from './deal.schema'

interface Props {
  control: Control<DealFormInput>
}

const EMPTY_ITEM = { procedureId: '', priceOverride: undefined, quantity: 1, note: '' }

/** Linha de item: mostra o valor efetivo (override ?? padrão do catálogo) × qtd. */
function ItemSubtotal({ control, index, defaultPrice }: { control: Control<DealFormInput>; index: number; defaultPrice: number | undefined }) {
  const override = useWatch({ control, name: `items.${index}.priceOverride` }) as number | undefined
  const quantity = useWatch({ control, name: `items.${index}.quantity` }) as number | string | undefined
  const unit = override ?? defaultPrice
  if (unit == null) return null
  const qty = Number(quantity) || 0
  return (
    <p className="text-xs text-muted-foreground">
      Subtotal: <span className="font-medium text-foreground">{formatCurrency(unit * qty)}</span>
      {' '}({formatCurrency(unit)} × {qty})
    </p>
  )
}

export default function ProcedureListEditor({ control }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const { data: procedures = [], isLoading } = useProcedures()
  const selected = (useWatch({ control, name: 'items' }) ?? []) as { procedureId?: string }[]

  return (
    <div className="space-y-3">
      {procedures.length === 0 && !isLoading && (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          Nenhum procedimento no catálogo. Cadastre em <strong>Procedimentos</strong> antes de montar o orçamento.
        </p>
      )}

      {fields.map((field, index) => {
        const procId = selected[index]?.procedureId
        const proc = procedures.find((p) => p.id === procId)
        return (
          <div key={field.id} className="border rounded-lg p-3 space-y-2 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive h-6 px-2"
                  onClick={() => remove(index)}
                >
                  Remover
                </Button>
              )}
            </div>

            <FormField
              control={control}
              name={`items.${index}.procedureId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedimento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoading ? 'Carregando...' : 'Selecione o procedimento'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {procedures.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}{p.code ? ` (${p.code})` : ''} — {formatCurrency(p.defaultPrice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} value={(field.value as string | number | undefined) ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`items.${index}.priceOverride`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (opcional)</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        placeholder={proc ? formatCurrency(proc.defaultPrice) : '0,00'}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value as number | undefined}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name={`items.${index}.note`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Detalhes adicionais" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ItemSubtotal control={control} index={index} defaultPrice={proc?.defaultPrice} />
          </div>
        )
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={procedures.length === 0}
        onClick={() => append(EMPTY_ITEM)}
      >
        + Adicionar item
      </Button>
    </div>
  )
}
