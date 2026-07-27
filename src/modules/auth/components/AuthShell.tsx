'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

/**
 * Estructura compartida de las pantallas de auth (Bloque H §2).
 *
 * Mantiene el esquema de 2 columnas que ya existía (imagen a la izquierda,
 * formulario a la derecha).
 *  - Se eliminó el `mt-15` que tenía RegisterForm para esquivar el navbar: en
 *    estas rutas ya no se renderiza navbar ni footer (ver NavbarSelector /
 *    FooterSelector), así que la pantalla es realmente de alto completo.
 *  - Como no hay navbar, se agrega un link propio "Volver al inicio".
 *  - **Panel de imagen sin tinte de color** (ver comentario en el JSX): la foto
 *    se muestra nítida, con un degradado neutro solo abajo para legibilidad, y
 *    el texto en un bloque amplio alineado a la izquierda. Antes había un
 *    overlay verde a pantalla completa + logo superpuesto + copy apretado en la
 *    esquina inferior.
 */

interface AuthShellProps {
  image: string;
  imageAlt: string;
  /**
   * Punto focal del recorte (valor de `object-position`, ej. `'70% center'`).
   * El panel es una columna ALTA y las fotos de stock son apaisadas, así que
   * `object-cover` recorta a lo ancho: si el sujeto no está centrado en la foto
   * original, queda pegado al borde o directamente fuera. Default: `'center'`.
   */
  imagePosition?: string;
  /** Título grande sobre la imagen. */
  panelTitle: React.ReactNode;
  panelText: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthShell({
  image,
  imageAlt,
  imagePosition = 'center',
  panelTitle,
  panelText,
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-surface">

      {/* ── PANEL IZQUIERDO — imagen + mensaje ──
          Rediseño: la foto se ve NÍTIDA y real. Antes llevaba encima un
          `bg-brand-950/75` (tinte verde a pantalla completa) más un segundo
          degradado verde: la imagen quedaba teñida y apagada, y el logo
          superpuesto no aportaba nada. Ahora:
           - Sin tinte de color. Solo un degradado NEUTRO abajo
             (`from-black/85`), y únicamente en la mitad inferior, que es donde
             va el texto — el resto de la foto queda limpia.
           - Sin logo superpuesto (ya está el link "Volver al inicio" arriba).
           - El texto es un bloque alineado a la izquierda con aire real
             (`p-14`, `max-w-xl`), no un párrafo apretado en la esquina. */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="50vw"
          className="object-cover"
          style={{ objectPosition: imagePosition }}
        />

        {/* Degradado de legibilidad — neutro, solo abajo. */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/85 via-black/45 to-transparent" />
        {/* Velo mínimo y parejo: sostiene el contraste del botón de arriba sin
            llegar a leerse como un tinte. */}
        <div className="absolute inset-0 bg-black/10" />

        <div className="absolute inset-0 flex flex-col justify-between p-14">
          <Link
            href="/"
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white hover:text-brand-800"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            Volver al inicio
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            className="max-w-2xl"
          >
            {/* Filete de marca: aporta el verde sin teñir la foto. */}
            <span
              aria-hidden
              className="mb-7 block h-1.5 w-16 rounded-full"
              style={{ background: 'var(--gradient-brand)' }}
            />
            <h2 className="text-[2.75rem] leading-[1.1] font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
              {panelTitle}
            </h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
              {panelText}
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── PANEL DERECHO — formulario ── */}
      <div className="flex w-full items-center justify-center px-5 py-10 lg:w-1/2 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Volver al inicio en mobile (el panel izquierdo está oculto) */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-500 transition-colors hover:text-brand-700 lg:hidden"
          >
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>

          <div className="rounded-2xl border border-ink-200/70 bg-white p-7 shadow-[0_10px_40px_-16px_rgba(10,12,11,0.2)] sm:p-9">
            <div className="mb-7">
              <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
              <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>
            </div>

            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AuthShell;
