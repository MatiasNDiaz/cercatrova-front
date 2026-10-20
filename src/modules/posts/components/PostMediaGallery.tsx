'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Film } from 'lucide-react';
import type { Post } from '@/modules/shared/types/api';
import { postMediaList, mediaAspectRatio, formatDuration } from '../lib/postMedia';

/**
 * Galería de medios de una publicación (imágenes y videos), un medio a la vez.
 *
 * Reemplaza a la imagen única que mostraba `PostCard`. Con un solo medio se ve
 * exactamente como antes: sin flechas, sin puntos.
 *
 * Decisiones de rendimiento — el feed carga TODAS las publicaciones de una:
 *  - Solo se monta el medio activo. Las otras imágenes no se piden y los
 *    videos no existen en el DOM hasta que se llega a ellos.
 *  - Videos con `preload="none"` + `poster`: la tarjeta muestra el fotograma
 *    inicial (una imagen liviana) y el video recién se descarga cuando el
 *    usuario aprieta play. Nada arranca solo y nunca con sonido.
 *  - Al cambiar de medio, el video anterior se desmonta: deja de sonar y de
 *    descargar.
 *
 * Proporción: `object-contain` sobre fondo oscuro, igual que la imagen de
 * antes — un video vertical (reel) o una imagen de Canva con texto no se
 * recortan ni se deforman.
 */
export function PostMediaGallery({ post }: { post: Pick<Post, 'id' | 'imageUrl' | 'createdAt' | 'media' | 'description'> }) {
  const media = postMediaList(post);
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);

  const count = media.length;
  const current = media[Math.min(index, count - 1)];
  const go = (i: number) => setIndex((i + count) % count);
  const alt = post.description.slice(0, 80);

  return (
    <div
      className="relative w-full bg-ink-950"
      // Swipe en mobile: un deslizamiento horizontal de más de 40px cambia de medio.
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
      onKeyDown={(e) => {
        if (count < 2) return;
        if (e.key === 'ArrowRight') go(index + 1);
        if (e.key === 'ArrowLeft') go(index - 1);
      }}
      role={count > 1 ? 'region' : undefined}
      aria-roledescription={count > 1 ? 'galería' : undefined}
      aria-label={count > 1 ? `Medios de la publicación (${count})` : undefined}
    >
      {current.type === 'video' ? (
        // `key`: al pasar de un video a otro, se monta uno nuevo (y el
        // anterior se detiene) en vez de reutilizar el elemento con otra fuente.
        <video
          key={current.id}
          src={current.url}
          poster={current.posterUrl ?? undefined}
          controls
          playsInline
          preload="none"
          aria-label={`Video: ${alt}`}
          className="mx-auto block max-h-[42rem] w-full"
          style={{ aspectRatio: mediaAspectRatio(current) ?? '9 / 16' }}
        />
      ) : (
        <Image
          key={current.id}
          src={current.url}
          alt={alt}
          width={current.width ?? 1080}
          height={current.height ?? 1080}
          sizes="(max-width: 1024px) 100vw, 640px"
          className="max-h-[42rem] w-full object-contain"
        />
      )}

      {current.type === 'video' && formatDuration(current.duration) && (
        <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
          <Film size={12} />{formatDuration(current.duration)}
        </span>
      )}

      {count > 1 && (
        <>
          <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            {index + 1}/{count}
          </span>

          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Medio anterior"
            className="absolute top-1/2 left-2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/85 text-ink-900 shadow-md backdrop-blur-sm transition-transform hover:scale-105"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Medio siguiente"
            className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/85 text-ink-900 shadow-md backdrop-blur-sm transition-transform hover:scale-105"
          >
            <ChevronRight size={18} />
          </button>

          {/* Puntos — encima de los controles nativos del video no: van en
              una franja propia debajo, para no tapar la barra de reproducción. */}
          <div className="flex items-center justify-center gap-1.5 bg-ink-950 py-2.5">
            {media.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir al ${m.type === 'video' ? 'video' : 'imagen'} ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default PostMediaGallery;
