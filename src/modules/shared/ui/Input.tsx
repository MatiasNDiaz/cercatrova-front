/**
 * Input de formulario con las clases base centralizadas.
 *
 * Reemplaza las constantes `inputCls`/`inputClass` duplicadas en
 * PropertyForm.tsx, publicar/page.tsx y preferencias/page.tsx.
 *
 * Apariencia idéntica a la actual (fondo gris que blanquea al foco). Lo único
 * que cambia respecto del string original es que el color de foco sale del
 * token `brand-700` en vez del hex literal `#0b7a4b` — mismo valor exacto,
 * cero diferencia visual.
 */

/** Clases base del control. Exportadas para casos donde no se puede usar el componente (ej. <textarea>). */
export const inputBaseClasses =
  'w-full px-4 py-2.5 text-sm rounded-xl border bg-gray-50 transition-all placeholder:text-gray-400 focus:outline-none focus:bg-white';

const borderNormal = 'border-gray-200 focus:border-brand-700';
const borderInvalid = 'border-red-300 bg-red-50 focus:border-red-400';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Estado de error: borde y fondo rojos. Combinar con <Field error="..."> */
  invalid?: boolean;
}

export function Input({ invalid = false, className = '', ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={`${inputBaseClasses} ${invalid ? borderInvalid : borderNormal} ${className}`}
    />
  );
}

export default Input;
