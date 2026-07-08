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
}

function toFormValues(product: Product | null, defaultUnitId: string | null): ProductFormValues {
  if (!product) {
    return {
      name: '',
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
export function ProductFormSheet({ open, onClose, product, defaultUnitId }: ProductFormSheetProps) {
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
      await inventoryService.create(payload);
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
      {/* `key` reinicia el formulario al cambiar de producto (o entre crear/editar). */}
      <ProductForm
        key={product?.id ?? 'new'}
        formId={formId}
        defaultValues={toFormValues(product, defaultUnitId)}
        categories={categories}
        locations={locations}
        units={units}
        tags={tags}
        onSubmit={handleSubmit}
      />
    </Sheet>
  );
}
