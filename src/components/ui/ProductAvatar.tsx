import { cn } from '@/lib/cn';

interface ProductAvatarProps {
  /** Se conserva por compatibilidad; ya no se usa (se muestra un monograma). */
  icon?: string;
  color: string;
  name: string;
  size?: 'sm' | 'md';
}

/** Inicial del producto en mayúscula (o '·' si no hay nombre). */
function initial(name: string): string {
  const c = name.trim().charAt(0);
  return c ? c.toUpperCase() : '·';
}

/**
 * Avatar del producto: un monograma elegante (la inicial en el color del
 * producto sobre una superficie sutil). Sustituye a los emojis por una estética
 * más sobria y profesional.
 */
export function ProductAvatar({ color, name, size = 'md' }: ProductAvatarProps) {
  const box = size === 'sm' ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-base';
  return (
    <span
      aria-hidden="true"
      title={name}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl border font-display font-medium',
        box,
      )}
      style={{
        color,
        backgroundColor: `${color}14`,
        borderColor: `${color}33`,
      }}
    >
      {initial(name)}
    </span>
  );
}
