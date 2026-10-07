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
      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
      transition={
        reduce ? { duration: 0 } : { type: 'spring', stiffness: 480, damping: 34, mass: 0.6 }
      }
      className={className}
    >
      {children}
    </motion.li>
  );
}
