'use client';

import { GUEST_NAME_MAX } from '@/modules/shared/lib/interaction';

/**
 * Campos extra del formulario de comentario cuando NO hay sesión:
 *
 *  - "Tu nombre (opcional)": si queda vacío, el comentario se muestra como
 *    "Visitante".
 *  - Honeypot anti-bots: un campo `website` invisible para las personas
 *    (fuera de pantalla, sin tab, `aria-hidden`, autocompletado apagado). Un
 *    bot que llena todos los inputs lo completa, y el backend descarta el
 *    comentario en silencio.
 */
export function GuestNameField({
  name,
  onNameChange,
  honeypot,
  onHoneypotChange,
  compact = false,
}: {
  name: string;
  onNameChange: (v: string) => void;
  honeypot: string;
  onHoneypotChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value.slice(0, GUEST_NAME_MAX))}
        placeholder="Tu nombre (opcional)"
        aria-label="Tu nombre (opcional)"
        autoComplete="name"
        className={`w-full rounded-2xl border border-ink-200 bg-white text-sm text-ink-700 placeholder:text-ink-500 focus:border-brand-700 focus:outline-none ${
          compact ? 'px-3.5 py-2' : 'px-4 py-2.5'
        }`}
      />
      {/* Honeypot: las personas no lo ven ni llegan con el teclado. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Sitio web
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => onHoneypotChange(e.target.value)}
          />
        </label>
      </div>
    </>
  );
}

export default GuestNameField;
