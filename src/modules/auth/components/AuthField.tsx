'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, type LucideIcon } from 'lucide-react';

/**
 * Campo de formulario de auth (Bloque H §2).
 *
 * ⚠️ Por qué NO usa el `<Field>`/`<Input>` compartidos de `shared/ui`:
 * esos componentes tienen `px-4` en su clase base y estos campos necesitan
 * `pl-10` para el ícono de adentro (y `pr-10` en los de contraseña, por el
 * botón del ojito). Como el proyecto no usa `tailwind-merge`, pasar `pl-10`
 * por `className` dejaría los dos paddings compitiendo — es exactamente el
 * caso que ya se documentó en el Bloque UI-7 con los inputs con ícono de
 * `preferencias/page.tsx` y el precio de `PropertyForm`.
 *
 * Cuando exista un `<Input icon={...} />` compartido, estos campos son los
 * primeros candidatos a migrar.
 *
 * El mensaje de error aparece y desaparece animado (alto + opacidad) para que
 * el formulario no "salte" de golpe al validar.
 */

interface AuthFieldProps {
  label: string;
  icon: LucideIcon;
  error?: string;
  /** Contenido extra a la derecha del label (ej. "¿Olvidaste tu contraseña?"). */
  action?: React.ReactNode;
  /** El input, ya registrado con react-hook-form. */
  children: React.ReactNode;
  htmlFor?: string;
}

export function AuthField({ label, icon: Icon, error, action, children, htmlFor }: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-800">
          {label}
        </label>
        {action}
      </div>

      <div className="relative">
        <span
          className={`pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 transition-colors ${
            error ? 'text-red-400' : 'text-ink-400'
          }`}
        >
          <Icon size={17} />
        </span>
        {children}
      </div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 2 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex items-center gap-1.5 overflow-hidden text-[13px] font-medium text-red-600"
          >
            <AlertCircle size={13} className="shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Clases del input de auth. Incluye `pl-10` para dejar lugar al ícono. */
export const authInputClasses =
  'w-full rounded-xl border bg-ink-50/60 py-3 pl-10 pr-4 text-sm text-ink-900 outline-none transition-all duration-200 placeholder:text-ink-400 focus:bg-white';

export const authInputNormal = 'border-ink-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10';
export const authInputError = 'border-red-300 bg-red-50/60 focus:border-red-400 focus:ring-4 focus:ring-red-500/10';

/** Helper para armar el className del input según el estado de error. */
export function authInput(hasError: boolean, extra = '') {
  return `${authInputClasses} ${hasError ? authInputError : authInputNormal} ${extra}`;
}

export default AuthField;
