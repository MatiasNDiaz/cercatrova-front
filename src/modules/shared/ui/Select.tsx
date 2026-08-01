/**
 * Select de formulario con las clases base centralizadas.
 *
 * Reemplaza las constantes `selectCls`/`selectClass` duplicadas en
 * PropertyForm.tsx, publicar/page.tsx y preferencias/page.tsx.
 *
 * Apariencia idéntica a la actual. Igual que en Input, lo único que cambia es
 * que el color de foco sale del token `brand-700` en vez del hex `#0b7a4b`.
 *
 * La flecha: `appearance-none` saca la del navegador, así que se dibuja una
 * propia. Antes no se reponía ninguna y el control quedaba idéntico a un input
 * de texto — en desktop se descubría probando, y en mobile directamente no
 * invitaba a tocarlo. Es `pointer-events-none` para que el click atraviese y
 * abra el desplegable igual.
 */

import { inputBaseClasses } from './Input';

/** Clases base del select. Exportadas por si hace falta usarlas sueltas. */
export const selectBaseClasses = `${inputBaseClasses} appearance-none pr-10`;

const borderNormal = 'border-gray-200 focus:border-brand-700';
const borderInvalid = 'border-red-300 bg-red-50 focus:border-red-400';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Estado de error: borde y fondo rojos. Combinar con <Field error="..."> */
  invalid?: boolean;
}

export function Select({ invalid = false, className = '', children, ...props }: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        {...props}
        aria-invalid={invalid || undefined}
        className={`${selectBaseClasses} ${invalid ? borderInvalid : borderNormal} ${className}`}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-400"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

export default Select;
