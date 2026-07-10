interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Logotipo minimalista: una gota estilizada (guiño vampírico sobrio). Usa
 * `currentColor`, así que hereda el color del contenedor (p. ej. `text-primary`).
 */
export function Logo({ size = 22, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 2.5c-3.2 4-6 6.9-6 10.4a6 6 0 0 0 12 0c0-3.5-2.8-6.4-6-10.4Z"
        fill="currentColor"
      />
      <path
        d="M9.6 8.7c-1.1 1.3-1.7 2.6-1.6 4.1"
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
