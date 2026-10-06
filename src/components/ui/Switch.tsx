import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

/** Interruptor accesible (role=switch) para opciones booleanas. */
export function Switch({ checked, onChange, label, id }: SwitchProps) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-surface-2',
      )}
    >
      <motion.span
        aria-hidden="true"
        className="inline-block h-5 w-5 rounded-full bg-white shadow"
        animate={{ x: checked ? 24 : 4 }}
        transition={
          reduce ? { duration: 0 } : { type: 'spring', stiffness: 550, damping: 32, mass: 0.6 }
        }
      />
    </button>
  );
}
