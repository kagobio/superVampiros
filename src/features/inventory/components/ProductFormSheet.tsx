import { useId } from 'react';
import { Trash2 } from 'lucide-react';
import type { Product } from '@/domain/product/product.types';
import { inventoryService } from '@/services/inventory/inventory.service';
import { DEFAULT_PRODUCT_COLOR, DEFAULT_PRODUCT_ICON } from '@/config/constants';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { fromDateInput, toDateInput } from '@/lib/date';
import { useCategories, useLocations, useTags, useUnits } from '@/hooks/useTaxonomies';
import { ProductForm } from './ProductForm';
import type { ProductFormValues } from '../product.schema';

interface ProductFormSheetProps {
  open: boolean;
  onClose: () => void;
  /** Producto a editar; `null` para crear uno nuevo. */
  product: Product | null;
  defaultUnitId: string | null;
  /** Nombre inicial al crear (p. ej. venido del escaneo). */
  initialName?: string;
  /** Código de barras a guardar al crear (venido del escaneo). */
  barcode?: string | null;
}

function toFormValues(
  product: Product | null,
  defaultUnitId: string | null,
  initialName: string,
): ProductFormValues {
  if (!product) {
    return {
      name: initialName,
      categoryId: '',
      locationId: '',
      quantity: 1,
      unitId: defaultUnitId ?? '',
      minStock: 0,
      favorite: false,
      expiryDate: '',
      notes: '',
      icon: DEFAULT_PRODUCT_ICON,
      color: DEFAULT_PRODUCT_COLOR,
      tagIds: [],
    };
  }
  return {
    name: product.name,
    categoryId: product.categoryId ?? '',
    locationId: product.locationId ?? '',
    quantity: product.quantity,
    unitId: product.unitId ?? '',
    minStock: product.minStock,
    favorite: product.favorite,
    expiryDate: toDateInput(product.expiryDate),
    notes: product.notes,
    icon: product.icon,
    color: product.color,
    tagIds: product.tagIds,
  };
}

/** Convierte '' → null en los campos de id. */
function nullable(value: string): string | null {
  return value === '' ? null : value;
}

/** Sheet que contiene el formulario de producto y orquesta guardar/eliminar. */
export function ProductFormSheet({
  open,
  onClose,
  product,
  defaultUnitId,
  initialName = '',
  barcode = null,
}: ProductFormSheetProps) {
  const formId = useId();
  const categories = useCategories();
  const locations = useLocations();
  const units = useUnits();
  const tags = useTags();
  const isEdit = product !== null;

  const handleSubmit = async (values: ProductFormValues) => {
    const payload = {
      name: values.name,
      categoryId: nullable(values.categoryId),
      locationId: nullable(values.locationId),
      quantity: values.quantity,
      unitId: nullable(values.unitId),
      minStock: values.minStock,
      favorite: values.favorite,
      expiryDate: fromDateInput(values.expiryDate),
      notes: values.notes,
      icon: values.icon,
      color: values.color,
      tagIds: values.tagIds,
    };
    if (isEdit) {
      await inventoryService.update(product.id, payload);
    } else {
      await inventoryService.create({ ...payload, barcode });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (product) {
      await inventoryService.remove(product.id);
      onClose();
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      footer={
        <div className="flex items-center gap-2">
          {isEdit ? (
            <Button variant="ghost" onClick={handleDelete} className="text-danger">
              <Trash2 size={18} aria-hidden="true" />
              Eliminar
            </Button>
          ) : null}
          <Button type="submit" form={formId} className="ml-auto">
            {isEdit ? 'Guardar' : 'Añadir'}
          </Button>
        </div>
      }
    >
      {barcode ? (
        <p className="mb-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
          Código escaneado: <span className="font-mono text-text">{barcode}</span>
        </p>
      ) : null}
      {/* `key` reinicia el formulario al cambiar de producto o de código. */}
      <ProductForm
        key={product?.id ?? barcode ?? 'new'}
        formId={formId}
        defaultValues={toFormValues(product, defaultUnitId, initialName)}
        categories={categories}
        locations={locations}
        units={units}
        tags={tags}
        onSubmit={handleSubmit}
      />
    </Sheet>
  );
}
