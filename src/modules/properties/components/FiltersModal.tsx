'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  rooms: '', bathrooms: '', minPrice: '', maxPrice: '',
  minSupTotal: '', maxSupTotal: '', minSupCubierta: '', maxSupCubierta: '',
  maxAntiquity: '',
};

type NumsKey = keyof typeof EMPTY_NUMS;

/** Los campos de ubicación llegan como `string[]`; el Dropdown pide `{value,label}`. */
const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

/**
 * Deja un valor de ubicación listo para MOSTRAR y para mandar a la URL:
 * colapsa las corridas de espacios, recorta las puntas y fuerza la primera
 * letra en mayúscula.
 *
 * Los espacios importan porque `\s` incluye el espacio duro (` `), y ese es
 * el sospechoso número uno cuando dos opciones del desplegable se ven
 * EXACTAMENTE iguales: son valores tipeados a mano, y un espacio invisible al
 * final no se nota en pantalla pero para Postgres son dos filas distintas.
 *
 * La mayúscula inicial es una regla de presentación FIJA, no una elección entre
 * variantes: como el admin carga `localidad`/`zone` a mano en un `<Input>`, en
 * la base conviven `"Centro"` y `"centro"`, y el desplegable tiene que mostrar
 * siempre la forma capitalizada sin importar cuál quedó guardada primero.
 *
 * Se capitaliza SOLO la primera letra, no cada palabra: `"Santa Cruz del Lago"`
 * tiene que quedar tal cual (en castellano el `del` va en minúscula); lo que hay
 * que corregir es el caso `"centro"` -> `"Centro"`.
 */
