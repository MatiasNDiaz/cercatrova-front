'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  MapPin,
  Home,
  DollarSign,
  Car,
  Trash2,
  Bed,
  Bath,
  Maximize,
  Calendar,
  TreePine,
  FileText,
  ChevronDown,
  Search
} from 'lucide-react';
import { usePropertyFilters } from '../hooks/usePropertyFilters';
import { OperationType } from '../interfaces/operation-type';
import { propertiesService } from '../services/properties.service';

export const FiltersPanel = () => {
  const { filters, setFilters, clearFilters } = usePropertyFilters();
  const [isClearingFilters, setIsClearingFilters] = useState(false);

  // Estados para controlar la apertura de los dropdowns personalizados
  const [openLoc, setOpenLoc] = useState(false);
  const [openZone, setOpenZone] = useState(false);
  const [openBarrio, setOpenBarrio] = useState(false);

  /* =========================================================
      LOCAL STATE PARA INPUTS NUMÉRICOS (ANTI-LAG)
  ========================================================= */
  const [localNumbers, setLocalNumbers] = useState<{
    rooms: string;
    bathrooms: string;
    minPrice: string;
    maxPrice: string;
    minM2: string;
    maxM2: string;
    maxAntiquity: string;
  }>
  ({
    rooms: filters.rooms?.toString() || '',
    bathrooms: filters.bathrooms?.toString() || '',
    minPrice: filters.minPrice?.toString() || '',
    maxPrice: filters.maxPrice?.toString() || '',
    minM2: filters.minM2?.toString() || '',
    maxM2: filters.maxM2?.toString() || '',
    maxAntiquity: filters.maxAntiquity?.toString() || '',
  });

  /* Sync cuando filtros globales cambian */
  useEffect(() => {
    if (isClearingFilters) return;

    const timeout = setTimeout(() => {
      setFilters({
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
  }, [localNumbers, setFilters, isClearingFilters]);

  /* =========================================================
      MEMO STYLES
  ========================================================= */
  const styles = useMemo(() => ({
    groupLabel:
      'flex items-center gap-2 text-[11px] font-black text-[#0b7a4b] uppercase mb-4 tracking-wider',
    
    input:
      'w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 bg-white text-sm text-[#0b7a4b] placeholder:text-[#0b7a4b]/60 focus:border-[#0b7a4b] focus:ring-2 focus:ring-[#0b7a4b]/20 outline-none transition-all duration-200 hover:border-[#0b7a4b]/60',

    select:
      'w-full h-14 pl-12 pr-10 bg-white rounded-2xl border border-gray-200 text-[#0b7a4b] font-medium focus:ring-2 focus:ring-[#0b7a4b]/20 focus:border-[#0b7a4b] outline-none transition-all duration-200 hover:border-[#0b7a4b]/60 flex items-center text-left relative cursor-pointer overflow-hidden whitespace-nowrap text-ellipsis',

    checkbox:
      'w-4 h-4 accent-[#0b7a4b] transition-all text-[#0b7a4b] duration-200 cursor-pointer',
    
    iconStyle: 
      'absolute left-4 top-1/2 -translate-y-1/2 text-[#0b7a4b] pointer-events-none group-focus-within:scale-110 transition-transform duration-200 z-10',

    dropdownList:
      'absolute z-[60] mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[#0b7a4b]/20',
    
    dropdownItem:
      'w-full text-left px-5 py-3 text-sm text-[#0b7a4b] hover:bg-[#0b7a4b]/5 transition-colors duration-150 border-b border-gray-50 last:border-none'
  }), []);

  /* =========================================================
      HANDLERS
  ========================================================= */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;

      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFilters({ [name]: checked || undefined });
      } else {
        setFilters({ [name]: value === '' ? undefined : value });
      }
    },
    [setFilters]
  );

  const handleOperationChange = useCallback(
    (op: OperationType) => {
      setFilters({ operationType: op });
    },
    [setFilters]
  );

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length - 2;
  }, [filters]);

  const [locationOptions, setLocationOptions] = useState<{
    localidades: string[];
    barrios: string[];
    zones: string[];
  }>({
    localidades: [],
    barrios: [],
    zones: [],
  });

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
    <div className="rounded-4xl border border-[#0b7a4b]/30 bg-linear-to-br from-[#e8e5e5] to-[#e8e5e5] shadow-xl p-5 w-full max-w-6xl mx-auto transition-all duration-100">

      {/* ================= TOP (LOCALIDAD, ZONA, BARRIO) ================= */}
      <div className="flex flex-col md:flex-row gap-4 mb-12 items-end">
        
        {/* LOCALIDAD */}
        <div className="flex-1 w-full relative">
          <label className="block text-[10px] font-bold text-[#0b7a4b] uppercase mb-2 ml-4">localidad</label>
          <div className="relative group">
            <MapPin className={styles.iconStyle} size={18} />
            <button
              type="button"
              onClick={() => { setOpenLoc(!openLoc); setOpenZone(false); setOpenBarrio(false); }}
              className={styles.select}
            >
              {filters.localidad || <span className="text-[#0b7a4b]/60">Buscar localidad...</span>}
              <ChevronDown className="absolute right-4 text-[#0b7a4b]/40" size={16} />
            </button>

            {openLoc && (
              <div className={styles.dropdownList}>
                <button
                  onClick={() => { setFilters({ localidad: undefined }); setOpenLoc(false); }}
                  className={styles.dropdownItem}
                >
                  Todas las localidades
                </button>
                {locationOptions.localidades.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => { setFilters({ localidad: loc }); setOpenLoc(false); }}
                    className={styles.dropdownItem}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ZONA */}
        <div className="flex-1 w-full relative">
          <label className="block text-[10px] font-bold text-[#0b7a4b] uppercase mb-2 ml-4">Zona</label>
          <div className="relative group">
            <MapPin className={styles.iconStyle} size={18} />
            <button
              type="button"
              onClick={() => { setOpenZone(!openZone); setOpenLoc(false); setOpenBarrio(false); }}
              className={styles.select}
            >
              {filters.zone || <span className="text-[#0b7a4b]/60">Buscar zona...</span>}
              <ChevronDown className="absolute right-4 text-[#0b7a4b]/40" size={16} />
            </button>

            {openZone && (
              <div className={styles.dropdownList}>
                <button
                  onClick={() => { setFilters({ zone: undefined }); setOpenZone(false); }}
                  className={styles.dropdownItem}
                >
                  Todas las zonas
                </button>
                {locationOptions.zones.map((z) => (
                  <button
                    key={z}
                    onClick={() => { setFilters({ zone: z }); setOpenZone(false); }}
                    className={styles.dropdownItem}
                  >
                    {z}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BARRIO */}
        <div className="flex-1 w-full relative">
          <label className="block text-[10px] font-bold text-[#0b7a4b] uppercase mb-2 ml-4">Barrio</label>
          <div className="relative group">
            <MapPin className={styles.iconStyle} size={18} />
            <button
              type="button"
              onClick={() => { setOpenBarrio(!openBarrio); setOpenLoc(false); setOpenZone(false); }}
              className={styles.select}
            >
              {filters.barrio || <span className="text-[#0b7a4b]/60">Buscar barrio...</span>}
              <ChevronDown className="absolute right-4 text-[#0b7a4b]/40" size={16} />
            </button>

            {openBarrio && (
              <div className={styles.dropdownList}>
                <button
                  onClick={() => { setFilters({ barrio: undefined }); setOpenBarrio(false); }}
                  className={styles.dropdownItem}
                >
                  Todos los barrios
                </button>
                {locationOptions.barrios.map((b) => (
                  <button
                    key={b}
                    onClick={() => { setFilters({ barrio: b }); setOpenBarrio(false); }}
                    className={styles.dropdownItem}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* OPERACIÓN */}
        <div>
          <label className="block text-[10px] font-bold text-[#0b7a4b] uppercase mb-2 ml-4">Operación</label>
          <div className="flex bg-white rounded-2xl p-1 border border-gray-200 shadow-sm h-14 items-center px-2 gap-2">
            {['venta', 'alquiler'].map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => handleOperationChange(op as OperationType)}
                className={`flex-1 md:w-28 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all transition-text duration-240
                  ${filters.operationType === op
                    ? 'bg-[#0b7a4b] text-white shadow-md'
                    : 'text-[#0b7a4b] hover:bg-[#0b7a4b] hover:text-white'
                  }`}
              >
                {op === 'venta' ? 'Venta' : 'Alquiler'}
              </button>
            ))}
          </div>
        </div>


        
      </div>

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-14">

        {/* TIPO Y ESPACIOS */}
        <div>
          <h3 className={styles.groupLabel}><Home size={16} /> Tipo y Espacios</h3>
          <div className="space-y-4">
            <div className="relative group">
              <Home className={styles.iconStyle} size={18} />
              <select
                aria-label='tipo'
                name="typeOfPropertyId"
                value={filters.typeOfPropertyId || ''}
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
              <Bed className={styles.iconStyle} size={18} />
              <input
                type="number"
                value={localNumbers.rooms}
                onChange={(e) => setLocalNumbers((prev) => ({ ...prev, rooms: e.target.value }))}
                className={styles.input}
                placeholder="Habitaciones"
              />
            </div>

            <div className="relative group">
              <Bath className={styles.iconStyle} size={18} />
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
          <h3 className={styles.groupLabel}><DollarSign size={16} /> Presupuesto y Área</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <DollarSign className={styles.iconStyle} size={18} />
                <input
                  type="number"
                  value={localNumbers.minPrice}
                  onChange={(e) => setLocalNumbers((prev) => ({ ...prev, minPrice: e.target.value }))}
                  className={styles.input}
                  placeholder="Mínimo"
                />
              </div>
              <div className="relative group">
                <DollarSign className={styles.iconStyle} size={18} />
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
              <Maximize className={styles.iconStyle} size={18} />
              <input
                type="number"
                value={localNumbers.minM2}
                onChange={(e) => setLocalNumbers((prev) => ({ ...prev, minM2: e.target.value }))}
                className={styles.input}
                placeholder="M² mínimos"
              />
            </div>

            <div className="relative group">
              <Maximize className={styles.iconStyle} size={18} />
              <input
                type="number"
                value={localNumbers.maxM2}
                onChange={(e) => setLocalNumbers((prev) => ({ ...prev, maxM2: e.target.value }))}
                className={styles.input}
                placeholder="M² máximos"
              />
            </div>

            <div className="relative group">
              <Calendar className={styles.iconStyle} size={18} />
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
          <h3 className={styles.groupLabel}><Car size={16} /> Adicionales</h3>
          <div className="space-y-4">
            {[
              { label: 'Cochera', name: 'garage', icon: <Car size={16} /> },
              { label: 'Patio', name: 'patio', icon: <TreePine size={16} /> },
              { label: 'Escritura', name: 'property_deed', icon: <FileText size={16} /> }
            ].map((item) => (
              <label
                key={item.name}
                className="flex items-center text-[#0b7a4b] justify-between h-11 px-4 bg-white rounded-xl border border-gray-200 cursor-pointer transition-all duration-200 hover:border-[#0b7a4b] hover:shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#0b7a4b] group-hover:scale-110 transition-transform duration-200">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <input
                  type="checkbox"
                  name={item.name}
                  checked={!!filters[item.name as keyof typeof filters]}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
              </label>
            ))}


{/* botones de limpiar filtros y de ver resultados: */}
           <div className="flex w-full mt-4 h-10.5 relative overflow-hidden">
  {/* BOTÓN LIMPIAR FILTROS */}
  <button
    type="button"
    onClick={() => {
      setIsClearingFilters(true);
      clearFilters();
      setLocalNumbers({
        rooms: '',
        bathrooms: '',
        minPrice: '',
        maxPrice: '',
        minM2: '',
        maxM2: '',
        maxAntiquity: '',
      });
      setTimeout(() => setIsClearingFilters(false), 0);
    }}
    className={`
      flex items-center justify-center gap-2 text-xs font-bold text-white py-3 rounded-xl shadow-md 
      transition-all duration-500 ease-in-out whitespace-nowrap
      ${activeFiltersCount > 0 
        ? 'w-[48%] bg-red-600 hover:bg-red-700' 
        : 'w-full bg-red-600/80 hover:bg-red-700'
      }
    `}
  >
    <Trash2 size={14} className="shrink-0" />
    <span className="truncate">Limpiar Filtros ({activeFiltersCount})</span>
  </button>

  {/* BOTÓN VER RESULTADOS (Siempre presente, pero colapsado) */}
  <a
    onClick={(e) => {
      e.preventDefault();
      const section = document.getElementById('propiedades');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }}
    className={`
      flex items-center justify-center gap-2 text-xs font-bold text-white py-3 rounded-xl shadow-md cursor-pointer
      transition-all duration-500 ease-in-out bg-[#0c7332] hover:bg-[#065021]
      ${activeFiltersCount > 0 
        ? 'w-[48%] ml-[4%] opacity-100 scale-100' 
        : 'w-0 ml-0 opacity-0 scale-95 pointer-events-none'
      }
    `}
  >
    <Search size={14} className="shrink-0" />
    <span className="whitespace-nowrap">Ver Resultados</span>
  </a>
</div>



            
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;