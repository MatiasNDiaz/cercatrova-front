/**
 * Select de formulario con las clases base centralizadas.
 *
 * Reemplaza las constantes `selectCls`/`selectClass` duplicadas en
 * PropertyForm.tsx, publicar/page.tsx y preferencias/page.tsx.
 *
 * Apariencia idéntica a la actual. Igual que en Input, lo único que cambia es
 * que el color de foco sale del token `brand-700` en vez del hex `#0b7a4b`.
 *
 * ⚠️ Nota heredada del código actual: las 3 copias usan `appearance-none`, que
 * saca la flecha nativa del <select> sin poner ninguna en su lugar — el control
 * queda sin indicador visual de que es desplegable. Se mantiene igual acá a
 * propósito (esta sesión no rediseña), pero conviene resolverlo cuando toquemos
 * el diseño de los inputs.
 */

import { inputBaseClasses } from './Input';

/** Clases base del select. Exportadas por si hace falta usarlas sueltas. */
export const selectBaseClasses = `${inputBaseClasses} appearance-none`;

const borderNormal = 'border-gray-200 focus:border-brand-700';
const borderInvalid = 'border-red-300 bg-red-50 focus:border-red-400';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Estado de error: borde y fondo rojos. Combinar con <Field error="..."> */
  invalid?: boolean;
}

export function Select({ invalid = false, className = '', children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={`${selectBaseClasses} ${invalid ? borderInvalid : borderNormal} ${className}`}
    >
      {children}
    </select>
  );
}

export default Select;
