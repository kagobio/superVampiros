import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { controlClass } from './Field';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(controlClass, 'h-11', className)} {...props} />;
});
