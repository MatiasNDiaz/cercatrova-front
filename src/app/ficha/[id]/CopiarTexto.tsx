'use client';

import { useCallback, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Botón "copiar" para un bloque de texto de la ficha.
 *
 * ── Por qué existe, y por qué SÓLO en dos lugares ───────────────────────────
 * La ficha se le pasa a un colega que casi siempre va a reusar el texto: lo
 * pega en su propio aviso, en un WhatsApp o en su CRM. Seleccionar a mano una
 * descripción de doce renglones en el teléfono es incómodo y se corta mal.
 *
 * Va sólo en el **título** y en la **descripción**, que son los dos campos de
 * texto largo. El resto de la ficha son datos sueltos (un precio, un barrio, un
 * número de ambientes): copiarlos a mano es un gesto, y un botón por dato
 * llenaría la pantalla de íconos sin ahorrarle nada a nadie.
 *
 * ── El estado "copiado" dura 2s y además hay toast ──────────────────────────
 * El toast confirma la acción aunque el botón haya quedado fuera de vista
 * (típico en la descripción larga, donde el botón está arriba del bloque y el
 * dedo termina abajo); el ícono ✓ da la respuesta inmediata en el punto donde
 * el usuario está mirando. Las dos señales cubren casos distintos.
 */
export function CopiarTexto({
  texto, etiqueta, className = '',
}: {
  texto: string;
  /** Qué se copió, para el mensaje: "Título copiado". */
  etiqueta: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  const copiar = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast.success(`${etiqueta} copiado`);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error('No se pudo copiar');
    }
  }, [texto, etiqueta]);

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={`Copiar ${etiqueta.toLowerCase()}`}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-brand-700/30 bg-brand-50 px-2.5 py-1.5 text-[11px] font-bold tracking-wide text-brand-800 uppercase transition-colors duration-200 hover:border-brand-700 hover:bg-brand-100 ${className}`}
    >
      {copiado ? <Check size={13} /> : <Copy size={13} />}
      {copiado ? 'Copiado' : 'Copiar'}
    </button>
  );
}

export default CopiarTexto;
