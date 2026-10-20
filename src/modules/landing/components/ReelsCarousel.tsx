'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Images } from 'lucide-react';

/** Una card del carrusel — ya resuelta en el servidor (`CercaReels`). */
export interface ReelItem {
  id: number;
  type: 'image' | 'video';
  /** Imagen de la card: la imagen misma, o el fotograma inicial si es video. */
  cover: string;
  /** Solo videos: URL del archivo. */
  videoUrl: string | null;
  description: string;
  /** Fecha ya formateada en el servidor (formato determinista, sin desajuste de hidratación). */
  date: string;
  /** Cuántos medios tiene la publicación (la card muestra solo el primero). */
  mediaCount: number;
}

/**
 * Carrusel circular de "Cerca-Reels".
 *
 * Orden: llega de más reciente a más antigua y se reacomoda a
 * `[2ª, 1ª, 3ª, 4ª, …, última]`, arrancando con la 1ª activa. Así la vista
 * inicial es siempre "2ª | 1ª | 3ª" (la más reciente en el centro) y las
 * flechas recorren todas dando la vuelta completa.
 *
 * Posición de cada card = su distancia circular a la activa (-1, 0, +1 se ven;
 * el resto queda oculto a los costados, listo para entrar animado).
 */
export function ReelsCarousel({ items: newestFirst }: { items: ReelItem[] }) {
  const items =
    newestFirst.length >= 2 ? [newestFirst[1], newestFirst[0], ...newestFirst.slice(2)] : newestFirst;
  const n = items.length;

  const [active, setActive] = useState(n >= 2 ? 1 : 0);
  const stageRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const inView = useInView(stageRef, { amount: 0.4 });
  const reduceMotion = useReducedMotion();

  const go = (i: number) => setActive(((i % n) + n) % n);
  const showArrows = n > 3;

  /** Distancia circular a la activa. En empate (n par) gana la izquierda. */
  const offsetOf = (i: number) => {
    let d = (i - active + n) % n;
    if (d >= n / 2 && d !== 0) d -= n;
    return d;
  };

  const transition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 260, damping: 32, mass: 0.9 };

  return (
    <div className="relative">
      <div
        ref={stageRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Cerca-Reels: publicaciones recientes. Usá las flechas del teclado para recorrerlas."
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
        }}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null || n < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
        }}
        // Ancho de card por breakpoint (`--card-w`) y alto del escenario
        // calculado sobre él (9:16 × escala de la central + aire): sin saltos de
        // layout al cambiar de card. En mobile la central ocupa casi todo el
        // ancho y las laterales se asoman a los costados.
        className="relative mx-auto h-[calc(var(--card-w)*16/9*1.15+2.5rem)] w-full overflow-hidden rounded-3xl outline-none [--card-w:min(68vw,300px)] focus-visible:ring-2 focus-visible:ring-brand-700/50 md:[--card-w:230px] lg:[--card-w:270px]"
      >
        {items.map((item, i) => {
          const offset = offsetOf(i);
          const isActive = offset === 0;
          const visible = Math.abs(offset) <= 1;
          // Las que están a 2 lugares se montan (para entrar animadas y con la
          // imagen ya pedida); más lejos, no se monta nada: carga diferida.
          if (Math.abs(offset) > 2) return null;

          return (
            <div
              key={item.id}
              className="absolute top-[calc(50%-var(--card-w)*8/9)] left-[calc(50%-var(--card-w)/2)] w-(--card-w)"
              style={{ zIndex: isActive ? 30 : visible ? 20 : 10 }}
            >
              <motion.div
                initial={false}
                animate={{
                  x: `${offset * 95}%`,
                  scale: isActive ? 1.15 : 0.88,
                  opacity: visible ? 1 : 0,
                }}
                transition={transition}
                style={{ pointerEvents: visible ? 'auto' : 'none' }}
              >
                <ReelCard
                  item={item}
                  isActive={isActive}
                  playing={isActive && inView && !reduceMotion}
                  onSelect={() => go(i)}
                />
              </motion.div>
            </div>
          );
        })}
      </div>

      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label="Publicación anterior"
            className="absolute top-1/2 left-1 z-40 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white/95 text-ink-800 shadow-[0_8px_20px_-8px_rgba(10,12,11,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-[calc(50%+2px)] hover:border-brand-700/40 hover:text-brand-700 sm:left-3"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="Publicación siguiente"
            className="absolute top-1/2 right-1 z-40 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white/95 text-ink-800 shadow-[0_8px_20px_-8px_rgba(10,12,11,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-[calc(50%+2px)] hover:border-brand-700/40 hover:text-brand-700 sm:right-3"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
