'use client';

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  MapPin, Home, DollarSign, Car, Trash2, Bed, Bath,
  Maximize, Calendar, TreePine, FileText, ChevronDown, Search
} from 'lucide-react';
import { usePropertyFilters } from '../hooks/usePropertyFilters';
import { OperationType } from '../interfaces/operation-type';
import { propertiesService } from '../services/properties.service';
import { PropertyFilters } from '../interfaces/property-filters.interface';

export const FiltersPanel = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isLanding = pathname === '/';

  const { filters, setFilters, clearFilters } = usePropertyFilters();
  const [isClearingFilters, setIsClearingFilters] = useState(false);

  const [landingFilters, setLandingFilters] = useState<Partial<PropertyFilters>>({});

  const [resultCount, setResultCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  const [openLoc, setOpenLoc] = useState(false);
  const [openZone, setOpenZone] = useState(false);
  const [openBarrio, setOpenBarrio] = useState(false);

  const [localNumbers, setLocalNumbers] = useState<{
    rooms: string; bathrooms: string; minPrice: string;
    maxPrice: string; minM2: string; maxM2: string; maxAntiquity: string;
  }>({
    rooms: filters.rooms?.toString() || '',
    bathrooms: filters.bathrooms?.toString() || '',
    minPrice: filters.minPrice?.toString() || '',
    maxPrice: filters.maxPrice?.toString() || '',
    minM2: filters.minM2?.toString() || '',
    maxM2: filters.maxM2?.toString() || '',
    maxAntiquity: filters.maxAntiquity?.toString() || '',
  });

  const displayFilters = isLanding ? landingFilters : filters;

  const applyFilter = useCallback((newFilters: Partial<PropertyFilters>) => {
    if (isLanding) {
      setLandingFilters(prev => {
        const updated = { ...prev };
        Object.entries(newFilters).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            delete updated[key as keyof PropertyFilters];
          } else {
            (updated as Record<string, unknown>)[key] = value;
          }
        });
        return updated;
      });
    } else {
      setFilters(newFilters);
    }
  }, [isLanding, setFilters]);

  const isFirstCountRender = useRef(true);

  useEffect(() => {
    if (isFirstCountRender.current) {
      isFirstCountRender.current = false;
      return;
    }

    const filtersToCount = isLanding ? landingFilters : filters;
    const hasActiveFilters = Object.values(filtersToCount).some(
      v => v !== undefined && v !== null && v !== ''
    );

    if (!hasActiveFilters) {
      setResultCount(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoadingCount(true);
      try {
        const response = await propertiesService.getFilteredProperties({
          ...filtersToCount,
          page: 1,
          limit: 1,
        });
        setResultCount(response?.meta?.totalItems ?? null);
      } catch {
        setResultCount(null);
      } finally {
        setLoadingCount(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [landingFilters, filters, isLanding]);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isClearingFilters) return;

    const timeout = setTimeout(() => {
      applyFilter({
        rooms: localNumbers.rooms ? Number(localNumbers.rooms) : undefined,
        bathrooms: localNumbers.bathrooms ? Number(localNumbers.bathrooms) : undefined,
        minPrice: localNumbers.minPrice ? Number(localNumbers.minPrice) : undefined,
        maxPrice: localNumbers.maxPrice ? Number(localNumbers.maxPrice) : undefined,
        minM2: localNumbers.minM2 ? Number(localNumbers.minM2) : undefined,
        maxM2: localNumbers.maxM2 ? Number(localNumbers.maxM2) : undefined,
        maxAntiquity: localNumbers.maxAntiquity ? Number(localNumbers.maxAntiquity) : undefined,
      });
    }, 700);

    return () => clearTimeout(timeout);
  }, [localNumbers, applyFilter, isClearingFilters]);

  /* =========================================================
      MEMO STYLES — SOLO ESTA SECCIÓN CAMBIÓ
  ========================================================= */
  const styles = useMemo(() => ({
    groupLabel: 'flex items-center gap-2 text-[10px] font-black text-[#0b7a4b] uppercase mb-4 tracking-[0.18em] pb-2.5 border-b border-[#0b7a4b]/10',
    input: 'w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#0b7a4b] focus:ring-2 focus:ring-[#0b7a4b]/10 outline-none transition-all duration-200 hover:border-[#0b7a4b]/40',
    select: 'w-full h-14 pl-12 pr-10 bg-white rounded-2xl border border-gray-200 text-gray-700 font-medium focus:ring-2 focus:ring-[#0b7a4b]/10 focus:border-[#0b7a4b] outline-none transition-all duration-200 hover:border-[#0b7a4b]/40 flex items-center text-left relative cursor-pointer overflow-hidden whitespace-nowrap text-ellipsis',
    checkbox: 'w-4 h-4 accent-[#0b7a4b] transition-all text-[#0b7a4b] duration-200 cursor-pointer',
    iconStyle: 'absolute left-4 top-1/2 -translate-y-1/2 text-[#0b7a4b] pointer-events-none transition-all duration-200 z-10',
    dropdownList: 'absolute z-[60] mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[#0b7a4b]/20',
    dropdownItem: 'w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-[#0b7a4b]/5 hover:text-[#0b7a4b] transition-colors duration-150 border-b border-gray-50 last:border-none font-medium'
  }), []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        applyFilter({ [name]: checked || undefined });
      } else {
        applyFilter({ [name]: value === '' ? undefined : value });
      }
    },
    [applyFilter]
  );

  const handleOperationChange = useCallback(
    (op: OperationType) => applyFilter({ operationType: op }),
    [applyFilter]
  );

  const activeFiltersCount = useMemo(() => {
    const f = isLanding ? landingFilters : filters;
    return Object.entries(f).filter(
      ([key, value]) =>
        key !== 'page' &&
        key !== 'limit' &&
        value !== undefined &&
        value !== null &&
        value !== ''
    ).length;
  }, [isLanding, landingFilters, filters]);

  const handleVerResultados = useCallback(() => {
    if (isLanding) {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '10');
      Object.entries(landingFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });
      if (localNumbers.rooms) params.set('rooms', localNumbers.rooms);
      if (localNumbers.bathrooms) params.set('bathrooms', localNumbers.bathrooms);
      if (localNumbers.minPrice) params.set('minPrice', localNumbers.minPrice);
      if (localNumbers.maxPrice) params.set('maxPrice', localNumbers.maxPrice);
      if (localNumbers.minM2) params.set('minM2', localNumbers.minM2);
      if (localNumbers.maxM2) params.set('maxM2', localNumbers.maxM2);
      if (localNumbers.maxAntiquity) params.set('maxAntiquity', localNumbers.maxAntiquity);
      router.push(`/properties?${params.toString()}`);
    } else {
      const section = document.getElementById('propiedades');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLanding, landingFilters, localNumbers, router]);

  const [locationOptions, setLocationOptions] = useState<{
    localidades: string[]; barrios: string[]; zones: string[];
  }>({ localidades: [], barrios: [], zones: [] });

  useEffect(() => {
    const fetchLocationFilters = async () => {
      try {
        const data = await propertiesService.getLocationFilters();
        setLocationOptions(data);
      } catch (error) {
        console.error('Error cargando filtros de ubicación', error);
      }
    };
    fetchLocationFilters();
  }, []);

  return (
    /* ── Contenedor principal ─────────────────────────────── */
    <div
      className="rounded-3xl p-6 w-full max-w-6xl mx-auto transition-all duration-100"
      style={{
        background: "rgba(255,255,255,0.98)",
        border: "1px solid rgba(11,122,75,0.12)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,1) inset",
      }}
    >

      {/* ── TOP: Localidad / Zona / Barrio / Operación ────────── */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-end">

        {/* LOCALIDAD */}
        <div className="flex-1 w-full relative">
          <label className="block text-[10px] font-black text-[#0b7a4b] uppercase tracking-[0.18em] mb-2 ml-1">
            Localidad
          </label>
          <div className="relative group">
            <MapPin className={styles.iconStyle} size={16} />
            <button
              type="button"
              onClick={() => { setOpenLoc(!openLoc); setOpenZone(false); setOpenBarrio(false); }}
              className={styles.select}
            >
              {displayFilters.localidad || <span className="text-gray-400 font-normal">Buscar localidad...</span>}
              <ChevronDown className="absolute right-4 text-gray-400" size={15} />
            </button>
            {openLoc && (
              <div className={styles.dropdownList}>
                <button onClick={() => { applyFilter({ localidad: undefined }); setOpenLoc(false); }} className={styles.dropdownItem}>
                  Todas las localidades
                </button>
                {locationOptions.localidades.map((loc) => (
                  <button key={loc} onClick={() => { applyFilter({ localidad: loc }); setOpenLoc(false); }} className={styles.dropdownItem}>
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ZONA */}
        <div className="flex-1 w-full relative">
          <label className="block text-[10px] font-black text-[#0b7a4b] uppercase tracking-[0.18em] mb-2 ml-1">
            Zona
          </label>
          <div className="relative group">
            <MapPin className={styles.iconStyle} size={16} />
            <button
              type="button"
              onClick={() => { setOpenZone(!openZone); setOpenLoc(false); setOpenBarrio(false); }}
              className={styles.select}
            >
              {displayFilters.zone || <span className="text-gray-400 font-normal">Buscar zona...</span>}
              <ChevronDown className="absolute right-4 text-gray-400" size={15} />
            </button>
            {openZone && (
              <div className={styles.dropdownList}>
                <button onClick={() => { applyFilter({ zone: undefined }); setOpenZone(false); }} className={styles.dropdownItem}>
                  Todas las zonas
                </button>
                {locationOptions.zones.map((z) => (
                  <button key={z} onClick={() => { applyFilter({ zone: z }); setOpenZone(false); }} className={styles.dropdownItem}>
                    {z}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BARRIO */}
        <div className="flex-1 w-full relative">
          <label className="block text-[10px] font-black text-[#0b7a4b] uppercase tracking-[0.18em] mb-2 ml-1">
            Barrio
          </label>
          <div className="relative group">
            <MapPin className={styles.iconStyle} size={16} />
            <button
              type="button"
              onClick={() => { setOpenBarrio(!openBarrio); setOpenLoc(false); setOpenZone(false); }}
              className={styles.select}
            >
              {displayFilters.barrio || <span className="text-gray-400 font-normal">Buscar barrio...</span>}
              <ChevronDown className="absolute right-4 text-gray-400" size={15} />
            </button>
            {openBarrio && (
              <div className={styles.dropdownList}>
                <button onClick={() => { applyFilter({ barrio: undefined }); setOpenBarrio(false); }} className={styles.dropdownItem}>
                  Todos los barrios
                </button>
                {locationOptions.barrios.map((b) => (
                  <button key={b} onClick={() => { applyFilter({ barrio: b }); setOpenBarrio(false); }} className={styles.dropdownItem}>
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* OPERACIÓN */}
        <div className="shrink-0">
          <label className="block text-[10px] font-black text-[#0b7a4b] uppercase tracking-[0.18em] mb-2 ml-1">
            Operación
          </label>
          <div className="flex bg-gray-50 rounded-2xl p-1 border border-gray-200 h-14 items-center gap-1">
            {['venta', 'alquiler'].map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => handleOperationChange(op as OperationType)}
                className={`w-28 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-200
                  ${displayFilters.operationType === op
                    ? 'bg-[#0b7a4b] text-white shadow-md shadow-[#0b7a4b]/25'
                    : 'text-gray-500 hover:text-[#0b7a4b] hover:bg-white hover:shadow-sm'
                  }`}
              >
                {op === 'venta' ? 'Venta' : 'Alquiler'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Separador ─────────────────────────────────────────── */}
      <div className="w-full h-px bg-gray-100 mb-6" />

      {/* ── GRID 3 COLUMNAS ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* TIPO Y ESPACIOS */}
        <div>
          <h3 className={styles.groupLabel}>
            <Home size={14} />
            Tipo y Espacios
          </h3>
          <div className="space-y-3">
            <div className="relative group">
              <Home className={styles.iconStyle} size={16} />
              <select
                aria-label='tipo'
                name="typeOfPropertyId"
                value={displayFilters.typeOfPropertyId || ''}
                onChange={handleChange}
                className={styles.input}
              >
                <option value="">Tipo de Propiedad</option>
                <option value="1">Casa</option>
                <option value="2">Departamento</option>
                <option value="3">Local</option>
                <option value="4">Oficina</option>
                <option value="5">Terreno</option>
                <option value="">Cualquier tipo</option>
              </select>
            </div>
            <div className="relative group">
              <Bed className={styles.iconStyle} size={16} />
              <input
                type="number"
                value={localNumbers.rooms}
                onChange={(e) => setLocalNumbers((prev) => ({ ...prev, rooms: e.target.value }))}
                className={styles.input}
                placeholder="Habitaciones"
              />
            </div>
            <div className="relative group">
              <Bath className={styles.iconStyle} size={16} />
              <input
                type="number"
                value={localNumbers.bathrooms}
                onChange={(e) => setLocalNumbers((prev) => ({ ...prev, bathrooms: e.target.value }))}
                className={styles.input}
                placeholder="Baños"
              />
            </div>
          </div>
        </div>

        {/* PRESUPUESTO Y ÁREA */}
        <div>
          <h3 className={styles.groupLabel}>
            <DollarSign size={14} />
            Presupuesto y Área
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative group">
                <DollarSign className={styles.iconStyle} size={16} />
                <input
                  type="number"
                  value={localNumbers.minPrice}
                  onChange={(e) => setLocalNumbers((prev) => ({ ...prev, minPrice: e.target.value }))}
                  className={styles.input}
                  placeholder="Mínimo"
                />
              </div>
              <div className="relative group">
                <DollarSign className={styles.iconStyle} size={16} />
                <input
                  type="number"
                  value={localNumbers.maxPrice}
                  onChange={(e) => setLocalNumbers((prev) => ({ ...prev, maxPrice: e.target.value }))}
                  className={styles.input}
                  placeholder="Máximo"
                />
              </div>
            </div>
            <div className="relative group">
              <Maximize className={styles.iconStyle} size={16} />
              <input
                type="number"
                value={localNumbers.minM2}
                onChange={(e) => setLocalNumbers((prev) => ({ ...prev, minM2: e.target.value }))}
                className={styles.input}
                placeholder="M² mínimos"
              />
            </div>
            <div className="relative group">
              <Maximize className={styles.iconStyle} size={16} />
              <input
                type="number"
                value={localNumbers.maxM2}
                onChange={(e) => setLocalNumbers((prev) => ({ ...prev, maxM2: e.target.value }))}
                className={styles.input}
                placeholder="M² máximos"
              />
            </div>
            <div className="relative group">
              <Calendar className={styles.iconStyle} size={16} />
              <input
                type="number"
                value={localNumbers.maxAntiquity}
                onChange={(e) => setLocalNumbers((prev) => ({ ...prev, maxAntiquity: e.target.value }))}
                className={styles.input}
                placeholder="Antigüedad máx. (años)"
              />
            </div>
          </div>
        </div>

        {/* ADICIONALES */}
        <div>
          <h3 className={styles.groupLabel}>
            <Car size={14} />
            Adicionales
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Cochera', name: 'garage', icon: <Car size={15} /> },
              { label: 'Patio', name: 'patio', icon: <TreePine size={15} /> },
              { label: 'Escritura', name: 'property_deed', icon: <FileText size={15} /> },
            ].map((item) => (
              <label
                key={item.name}
                className={`flex items-center justify-between h-11 px-4 bg-white rounded-xl border cursor-pointer transition-all duration-200 group
                  ${(displayFilters as Record<string, unknown>)[item.name]
                    ? 'border-[#0b7a4b]/40 bg-[#0b7a4b]/5 shadow-sm'
                    : 'border-gray-200 hover:border-[#0b7a4b]/30 hover:shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`transition-colors duration-200 ${(displayFilters as Record<string, unknown>)[item.name] ? 'text-[#0b7a4b]' : 'text-gray-400 group-hover:text-[#0b7a4b]'}`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm font-medium transition-colors duration-200 ${(displayFilters as Record<string, unknown>)[item.name] ? 'text-[#0b7a4b] font-semibold' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                </div>
                <input
                  type="checkbox"
                  name={item.name}
                  checked={!!(displayFilters as Record<string, unknown>)[item.name]}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
              </label>
            ))}

            {/* ── BOTONES ───────────────────────────────────────── */}
            <div className="flex w-full mt-5 gap-2 relative overflow-hidden">

              {/* LIMPIAR FILTROS */}
              <button
                type="button"
                onClick={() => {
                  setIsClearingFilters(true);
                  if (isLanding) {
                    setLandingFilters({});
                    setResultCount(null);
                  } else {
                    clearFilters();
                  }
                  setLocalNumbers({ rooms: '', bathrooms: '', minPrice: '', maxPrice: '', minM2: '', maxM2: '', maxAntiquity: '' });
                  setTimeout(() => setIsClearingFilters(false), 0);
                }}
                className={`
                  flex items-center justify-center gap-2 text-xs font-bold py-3 rounded-xl
                  transition-all duration-500 ease-in-out whitespace-nowrap
                  ${activeFiltersCount > 0
                    ? 'w-[46%] bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20'
                    : 'w-full bg-gray-100 text-gray-400 hover:bg-gray-200 border border-gray-200'
                  }
                `}
              >
                <Trash2 size={13} className="shrink-0" />
                <span className="truncate">Limpiar ({activeFiltersCount})</span>
              </button>

              {/* VER RESULTADOS */}
              <button
                type="button"
                onClick={handleVerResultados}
                className={`
                  flex items-center justify-center gap-2 text-xs font-bold text-white py-3 rounded-xl
                  transition-all duration-500 ease-in-out bg-[#0b7a4b] hover:bg-[#084f30] shadow-md shadow-[#0b7a4b]/25 cursor-pointer
                  ${activeFiltersCount > 0
                    ? 'w-[54%] opacity-100 scale-100'
                    : 'w-0 opacity-0 scale-95 pointer-events-none'
                  }
                `}
              >
                <Search size={13} className="shrink-0" />
                <span className="whitespace-nowrap">
                  Ver{' '}
                  {loadingCount
                    ? '...'
                    : resultCount !== null
                      ? `${resultCount} resultados`
                      : 'Resultados'
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;