'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Home, DollarSign, Car, TreePine, FileText,
  Bed, Bath, Maximize, Calendar, ChevronDown, X, Search, Trash2, Building2,
} from 'lucide-react';
import { usePropertyFilters } from '../hooks/usePropertyFilters';
import { propertiesService } from '../services/properties.service';
import { PropertyFilters } from '../interfaces/property-filters.interface';
import api from '@/modules/shared/lib/axios';

/**
 * Modal de filtros del catálogo (Bloque 2 del rediseño de /properties).
 *
 * Reemplaza al `FiltersPanel` colapsable. Diferencias clave:
 *  - Es un MODAL real: se portalea a `document.body`, oscurece y desenfoca el
 *    fondo (`backdrop-blur`), se cierra con Escape / click en el fondo, y bloquea
 *    el scroll del catálogo detrás — mismo lenguaje visual que `ConfirmDialog`.
 *  - Trabaja con un BORRADOR local: los cambios no tocan la URL hasta que el
 *    usuario aprieta "Aplicar". "Limpiar" resetea el borrador (no commitea). Así
 *    no hay un `router.push` por cada tecla ni saltos de contenido de fondo.
 *  - Colores 100% tokenizados (`brand-*`/`ink-*`), sin hex hardcodeado.
 *  - El tipo de propiedad se trae de `GET /property-types` (antes estaba
 *    hardcodeado como IDs 1-5).
 *
 * `search` (texto libre) NO se maneja acá — vive en `PropertySearchBar`.
 */

interface FiltersModalProps {
  open: boolean;
  onClose: () => void;
}

interface PropertyType {
  id: number;
  name: string;
}

const EMPTY_NUMS = {
  rooms: '', bathrooms: '', minPrice: '', maxPrice: '', minM2: '', maxM2: '', maxAntiquity: '',
};

type NumsKey = keyof typeof EMPTY_NUMS;

