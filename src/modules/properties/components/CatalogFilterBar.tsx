'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ChevronDown, ArrowUpNarrowWide, Clock, Star, Check } from 'lucide-react';
import { usePropertyFilters } from '@/modules/properties/hooks/usePropertyFilters';
import { PropertyFilters } from '@/modules/properties/interfaces/property-filters.interface';
import { OperationType } from '@/modules/properties/interfaces/operation-type';
import { PropertySearchBar } from './PropertySearchBar';

/**
 * Cabecera de búsqueda/filtros del catálogo.
 *
 * Layout (rediseño §2):
 *   Fila 1 → barra de búsqueda de texto libre, ancho completo.
 *   Fila 2 → [ Venta | Alquiler ] [precio ▾] [antigüedad ▾] [valoración ▾] … [Más filtros]
 *
 * Estilo (§1 y §3): se sacó el bloque verde plano que envolvía todo. Ahora el
 * contenedor es BLANCO con sombra marcada sobre el fondo `brand-50` de la
 * sección, y los controles usan el mismo lenguaje visual que `Input`/`Select`
 * compartidos y que el modal de filtros (mismo alto, radio `rounded-xl`, borde
 * `ink-200`, foco `brand-700` con ring), para que todo se sienta parte del mismo
 * sistema de diseño en vez de un estilo aparte.
 *
 * ⚠️ La LÓGICA no cambia: sigue siendo `setFilters` / `filters.operationType` /
 * `filters.sortBy` / `filters.order` de `usePropertyFilters`.
 */

interface CatalogFilterBarProps {
  onOpenFilters: () => void;
  activeFiltersCount: number;
}

type SortField = NonNullable<PropertyFilters['sortBy']>;

/** Alto/radio compartido por todos los controles de la fila 2. */
const CONTROL = 'h-12 rounded-xl';

export function CatalogFilterBar({ onOpenFilters, activeFiltersCount }: CatalogFilterBarProps) {
  const { filters, setFilters } = usePropertyFilters();

  const toggleOperation = (op: OperationType) => {
    setFilters({ operationType: filters.operationType === op ? undefined : op });
  };

  // Un solo estado de orden: al elegir en un select se fija ese campo+dirección
  // (y los demás quedan en su placeholder automáticamente).
  const setSort = (field: SortField, order: '' | 'ASC' | 'DESC') => {
    if (!order) setFilters({ sortBy: undefined, order: undefined });
    else setFilters({ sortBy: field, order });
  };

  const valueFor = (field: SortField) => (filters.sortBy === field ? filters.order ?? '' : '');

  // Sin `overflow-hidden`: los menús de los dropdowns son `absolute` y se salen
  // del contenedor — con overflow oculto quedaban recortados.
  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_24px_60px_-24px_rgba(10,12,11,0.3)] sm:p-6">

      {/* ── FILA 1 — búsqueda, ancho completo ── */}
      <PropertySearchBar />

      {/* ── FILA 2 — operación + orden + más filtros ── */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">

        {/* Operación (segmentado, un único contenedor) */}
        <div
          role="group"
          aria-label="Tipo de operación"
          className={`${CONTROL} flex shrink-0 items-center gap-1 border border-ink-200 bg-ink-50 p-1 lg:w-52`}
        >
          {(['venta', 'alquiler'] as const).map((op) => {
            const active = filters.operationType === op;
            return (
              <button
                key={op}
                type="button"
                aria-pressed={active}
                onClick={() => toggleOperation(op as OperationType)}
                className={`h-full flex-1 cursor-pointer rounded-lg text-sm font-bold capitalize transition-all duration-300 ${
                  active
                    ? 'bg-brand-700 text-white shadow-[0_4px_12px_-4px_rgba(11,122,75,0.55)]'
                    : 'text-ink-600 hover:text-brand-700'
                }`}
              >
                {op}
              </button>
            );
          })}
        </div>

        {/* Orden */}
        <SortDropdown
          icon={ArrowUpNarrowWide}
          value={valueFor('price')}
          onChange={(v) => setSort('price', v)}
          placeholder="Ordenar por precio"
          options={[
            { value: 'ASC', label: 'Precio: menor a mayor' },
            { value: 'DESC', label: 'Precio: mayor a menor' },
          ]}
        />
        <SortDropdown
          icon={Clock}
          value={valueFor('antiquity')}
          onChange={(v) => setSort('antiquity', v)}
          placeholder="Ordenar por antigüedad"
          options={[
            { value: 'ASC', label: 'Más recientes' },
            { value: 'DESC', label: 'Más antiguas' },
          ]}
        />
        <SortDropdown
          icon={Star}
          value={valueFor('rating')}
          onChange={(v) => setSort('rating', v)}
          placeholder="Ordenar por valoración"
          options={[
            { value: 'DESC', label: 'Mejor valoradas' },
            { value: 'ASC', label: 'Peores valoradas' },
          ]}
        />

        {/* Más filtros */}
        <button
          type="button"
          onClick={onOpenFilters}
          className={`${CONTROL} flex shrink-0 cursor-pointer items-center justify-center gap-2 border border-brand-700 bg-brand-700 px-5 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(11,122,75,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-800 active:scale-[0.98]`}
        >
          <SlidersHorizontal size={17} />
          <span>Más filtros</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-black text-brand-700">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Dropdown de orden a medida (NO es un <select> nativo) ─────────────────────
   Mismo contrato que antes (value/onChange). Estados alineados al lenguaje de
   `Input`/`Select` compartidos: borde `ink-200` en reposo, `brand-700` en foco
   con ring, y acento verde de marca cuando está activo. El hover solo cambia el
   borde — sin rellenos de color. */
function SortDropdown({
  icon: Icon, value, onChange, placeholder, options,
}: {
  icon: React.ElementType;
  value: '' | 'ASC' | 'DESC';
  onChange: (v: '' | 'ASC' | 'DESC') => void;
  placeholder: string;
  options: { value: 'ASC' | 'DESC'; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = value !== '';
  const activeLabel = options.find((o) => o.value === value)?.label;

  // Cierra al clickear afuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${CONTROL} flex w-full cursor-pointer items-center gap-2.5 border bg-white px-3.5 text-left outline-none transition-all duration-200 hover:border-brand-700/40 focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10 ${
          active ? 'border-brand-700 text-brand-700' : 'border-ink-200 text-ink-700'
        }`}
      >
        <Icon size={17} className={active ? 'text-brand-700' : 'text-ink-400'} />
        <span className="flex-1 truncate text-sm font-semibold">
          {active ? activeLabel : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''} ${active ? 'text-brand-700' : 'text-ink-400'}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-ink-100 bg-white py-1.5 shadow-[0_20px_45px_-15px_rgba(10,12,11,0.3)]"
          >
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-ink-500 transition-colors hover:bg-ink-50"
            >
              {placeholder}
            </button>
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium transition-colors duration-200 ${
                    selected ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-brand-50 hover:text-brand-700'
                  }`}
                >
                  {o.label}
                  {selected && <Check size={15} className="text-brand-700" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CatalogFilterBar;
