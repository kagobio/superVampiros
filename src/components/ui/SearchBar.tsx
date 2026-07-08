import { Search, X } from 'lucide-react';
import { controlClass } from './Field';
import { cn } from '@/lib/cn';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Buscador con icono y botón de limpieza. */
export function SearchBar({ value, onChange, placeholder = 'Buscar…' }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar productos"
        className={cn(controlClass, 'h-11 pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-text"
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
