'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ChevronDown, ArrowUpNarrowWide, Clock, Star, Check } from 'lucide-react';
import { usePropertyFilters } from '@/modules/properties/hooks/usePropertyFilters';
import { PropertyFilters } from '@/modules/properties/interfaces/property-filters.interface';
import { OperationType } from '@/modules/properties/interfaces/operation-type';
import { PropertySearchBar } from './PropertySearchBar';

/**
 * Panel de controles del catálogo — rediseño visual (la LÓGICA no cambió: sigue
 * siendo `setFilters`/`filters.operationType`/`filters.sortBy`/`filters.order` de
 * `usePropertyFilters`, sin tocar).
 *
 *  Fila 1 (4 controles EXACTAMENTE iguales — h-14, mismo ancho/radio/sombra):
 *    [ Venta | Alquiler ]  [Ordenar por precio ▾]  [Antigüedad ▾]  [Valoración ▾]
 *
 *  Fila 2 (búsqueda 75% + botón 25%):
 *    [ 🔍 barra de búsqueda .......................... ]  [ Más filtros ]
 *
 * Cada control de orden tiene su PROPIO color de acento (precio=ámbar,
 * antigüedad=azul, valoración=violeta) — la operación usa el verde de marca,
 * que es el control más importante de la fila. Los 3 selects de orden ya NO
 * son `<select>` nativos: son botones que abren un menú propio (mismo patrón
 * que `LocationDropdown` del modal de filtros), para tener control total del
 * estilo y un hover consistente en toda la app.
 */

interface CatalogFilterBarProps {
  onOpenFilters: () => void;
  activeFiltersCount: number;
}

type SortField = NonNullable<PropertyFilters['sortBy']>;
type Accent = 'amber' | 'blue' | 'violet';

/** Alto, radio y geometría compartidos por TODOS los controles de la fila 1. */
const CONTROL = 'h-14 w-full rounded-2xl';

/** Clases literales por acento (Tailwind necesita strings completos, no interpolados). */
const ACCENTS: Record<Accent, {
  activeBorder: string; activeText: string; activeIcon: string; hoverIcon: string;
  hoverBorder: string; ring: string; itemHover: string; itemActive: string;
}> = {
  amber: {
    activeBorder: 'border-amber-400', activeText: 'text-amber-700', activeIcon: 'text-amber-600',
    hoverIcon: 'group-hover:text-amber-600',
    hoverBorder: 'hover:border-amber-300', ring: 'focus:ring-amber-400/20',
    itemHover: 'hover:bg-amber-50 hover:text-amber-700', itemActive: 'bg-amber-50 text-amber-700',
  },
  blue: {
    activeBorder: 'border-blue-400', activeText: 'text-blue-700', activeIcon: 'text-blue-600',
    hoverIcon: 'group-hover:text-blue-600',
    hoverBorder: 'hover:border-blue-300', ring: 'focus:ring-blue-400/20',
    itemHover: 'hover:bg-blue-50 hover:text-blue-700', itemActive: 'bg-blue-50 text-blue-700',
  },
  violet: {
    activeBorder: 'border-violet-400', activeText: 'text-violet-700', activeIcon: 'text-violet-600',
    hoverIcon: 'group-hover:text-violet-600',
    hoverBorder: 'hover:border-violet-300', ring: 'focus:ring-violet-400/20',
    itemHover: 'hover:bg-violet-50 hover:text-violet-700', itemActive: 'bg-violet-50 text-violet-700',
  },
};

