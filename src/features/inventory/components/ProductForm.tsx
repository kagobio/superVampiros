import { useState } from 'react';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Category } from '@/domain/category/category.types';
import type { Location } from '@/domain/location/location.types';
import type { Unit } from '@/domain/unit/unit.types';
import type { Tag } from '@/domain/tag/tag.types';
import { calendarDaysUntil } from '@/domain/product/product.rules';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { cn } from '@/lib/cn';
import { describeExpiry, fromDateInput } from '@/lib/date';
import { productFormSchema, type ProductFormValues } from '../product.schema';

/** Indicador en vivo del estado de caducidad según la fecha seleccionada. */
function ExpiryHint({ control, now }: { control: Control<ProductFormValues>; now: number }) {
  const value = useWatch({ control, name: 'expiryDate' });
  const ts = fromDateInput(value ?? '');
  if (ts == null) return null;
  const days = calendarDaysUntil(ts, now);
  const tone = days < 0 ? 'text-danger' : days <= 3 ? 'text-warning' : 'text-success';
  const dot = days < 0 ? 'bg-danger' : days <= 3 ? 'bg-warning' : 'bg-success';
  return (
    <p className={cn('flex items-center gap-1.5 text-xs', tone)}>
      <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', dot)} />
      {describeExpiry(days)}
    </p>
  );
}

export interface ProductFormProps {
  formId: string;
  defaultValues: ProductFormValues;
  categories: Category[];
  locations: Location[];
  units: Unit[];
  tags: Tag[];
  onSubmit: (values: ProductFormValues) => void;
}

/** Formulario de alta/edición de producto (RHF + Zod). */
export function ProductForm({
  formId,
  defaultValues,
  categories,
  locations,
  units,
  tags,
  onSubmit,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  // Timestamp estable por montaje para el indicador de caducidad.
  const [now] = useState(() => Date.now());

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Nombre" error={errors.name?.message}>
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            autoFocus
            placeholder="Leche, huevos, arroz…"
            {...register('name')}
          />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cantidad" error={errors.quantity?.message}>
          {({ id }) => (
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              min={0}
              {...register('quantity', { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Unidad">
          {({ id }) => (
            <Select id={id} {...register('unitId')}>
              <option value="">—</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.abbreviation})
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoría">
          {({ id }) => (
            <Select id={id} {...register('categoryId')}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Ubicación">
          {({ id }) => (
            <Select id={id} {...register('locationId')}>
              <option value="">—</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Stock mínimo" hint="Aviso al bajar de aquí" error={errors.minStock?.message}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="number"
              inputMode="decimal"
              min={0}
              {...register('minStock', { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Caducidad">
          {({ id }) => <Input id={id} type="date" {...register('expiryDate')} />}
        </Field>
      </div>

      <ExpiryHint control={control} now={now} />

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2.5">
        <span className="text-sm font-medium text-text">Marcar como favorito</span>
        <Controller
          control={control}
          name="favorite"
          render={({ field }) => (
            <Switch checked={field.value} onChange={field.onChange} label="Favorito" />
          )}
        />
      </div>

      <Field label="Color" hint="Se usa en el monograma del producto">
        {() => (
          <Controller
            control={control}
            name="color"
            render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
          />
        )}
      </Field>

      {tags.length > 0 ? (
        <Field label="Etiquetas">
          {() => (
            <Controller
              control={control}
              name="tagIds"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const active = field.value.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          field.onChange(
                            active
                              ? field.value.filter((t) => t !== tag.id)
                              : [...field.value, tag.id],
                          )
                        }
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs transition-colors',
                          active
                            ? 'border-transparent bg-primary text-primary-fg'
                            : 'border-border text-muted hover:text-text',
                        )}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          )}
        </Field>
      ) : null}

      <Field label="Notas" error={errors.notes?.message}>
        {({ id, describedBy }) => (
          <TextArea
            id={id}
            aria-describedby={describedBy}
            placeholder="Marca preferida, dónde comprarlo…"
            {...register('notes')}
          />
        )}
      </Field>
    </form>
  );
}
