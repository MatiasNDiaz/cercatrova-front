/**
 * Wrapper de campo de formulario: label + control + hint/error.
 *
 * Centraliza el `Field` que hoy está reimplementado en 3 archivos
 * (PropertyForm.tsx, publicar/page.tsx, preferencias/page.tsx).
 * Ver FRONTEND_CHANGES.md para la lista de usos a migrar.
 *
 * La apariencia es EXACTAMENTE la actual (label chico bold gris) — esta pieza
 * solo unifica el código, no rediseña nada. El rediseño visual de los inputs
 * es una sesión aparte.
 *
 * Uso:
 *   <Field label="Precio (USD)" hint="Sin puntos ni comas">
 *     <Input type="number" value={price} onChange={...} />
 *   </Field>
 */

interface FieldProps {
  label: string;
  /** Texto de ayuda bajo el campo. Se oculta si hay `error`. */
  hint?: string;
  /** Mensaje de validación. Tiene prioridad sobre `hint`. */
  error?: string;
  /** Agrega un asterisco al label. */
  required?: boolean;
  /** id del control, para vincular el <label> por htmlFor. */
  htmlFor?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, required, htmlFor, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-bold text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {children}

      {error ? (
        <p className="text-[11px] font-medium text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-[11px] font-medium text-brand-700/70">{hint}</p>
      ) : null}
    </div>
  );
}

export default Field;
