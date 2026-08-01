'use client';

/**
 * Piezas de gráfico reutilizables de la página de estadísticas.
 *
 * Criterio fijo, igual para todas las secciones:
 *   • Torta  → cuando el dato es una PROPORCIÓN (venta vs alquiler, tipos).
 *   • Barra  → cuando el dato es un RANKING (zonas, propiedades más guardadas).
 *   • Todo gráfico va acompañado de los números concretos (al lado en la torta,
 *     abajo en las barras). El gráfico solo no alcanza para tomar decisiones.
 */

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import Image from 'next/image';
import Link from 'next/link';
import { Info, ImageOff } from 'lucide-react';
import { useIsNarrow } from '@/modules/shared/hooks/useMediaQuery';
import type { StatRow, PropertyRankRow } from '../types';

/** Paleta derivada del verde de marca, de más oscuro a más claro. */
export const CHART_COLORS = [
  '#0b7a4b', '#14a366', '#0f8b57', '#5cc98f',
  '#065f3c', '#86dcae', '#03301e', '#a7e8c6',
];

const nf = new Intl.NumberFormat('es-AR');
export const fmt = (n: number) => nf.format(n);

// ── Contenedor de sección ─────────────────────────────────────────────────────
export function ChartCard({
  title, subtitle, note, children,
}: {
  title: string;
  subtitle?: string;
  /** Aclaración destacada (ej. "ranking histórico"). */
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>

      {note && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
          <Info size={14} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-800">{note}</p>
        </div>
      )}

      {children}
    </section>
  );
}

// ── Estado vacío ──────────────────────────────────────────────────────────────
export function NoData({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-10 text-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// ── Torta + números al costado ────────────────────────────────────────────────
export function PieStat({
  data, unit = '', emptyMessage = 'Todavía no hay datos en este rango.',
}: {
  data: StatRow[];
  /** Palabra que acompaña al número, ej. "búsquedas". */
  unit?: string;
  emptyMessage?: string;
}) {
  const rows = data.filter(d => d.count > 0);
  if (rows.length === 0) return <NoData message={emptyMessage} />;

  const total = rows.reduce((a, r) => a + r.count, 0);

  return (
    <div className="flex flex-col items-center gap-5 lg:flex-row">
      <div className="h-56 w-full lg:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="count"
              nameKey="label"
              innerRadius="52%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
            >
              {rows.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, name) => [`${fmt(Number(v ?? 0))} ${unit}`.trim(), String(name ?? '')]}
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Números concretos al costado de la torta */}
      <ul className="w-full space-y-2 lg:w-1/2">
        {rows.map((r, i) => (
          <li key={r.label} className="flex items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="flex-1 truncate text-sm text-gray-700">{r.label}</span>
            <span className="shrink-0 text-sm font-bold text-gray-900">{fmt(r.count)}</span>
            <span className="w-12 shrink-0 text-right text-xs font-semibold text-gray-500">
              {r.percentage}%
            </span>
          </li>
        ))}
        <li className="flex items-center gap-3 border-t border-gray-100 pt-2">
          <span className="h-3 w-3 shrink-0" />
          <span className="flex-1 text-sm font-semibold text-gray-500">Total</span>
          <span className="shrink-0 text-sm font-bold text-[#0b7a4b]">{fmt(total)}</span>
          <span className="w-12 shrink-0" />
        </li>
      </ul>
    </div>
  );
}

