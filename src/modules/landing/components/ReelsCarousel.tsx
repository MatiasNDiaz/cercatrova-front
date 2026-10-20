'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Play, Pause, Images, Volume2, VolumeX, RotateCcw, RotateCw,
  Maximize, Heart, MessageCircle, ArrowUpRight,
} from 'lucide-react';

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
  /** Proporción real del medio (ancho / alto). */
  ratio: number;
  likes: number;
  comments: number;
}

/**
 * Proporción usada por la card: la REAL del medio, acotada entre 9:16 (reel
 * vertical) y 4:3. Dentro de ese rango la card toma exactamente la forma del
 * video o la imagen — sin recortes ni franjas negras. Fuera de él (algo muy
 * panorámico) se recorta apenas, para que la card no se vuelva una tira.
 */
const clampRatio = (r: number) => Math.min(4 / 3, Math.max(9 / 16, r || 9 / 16));

/**
 * Alto/ancho de una card según su proporción, en CSS puro (sin medir el DOM:
 * nada de saltos al hidratar). Alto base `--card-h` por breakpoint, limitado
 * para que el ancho nunca pase del 88% de la pantalla ni de 560px.
 */
const cardHeight = (r: number) => `min(var(--card-h), calc(88vw / ${r}), calc(560px / ${r}))`;
const cardWidth = (r: number) => `calc(${cardHeight(r)} * ${r})`;

const fmtTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const t = Math.floor(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

/**
 * Carrusel circular de "Cerca-Reels".
 *
 * Orden: llega de más reciente a más antigua y se reacomoda a
 * `[2ª, 1ª, 3ª, 4ª, …, última]`, arrancando con la 1ª activa. Así la vista
 * inicial es siempre "2ª | 1ª | 3ª" (la más reciente en el centro) y las
 * flechas recorren todas dando la vuelta completa.
 *
 * Cada card toma la forma de su medio (ver `clampRatio`), así que las
 * posiciones se calculan en CSS a partir del ancho de la central (`--wc`) y
 * del de cada card (`--w`). El movimiento es una transición CSS de `transform`
 * (compositable), que la regla global de `prefers-reduced-motion` anula.
 */
export function ReelsCarousel({ items: newestFirst }: { items: ReelItem[] }) {
  const items =
    newestFirst.length >= 2 ? [newestFirst[1], newestFirst[0], ...newestFirst.slice(2)] : newestFirst;
  const n = items.length;

  const [active, setActive] = useState(n >= 2 ? 1 : 0);
  // Sonido: compartido entre cards. Arranca SIN sonido (el navegador solo
  // permite autoplay muteado); al activarlo el usuario, los siguientes videos
  // centrales ya suenan.
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);

  const stageRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const inView = useInView(stageRef, { amount: 0.4 });
  const reduceMotion = useReducedMotion();

  const go = (i: number) => setActive(((i % n) + n) % n);
  const showArrows = n > 3;
  const current = items[active];

  /** Distancia circular a la activa. En empate (n par) gana la izquierda. */
  const offsetOf = (i: number) => {
    let d = (i - active + n) % n;
    if (d >= n / 2 && d !== 0) d -= n;
    return d;
  };

  const centerRatio = clampRatio(current.ratio);

  return (
    <div className="relative">
      <div className="relative">
        {/* ── Resplandor ambiente: la portada activa, muy desenfocada, detrás
            de las cards. Le da color y vida a la sección según el reel. ── */}
        <div aria-hidden className="pointer-events-none absolute inset-x-[10%] inset-y-[8%] overflow-visible">
          <AnimatePresence initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8 }}
              className="absolute inset-0 scale-110 overflow-hidden rounded-[3rem] blur-3xl"
            >
              <Image src={current.cover} alt="" fill sizes="160px" className="object-cover" />
            </motion.div>
          </AnimatePresence>
        </div>

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
          // Alto de card por breakpoint (`--card-h`). En mobile la central es
          // casi de pantalla completa y las laterales se asoman a los costados.
          style={{ '--wc': cardWidth(centerRatio) } as CSSProperties}
          className="relative mx-auto h-[calc(var(--card-h)*1.1+3rem)] w-full overflow-hidden outline-none [--card-h:min(135vw,540px)] focus-visible:ring-2 focus-visible:ring-brand-700/50 md:[--card-h:460px] lg:[--card-h:500px]"
        >
          {items.map((item, i) => {
            const offset = offsetOf(i);
            // Más de 2 lugares: no se monta nada (carga diferida).
            if (Math.abs(offset) > 2) return null;

            const isActive = offset === 0;
            const visible = Math.abs(offset) <= 1;
            const r = clampRatio(item.ratio);
            const sign = Math.sign(offset);
            const dx =
              offset === 0
                ? '0px'
                : Math.abs(offset) === 1
                  ? `calc(${sign} * (var(--wc) * 0.55 + var(--w) * 0.44 - 1.25rem))`
                  : `calc(${sign} * (var(--wc) * 0.55 + var(--card-h) * 0.55 + var(--w) * 0.44))`;

            return (
              <div
                key={item.id}
                className="absolute top-1/2 left-1/2 transition-[transform,opacity] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  '--w': cardWidth(r),
                  width: 'var(--w)',
                  height: cardHeight(r),
                  transform: `translate(-50%, -50%) translateX(${dx}) scale(${isActive ? 1.1 : 0.88})`,
                  opacity: visible ? 1 : 0,
                  zIndex: isActive ? 30 : visible ? 20 : 10,
                  pointerEvents: visible ? 'auto' : 'none',
                } as CSSProperties}
              >
                <ReelCard
                  item={item}
                  isActive={isActive}
                  autoPlay={isActive && inView && !reduceMotion}
                  muted={muted}
                  volume={volume}
                  onMutedChange={setMuted}
                  onVolumeChange={setVolume}
                  onSelect={() => go(i)}
                />
              </div>
            );
          })}
        </div>

        {showArrows && (
          <>
            <ArrowButton side="left" onClick={() => go(active - 1)} />
            <ArrowButton side="right" onClick={() => go(active + 1)} />
          </>
        )}
      </div>

      {/* ── Indicadores de posición ── */}
      {n > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ir a la publicación ${i + 1}`}
              aria-current={i === active}
              className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${
                i === active ? 'w-7 bg-brand-700' : 'w-2 bg-ink-300 hover:bg-brand-600/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Panel de la publicación activa ── */}
      <div className="mx-auto mt-8 max-w-2xl">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' }}
            className="rounded-2xl border border-ink-100 bg-white/85 px-6 py-5 text-center shadow-[0_2px_10px_-2px_rgba(10,12,11,0.08)] backdrop-blur-sm"
          >
            <p className="line-clamp-3 text-base leading-relaxed whitespace-pre-line text-ink-700">
              {current.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold">
              <span className="rounded-full bg-ink-100 px-3 py-1.5 text-ink-600">{current.date}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-rose-600">
                <Heart size={13} />{current.likes}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-brand-800">
                <MessageCircle size={13} />{current.comments}
              </span>
              <Link
                href={`/publicaciones/${current.id}`}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-brand-700 transition-colors hover:bg-brand-50"
              >
                Ver publicación <ArrowUpRight size={13} />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ArrowButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Publicación anterior' : 'Publicación siguiente'}
      className={`absolute top-1/2 z-40 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white/95 text-ink-800 shadow-[0_8px_20px_-8px_rgba(10,12,11,0.35)] backdrop-blur-sm transition-colors duration-300 hover:border-brand-700/40 hover:text-brand-700 ${
        side === 'left' ? 'left-1 sm:left-3' : 'right-1 sm:right-3'
      }`}
    >
      <Icon size={22} />
    </button>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
function ReelCard({
  item, isActive, autoPlay, muted, volume, onMutedChange, onVolumeChange, onSelect,
}: {
  item: ReelItem;
  isActive: boolean;
  /** Solo la central, con la sección en pantalla y sin "reducir movimiento". */
  autoPlay: boolean;
  muted: boolean;
  volume: number;
  onMutedChange: (m: boolean) => void;
  onVolumeChange: (v: number) => void;
  onSelect: () => void;
}) {
  const alt = item.description.slice(0, 100) || 'Publicación de Cerca Trova';
  const isVideo = item.type === 'video' && !!item.videoUrl;

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-2xl bg-ink-950 ring-1 transition-shadow duration-500 ${
        isActive
          ? 'shadow-[0_34px_70px_-24px_rgba(6,57,35,0.6)] ring-white/10'
          : 'shadow-[0_14px_30px_-18px_rgba(10,12,11,0.4)] ring-ink-900/10'
      }`}
    >
      <Image src={item.cover} alt={alt} fill sizes="(max-width: 768px) 90vw, 560px" className="object-cover" />

      {/* Solo la central monta el <video> (con sus controles). Las laterales
          son el fotograma inicial: al cambiar de activa, el video anterior se
          desmonta y se detiene. */}
      {isActive && isVideo && (
        <ReelVideo
          src={item.videoUrl!}
          poster={item.cover}
          label={alt}
          autoPlay={autoPlay}
          muted={muted}
          volume={volume}
          onMutedChange={onMutedChange}
          onVolumeChange={onVolumeChange}
        />
      )}

      {!isActive && <div className="absolute inset-0 bg-ink-950/30" />}

      {/* Indicadores de tipo */}
      <div className="pointer-events-none absolute top-3 left-3 z-20 flex items-center gap-1.5">
        {item.type === 'video' && !isActive && (
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

      {/* Texto sobre degradé (en la central con video, sube para dejar lugar a
          la barra de controles). */}
      <div
        className={`pointer-events-none absolute inset-x-0 bg-linear-to-t from-ink-950/90 via-ink-950/55 to-transparent px-4 pt-14 text-left ${
          isActive && isVideo ? 'bottom-0 pb-[5.5rem]' : 'bottom-0 pb-4'
        }`}
      >
        <p className="line-clamp-2 text-sm leading-snug font-semibold text-white">{item.description}</p>
        <p className="mt-1.5 text-[11px] font-medium tracking-wide text-white/70">{item.date}</p>
      </div>

      {/* Click: la central lleva a Publicaciones (capa debajo de los
          controles); una lateral pasa al centro. */}
      {isActive ? (
        <Link href="/publicaciones" aria-label={`Ver en Publicaciones: ${alt}`} className="absolute inset-0 z-10" />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Mostrar: ${alt}`}
          className="absolute inset-0 z-10 cursor-pointer"
        />
      )}
    </div>
  );
}

// ── Video central con controles propios ──────────────────────────────────────
/**
 * Controles propios (no los nativos) porque la card entera es un link: con los
 * nativos, un click para subir el volumen terminaba navegando. La barra va por
 * ENCIMA del link y corta la propagación de clicks, teclas y toques (si no,
 * las flechas del teclado sobre la barra de progreso movían el carrusel).
 */
function ReelVideo({
  src, poster, label, autoPlay, muted, volume, onMutedChange, onVolumeChange,
}: {
  src: string;
  poster: string;
  label: string;
  autoPlay: boolean;
  muted: boolean;
  volume: number;
  onMutedChange: (m: boolean) => void;
  onVolumeChange: (v: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Si el usuario pausó a mano, el autoplay no se lo vuelve a arrancar.
  const userPaused = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (autoPlay && !userPaused.current) v.play().catch(() => {});
    if (!autoPlay) v.pause();
  }, [autoPlay]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = muted;
    v.volume = volume;
  }, [muted, volume]);

  // En pantalla completa se usan los controles nativos (los propios quedan
  // dentro de la card y no se verían).
  useEffect(() => {
    const onFs = () => {
      const v = ref.current;
      if (v) v.controls = document.fullscreenElement === v;
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { userPaused.current = false; v.play().catch(() => {}); }
    else { userPaused.current = true; v.pause(); }
  };
  const seek = (t: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, t), v.duration || 0);
  };
  const fullscreen = () => {
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
    else v.webkitEnterFullscreen?.(); // Safari de iPhone
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const btn =
    'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/15';

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        aria-label={`Video: ${label}`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div
        onClick={stop}
        onKeyDown={stop}
        onTouchStart={stop}
        onTouchEnd={stop}
        className="absolute inset-x-2 bottom-2 z-20 rounded-xl bg-black/55 px-2 pt-2 pb-1 text-white backdrop-blur-md"
      >
        {/* Progreso — arrastrable para ir a cualquier punto */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(time, duration || 0)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Posición del video"
          className="block h-1.5 w-full cursor-pointer accent-brand-500"
        />

        <div className="mt-1 flex items-center gap-0.5">
          <button type="button" onClick={() => seek(time - 5)} aria-label="Retroceder 5 segundos" className={btn}>
            <RotateCcw size={17} />
          </button>
          <button type="button" onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproducir'} className={btn}>
            {playing ? <Pause size={18} className="fill-current" /> : <Play size={18} className="ml-0.5 fill-current" />}
          </button>
          <button type="button" onClick={() => seek(time + 5)} aria-label="Adelantar 5 segundos" className={btn}>
            <RotateCw size={17} />
          </button>

          <span className="ml-1 text-[11px] font-semibold tabular-nums text-white/85">
            {fmtTime(time)} / {fmtTime(duration)}
          </span>

          <div className="ml-auto flex items-center">
            <button
              type="button"
              onClick={() => onMutedChange(!muted)}
              aria-label={muted ? 'Activar sonido' : 'Silenciar'}
              className={btn}
            >
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {/* Volumen fino: en el celular se usan los botones del teléfono. */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                onVolumeChange(v);
                onMutedChange(v === 0);
              }}
              aria-label="Volumen"
              className="hidden h-1.5 w-16 cursor-pointer accent-brand-500 sm:block"
            />
            <button type="button" onClick={fullscreen} aria-label="Pantalla completa" className={btn}>
              <Maximize size={17} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Skeleton con el mismo layout de 3 columnas, mientras cargan los datos. */
export function ReelsCarouselSkeleton() {
  return (
    <div
      aria-hidden
      className="relative mx-auto flex h-[calc(var(--card-h)*1.1+3rem)] w-full items-center justify-center overflow-hidden [--card-h:min(135vw,540px)] md:[--card-h:460px] lg:[--card-h:500px]"
    >
      <div className="h-(--card-h) w-[calc(var(--card-h)*9/16)] max-w-[88vw] translate-x-[8%] scale-[0.88] animate-pulse rounded-2xl bg-ink-200/70" />
      <div className="z-10 h-(--card-h) w-[calc(var(--card-h)*9/16)] max-w-[88vw] scale-110 animate-pulse rounded-2xl bg-ink-200" />
      <div className="h-(--card-h) w-[calc(var(--card-h)*9/16)] max-w-[88vw] -translate-x-[8%] scale-[0.88] animate-pulse rounded-2xl bg-ink-200/70" />
    </div>
  );
}

export default ReelsCarousel;