export function FiltersModal({ open, onClose }: FiltersModalProps) {
  const { filters, setFilters, clearFilters } = usePropertyFilters();
  const [mounted, setMounted] = useState(false);

  // Borrador: campos de selección/toggle/checkbox (sin números ni search).
  const [draft, setDraft] = useState<Partial<PropertyFilters>>({});
  // Números como strings, para que el input sea fluido.
  const [nums, setNums] = useState({ ...EMPTY_NUMS });

  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [locations, setLocations] = useState<{ localidades: string[]; barrios: string[]; zones: string[] }>({
    localidades: [], barrios: [], zones: [],
  });

  const [openDrop, setOpenDrop] = useState<'loc' | 'zone' | 'barrio' | null>(null);
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  useEffect(() => setMounted(true), []);

  // Datos de los dropdowns — una sola vez.
  useEffect(() => {
    propertiesService.getLocationFilters().then(setLocations).catch(() => {});
    api.get('/property-types').then((r) => setPropertyTypes(r.data || [])).catch(() => {});
  }, []);

  // Al abrir: inicializa el borrador desde los filtros vigentes de la URL.
  useEffect(() => {
    if (!open) return;
    setDraft({
      // operationType ya NO se maneja acá: vive en la fila de arriba del
      // catálogo (toggle Venta/Alquiler), fuera del modal.
      typeOfPropertyId: filters.typeOfPropertyId,
      localidad: filters.localidad,
      barrio: filters.barrio,
      zone: filters.zone,
      garage: filters.garage,
      patio: filters.patio,
      property_deed: filters.property_deed,
    });
    setNums({
      rooms: filters.rooms?.toString() ?? '',
      bathrooms: filters.bathrooms?.toString() ?? '',
      minPrice: filters.minPrice?.toString() ?? '',
      maxPrice: filters.maxPrice?.toString() ?? '',
      minM2: filters.minM2?.toString() ?? '',
      maxM2: filters.maxM2?.toString() ?? '',
      maxAntiquity: filters.maxAntiquity?.toString() ?? '',
    });
    setOpenDrop(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Bloqueo del scroll de fondo + Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Objeto de filtros que representa el borrador completo (draft + números).
  const draftAsFilters = useMemo((): Partial<PropertyFilters> => {
    const n = (v: string) => (v ? Number(v) : undefined);
    return {
      ...draft,
      rooms: n(nums.rooms),
      bathrooms: n(nums.bathrooms),
      minPrice: n(nums.minPrice),
      maxPrice: n(nums.maxPrice),
      minM2: n(nums.minM2),
      maxM2: n(nums.maxM2),
      maxAntiquity: n(nums.maxAntiquity),
    };
  }, [draft, nums]);

  const activeCount = useMemo(
    () => Object.values(draftAsFilters).filter((v) => v !== undefined && v !== null && v !== '').length,
    [draftAsFilters]
  );

  // Conteo de resultados en vivo del borrador (debounce 450ms).
  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(async () => {
      setLoadingCount(true);
      try {
        const res = await propertiesService.getFilteredProperties({
          ...draftAsFilters,
          // operationType vive fuera del modal (fila de arriba): se incluye acá
          // para que el conteo en vivo respete el toggle Venta/Alquiler activo.
          operationType: filters.operationType,
          search: filters.search,
          page: 1,
          limit: 1,
        });
        setResultCount(res?.meta?.totalItems ?? null);
      } catch {
        setResultCount(null);
      } finally {
        setLoadingCount(false);
      }
    }, 450);
    return () => clearTimeout(timeout);
  }, [draftAsFilters, filters.search, filters.operationType, open]);

  const setNum = (key: NumsKey, value: string) => setNums((p) => ({ ...p, [key]: value }));

  const handleApply = () => {
    setFilters({ ...draftAsFilters, page: 1 });
    onClose();
  };

  // "Limpiar": resetea el borrador local Y borra TODOS los query params de la
  // URL de un golpe (clearFilters → `?page=1&limit=12`, que también arrastra el
  // texto de búsqueda). Antes solo vaciaba el borrador sin commitear, así que
  // los filtros seguían activos en la URL hasta apretar "Aplicar" — ese era el
  // bug. Ahora la consulta limpia se aplica a la API de inmediato y se cierra.
  const handleClear = () => {
    setDraft({});
    setNums({ ...EMPTY_NUMS });
    setOpenDrop(null);
    clearFilters();
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
          {/* Fondo borroso + oscurecido */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-ink-950/45 backdrop-blur-[4px]"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros de búsqueda"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.9 }}
            className="relative z-10 my-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_30px_80px_-20px_rgba(10,12,11,0.5)]"
          >
            {/* ── MARCA DE AGUA (decorativa, ~5% opacidad, en las esquinas) ──
                Va como capa de fondo con z auto; el contenido real lleva
                `relative z-10` para superponerse siempre por encima. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <Home
                size={260}
                strokeWidth={1.2}
                className="absolute -top-16 -right-16 rotate-12 text-brand-700/5"
              />
              <Building2
                size={220}
                strokeWidth={1.2}
                className="absolute -bottom-14 -left-14 -rotate-12 text-brand-700/5"
              />
              <div className="absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-brand-500/6 blur-3xl" />
            </div>

            {/* ── HEADER ── */}
            <div className="relative z-10 flex items-center justify-between border-b border-ink-100 px-7 py-5">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-ink-900">Filtrá tu búsqueda</h2>
                <p className="mt-0.5 text-sm text-ink-500">Ajustá los criterios y aplicá para ver los resultados.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar filtros"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── BODY (scrollable) ── */}
            <div className="relative z-10 flex-1 overflow-y-auto px-7 py-6">

              {/* Ubicación */}
              <FilterGroup icon={MapPin} label="Ubicación">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <LocationDropdown
                    label="Localidad" placeholder="Todas las localidades"
                    value={draft.localidad} options={locations.localidades}
                    isOpen={openDrop === 'loc'} onToggle={() => setOpenDrop(openDrop === 'loc' ? null : 'loc')}
                    onSelect={(v) => { setDraft((p) => ({ ...p, localidad: v })); setOpenDrop(null); }}
                  />
                  <LocationDropdown
                    label="Zona" placeholder="Todas las zonas"
                    value={draft.zone} options={locations.zones}
                    isOpen={openDrop === 'zone'} onToggle={() => setOpenDrop(openDrop === 'zone' ? null : 'zone')}
                    onSelect={(v) => { setDraft((p) => ({ ...p, zone: v })); setOpenDrop(null); }}
                  />
                  <LocationDropdown
                    label="Barrio" placeholder="Todos los barrios"
                    value={draft.barrio} options={locations.barrios}
                    isOpen={openDrop === 'barrio'} onToggle={() => setOpenDrop(openDrop === 'barrio' ? null : 'barrio')}
                    onSelect={(v) => { setDraft((p) => ({ ...p, barrio: v })); setOpenDrop(null); }}
                  />
                </div>
              </FilterGroup>

              {/* Tipo y ambientes */}
              <FilterGroup icon={Bed} label="Tipo y ambientes">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <IconSelect
                    icon={Home}
                    value={draft.typeOfPropertyId?.toString() ?? ''}
                    onChange={(v) => setDraft((p) => ({ ...p, typeOfPropertyId: v ? Number(v) : undefined }))}
                    ariaLabel="Tipo de propiedad"
                  >
                    <option value="">Cualquier tipo</option>
                    {propertyTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </IconSelect>
                  <IconNumber icon={Bed} placeholder="Habitaciones" value={nums.rooms} onChange={(v) => setNum('rooms', v)} />
                  <IconNumber icon={Bath} placeholder="Baños" value={nums.bathrooms} onChange={(v) => setNum('bathrooms', v)} />
                </div>
              </FilterGroup>

              {/* Presupuesto y superficie */}
              <FilterGroup icon={DollarSign} label="Presupuesto y superficie">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <IconNumber icon={DollarSign} placeholder="Precio mín." value={nums.minPrice} onChange={(v) => setNum('minPrice', v)} />
                  <IconNumber icon={DollarSign} placeholder="Precio máx." value={nums.maxPrice} onChange={(v) => setNum('maxPrice', v)} />
                  <IconNumber icon={Calendar} placeholder="Antigüedad máx." value={nums.maxAntiquity} onChange={(v) => setNum('maxAntiquity', v)} />
                  <IconNumber icon={Maximize} placeholder="M² mín." value={nums.minM2} onChange={(v) => setNum('minM2', v)} />
                  <IconNumber icon={Maximize} placeholder="M² máx." value={nums.maxM2} onChange={(v) => setNum('maxM2', v)} />
                </div>
              </FilterGroup>

              {/* Adicionales */}
              <FilterGroup icon={Car} label="Adicionales" last>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {([
                    { key: 'garage', label: 'Cochera', icon: Car },
                    { key: 'patio', label: 'Patio', icon: TreePine },
                    { key: 'property_deed', label: 'Escritura', icon: FileText },
                  ] as const).map(({ key, label, icon: Icon }) => {
                    const active = !!draft[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDraft((p) => ({ ...p, [key]: active ? undefined : true }))}
                        className={`flex h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 ${
                          active
                            ? 'border-brand-700/40 bg-brand-50 text-brand-700'
                            : 'border-ink-200 bg-white text-ink-500 hover:border-brand-700/30'
                        }`}
                      >
                        <Icon size={16} className={active ? 'text-brand-700' : 'text-ink-400'} />
                        {label}
                        <span
                          className={`ml-auto flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${
                            active ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-300'
                          }`}
                        >
                          {active && <span className="text-[10px] font-black">✓</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FilterGroup>
            </div>

            {/* ── FOOTER ──
                "Limpiar" (rojo sólido) y "Ver N resultados" van JUNTOS en la
                misma fila a la derecha. En mobile se apilan con el principal
                arriba. */}
            <div className="relative z-10 flex flex-col-reverse gap-3 border-t border-ink-100 bg-white px-7 py-5 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleClear}
                disabled={activeCount === 0}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(239,68,68,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              >
                <Trash2 size={15} />
                Limpiar filtros {activeCount > 0 && `(${activeCount})`}
              </button>

              <button
                type="button"
                onClick={handleApply}
                style={{ background: 'var(--gradient-brand)' }}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-bold text-white shadow-[0_10px_24px_-8px_rgba(6,57,35,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98]"
              >
                <Search size={16} />
                {loadingCount
                  ? 'Buscando...'
                  : resultCount !== null
                    ? `Ver ${resultCount} ${resultCount === 1 ? 'resultado' : 'resultados'}`
                    : 'Aplicar filtros'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ── Sub-componentes ────────────────────────────────────────────────────────── */

function FilterGroup({
  icon: Icon, label, children, last = false,
}: {
  icon: React.ElementType; label: string; children: React.ReactNode; last?: boolean;
}) {
  return (
    <div className={last ? '' : 'mb-7'}>
      <h3 className="mb-3.5 flex items-center gap-2 border-b border-ink-100 pb-2 text-[11px] font-black tracking-[0.14em] text-brand-700 uppercase">
        <Icon size={14} />
        {label}
      </h3>
      {children}
    </div>
  );
}

const inputBase =
  'h-11 w-full rounded-xl border border-ink-200 bg-white pr-3 text-sm text-ink-900 outline-none transition-all duration-200 placeholder:text-ink-400 hover:border-brand-700/40 focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10';

function IconNumber({
  icon: Icon, placeholder, value, onChange,
}: {
  icon: React.ElementType; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-700" />
      <input
        type="number" min="0" inputMode="numeric"
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputBase} pl-10`}
      />
    </div>
  );
}

function IconSelect({
  icon: Icon, value, onChange, ariaLabel, children,
}: {
  icon: React.ElementType; value: string; onChange: (v: string) => void; ariaLabel: string; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-700" />
      <ChevronDown size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-400" />
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} cursor-pointer appearance-none pl-10`}
      >
        {children}
      </select>
    </div>
  );
}

function LocationDropdown({
  label, placeholder, value, options, isOpen, onToggle, onSelect,
}: {
  label: string; placeholder: string; value?: string; options: string[];
  isOpen: boolean; onToggle: () => void; onSelect: (v: string | undefined) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`${inputBase} flex cursor-pointer items-center gap-2 pl-10 text-left`}
      >
        <MapPin size={16} className="pointer-events-none absolute left-3.5 text-brand-700" />
        <span className={`truncate ${value ? 'text-ink-900' : 'text-ink-400'}`}>{value || placeholder}</span>
        <ChevronDown size={15} className="ml-auto shrink-0 text-ink-400" />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-ink-100 bg-white py-1 shadow-2xl">
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className="w-full px-4 py-2.5 text-left text-sm font-medium text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default FiltersModal;
