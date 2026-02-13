'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { FiltersPanel } from './FiltersPanel ';
import { SearchBar } from './SearchBar';

export const HeaderSearch = () => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-10">
      {/* BOTÓN DISPARADOR: Alineado a la derecha como en tu imagen */}
      <div className="flex justify-center items-center gap-5 mb-6 ">
        <SearchBar/>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 h-12 px-7 rounded-xl transition-all duration-400 font-bold shadow-sm
            ${showFilters 
              ? 'bg-[#0b7a4b] text-white hover:bg-[#085031]' 
              : 'bg-[#0b7a4b] text-white hover:bg-[#085031] shadow-green-900/10'
            }`}
        >
          {showFilters ? <X size={20} /> : <SlidersHorizontal size={20} />}
          <span>{showFilters ? 'Cerrar' : 'Filtros'}</span>
        </button>
      </div>

      {/* PANEL ÚNICO: Aquí adentro vive la SearchBar y los filtros */}
      <div className={`overflow-hidden transition-all duration-700 ease-in-out ${
        showFilters ? 'max-h-300 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
      }`}>
        <FiltersPanel />
      </div>
    </div>
  );
};