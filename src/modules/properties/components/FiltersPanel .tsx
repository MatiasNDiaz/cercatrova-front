'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  MapPin,
  Home,
  DollarSign,
  Car,
  Trash2
} from 'lucide-react';
import { usePropertyFilters } from '../hooks/usePropertyFilters';
import { OperationType } from '../interfaces/operation-type';

export const FiltersPanel = () => {
  const { filters, setFilters, clearFilters } = usePropertyFilters();

  /* =========================================================
     LOCAL STATE PARA INPUTS NUMÉRICOS (ANTI-LAG)
  ========================================================= */
  

  /* Sync cuando filtros globales cambian (ej: limpiar filtros) */
  const [localNumbers, setLocalNumbers] = useState<{
  rooms: string;
  bathrooms: string;
  minPrice: string;
  maxPrice: string;
  minM2: string;
  maxM2: string;
  maxAntiquity: string;
}>({
  rooms: filters.rooms?.toString() || '',
  bathrooms: filters.bathrooms?.toString() || '',
  minPrice: filters.minPrice?.toString() || '',
  maxPrice: filters.maxPrice?.toString() || '',
  minM2: filters.minM2?.toString() || '',
  maxM2: filters.maxM2?.toString() || '',
  maxAntiquity: filters.maxAntiquity?.toString() || '',
});


  /* Debounce → aplica al estado global */
  useEffect(() => {
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
  }, [localNumbers, setFilters]);

  /* =========================================================
     MEMO STYLES
  ========================================================= */
  const styles = useMemo(() => ({
    groupLabel:
      'flex items-center gap-2 text-[11px] font-black text-[#0b7a4b] uppercase mb-4 tracking-wider ',

    input:
      'w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-[#0b7a4b] text-[#0b7a4b] focus:border-[#0b7a4b] focus:ring-2 focus:ring-[#0b7a4b]/20 outline-none transition-all duration-200 hover:border-[#0b7a4b]/60 ',

    select:
      'w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-gray-200 text-[#0b7a4b] appearance-none font-medium  focus:ring-2 focus:ring-[#0b7a4b]/20 focus:border-[#0b7a4b] outline-none transition-all duration-200 hover:border-[#0b7a4b]/60',

    checkbox:
      'w-4 h-4 accent-[#0b7a4b] transition-all  text-[#0b7a4b] duration-200 cursor-pointer',
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

  /* =========================================================
     ACTIVE FILTER COUNT
  ========================================================= */
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length;
  }, [filters]);

  /* =========================================================
     COMPONENT
  ========================================================= */
  return (
    <div className=" rounded-4xl border border-[#0b7a4b]/30 bg-linear-to-br from-[#f9fffb] to-[#f2fff7] shadow-xl p-5 w-full max-w-6xl mx-auto transition-all duration-100">

      {/* ================= TOP ================= */}
      <div className="flex flex-col md:flex-row gap-8 mb-12 items-end">

        {/* UBICACIÓN */}
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-bold text-[#0b7a4b] uppercase mb-2 ml-4">
            localidad
          </label>
          <div className="relative group">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0b7a4b] group-hover:scale-110 transition-transform"
              size={18}
            />
            <select
              name="localidad"
              aria-label='a'
              value={filters.localidad || ''}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="" className='text-[#0b7a4b]'>Buscar por localidad...</option>
              <option className='text-[#0b7a4b]' value="Carlos Paz">Carlos Paz</option>
              <option className='text-[#0b7a4b]' value="Córdoba">Córdoba Capital</option>
              <option className='text-[#0b7a4b]' value="La Falda">La Falda</option>
              <option className='text-[#0b7a4b]' value="Alta Gracia">Alta Gracia</option>
              <option className='text-[#0b7a4b]' value="Rio Ceballos">Rio Ceballos</option>
              <option className='text-[#0b7a4b]' value="Capilla del Monte">Capilla del Monte</option>
              <option className='text-[#0b7a4b]' value="Calera">Calera</option>
              <option className='text-[#0b7a4b]' value="Cosquin">Cosquin</option>
              <option className='text-[#0b7a4b]' value="Villa General Belgrano">Villa General Belgrano</option>
              <option className='text-[#0b7a4b]' value="Mina Clavero">Mina Clavero</option>
            </select>
          </div>
        </div>

        {/* BARRIO */}
          <div className="flex-1 w-full">
          <label className="block text-[10px] font-bold text-[#0b7a4b] uppercase mb-2 ml-4">
            Zona
          </label>
          <div className="relative group">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0b7a4b] group-hover:scale-110 transition-transform"
              size={18}
            />
            <select
              name="barrio"
              aria-label='a'
              value={filters.barrio || ''}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="" className='text-[#0b7a4b]'>Buscar por Zona...</option>
              <option className='text-[#0b7a4b]' value="Alberdi">Alberdi</option>
              <option className='text-[#0b7a4b]' value="Nueva Cordoba">Nueva Cordoba</option>
              <option className='text-[#0b7a4b]' value="Alta Cordoba">Alta Cordoba</option>
              <option className='text-[#0b7a4b]' value="Valle Escondido">Valle Escondido</option>
              <option className='text-[#0b7a4b]' value="Las Palmas">Las Palmas</option>
              <option className='text-[#0b7a4b]' value="Cerro de las Rosas">Cerro de las Rosas</option>
              <option className='text-[#0b7a4b]' value="Ciudad Universitaria">Ciudad Universitaria</option>
              <option className='text-[#0b7a4b]' value="Güemes">Güemes</option>
              <option className='text-[#0b7a4b]' value="Argüello">Argüello</option>
              <option className='text-[#0b7a4b]' value="Urca">Urca</option>
              <option className='text-[#0b7a4b]' value="Los Manantiales">Los Manantiales</option>
            </select>
          </div>
        </div>

        {/* OPERACIÓN */}
        <div>
          <label className="block text-[10px] font-bold text-[#0b7a4b] uppercase mb-2 ml-4">
            Operación
          </label>

          <div className="flex bg-white rounded-2xl p-1 border border-gray-200 shadow-sm h-14 items-center px-2 gap-2">
            {['venta', 'alquiler'].map((op) => (
              <button
                key={op}
                onClick={() => handleOperationChange(op as OperationType)}
                className={`flex-1 md:w-28 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-300
                  ${
                    filters.operationType === op
                      ? 'bg-[#0b7a4b] text-white shadow-md '
                      : 'text-[#0b7a4b] hover:text-[#ffff] hover:bg-gray-500'
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

          <div className="space-y-4 text-[#0b7a4b]">
            <select
              aria-label='a'
              name="typeOfPropertyId"
              value={filters.typeOfPropertyId || ''}
              onChange={handleChange}
              className={styles.input}
            >
              <option className='text-[#0b7a4b]' value="">Tipo de Propiedad</option>
              <option className='text-[#0b7a4b]' value="1">Casa</option>
              <option className='text-[#0b7a4b]' value="2">Departamento</option>
              <option className='text-[#0b7a4b]' value="3">Local</option>
              <option className='text-[#0b7a4b]' value="4">Oficina</option>
              <option className='text-[#0b7a4b]' value="5">Terreno</option>
            </select>

            <input
              type="number"
              value={localNumbers.rooms}
              onChange={(e) =>
                setLocalNumbers((prev) => ({ ...prev, rooms: e.target.value }))
              }
              className={styles.input}
              placeholder="Habitaciones"
            />

            <input
              type="number"
              value={localNumbers.bathrooms}
              onChange={(e) =>
                setLocalNumbers((prev) => ({ ...prev, bathrooms: e.target.value }))
              }
              className={styles.input}
              placeholder="Baños"
            />
          </div>
        </div>

        {/* PRESUPUESTO Y ÁREA */}
        <div>
          <h3 className={styles.groupLabel}><DollarSign size={16} /> Presupuesto y Área</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={localNumbers.minPrice}
                onChange={(e) =>
                  setLocalNumbers((prev) => ({ ...prev, minPrice: e.target.value }))
                }
                className={styles.input}
                placeholder="$ Mínimo"
              />
              <input
                type="number"
                value={localNumbers.maxPrice}
                onChange={(e) =>
                  setLocalNumbers((prev) => ({ ...prev, maxPrice: e.target.value }))
                }
                className={styles.input}
                placeholder="$ Máximo"
              />
            </div>

            <input
              type="number"
              value={localNumbers.minM2}
              onChange={(e) =>
                setLocalNumbers((prev) => ({ ...prev, minM2: e.target.value }))
              }
              className={styles.input}
              placeholder="M² mínimos"
            />

            <input
              type="number"
              value={localNumbers.maxM2}
              onChange={(e) =>
                setLocalNumbers((prev) => ({ ...prev, maxM2: e.target.value }))
              }
              className={styles.input}
              placeholder="M² máximos"
            />

            <input
              type="number"
              value={localNumbers.maxAntiquity}
              onChange={(e) =>
                setLocalNumbers((prev) => ({ ...prev, maxAntiquity: e.target.value }))
              }
              className={styles.input}
              placeholder="Antigüedad máxima (años)"
            />
          </div>
        </div>

        {/* ADICIONALES */}
        <div>
          <h3 className={styles.groupLabel}><Car size={16} /> Adicionales</h3>

          <div className="space-y-4">
            {[
              { label: 'Cochera', name: 'garage' },
              { label: 'Patio', name: 'patio' },
              { label: 'Apto Escritura', name: 'aptoEscritura' }
            ].map((item) => (
              <label
                key={item.name}
                className="flex items-center text-[#0b7a4b] justify-between h-11 px-4 bg-white rounded-xl border border-gray-200 cursor-pointer transition-all duration-200 hover:border-[#0b7a4b] hover:shadow-sm"
              >
                <span className="text-sm text-[#0b7a4b]">{item.label}</span>
                <input
                  type="checkbox"
                  name={item.name}
                  checked={!!filters[item.name as keyof typeof filters]}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
              </label>
            ))}

            <button
              onClick={clearFilters}
              className="mt-6 w-full bg-red-500 hover:bg-red-600 transition-all duration-300 flex items-center justify-center gap-2 text-xs font-bold text-white py-3 rounded-xl shadow-md hover:shadow-lg active:scale-95"
            >
              <Trash2 size={14} /> Limpiar Filtros ({activeFiltersCount})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FiltersPanel;
