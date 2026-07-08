type ClassValue = string | number | false | null | undefined;

/** Une clases condicionales de forma segura (mini utilidad tipo clsx). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
