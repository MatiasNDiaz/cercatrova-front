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
 *    se muestra nítida, con un scrim neutro que sostiene la legibilidad, y el
 *    texto centrado en el panel. Antes había un overlay verde a pantalla
 *    completa + logo superpuesto + copy apretado en la esquina inferior.
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
          La foto se ve NÍTIDA y real: no hay tinte de color encima (antes había
          un `bg-brand-950/75` verde que la apagaba por completo).

          ⚠️ El velo NO es decorativo, es lo único que sostiene la legibilidad:
          las dos fotos de estas pantallas son muy claras (cielo blanco en login,
          pared blanca en registro), así que el texto blanco necesita un scrim
          parejo. El degradado que había antes oscurecía SOLO la mitad inferior,
          que servía cuando el texto iba abajo — con el texto centrado dejaba el
          centro sin contraste, y encima tapaba justo a las personas de la foto
          de registro, que están en el cuarto inferior. Ahora el scrim es parejo
          y se refuerza arriba/abajo, que es donde no hay texto. */}
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

        {/* Velo parejo y neutro: baja los blancos sin teñir la foto. */}
        <div className="absolute inset-0 bg-ink-950/50" />
        {/* Refuerzo en los extremos: sostiene el botón "Volver al inicio" arriba
            y cierra la composición abajo, dejando el centro más limpio. */}
        <div className="absolute inset-0 bg-linear-to-b from-ink-950/45 via-ink-950/15 to-ink-950/45" />

        {/* El link vive aparte del bloque de texto para que el texto pueda
            centrarse en TODO el panel y no contra un hermano de flex. */}
        <Link
          href="/"
          className="group absolute top-10 left-10 z-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white hover:text-brand-800"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Volver al inicio
        </Link>

        <div className="absolute inset-0 flex items-start mt-31 justify-center px-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            className="max-w-xl text-center"
          >
            {/* Filete de marca: aporta el verde sin teñir la foto.

                `bg-brand-700` y NO `var(--gradient-brand)`: ese gradiente va de
                #0f8b57 a #14a366, dos verdes más claros que el de marca. Al
                lado del título de la landing (`text-brand-700`, #0b7a4b) se
                notaba que era otro verde. Ahora es el mismo token exacto. */}
            <span
              aria-hidden
              className="mx-auto mb-7 block h-1.5 w-16 rounded-full bg-brand-700"
            />
            <h2 className="text-[2.75rem] leading-[1.1] font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
              {panelTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)]">
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
            {/* Centrado: antes iba alineado a la izquierda y quedaba
                descolgado respecto del resto de la tarjeta, que es simétrica. */}
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-brand-800">{title}</h1>
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
