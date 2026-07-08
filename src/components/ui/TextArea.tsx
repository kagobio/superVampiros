import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { controlClass } from './Field';

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, rows = 3, ...props },
  ref,
) {
  return (
    <textarea ref={ref} rows={rows} className={cn(controlClass, 'py-2.5', className)} {...props} />
  );
});
