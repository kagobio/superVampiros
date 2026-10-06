import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
}

/**
 * Elemento de lista (`<li>`) con entrada/salida y reordenamiento animados
 * (estilo hoja nativa). Úsalo dentro de un `<AnimatePresence>` para que al
 * añadir, quitar o mover elementos la lista reaccione con un muelle discreto.
 * Respeta `prefers-reduced-motion`.
 */
export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      layout={reduce ? false : 'position'}
      initial={reduce ? false : { opacity: 0, scale: 0.97 }}
      animate={reduce ? undefined : { opacity: 1, scale: 1 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
      transition={
        reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40, mass: 0.6 }
      }
      className={className}
    >
      {children}
    </motion.li>
  );
}
