'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Link2, Check } from 'lucide-react';

/**
 * Enlace directo de una publicación: `/publicaciones/:id`.
 *
 * Esa ruta muestra SOLO esa publicación (con su galería, likes y comentarios)
 * y trae metadatos OpenGraph, así que al pegarlo en WhatsApp, Instagram o
 * Facebook se previsualiza con su imagen/video y su texto, y quien lo abre cae
 * directo en ella.
 *
 * `window.location.origin` y no un dominio fijo: el mismo botón sirve en
 * producción, en previews y en local sin configurar nada.
 */
export function postShareUrl(postId: number): string {
  return `${window.location.origin}/publicaciones/${postId}`;
}

/** Copia al portapapeles, con respaldo para navegadores/contextos sin la API moderna. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Botón "Copiar enlace" de una publicación — para que el administrador o el
 * agente lo peguen y se lo manden a sus clientes.
 *
 * `variant`:
 *  - `light`: sobre fondo blanco (tarjeta del feed, panel admin).
 *  - `overlay`: sobre una foto/video (card de Cerca-Reels).
 * `withLabel` agrega el texto "Copiar enlace" al lado del ícono.
 */
export function CopyPostLinkButton({
  postId,
  variant = 'light',
  withLabel = false,
  className = '',
}: {
  postId: number;
  variant?: 'light' | 'overlay';
  withLabel?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    // Puede estar encima de un link (card de Cerca-Reels): que no navegue.
    e.preventDefault();
    e.stopPropagation();

    if (await copyText(postShareUrl(postId))) {
      setCopied(true);
      toast.success('Enlace copiado — pegalo en WhatsApp, Instagram o Facebook');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const styles =
    variant === 'overlay'
      ? 'bg-black/55 text-white backdrop-blur-sm hover:bg-black/70'
      : 'border border-ink-200 bg-white text-ink-600 shadow-sm hover:border-brand-700/40 hover:text-brand-700';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copied ? 'Enlace copiado' : 'Copiar enlace de la publicación'}
      title="Copiar enlace de la publicación"
      className={`inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 ${
        withLabel ? 'w-9 sm:w-auto sm:px-3.5' : 'w-9'
      } ${styles} ${className}`}
    >
      {copied ? <Check size={15} className={variant === 'overlay' ? '' : 'text-brand-700'} /> : <Link2 size={15} />}
      {/* En pantallas chicas queda solo el ícono, para no apretar lo de al lado. */}
      {withLabel && <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar enlace'}</span>}
    </button>
  );
}

export default CopyPostLinkButton;