// ── Barras horizontales + números abajo ───────────────────────────────────────
export function BarStat({
  data, unit = '', emptyMessage = 'Todavía no hay datos en este rango.', showPercentage = true,
}: {
  data: StatRow[];
  unit?: string;
  emptyMessage?: string;
  /**
   * En "extras" el porcentaje es sobre el total de búsquedas (una búsqueda
   * puede pedir varios extras), así que la suma pasa de 100 — ahí se muestra
   * igual, pero conviene poder apagarlo donde no aporta.
   */
  showPercentage?: boolean;
}) {
  const rows = data.filter(d => d.count > 0);
  // El eje Y de Recharts se dimensiona en píxeles, no con clases: a 375px de
  // ancho un eje de 140px se comía casi la mitad del gráfico y las barras
  // quedaban en ~140px. En mobile se achica el eje y se baja un punto la
  // tipografía; los valores exactos igual están en la lista de abajo.
  const narrow = useIsNarrow();
  if (rows.length === 0) return <NoData message={emptyMessage} />;

  return (
    <div className="flex flex-col gap-4">
      <div style={{ height: Math.max(140, rows.length * 34) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 24 }}>
            <CartesianGrid horizontal={false} stroke="#f1f5f4" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={narrow ? 96 : 140}
              tick={{ fontSize: narrow ? 10 : 11, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#0b7a4b0d' }}
              formatter={(v) => [`${fmt(Number(v ?? 0))} ${unit}`.trim(), 'Cantidad']}
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {rows.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Números concretos abajo del gráfico */}
      <ul className="divide-y divide-gray-50 rounded-xl border border-gray-100">
        {rows.map((r, i) => (
          <li key={r.label} className="flex items-center gap-3 px-3 py-2">
            <span className="w-5 shrink-0 text-xs font-bold text-gray-400">{i + 1}</span>
            <span className="flex-1 truncate text-sm text-gray-700">{r.label}</span>
            <span className="shrink-0 text-sm font-bold text-gray-900">
              {fmt(r.count)} <span className="text-xs font-medium text-gray-400">{unit}</span>
            </span>
            {showPercentage && (
              <span className="w-12 shrink-0 text-right text-xs font-semibold text-gray-500">
                {r.percentage}%
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Ranking de propiedades: barras + lista con imagen y link ──────────────────
export function PropertyRankStat({
  data, unit, emptyMessage, extra,
}: {
  data: PropertyRankRow[];
  unit: string;
  emptyMessage: string;
  /** Segunda métrica a mostrar por fila (promedio de estrellas, únicos…). */
  extra?: (row: PropertyRankRow) => string | null;
}) {
  // El eje Y de Recharts se mide en píxeles, no con clases de Tailwind: a
  // 375px de ancho un eje de 170px se llevaba más de la mitad del gráfico y las
  // barras quedaban ilegibles. En mobile se achica el eje, se baja un punto la
  // tipografía y se recorta más el título. El dato exacto no se pierde: la
  // lista de abajo muestra el título completo y el número.
  const narrow = useIsNarrow();
  const maxLabel = narrow ? 16 : 26;

  if (data.length === 0) return <NoData message={emptyMessage} />;

  // Títulos largos rompen el eje: se recortan solo para el gráfico.
  const chartData = data.map(d => ({
    ...d,
    label: d.title.length > maxLabel ? `${d.title.slice(0, maxLabel - 1)}…` : d.title,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div style={{ height: Math.max(140, data.length * 34) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 24 }}>
            <CartesianGrid horizontal={false} stroke="#f1f5f4" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={narrow ? 104 : 170}
              tick={{ fontSize: narrow ? 10 : 11, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#0b7a4b0d' }}
              formatter={(v) => [`${fmt(Number(v ?? 0))} ${unit}`, 'Cantidad']}
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detalle con imagen y link a la propiedad real */}
      <ul className="divide-y divide-gray-50 rounded-xl border border-gray-100">
        {data.map((p, i) => {
          const extraText = extra?.(p);
          return (
            <li key={p.propertyId} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-5 shrink-0 text-xs font-bold text-gray-400">{i + 1}</span>
              <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt={p.title} fill sizes="56px" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <ImageOff size={14} className="text-gray-400" />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <Link
                  href={`/properties/${p.propertyId}`}
                  className="block truncate text-sm font-semibold text-gray-800 transition-colors hover:text-[#0b7a4b]"
                >
                  {p.title}
                </Link>
                <span className="block truncate text-xs text-gray-400">
                  {p.localidad || 'Sin localidad'}
                  {extraText ? ` · ${extraText}` : ''}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-gray-900">
                {fmt(p.count)} <span className="text-xs font-medium text-gray-400">{unit}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Serie de tráfico por día ──────────────────────────────────────────────────
export function TrafficChart({
  data,
}: {
  data: { dia: string; visitas: number; unicos: number }[];
}) {
  if (data.length === 0) return <NoData message="Todavía no hay visitas registradas en este rango." />;

  const fmtDia = (d: unknown) =>
    new Date(String(d)).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });

  return (
    <div className="flex flex-col gap-4">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="gradVisitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0b7a4b" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#0b7a4b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f4" vertical={false} />
            <XAxis
              dataKey="dia"
              tickFormatter={fmtDia}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              labelFormatter={fmtDia}
              formatter={(v, name) => [fmt(Number(v ?? 0)), name === 'visitas' ? 'Visitas' : 'Únicos']}
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Area type="monotone" dataKey="visitas" stroke="#0b7a4b" strokeWidth={2} fill="url(#gradVisitas)" />
            <Area type="monotone" dataKey="unicos" stroke="#5cc98f" strokeWidth={2} fill="transparent" strokeDasharray="4 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-5 px-1 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-[#0b7a4b]" /> Visitas totales
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-[#5cc98f]" /> Visitantes únicos
        </span>
      </div>
    </div>
  );
}
