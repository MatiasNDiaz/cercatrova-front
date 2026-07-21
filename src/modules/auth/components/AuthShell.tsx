'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

/**
 * Estructura compartida de las pantallas de auth (Bloque H §2).
 *
 * Mantiene el esquema de 2 columnas que ya existía (imagen a la izquierda,
 * formulario a la derecha), pero rehecho:
 *  - El panel de imagen ahora lleva un overlay verde profundo de la misma
 *    familia que la landing (`brand-950`), con un mensaje encima. Antes era una
 *    foto suelta con 7 círculos decorativos y un `<div></div>` vacío al centro.
 *  - Se eliminó el `mt-15` que tenía RegisterForm para esquivar el navbar: en
 *    estas rutas ya no se renderiza navbar ni footer (ver NavbarSelector /
 *    FooterSelector), así que la pantalla es realmente de alto completo.
 *  - Como no hay navbar, se agrega un link propio "Volver al inicio".
 */

interface AuthShellProps {
  image: string;
  imageAlt: string;
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
  panelTitle,
  panelText,
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-surface">

      {/* ── PANEL IZQUIERDO — imagen + mensaje ── */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <Image src={image} alt={imageAlt} fill priority sizes="50vw" className="object-cover" />

        {/* Overlay verde profundo: misma familia que las secciones ancla de la
            landing. Garantiza contraste para el texto blanco de encima. */}
        <div className="absolute inset-0 bg-brand-950/75" />
        <div className="absolute inset-0 bg-linear-to-t from-brand-950/90 via-brand-950/30 to-brand-950/60" />

        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link
            href="/"
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white hover:text-brand-800"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            Volver al inicio
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            className="max-w-md"
          >
            <Image
              src="/LogoInmobiliaria.png"
              alt="Cerca Trova"
              width={150}
              height={60}
              className="mb-8 h-auto w-36 rounded-xl bg-white p-2.5"
            />
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
              {panelTitle}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/75">{panelText}</p>
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
