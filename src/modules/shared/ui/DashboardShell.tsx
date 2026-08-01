'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

/**
 * Chrome de los dashboards: barra superior + cajón lateral en mobile, sidebar
 * fijo en desktop.
 *
 * ── El problema que resuelve ────────────────────────────────────────────────
 * Los dos layouts montaban `<aside className="w-72 sticky h-screen">` sin
 * ninguna variante mobile ni menú hamburguesa. En una pantalla de 375px el
 * sidebar se comía 288px y dejaba 87px para el contenido: los dos dashboards
 * eran directamente inusables desde el celular.
 *
 * ── Cómo funciona ──────────────────────────────────────────────────────────
 * A partir de `lg` (1024px) es exactamente lo de antes: sidebar fijo a la
 * izquierda, contenido scrolleando al lado.
 *
 * Por debajo de `lg` el sidebar sale del flujo y pasa a ser un cajón que entra
 * desde la izquierda por encima del contenido, con fondo oscurecido. Se abre
 * con el botón de la barra superior y se cierra al tocar el fondo, con Escape,
 * o al navegar a otra página (si no, quedaba abierto tapando la pantalla a la
 * que acabás de entrar).
 *
 * El `sidebar` que recibe es el MISMO nodo en los dos casos — no hay una
 * versión mobile del menú que pueda quedar desincronizada de la de desktop.
 */
export function DashboardShell({
  sidebar,
  label,
  children,
}: {
  sidebar: React.ReactNode;
  /** Texto de la barra superior en mobile. Ej: "Panel Admin". */
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar al cambiar de ruta.
  useEffect(() => setOpen(false), [pathname]);

  // Escape + bloqueo del scroll de fondo mientras el cajón está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-deep">

      {/* ── SIDEBAR DESKTOP (≥ lg) ── */}
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-gray-100 bg-white shadow-sm lg:flex">
        {sidebar}
      </aside>

      {/* ── CAJÓN MOBILE (< lg) ── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-[2px] lg:hidden"
              aria-hidden
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 38 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-xs flex-col bg-white shadow-2xl lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="absolute top-3 right-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
              >
                <X size={18} />
              </button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── COLUMNA DE CONTENIDO ── */}
      <div className="flex h-dvh min-w-0 flex-1 flex-col">

        {/* Barra superior — solo mobile. `sticky` para que el botón del menú
            siga a mano después de scrollear una lista larga. */}
        <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-ink-200 text-brand-700 transition-all duration-200 hover:border-brand-700/40 hover:bg-brand-700/8 active:scale-95"
          >
            <Menu size={20} />
          </button>
          <span className="truncate text-sm font-bold tracking-tight text-brand-700">
            {label}
          </span>
        </header>

        <main className="custom-scrollbar min-w-0 flex-1 overflow-y-auto pb-8">
          <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;
