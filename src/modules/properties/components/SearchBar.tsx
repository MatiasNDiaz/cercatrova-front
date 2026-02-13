'use client';

import { useState, useEffect } from 'react';
import { usePropertyFilters } from '../hooks/usePropertyFilters';
import { Search, X } from 'lucide-react'; // Usamos lucide-react para los iconos

export const SearchBar = () => {
  const { filters, setFilters } = usePropertyFilters();
  
  // Estado local para que el input sea fluido (sin lag)
  const [inputValue, setInputValue] = useState(filters.search || '');

  // =========================================================
  // --- LÓGICA DE DEBOUNCE ---
  // =========================================================
  useEffect(() => {
    // Si el valor del input es igual al que ya está en la URL, no hacemos nada
    if (inputValue === filters.search) return;

    // Esperamos 500ms después de que el usuario deja de escribir
    const timer = setTimeout(() => {
      setFilters({ search: inputValue });
    }, 600);

    return () => clearTimeout(timer); // Limpiamos el timer si el usuario sigue escribiendo
  }, [inputValue, setFilters, filters.search]);

  // Sincronizar el input si la URL cambia (por ejemplo, al limpiar filtros)
  useEffect(() => {
    setInputValue(filters.search || '');
  }, [filters.search]);

  return (
    <div className="relative w-full mt-6 max-w-2xl ">
      <div className="relative flex items-center  w-full h-12 rounded-lg focus-within:shadow-lg bg-white overflow-hidden border border-[#0b7a4b]">
        <div className="grid place-items-center h-full w-12 text-gray-300">
          <Search size={20}  className='text-[#0e925b]'/>
        </div>

        <input
          className="peer h-full w-full outline-none text-sm text-gray-700 pr-2"
          type="text"
          id="search"
          placeholder="Busca por zona, tipo de propiedad, 'con patio'..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />

        {inputValue && (
          <button 
          aria-label='a'
            onClick={() => setInputValue('')}
            className="grid place-items-center h-full w-12 text-gray-600 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      <p className="mt-2 text-xs text-white px-1">
        Prueba con: <span className="italic text-blue-300 cursor-pointer" onClick={() => setInputValue('departamento en mina clavero')}>departamento en mina clavero</span>
      </p>
    </div>
  );
};