const cleanLocation = (v: string) => {
  const s = v.replace(/\s+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Clave de comparación para deduplicar valores de ubicación.
 *
 * Se normaliza igual que el backend compara al filtrar:
 * `unaccent(col) ILIKE unaccent(:v)` (`properties.service.ts:570` y `:572`), es
 * decir sin distinguir mayúsculas ni acentos. Se le suma la limpieza de espacios
 * de `cleanLocation`, que el `ILIKE` no hace por sí solo.
 */
const locationKey = (v: string) =>
  cleanLocation(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** ¿El valor conserva sus acentos? (`"Córdoba"` sí, `"Cordoba"` no). */
const hasAccents = (v: string) => v !== v.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Igual que `toOptions`, pero colapsa los valores repetidos.
 *
 * Por qué hace falta: el endpoint `GET /properties/filters/locations` ya hace un
 * `SELECT DISTINCT`, pero DISTINCT compara byte a byte. Como `localidad`/`zone`
 * son texto libre cargado por el admin en un `<Input>` (no un select cerrado),
 * tres propiedades del centro pueden haber quedado guardadas como `"Centro"`,
 * `"centro"` y `"Centro "` — tres filas distintas para Postgres, tres opciones
 * visualmente idénticas en el desplegable.
 *
 * El filtrado NO cambia: el backend matchea con `unaccent ILIKE '%valor%'`, así
 * que la variante que sobrevive sigue trayendo las propiedades cargadas con
 * cualquiera de las otras.
 *
 * Único desempate entre variantes: gana la que conserva los acentos
 * (`"Córdoba"` por sobre `"Cordoba"`). Las mayúsculas ya no desempatan nada
 * porque `cleanLocation` las normaliza. A igualdad, gana la primera, así el
 * resultado es determinista.
 *
 * Se usa un `Map`, que conserva el orden de inserción: el desplegable mantiene
 * el orden alfabético que ya venía del backend aunque la variante elegida se
 * reemplace más tarde.
 */
const toUniqueOptions = (values: string[]) => {
  const best = new Map<string, string>();

  for (const raw of values) {
    const value = cleanLocation(raw);
    if (!value) continue;
    const key = locationKey(value);
    const current = best.get(key);
    if (current === undefined || (!hasAccents(current) && hasAccents(value))) {
      best.set(key, value);
    }
  }

  return [...best.values()].map((value) => ({ value, label: value }));
};

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

  const [openDrop, setOpenDrop] = useState<'loc' | 'zone' | 'barrio' | 'type' | null>(null);
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
      tractoAbreviado: filters.tractoAbreviado,
      boleto: filters.boleto,
    });
    setNums({
      rooms: filters.rooms?.toString() ?? '',
      bathrooms: filters.bathrooms?.toString() ?? '',
      minPrice: filters.minPrice?.toString() ?? '',
      maxPrice: filters.maxPrice?.toString() ?? '',
      minSupTotal: filters.minSupTotal?.toString() ?? '',
      maxSupTotal: filters.maxSupTotal?.toString() ?? '',
      minSupCubierta: filters.minSupCubierta?.toString() ?? '',
      maxSupCubierta: filters.maxSupCubierta?.toString() ?? '',
      maxAntiquity: filters.maxAntiquity?.toString() ?? '',
    });
    setOpenDrop(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Bloqueo del scroll de fondo + Escape.
  //
  // FIX de scroll: además de `overflow: hidden` en el body, se compensa el ancho
  // de la scrollbar con `padding-right`. Sin eso, al ocultar la barra la página
  // de fondo se corre unos píxeles y se ve un "salto" al abrir/cerrar el modal.
  // (El otro origen del bug — dos contenedores scrolleables anidados — se
  // resolvió sacando el `overflow-y-auto` del wrapper exterior, más abajo.)
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
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
      minSupTotal: n(nums.minSupTotal),
      maxSupTotal: n(nums.maxSupTotal),
      minSupCubierta: n(nums.minSupCubierta),
      maxSupCubierta: n(nums.maxSupCubierta),
      maxAntiquity: n(nums.maxAntiquity),
    };
  }, [draft, nums]);

  const activeCount = useMemo(
    () => Object.values(draftAsFilters).filter((v) => v !== undefined && v !== null && v !== '').length,
    [draftAsFilters]
  );

  // ¿Hay ALGO que limpiar? No alcanza con mirar el borrador del modal: si el
  // usuario llegó desde el navbar a `/properties?operationType=venta`, o escribió
  // en el buscador, o eligió un orden, el borrador está vacío pero la URL no.
  // Antes el botón "Limpiar" miraba solo `activeCount` y quedaba deshabilitado
  // justo en ese caso — no había forma de volver a "todas las propiedades" desde
  // el modal. Ahora se habilita con cualquier filtro vigente en la URL.
  const hasUrlFilters = useMemo(
    () =>
      Object.entries(filters).some(
        ([k, v]) => !['page', 'limit'].includes(k) && v !== undefined && v !== null && v !== ''
      ),
    [filters]
  );
  const canClear = activeCount > 0 || hasUrlFilters;

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

  // Referencia estable: la usan los `Dropdown` como dependencia del efecto de
  // click-afuera, así no se re-suscribe el listener en cada render.
  const closeDrop = useCallback(() => setOpenDrop(null), []);

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
        // ⚠️ El wrapper NO lleva `overflow-y-auto`. Antes lo tenía, y como el
        // body del panel TAMBIÉN scrollea, quedaban dos contenedores
        // scrolleables anidados peleándose (ese era el bug de scroll). Ahora
        // solo scrollea el body del panel, y únicamente si la pantalla es muy
        // baja: en desktop el contenido entra completo.
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
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
            className="relative z-10 my-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_40px_100px_-20px_rgba(10,12,11,0.65),0_0_0_1px_rgba(10,12,11,0.05)]"
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

            {/* ── HEADER — título centrado en verde de marca ──
                Eyebrow en pastilla sólida `brand-700`, igual que `SectionHeading`
                de la Landing, para que el modal hable el mismo idioma visual. */}
            <div className="relative z-10 border-b border-ink-100 bg-linear-to-b from-brand-50/70 to-white px-7 py-6 text-center">
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-700">Filtrá tu búsqueda</h2>
              <p className="mt-1.5 text-sm text-ink-500">Ajustá los criterios y aplicá para ver los resultados.</p>
              {/* Cerrar: neutro en reposo, rojo recién en hover. El rojo sólido
                  permanente que había antes competía con el título y era lo
                  primero que saltaba a la vista al abrir el modal. */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar filtros"
                className="absolute top-1/2 right-6 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white text-ink-400 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── BODY — 2 columnas en desktop ──
                Repartir las 4 secciones en dos columnas hace que el modal entre
                COMPLETO sin scroll interno en desktop (antes eran 4 filas
                apiladas y siempre había que scrollear). El `overflow-y-auto`
                queda solo como red de seguridad para pantallas muy bajas. */}
            <div className="relative z-10 flex-1 overflow-y-auto px-7 py-6">
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">

              {/* Ubicación */}
              <FilterGroup icon={MapPin} label="Ubicación">
                <div className="grid grid-cols-1 gap-3">
                  <Dropdown
                    label="Localidad" placeholder="Todas las localidades"
                    value={draft.localidad} options={toUniqueOptions(locations.localidades)}
                    isOpen={openDrop === 'loc'} onToggle={() => setOpenDrop(openDrop === 'loc' ? null : 'loc')} onClose={closeDrop}
                    onSelect={(v) => { setDraft((p) => ({ ...p, localidad: v })); setOpenDrop(null); }}
                  />
                  <Dropdown
                    label="Zona" placeholder="Todas las zonas"
                    value={draft.zone} options={toUniqueOptions(locations.zones)}
                    isOpen={openDrop === 'zone'} onToggle={() => setOpenDrop(openDrop === 'zone' ? null : 'zone')} onClose={closeDrop}
                    onSelect={(v) => { setDraft((p) => ({ ...p, zone: v })); setOpenDrop(null); }}
                  />
                  <Dropdown
                    label="Barrio" placeholder="Todos los barrios"
                    value={draft.barrio} options={toOptions(locations.barrios)}
                    isOpen={openDrop === 'barrio'} onToggle={() => setOpenDrop(openDrop === 'barrio' ? null : 'barrio')} onClose={closeDrop}
                    onSelect={(v) => { setDraft((p) => ({ ...p, barrio: v })); setOpenDrop(null); }}
                  />
                </div>
              </FilterGroup>

              {/* Tipo y ambientes */}
              <FilterGroup icon={Bed} label="Tipo y ambientes">
                <div className="grid grid-cols-1 gap-3">
                  {/* Mismo dropdown custom que los tres de Ubicación — antes acá
                      había un `<select>` nativo con el estilo del navegador. */}
                  <Dropdown
                    label="Tipo de propiedad" placeholder="Cualquier tipo"
                    icon={Home}
                    value={draft.typeOfPropertyId?.toString()}
                    options={propertyTypes.map((t) => ({ value: String(t.id), label: t.name }))}
                    isOpen={openDrop === 'type'} onToggle={() => setOpenDrop(openDrop === 'type' ? null : 'type')} onClose={closeDrop}
                    onSelect={(v) => {
                      setDraft((p) => ({ ...p, typeOfPropertyId: v ? Number(v) : undefined }));
                      setOpenDrop(null);
                    }}
                  />
                  <IconNumber icon={Bed} placeholder="Habitaciones" value={nums.rooms} onChange={(v) => setNum('rooms', v)} />
                  <IconNumber icon={Bath} placeholder="Baños" value={nums.bathrooms} onChange={(v) => setNum('bathrooms', v)} />
                </div>
              </FilterGroup>

              {/* Presupuesto y superficie
                  Orden por PARES semánticos: precio mín/máx, luego m² mín/máx, y
                  antigüedad sola ocupando la fila entera. Antes el orden dejaba
                  [antigüedad | m² mín] en la misma fila (dos cosas sin relación) y
                  una celda huérfana vacía al final. */}
              <FilterGroup icon={DollarSign} label="Presupuesto y superficie">
                {/* La parte más densa del modal (6 inputs numéricos en pares).
                    A 375px las dos columnas dejaban ~140px por campo, con el
                    placeholder cortado. Una sola columna hasta sm. */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <IconNumber icon={DollarSign} placeholder="Precio mín." value={nums.minPrice} onChange={(v) => setNum('minPrice', v)} />
                  <IconNumber icon={DollarSign} placeholder="Precio máx." value={nums.maxPrice} onChange={(v) => setNum('maxPrice', v)} />
                  <IconNumber icon={Maximize} placeholder="Sup. Total mín." value={nums.minSupTotal} onChange={(v) => setNum('minSupTotal', v)} />
                  <IconNumber icon={Maximize} placeholder="Sup. Total máx." value={nums.maxSupTotal} onChange={(v) => setNum('maxSupTotal', v)} />
                  <IconNumber icon={Maximize} placeholder="Sup. Cubierta mín." value={nums.minSupCubierta} onChange={(v) => setNum('minSupCubierta', v)} />
                  <IconNumber icon={Maximize} placeholder="Sup. Cubierta máx." value={nums.maxSupCubierta} onChange={(v) => setNum('maxSupCubierta', v)} />
                  {/* `col-span-1` de base: con la grilla en una sola columna,
                      un `col-span-2` suelto crea una segunda columna implícita
                      y este campo queda al doble de ancho que los de arriba. */}
                  <div className="col-span-1 sm:col-span-2">
                    <IconNumber icon={Calendar} placeholder="Antigüedad máx. (años)" value={nums.maxAntiquity} onChange={(v) => setNum('maxAntiquity', v)} />
                  </div>
                </div>
              </FilterGroup>

              {/* Adicionales */}
              <FilterGroup icon={Car} label="Adicionales">
                <div className="grid grid-cols-1 gap-2.5">
                  {([
                    { key: 'garage', label: 'Cochera', icon: Car },
                    { key: 'patio', label: 'Patio', icon: TreePine },
                    // Documentación legal: independientes entre sí, se pueden
                    // combinar (una propiedad puede tener escritura Y boleto).
                    { key: 'property_deed', label: 'Escritura', icon: FileText },
                    { key: 'tractoAbreviado', label: 'Tracto abreviado', icon: FileText },
                    { key: 'boleto', label: 'Boleto', icon: FileText },
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
            </div>

            {/* ── FOOTER ──
                "Limpiar" (rojo sólido) y "Ver N resultados" van JUNTOS en la
                misma fila a la derecha. En mobile se apilan con el principal
                arriba. */}
            <div className="relative z-10 flex flex-col-reverse gap-3 border-t border-ink-100 bg-ink-50/70 px-7 py-5 sm:flex-row sm:items-center sm:justify-end">
              {/* Texto FIJO ("Limpiar filtros", sin el contador entre paréntesis)
                  para que este botón tampoco cambie de ancho y empuje al de al
                  lado. El estado se comunica con el `disabled`, no con el label. */}
              <button
                type="button"
                onClick={handleClear}
                disabled={!canClear}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold whitespace-nowrap text-white shadow-[0_8px_20px_-8px_rgba(239,68,68,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:w-auto"
              >
                <Trash2 size={15} />
                Limpiar filtros
              </button>

              {/* Ancho FIJO (no `min-w`) en desktop: el contador cambia de 1 a 5
                  dígitos y el label alterna entre "Buscando...", "Ver N
                  resultado(s)" y "Aplicar filtros". Con ancho fijo + `tabular-nums`
                  (dígitos monoespaciados) solo cambia el número: el botón no se
                  agranda ni achica y el footer nunca se mueve. 17rem cubre el
                  texto más largo esperable ("Ver 10000 resultados"). */}
              <button
                type="button"
                onClick={handleApply}
                style={{ background: 'var(--gradient-brand)' }}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-bold whitespace-nowrap text-white tabular-nums shadow-[0_10px_24px_-8px_rgba(6,57,35,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98] sm:w-68"
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
  icon: Icon, label, children,
}: {
  icon: React.ElementType; label: string; children: React.ReactNode;
}) {
  // Encabezado de sub-sección con el lenguaje de la Landing: ícono en verde de
  // marca sobre pastilla clara + texto en negro (`ink-900`). Antes era todo gris
  // chico en mayúsculas y se perdía.
  // El espaciado entre secciones lo da el `gap-y` de la grilla de 2 columnas.
  // Cada grupo va dentro de su propia tarjeta clara: así las 4 secciones se leen
  // como bloques separados en vez de una sopa de inputs sueltos, y los controles
  // (que son BLANCOS) ganan contraste contra el fondo de la tarjeta.
  //
  // `surface-mint` y no `ink-100`: es el mismo verde de sección que usan el
  // catálogo y el detalle, así el modal se lee como parte de ese sistema y no
  // como un cuadro gris aparte.
  return (
    <div className="rounded-2xl border border-brand-700/10 bg-surface-mint p-5">
      <h3 className="mb-3.5 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-700/10 text-brand-700">
          <Icon size={15} />
        </span>
        <span className="text-sm font-bold tracking-tight text-ink-950">{label}</span>
        <span className="ml-1 h-px flex-1 bg-ink-200/70" />
      </h3>
      {children}
    </div>
  );
}

const inputBase =
  'h-11 w-full rounded-xl border border-ink-200 bg-white pr-3 text-sm text-ink-900 outline-none transition-all duration-200 placeholder:text-ink-400 hover:border-brand-700/40 focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10';

function IconNumber({
  icon: Icon, placeholder, value, onChange, ariaLabel,
}: {
  icon: React.ElementType; placeholder: string; value: string; onChange: (v: string) => void; ariaLabel?: string;
}) {
  return (
    <div className="relative">
      <Icon size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-700" />
      <input
        type="number" min="0" inputMode="numeric"
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={`${inputBase} pl-10`}
      />
    </div>
  );
}

/**
 * Dropdown custom del modal (reemplaza al `<select>` nativo).
 *
 * Antes era `LocationDropdown` y solo servía para los tres campos de ubicación
 * (opciones `string[]`, ícono `MapPin` fijo). Se generalizó a opciones
 * `{ value, label }` + ícono configurable para que el select de tipo de
 * propiedad — que usaba el `<select>` nativo del navegador y desentonaba —
 * pueda usar exactamente el mismo componente.
 */
function Dropdown({
  label, placeholder, value, options, icon: Icon = MapPin, isOpen, onToggle, onSelect, onClose,
}: {
  label: string; placeholder: string; value?: string;
  options: { value: string; label: string }[];
  icon?: React.ElementType;
  isOpen: boolean; onToggle: () => void; onSelect: (v: string | undefined) => void; onClose: () => void;
}) {
  const selectedLabel = options.find((o) => o.value === value)?.label;
  const containerRef = useRef<HTMLDivElement>(null);

  // Click afuera → cerrar. Solo cierra el panel: NO toca la selección, así el
  // valor ya elegido se conserva (antes el dropdown quedaba abierto para
  // siempre hasta volver a hacer click en su propio botón).
  // Se escucha `mousedown` y no `click` para que cierre antes de que el click
  // llegue a otro elemento; el botón de toggle está DENTRO del contenedor, así
  // que sigue siendo `onToggle` quien maneja el cierre al clickearlo.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-expanded={isOpen}
        className={`${inputBase} flex cursor-pointer items-center gap-2 pl-10 text-left`}
      >
        <Icon size={16} className="pointer-events-none absolute left-3.5 text-brand-700" />
        <span className={`truncate ${selectedLabel ? 'text-ink-900' : 'text-ink-400'}`}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`ml-auto shrink-0 text-ink-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
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
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-brand-50 hover:text-brand-700 ${
                opt.value === value ? 'bg-brand-50 text-brand-700' : 'text-ink-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FiltersModal;