export function CatalogFilterBar({ onOpenFilters, activeFiltersCount }: CatalogFilterBarProps) {
  const { filters, setFilters } = usePropertyFilters();

  const toggleOperation = (op: OperationType) => {
    setFilters({ operationType: filters.operationType === op ? undefined : op });
  };

  // Un solo estado de orden: al cambiar un select, se fija ese campo+dirección
  // (y los demás quedan en su placeholder automáticamente).
  const setSort = (field: SortField, order: '' | 'ASC' | 'DESC') => {
    if (!order) setFilters({ sortBy: undefined, order: undefined });
    else setFilters({ sortBy: field, order });
  };

  const valueFor = (field: SortField) => (filters.sortBy === field ? filters.order ?? '' : '');

  // ⚠️ El panel va SIN `overflow-hidden`: los menús de los dropdowns son
  // `absolute` y se salen de sus bordes — con overflow oculto quedaban
  // RECORTADOS. La textura de puntos igual respeta las esquinas porque
  // `.surface-brand-panel::before` usa `border-radius: inherit`.
  return (
    <div className="surface-brand-panel relative rounded-3xl shadow-[0_20px_50px_-20px_rgba(6,57,35,0.5)]">
      <div className="relative z-10 p-5 sm:p-7 lg:p-8">

        {/* ── FILA 1 — 4 controles idénticos ── */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">

          {/* 1) Control segmentado Venta | Alquiler (un único contenedor) */}
          <div
            role="group"
            aria-label="Tipo de operación"
            className={`${CONTROL} flex items-center gap-1 border border-white/15 bg-white p-1.5 shadow-sm`}
          >
            {(['venta', 'alquiler'] as const).map((op) => {
              const active = filters.operationType === op;
              return (
                <button
                  key={op}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleOperation(op as OperationType)}
                  className={`h-full flex-1 cursor-pointer rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                    active
                      ? 'bg-brand-700 text-white shadow-[0_4px_14px_-4px_rgba(6,57,35,0.6)]'
                      : 'bg-white text-ink-700 hover:text-brand-700'
                  }`}
                >
                  {op}
                </button>
              );
            })}
          </div>

          {/* 2) Precio — acento ámbar */}
          <SortDropdown
            icon={ArrowUpNarrowWide}
            accent="amber"
            value={valueFor('price')}
            onChange={(v) => setSort('price', v)}
            placeholder="Ordenar por precio"
            options={[
              { value: 'ASC', label: 'Precio: menor a mayor' },
              { value: 'DESC', label: 'Precio: mayor a menor' },
            ]}
          />

          {/* 3) Antigüedad — acento azul */}
          <SortDropdown
            icon={Clock}
            accent="blue"
            value={valueFor('antiquity')}
            onChange={(v) => setSort('antiquity', v)}
            placeholder="Ordenar por antigüedad"
            options={[
              { value: 'ASC', label: 'Más recientes' },
              { value: 'DESC', label: 'Más antiguas' },
            ]}
          />

          {/* 4) Valoración — acento violeta */}
          <SortDropdown
            icon={Star}
            accent="violet"
            value={valueFor('rating')}
            onChange={(v) => setSort('rating', v)}
            placeholder="Ordenar por valoración"
            options={[
              { value: 'DESC', label: 'Mejor valoradas' },
              { value: 'ASC', label: 'Peores valoradas' },
            ]}
          />
        </div>

        {/* ── FILA 2 — búsqueda (75%) + Más filtros (25%) ── */}
        <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <PropertySearchBar />
          </div>

          <button
            type="button"
            onClick={onOpenFilters}
            className="relative flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-white/20 bg-white px-5 text-sm font-bold text-brand-700 shadow-[0_8px_20px_-8px_rgba(3,35,21,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:shadow-[0_14px_30px_-10px_rgba(3,35,21,0.6)] active:scale-[0.98]"
          >
            <SlidersHorizontal size={18} className="text-brand-700" />
            <span>Más filtros</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1.5 text-xs font-black text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Dropdown de orden a medida (NO es un <select> nativo) ─────────────────────
   Mismo contrato que antes (value/onChange), pero UI propia: botón + menú
   flotante con framer-motion. Hover del botón cerrado = SOLO borde + sombra,
   sin cambio de fondo (así se evita el efecto "pesado" de un fill de color). */
function SortDropdown({
  icon: Icon, accent, value, onChange, placeholder, options,
}: {
  icon: React.ElementType;
  accent: Accent;
  value: '' | 'ASC' | 'DESC';
  onChange: (v: '' | 'ASC' | 'DESC') => void;
  placeholder: string;
  options: { value: 'ASC' | 'DESC'; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = value !== '';
  const c = ACCENTS[accent];
  const activeLabel = options.find((o) => o.value === value)?.label;

  // Cierra al clickear afuera o al presionar Escape.
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group flex ${CONTROL} cursor-pointer items-center gap-2.5 border bg-white px-4 text-left shadow-sm outline-none transition-all duration-300 hover:shadow-[0_10px_22px_-10px_rgba(10,12,11,0.25)] focus:ring-4 ${c.ring} ${
          active ? `${c.activeBorder} ${c.activeText}` : `border-white/15 text-ink-800 ${c.hoverBorder}`
        }`}
      >
        <Icon size={17} className={active ? c.activeIcon : `text-ink-500 transition-colors duration-300 ${c.hoverIcon}`} />
        <span className="flex-1 truncate text-sm font-semibold">
          {active ? activeLabel : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''} ${active ? c.activeIcon : 'text-ink-400'}`}
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
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-ink-100 bg-white py-1.5 shadow-[0_20px_45px_-15px_rgba(10,12,11,0.3)]"
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
                    selected ? c.itemActive : `text-ink-700 ${c.itemHover}`
                  }`}
                >
                  {o.label}
                  {selected && <Check size={15} className={c.activeIcon} />}
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
