'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import FiltersPanel from './FiltersPanel '; 
import { SearchBar } from './SearchBar';

export const HeaderSearch = () => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-10">
      
      {/* SEARCH + BOTÓN FILTROS */}
      <div className="flex items-center gap-3 mb-6 w-full">
        
        {/* SEARCH BAR */}
        <div className="flex-1">
          <SearchBar />
        </div>

        {/* BOTÓN FILTROS */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-3 h-12 px-7 py-6  rounded-4xl font-bold transition-all duration-300 shadow-sm
            bg-[#0b7a4b] text-white hover:bg-[#085031]
          `}
        >
          {showFilters ? <X size={20} /> : <SlidersHorizontal size={20} />}
          <span>{showFilters ? 'Cerrar' : 'Filtros'}</span>
        </button>
      </div>

      {/* PANEL DE FILTROS */}
      <div
        className={`overflow-hidden transition-all duration-700 ease-in-out
          ${showFilters ? 'max-h-300 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}
        `}
      >
        <FiltersPanel />
      </div>

    </div>
  );
};