function ReelCard({
  item, isActive, playing, onSelect,
}: {
  item: ReelItem;
  isActive: boolean;
  /** Solo la central, con la sección en pantalla y sin "reducir movimiento". */
  playing: boolean;
  onSelect: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const alt = item.description.slice(0, 100) || 'Publicación de Cerca Trova';

  // Play/pausa según visibilidad. El navegador puede rechazar el play (ahorro
  // de datos, etc.): se ignora y queda el póster.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing]);

  const body = (
    <div
      className={`relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-ink-950 ring-1 transition-shadow duration-500 ${
        isActive
          ? 'shadow-[0_34px_70px_-24px_rgba(6,57,35,0.55)] ring-white/10'
          : 'shadow-[0_14px_30px_-18px_rgba(10,12,11,0.4)] ring-ink-900/10'
      }`}
    >
      <Image
        src={item.cover}
        alt={alt}
        fill
        sizes="(max-width: 768px) 70vw, 320px"
        className="object-cover"
      />

      {/* Solo la card central monta el <video>: las laterales son una imagen
          (el fotograma inicial). Al cambiar de activa, el video anterior se
          desmonta, o sea que se detiene. */}
      {isActive && item.type === 'video' && item.videoUrl && (
        <video
          ref={videoRef}
          src={item.videoUrl}
          poster={item.cover}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`Video: ${alt}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Laterales levemente atenuadas */}
      {!isActive && <div className="absolute inset-0 bg-ink-950/25" />}

      {/* Indicadores de tipo */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        {item.type === 'video' && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
            <Play size={14} className="ml-0.5 fill-current" />
          </span>
        )}
        {item.mediaCount > 1 && (
          <span className="inline-flex h-8 items-center gap-1 rounded-full bg-black/55 px-2.5 text-[11px] font-bold text-white backdrop-blur-sm">
            <Images size={13} />{item.mediaCount}
          </span>
        )}
      </div>

      {/* Texto sobre degradé oscuro */}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink-950/90 via-ink-950/55 to-transparent px-4 pt-14 pb-4 text-left">
        <p className="line-clamp-2 text-sm leading-snug font-semibold text-white">{item.description}</p>
        <p className="mt-1.5 text-[11px] font-medium tracking-wide text-white/70">{item.date}</p>
      </div>
    </div>
  );

  // Central → página de Publicaciones. Lateral → la trae al centro.
  return isActive ? (
    <Link href="/publicaciones" aria-label={`Ver en Publicaciones: ${alt}`} className="block">
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onSelect} aria-label={`Mostrar: ${alt}`} className="block w-full cursor-pointer">
      {body}
    </button>
  );
}

/** Skeleton con el mismo layout de 3 columnas, mientras cargan los datos. */
export function ReelsCarouselSkeleton() {
  return (
    <div
      aria-hidden
      className="relative mx-auto flex h-[calc(var(--card-w)*16/9*1.15+2.5rem)] w-full items-center justify-center gap-0 overflow-hidden [--card-w:min(68vw,300px)] md:[--card-w:230px] lg:[--card-w:270px]"
    >
      <div className="aspect-[9/16] w-(--card-w) translate-x-[8%] scale-[0.88] animate-pulse rounded-2xl bg-ink-200/70" />
      <div className="z-10 aspect-[9/16] w-(--card-w) scale-[1.15] animate-pulse rounded-2xl bg-ink-200" />
      <div className="aspect-[9/16] w-(--card-w) -translate-x-[8%] scale-[0.88] animate-pulse rounded-2xl bg-ink-200/70" />
    </div>
  );
}

export default ReelsCarousel;
