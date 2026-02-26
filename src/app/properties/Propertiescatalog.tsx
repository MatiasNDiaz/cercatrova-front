'use client';

import { useEffect, useState, useRef } from 'react';
import { LayoutGrid, List, SlidersHorizontal, X, Search, Bed, Toilet, Hourglass, Maximize, MapPin, Heart } from 'lucide-react';
import { BsWhatsapp } from 'react-icons/bs';
import Image from 'next/image';
import Link from 'next/link';
import { usePropertyFilters } from '@/modules/properties/hooks/usePropertyFilters';
import { propertiesService } from '@/modules/properties/services/properties.service';
import { PropertyCard } from '@/modules/properties/components/PropertyCard';
import { SearchBar } from '@/modules/properties/components/SearchBar';
import FiltersPanel from '@/modules/properties/components/FiltersPanel ';
import { Property } from '@/modules/properties/interfaces/propertyInterface';

interface Props {
  initialItems: Property[];
  initialTotal: number;
}

type ViewMode = 'grid' | 'list';

export default function PropertiesCatalog({ initialItems, initialTotal }: Props) {
  const { filters, setFilters } = usePropertyFilters();
  const [items, setItems] = useState<Property[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const isFirstRender = useRef(true);

  // ── FETCH cuando cambian los filtros ──────────────────────────────────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await propertiesService.getFilteredProperties(filters);
        setItems(response?.data || []);
        setTotal(response?.meta?.totalItems || 0);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // ── PAGINACIÓN ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(total / (filters.limit || 12));
  const currentPage = filters.page || 1;

  const goToPage = (page: number) => {
    setFilters({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 pt-28 pb-10">

      {/* ── HEADER ── */}
      <div className="mb-6">
        <span className="text-sm tracking-widest uppercase text-[#0b7a4b] font-medium">
          Catálogo
        </span>
        <h1 className="text-4xl md:text-5xl font-semibold mt-2 text-gray-900">
          Encontrá tu próxima <span className="text-[#0b7a4b]">propiedad.</span>
        </h1>
      </div>

      {/* ── BARRA DE BÚSQUEDA + CONTROLES ── */}
      <div className="flex items-center gap-3 mb-4 w-full">
        <div className="flex-1">
          <SearchBar />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 h-12 px-6 rounded-full font-bold transition-all duration-300 shadow-sm bg-[#0b7a4b] text-white hover:bg-[#085031] shrink-0"
        >
          {showFilters ? <X size={18} /> : <SlidersHorizontal size={18} />}
          <span className="hidden sm:inline">{showFilters ? 'Cerrar' : 'Filtros'}</span>
        </button>

        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-full transition-all duration-200 ${
              viewMode === 'grid'
                ? 'bg-[#0b7a4b] text-white shadow'
                : 'text-gray-400 hover:text-[#0b7a4b]'
            }`}
            aria-label="Vista grilla"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-full transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-[#0b7a4b] text-white shadow'
                : 'text-gray-400 hover:text-[#0b7a4b]'
            }`}
            aria-label="Vista lista"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* ── PANEL DE FILTROS ── */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          showFilters ? 'max-h-225 opacity-100 mb-8' : 'max-h-0 opacity-0'
        }`}
      >
        <FiltersPanel />
      </div>

      {/* ── RESULTADOS META ── */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500 font-medium">
          {loading ? 'Buscando...' : (
            <>
              <span className="text-[#0b7a4b] font-bold">{total}</span>{' '}
              {total === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
            </>
          )}
        </p>
        <p className="text-sm text-gray-600 mr-4">
          Página {currentPage} de {totalPages || 1}
        </p>
      </div>

      {/* ── GRID / LIST ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl bg-white/60 animate-pulse h-96" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Search size={48} className="text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">
            No encontramos propiedades
          </h3>
          <p className="text-gray-400 text-sm max-w-sm">
            Probá ajustando los filtros o buscando con otros términos.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div id="propiedades" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      ) : (
        <div id="propiedades" className="flex flex-col gap-6">
          {items.map((prop) => (
            <PropertyCardList key={prop.id} property={prop} />
          ))}
        </div>
      )}

      {/* ── PAGINACIÓN ── */}
      {totalPages > 1 && !loading && (
        <div className="flex justify-center items-center gap-2 mt-12">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-full text-sm font-bold border border-gray-200 text-gray-500 hover:border-[#0b7a4b] hover:text-[#0b7a4b] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p as number)}
                  className={`w-10 h-10 rounded-full text-sm font-bold transition-all duration-200 ${
                    currentPage === p
                      ? 'bg-[#0b7a4b] text-white shadow-md'
                      : 'border border-gray-200 text-gray-500 hover:border-[#0b7a4b] hover:text-[#0b7a4b]'
                  }`}
                >
                  {p}
                </button>
              )
            )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-full text-sm font-bold border border-gray-200 text-gray-500 hover:border-[#0b7a4b] hover:text-[#0b7a4b] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

// ── PROPERTY CARD LISTA (versión horizontal con Botón de Consulta) ────────────────
function PropertyCardList({ property }: { property: Property }) {
  const {
    id, title, price, rooms, bathrooms, m2, localidad, barrio,
    images, typeOfProperty, operationType, antiquity,
  } = property;

  const coverImage =
    images?.find((img) => img.isCover)?.url ||
    images?.[0]?.url ||
    '/placeholder-house.jpg';

  const whatsappMsg = encodeURIComponent(
    `Hola! Estoy interesado en la propiedad: "${title}" (Propiedad número: ${id}). ¿Podría darme más información?`
  );

  return (
    <div className="group relative flex bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgba(11,122,75,0.15)] border border-transparent hover:border-[#0b7a4b]/30 transition-all duration-300 h-74">

      {/* ── LINK que envuelve imagen + contenido (Parte Izquierda) ── */}
      <Link href={`/properties/${id}`} className="flex flex-1 overflow-hidden">
        
        <div className="relative w-56 sm:w-82 shrink-0 overflow-hidden">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <span className="absolute top-3 left-3 bg-[#179144] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            {operationType}
          </span>
        </div>

        <div className="flex flex-col justify-between p-6 flex-1">
          <div>
            <span className="text-[#0b7a4b] text-xs font-semibold uppercase tracking-wider">
              {typeOfProperty?.name}
            </span>
            <h3 className="text-lg font-semibold text-gray-800 mt-1 group-hover:text-[#0b7a4b] transition-colors line-clamp-1">
              {title}
            </h3>
            <div className="flex items-center text-gray-500 text-sm mt-1">
              <MapPin size={14} className="mr-1 text-[#0b7a4b]" />
              {localidad}, {barrio}
            </div>
          </div>

          <div className="flex gap-3 mt-4 flex-wrap">
            {[
              { icon: Bed, value: rooms, label: 'Hab.' },
              { icon: Toilet, value: bathrooms, label: 'Baños' },
              { icon: Hourglass, value: antiquity, label: 'Años' },
              { icon: Maximize, value: `${m2} m²`, label: 'Sup.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-1.5 bg-[#0b7a4b]/10 px-3 py-1.5 rounded-xl">
                  <Icon size={14} className="text-[#0b7a4b]" />
                  <span className="text-xs font-semibold text-[#0b7a4b]">{item.value}</span>
                  <span className="text-[10px] text-gray-400 uppercase">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Link>

      {/* ── SECCIÓN DE ACCIÓN (Derecha) ── */}
      <div className="flex flex-col items-start justify-between p-6 pb-5 shrink-0 bg-gray-50   border-gray-100 w-55">
        <div className="text-start">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Precio</p>
          <p className="text-2xl font-black text-[#0b7a4b]">
            {price.toLocaleString()} <span className="text-sm font-medium">USD</span>
          </p>
        </div>

        <a
          href={`https://wa.me/543513872817?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-8 py-2 bg-[#0b7a4b] hover:bg-[#169e65] text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95"
        >
          <BsWhatsapp size={16} />
          Contactar
        </a>
      </div>

      {/* ── Favorito (FUERA del Link para evitar conflictos) ── */}
      <button
        aria-label="favorito"
        className="absolute top-4 right-62 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm text-gray-400 hover:text-red-500 transition-all"
      >
        <Heart size={18} />
      </button>
    </div>
  );
}