'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Home } from 'lucide-react';

/**
 * Miniatura de la propiedad en una notificación — y es el enlace.
 *
 * Reemplaza al link de texto "Ver propiedad" de las tarjetas de notificación.
 *
 *  - Escritorio: 140×100 a la derecha de la tarjeta. Al pasar el cursor (o
 *    al enfocarla con el teclado) se oscurece y aparece "Ver propiedad".
 *  - Celular (sin hover): ancho completo debajo del texto, con una franja
 *    oscura fija abajo que dice "Ver propiedad".
 *  - Sin fotos o si la imagen no carga: casita sobre gris claro, nunca una
 *    imagen rota.
 *  - Propiedad borrada / dada de baja: "Propiedad no disponible", sin enlace.
 *
 * La imagen pasa por `next/image`, que sirve una versión chica (no el original
 * de Cloudinary) y la carga recién cuando entra en pantalla (`lazy`).
 */
export function PropertyThumbLink({
  href,
  title,
  imageUrl,
  available,
  onNavigate,
}: {
  href: string;
  title: string | null;
  imageUrl: string | null;
  available: boolean;
  /** Ej. marcar la notificación como leída al abrirla. */
  onNavigate?: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const box =
    'relative block h-40 w-full shrink-0 overflow-hidden rounded-xl sm:h-[100px] sm:w-[140px]';
  const name = title?.trim() || 'la propiedad';

  if (!available) {
    return (
      <div className={`${box} flex flex-col items-center justify-center gap-1.5 border border-dashed border-gray-200 bg-gray-50 text-gray-400`}>
        <Home size={22} aria-hidden />
        <span className="px-2 text-center text-[11px] font-semibold">Propiedad no disponible</span>
      </div>
    );
  }

  const showImage = !!imageUrl && !broken;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-label={`Ver propiedad: ${name}`}
      className={`${box} group/thumb cursor-pointer bg-gray-100 ring-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[#0b7a4b]`}
    >
      {showImage ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          // Sin `vw` a propósito: con `100vw` Next solo ofrece anchos desde
          // 640px y el escritorio bajaba 640px para un hueco de 140. En
          // celular la miniatura mide como mucho ~400px de ancho.
          sizes="(max-width: 640px) 400px, 140px"
          loading="lazy"
          className="object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-gray-400" aria-hidden>
          <Home size={26} />
        </span>
      )}

      {/* Escritorio: capa oscura que aparece con el cursor o con el foco. */}
      <span
        aria-hidden
        className="absolute inset-0 hidden items-center justify-center gap-1.5 bg-black/50 text-xs font-semibold text-white opacity-0 transition-opacity duration-200 group-hover/thumb:opacity-100 group-focus-visible/thumb:opacity-100 sm:flex"
      >
        <Eye size={15} /> Ver propiedad
      </span>

      {/* Celular: no hay hover, así que la franja está siempre. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/60 py-1.5 text-xs font-semibold text-white sm:hidden"
      >
        <Eye size={14} /> Ver propiedad
      </span>
    </Link>
  );
}

export default PropertyThumbLink;
