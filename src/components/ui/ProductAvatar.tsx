import { Package } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ProductAvatarProps {
  icon: string;
  color: string;
  name: string;
  size?: 'sm' | 'md';
}

/** Detecta si el icono es un emoji (cualquier carácter fuera del ASCII imprimible). */
function isEmoji(icon: string): boolean {
  return icon.length > 0 && /[^ -~]/.test(icon);
}

/**
 * Avatar del producto: cuadrado redondeado teñido con su color, mostrando su
 * emoji si lo tiene o un icono por defecto. (El IconPicker llegará en Fase 6.)
 */
export function ProductAvatar({ icon, color, name, size = 'md' }: ProductAvatarProps) {
  const box = size === 'sm' ? 'h-9 w-9 text-lg' : 'h-11 w-11 text-xl';
  return (
    <span
      aria-hidden="true"
      className={cn('flex shrink-0 items-center justify-center rounded-xl', box)}
      style={{ backgroundColor: `${color}22`, color }}
      title={name}
    >
      {isEmoji(icon) ? (
        <span className="leading-none">{icon}</span>
      ) : (
        <Package size={size === 'sm' ? 18 : 20} />
      )}
    </span>
  );
}
