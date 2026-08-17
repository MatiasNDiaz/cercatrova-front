import { Maximize2 } from 'lucide-react';

/**
 * Señal de "esta foto se puede ampliar", para poner sobre la imagen que abre el
 * visor. Existe para que el detalle de propiedad y la ficha compartible muestren
 * exactamente la misma pista en la esquina de la foto.
 *
 * ⚠️ Vive en su PROPIO archivo y no dentro de `ImageLightbox.tsx`, aunque son
 * la misma funcionalidad. El motivo es de bundle: `ImageLightbox` arrastra
 * Swiper + su módulo Zoom (~37 kB), y se carga con `next/dynamic` recién cuando
 * el usuario abre el visor. Si esta etiqueta viviera en ese archivo, el import
 * estático que hace falta para pintarla en el primer render volvería a meter
 * Swiper en el bundle inicial y anularía la carga diferida.
 *
 * Depende de `group-hover`, así que el contenedor de la imagen tiene que llevar
 * la clase `group`.
 */
export function AmpliarHint({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none flex items-center gap-1.5 rounded-full bg-ink-950/60 px-3 py-1.5 text-[11px] font-semibold text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 ${className}`}
    >
      <Maximize2 size={13} />
      Ampliar
    </span>
  );
}

export default AmpliarHint;
