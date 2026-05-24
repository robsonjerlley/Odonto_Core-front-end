import { useFieldArray, type Control } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { DealFormInput } from './deal.schema'

interface Props {
  control: Control<DealFormInput>
}

const EMPTY_PROCEDURE = { name: '', code: '', tableValue: 0, quantity: 1, note: '' }

export default function ProcedureListEditor({ control }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'procedures' })

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="border rounded-lg p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Procedimento {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive h-6 px-2"
              onClick={() => remove(index)}
            >
              Remover
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={control}
              name={`procedures.${index}.name`}
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Nome do procedimento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Implante dentário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`procedures.${index}.code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="TUSS, CBP..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`procedures.${index}.quantity`}
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
              name={`procedures.${index}.tableValue`}
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Valor tabela (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={0.01} placeholder="0,00" {...field} value={(field.value as string | number | undefined) ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`procedures.${index}.note`}
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Observação (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Detalhes adicionais" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => append(EMPTY_PROCEDURE)}
      >
        + Adicionar procedimento
      </Button>
    </div>
  )
}
