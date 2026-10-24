'use client';

import { useEffect, useId, useState } from 'react';
import { Info, Loader2, TrendingDown, TrendingUp, Users } from 'lucide-react';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { fmt } from './charts';
import type { StatsRange, VisitorsSummary } from '../types';

const RANGE_OPTIONS: { value: StatsRange; label: string }[] = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

/** Etiqueta mientras carga (después manda la que devuelve el backend). */
const PERIOD_FALLBACK: Record<StatsRange, string> = {
  day: 'Hoy',
  week: 'Últimos 7 días',
  month: 'Últimos 30 días',
};

const oneDecimal = (n: number) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * "X personas visitaron Cerca Trova" — reemplaza al KPI "Visitas 1.287 —
 * 414 únicos", que no dejaba claro qué era cada número.
 *
 * El dato grande son las PERSONAS (visitantes distintos en todo el período);
 * abajo, las páginas vistas y cuántas por persona. Tiene su propio selector
 * Día / Semana / Mes (arranca en el rango de la página y lo sigue si cambia).
 * Criterio de conteo: `CercaTrova-Back/src/modules/statistics/visitors.ts`.
 */
export function VisitorsCard({ range: pageRange }: { range: StatsRange }) {
  const [range, setRange] = useState<StatsRange>(pageRange);
  const [data, setData] = useState<VisitorsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Si cambia el selector general de la página, la tarjeta lo sigue.
  const [lastPageRange, setLastPageRange] = useState(pageRange);
  if (pageRange !== lastPageRange) {
    setLastPageRange(pageRange);
    setRange(pageRange);
  }

  useEffect(() => {
    let alive = true;
    api
      .get<VisitorsSummary>('/statistics/visitors', { params: { range } })
      .then(({ data }) => { if (alive) { setData(data); setError(null); } })
      .catch((e) => { if (alive) setError(getErrorMessage(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [range]);

  const changeRange = (r: StatsRange) => {
    if (r === range) return;
    setLoading(true);
    setRange(r);
  };

  const shown = data?.range === range ? data : null;
  const people = shown?.uniqueVisitors ?? 0;

  return (
    <section
      aria-labelledby="visitors-card-title"
      aria-busy={loading}
      className="relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b7a4b]/10 text-[#0b7a4b]">
            <Users size={18} />
          </span>
          <div>
            <h2
              id="visitors-card-title"
              className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-gray-500 uppercase"
            >
              Visitantes
              <InfoTip />
            </h2>
            <p className="text-sm font-bold text-[#0b7a4b]">
              {shown?.period.label ?? PERIOD_FALLBACK[range]}
            </p>
          </div>
        </div>

        <div role="group" aria-label="Período" className="flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/60 p-1">
          {RANGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={range === o.value}
              onClick={() => changeRange(o.value)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                range === o.value
                  ? 'bg-[#0b7a4b] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b]'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {error && !shown ? (
        <p className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
          No se pudieron cargar los visitantes: {error}
        </p>
      ) : !shown ? (
        <div className="mt-5 flex items-center gap-2 py-6 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Calculando…
        </div>
      ) : (
        <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-4xl leading-none font-bold text-gray-900">{fmt(people)}</span>
            <span className="text-sm font-semibold text-gray-700">
              {people === 1 ? 'persona visitó' : 'personas visitaron'} Cerca Trova
            </span>
          </p>

          <Change pct={shown.change.uniqueVisitors} previous={shown.previous} current={people} />

          <div className="mt-4 grid gap-2 border-t border-gray-100 pt-4 sm:grid-cols-2">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-gray-900">{fmt(shown.pageViews)}</span>{' '}
              {shown.pageViews === 1 ? 'página vista' : 'páginas vistas'} en total
            </p>
            <p className="text-sm text-gray-600">
              {shown.pagesPerVisitor != null ? (
                <>
                  ≈ <span className="font-bold text-gray-900">{oneDecimal(shown.pagesPerVisitor)}</span>{' '}
                  páginas vistas por persona
                </>
              ) : (
                'Sin visitas para promediar'
              )}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/** "↑ 12% respecto de la semana pasada": verde si sube, rojo si baja. */
function Change({
  pct, previous, current,
}: {
  pct: number | null;
  previous: VisitorsSummary['previous'];
  current: number;
}) {
  if (pct == null) {
    // Período anterior en 0: un porcentaje no tendría sentido.
    if (current === 0) return null;
    return (
      <p className="mt-2 text-xs text-gray-500">
        Sin visitas en {previous.label} para comparar.
      </p>
    );
  }
  if (pct === 0) {
    return <p className="mt-2 text-xs font-semibold text-gray-500">= Igual que {previous.label}</p>;
  }
  const up = pct > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <p
      className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
      }`}
      title={`${fmt(previous.uniqueVisitors)} personas en ${previous.label}`}
    >
      <Icon size={13} aria-hidden />
      {up ? '↑' : '↓'} {Math.abs(pct)}% respecto de {previous.label}
    </p>
  );
}

/**
 * ⓘ con la explicación. Se abre con el cursor, con el foco del teclado y con
 * un toque (celular, donde no hay hover); Escape lo cierra.
 */
function InfoTip() {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    // En celular el globo se ubica respecto de la TARJETA (ocupa su ancho,
    // debajo del encabezado); desde `sm`, pegado al ícono.
    <span className="group/tip inline-flex normal-case sm:relative">
      <button
        type="button"
        aria-label="Qué significa cada número"
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        className="flex cursor-pointer items-center rounded-full text-gray-400 transition-colors hover:text-[#0b7a4b] focus-visible:text-[#0b7a4b] focus-visible:outline-none"
      >
        <Info size={14} />
      </button>
      <span
        id={id}
        role="tooltip"
        className={`absolute inset-x-4 top-[4.25rem] z-20 rounded-xl sm:inset-x-auto sm:top-6 sm:left-0 sm:w-72 border border-gray-100 bg-white p-3.5 text-left text-xs leading-relaxed font-normal tracking-normal text-gray-600 shadow-lg transition-opacity duration-150 group-hover/tip:visible group-hover/tip:opacity-100 group-focus-within/tip:visible group-focus-within/tip:opacity-100 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <strong className="text-gray-900">Personas:</strong> cuántos visitantes distintos entraron
        al sitio. Si alguien entra 5 veces, cuenta como 1.
        <br />
        <strong className="text-gray-900">Páginas vistas:</strong> cuántas veces se abrió alguna
        página del sitio en total, contando cada visita.
        <span className="mt-2 block border-t border-gray-100 pt-2 text-[11px] text-gray-500">
          No cuentan el equipo de Cerca Trova, los bots ni las recargas de la misma página
          dentro de los 30 minutos.
        </span>
      </span>
    </span>
  );
}

export default VisitorsCard;
