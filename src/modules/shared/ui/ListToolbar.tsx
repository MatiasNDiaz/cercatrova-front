'use client';

import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Barra de filtros compartida de los listados del dashboard.
 *
 * Unifica el patrón que ya funcionaba bien en Propiedades (admin) y en Mis
 * Solicitudes (usuario) — buscador a la izquierda ocupando el ancho sobrante,
 * selects de orden/estado a la derecha — y lo deja disponible para el resto de
 * los listados, que no tenían ningún filtro.
 *
 * ⚠️ No filtra nada por su cuenta: es presentación pura. Cada página sigue
 * decidiendo cómo filtra su propia lista (todas lo hacen en cliente, sobre los
 * datos que ya trajeron; ninguna cambia su fetch por esto).
 */

export function ListToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">{children}</div>
  );
}

/** Buscador de texto libre. Ocupa el espacio sobrante de la fila. */
export function ListSearch({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  /** Para lectores de pantalla; por defecto usa el placeholder. */
  label?: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search size={15} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="h-12 w-full rounded-xl border border-ink-200 bg-white pr-10 pl-11 text-sm text-ink-900 transition-all duration-200 placeholder:text-gray-400 hover:border-brand-700/40 focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10 focus:outline-none"
      />
      {/* Limpiar: aparece recién cuando hay texto, para no ocupar lugar vacío. */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors duration-200 hover:bg-ink-100 hover:text-ink-700"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * Select de orden/estado. Mismo alto y radio que el buscador para que la fila
 * quede pareja — antes cada página los dimensionaba distinto.
 */
export function ListSelect({
  value,
  onChange,
  label,
  icon: Icon,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  icon?: React.ElementType;
  children: ReactNode;
}) {
  return (
    <div className="relative shrink-0">
      {Icon && (
        <Icon size={15} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-brand-700" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`h-12 w-full cursor-pointer appearance-none rounded-xl border border-ink-200 bg-white pr-9 text-sm font-semibold text-ink-700 transition-all duration-200 hover:border-brand-700/40 focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10 focus:outline-none lg:w-56 ${
          Icon ? 'pl-11' : 'pl-4'
        }`}
      >
        {children}
      </select>
      {/* Flecha propia: `appearance-none` saca la nativa y sin esto el select
          se queda sin ninguna indicación de que despliega. */}
      <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-400">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

/**
 * Grupo de pastillas para filtrar por estado/categoría.
 * Alternativa al select cuando las opciones son pocas y conviene verlas todas.
 */
export function ListChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 ${
              active
                ? 'border-brand-700 bg-brand-700 text-white shadow-[0_4px_12px_-4px_rgba(11,122,75,0.55)]'
                : 'border-ink-200 bg-white text-ink-600 hover:border-brand-700/40 hover:text-brand-700'
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                  active ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Estado "no hay coincidencias" — distinto del "todavía no hay nada". */
export function NoMatches({ onClear, message }: { onClear: () => void; message?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-ink-100 bg-white px-6 py-16 text-center shadow-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700/10 text-brand-700">
        <Search size={24} />
      </span>
      <div>
        <p className="font-bold text-ink-800">Ningún resultado coincide</p>
        <p className="mt-1 text-sm text-gray-500">
          {message ?? 'Probá con otro término de búsqueda o cambiá los filtros.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-bold text-brand-700 transition-all duration-200 hover:border-brand-700/40 hover:bg-brand-700/8"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
