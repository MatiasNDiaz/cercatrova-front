'use client';

/**
 * Estadísticas del admin — Fase 4.
 *
 * UN SOLO fetch: `GET /statistics?range=` ya devuelve las 11 secciones juntas
 * (ver `overview()` en el backend), así que no se piden 11 endpoints por
 * separado. Cambiar el rango vuelve a pedir ese único endpoint.
 */

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/modules/shared/lib/axios';
import { getErrorMessage } from '@/modules/shared/lib/apiError';
import { useUrlFilter } from '@/modules/shared/hooks/useUrlFilter';
import { BarChart3, Loader2, RefreshCw, Users, Eye,
  Timer, Building2, ClipboardList, Search, AlertCircle
} from 'lucide-react';
import {
  ChartCard, PieStat, BarStat, PropertyRankStat, TrafficChart, NoData, fmt
} from '@/modules/statistics/components/charts';
import { RANGE_LABELS, type StatisticsOverview, type StatsRange } from '@/modules/statistics/types';

import { DashboardBackLink } from '@/modules/shared/ui/DashboardBackLink';
import { DashboardPage } from '@/modules/shared/ui/DashboardPage';
const RANGES: StatsRange[] = ['day', 'week', 'month'];

/**
 * Texto que se muestra en las secciones con `rangeApplies: false`.
 * Favoritos y Valoraciones salen de tablas sin columna de fecha, así que el
 * selector de arriba no las filtra — se aclara explícitamente para que no
 * parezca que el filtro está roto.
 */
const HISTORICAL_NOTE =
  'Este ranking es histórico: incluye todo lo acumulado desde el inicio. El selector de día / semana / mes de arriba no aplica acá, porque el registro de origen no guarda la fecha en que se hizo la acción. No es un error del filtro.';

export default function EstadisticasPage() {
  // El rango vive en la URL, igual que el resto de los filtros del dashboard.
  const [range, setRange] = useUrlFilter<StatsRange>('rango', 'month');
  const [data, setData] = useState<StatisticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (r: StatsRange, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<StatisticsOverview>('/statistics', { params: { range: r } });
      setData(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  const refresh = async () => {
    await load(range, true);
    toast.success('Estadísticas actualizadas');
  };

  return (
    <DashboardPage>
      <DashboardBackLink href="/dashboardAdmin" />

      {/* ── Header + selector de rango ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b7a4b]/10 text-[#0b7a4b]">
            <BarChart3 size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[#0b7a4b]">Estadísticas</h1>
            <p className="mt-0.5 text-sm text-gray-600">
              Qué buscan los usuarios, qué hay cargado y cómo se mueve el sitio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-gray-100 bg-white p-1">
            {RANGES.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`cursor-pointer rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  range === r
                    ? 'bg-[#0b7a4b] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-[#0b7a4b]/8 hover:text-[#0b7a4b]'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            aria-label="Actualizar"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-500 transition-all hover:text-[#0b7a4b] disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-32 text-gray-500">
          <Loader2 size={18} className="animate-spin" /> Calculando estadísticas…
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-bold text-red-700">No se pudieron cargar las estadísticas</p>
            <p className="mt-0.5 text-xs text-red-600">{error}</p>
          </div>
        </div>
      ) : data ? (
        <Contenido data={data} />
      ) : null}
    </DashboardPage>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
function Contenido({ data }: { data: StatisticsOverview }) {
  const {
    busquedas, operacion, favoritas, comentadas, valoradas,
    visitadas, trafico, registros, solicitudes, tiempo, inventario
  } = data;

  const rangoLabel = RANGE_LABELS[data.range].toLowerCase();
  const sinBusquedas = busquedas.totalBusquedas === 0;

  const mmss = (s: number) =>
    s >= 60 ? `${Math.floor(s / 60)} min ${s % 60}s` : `${s}s`;

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={Eye}           label="Visitas"            value={fmt(trafico.totalVisitas)}     hint={`${fmt(trafico.visitantesUnicos)} únicos`} />
        <Kpi icon={Timer}         label="Tiempo promedio"    value={mmss(tiempo.promedioSegundos)} hint={`${fmt(tiempo.muestras)} mediciones`} />
        <Kpi icon={Search}        label="Búsquedas"          value={fmt(busquedas.totalBusquedas)} hint={rangoLabel} />
        <Kpi icon={Users}         label="Registros"          value={fmt(registros.total)}          hint={rangoLabel} />
        <Kpi icon={ClipboardList} label="Solicitudes"        value={fmt(solicitudes.total)}        hint={rangoLabel} />
        <Kpi icon={Building2}     label="Propiedades nuevas" value={fmt(inventario.totalEnRango)}  hint={`${fmt(inventario.totalHistorico)} en total`} />
      </div>

      {sinBusquedas && (
        <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4">
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-gray-400" />
          <p className="text-sm text-gray-600">
            No se registraron búsquedas en {rangoLabel}. Las secciones de
            &quot;qué buscan los usuarios&quot; van a aparecer vacías hasta que
            alguien use los filtros del catálogo o cargue sus preferencias.
            Probá con un rango más amplio.
          </p>
        </div>
      )}

      {/* ══ PROPORCIONES (torta) ══ */}
      <Titulo>Proporciones</Titulo>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Venta vs. Alquiler — qué buscan"
          subtitle={`Tipo de operación pedido en las búsquedas · ${rangoLabel}`}
        >
          <PieStat data={operacion.data} unit="búsquedas" />
        </ChartCard>

        <ChartCard
          title="Inventario propio por tipo"
          subtitle={`Propiedades cargadas en ${rangoLabel}, según el tipo`}
        >
          <PieStat
            data={inventario.porTipo}
            unit="propiedades"
            emptyMessage={`No se cargaron propiedades en ${rangoLabel}.`}
          />
        </ChartCard>

        <ChartCard
          title="Inventario propio por operación"
          subtitle={`Propiedades cargadas en ${rangoLabel}, en venta o alquiler`}
        >
          <PieStat
            data={inventario.porOperacion}
            unit="propiedades"
            emptyMessage={`No se cargaron propiedades en ${rangoLabel}.`}
          />
        </ChartCard>

        <ChartCard
          title="Estado de las solicitudes"
          subtitle={`Solicitudes de publicación recibidas en ${rangoLabel}`}
        >
          <PieStat
            data={solicitudes.porEstado}
            unit="solicitudes"
            emptyMessage={`No se recibieron solicitudes en ${rangoLabel}.`}
          />
        </ChartCard>

        <ChartCard
          title="Cómo se registran los usuarios"
          subtitle={`Método usado en los ${fmt(registros.total)} registros de ${rangoLabel}`}
        >
          <PieStat
            data={registros.porMetodo}
            unit="registros"
            emptyMessage={`No hubo registros nuevos en ${rangoLabel}.`}
          />
        </ChartCard>

        <ChartCard
          title="Visitantes logueados vs. anónimos"
          subtitle={`Sobre ${fmt(trafico.visitantesUnicos)} visitantes únicos de ${rangoLabel}`}
        >
          <PieStat
            data={[
              {
                label: 'Con cuenta',
                count: trafico.visitantesLogueados,
                percentage: pct(trafico.visitantesLogueados, trafico.visitantesUnicos)
              },
              {
                label: 'Anónimos',
                count: trafico.visitantesAnonimos,
                percentage: pct(trafico.visitantesAnonimos, trafico.visitantesUnicos)
              },
            ]}
            unit="visitantes"
            emptyMessage={`No hubo visitas en ${rangoLabel}.`}
          />
        </ChartCard>
      </div>

      {/* ══ RANKINGS DE BÚSQUEDA (barras) ══ */}
      <Titulo>Qué buscan los usuarios</Titulo>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Zonas más buscadas" subtitle={rangoLabel}>
          <BarStat data={busquedas.zonas} unit="búsquedas" />
        </ChartCard>

        <ChartCard title="Localidades más buscadas" subtitle={rangoLabel}>
          <BarStat data={busquedas.localidades} unit="búsquedas" />
        </ChartCard>

        <ChartCard title="Barrios más buscados" subtitle={rangoLabel}>
          <BarStat data={busquedas.barrios} unit="búsquedas" />
        </ChartCard>

        <ChartCard title="Tipos de propiedad más buscados" subtitle={rangoLabel}>
          <BarStat data={busquedas.tiposDePropiedad} unit="búsquedas" />
        </ChartCard>

        <ChartCard title="Rangos de precio más buscados" subtitle={`En dólares · ${rangoLabel}`}>
          <BarStat data={busquedas.rangosDePrecio} unit="búsquedas" />
        </ChartCard>

        <ChartCard
          title="Extras más pedidos"
          subtitle={rangoLabel}
          note="El porcentaje es sobre el total de búsquedas, no entre extras: una misma búsqueda puede pedir cochera y patio a la vez, así que la suma puede pasar el 100%."
        >
          <BarStat data={busquedas.extras} unit="búsquedas" />
        </ChartCard>

        <ChartCard title="Habitaciones pedidas" subtitle={`Mínimo solicitado · ${rangoLabel}`}>
          <BarStat data={busquedas.habitaciones} unit="búsquedas" />
        </ChartCard>

        <ChartCard title="Baños pedidos" subtitle={`Mínimo solicitado · ${rangoLabel}`}>
          <BarStat data={busquedas.banios} unit="búsquedas" />
        </ChartCard>
      </div>

      {/* Promedios de lo buscado — números sueltos, sin gráfico */}
      <ChartCard
        title="El buscador promedio"
        subtitle={`Promedio de los valores que la gente puso en los filtros durante ${rangoLabel}`}
      >
        {sinBusquedas ? (
          <NoData message={`No hubo búsquedas en ${rangoLabel}.`} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Dato label="Presupuesto"        value={busquedas.promedios.precio ? `USD ${fmt(busquedas.promedios.precio)}` : '—'} />
            <Dato label="Superficie total"   value={busquedas.promedios.supTotal ? `${fmt(busquedas.promedios.supTotal)} m²` : '—'} />
            <Dato label="Antigüedad máxima"  value={busquedas.promedios.antiguedadMaxima ? `${fmt(busquedas.promedios.antiguedadMaxima)} años` : '—'} />
          </div>
        )}
      </ChartCard>

      {/* ══ RANKINGS DE PROPIEDADES ══ */}
      <Titulo>Propiedades destacadas</Titulo>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Más guardadas en favoritos"
          subtitle="Ranking histórico — no depende del rango elegido"
          note={HISTORICAL_NOTE}
        >
          <PropertyRankStat
            data={favoritas.data}
            unit="favoritos"
            emptyMessage="Todavía nadie guardó propiedades en favoritos."
          />
        </ChartCard>

        <ChartCard
          title="Mejor valoradas"
          subtitle={`Ranking histórico · mínimo ${valoradas.minRatings ?? 2} valoraciones para entrar`}
          note={HISTORICAL_NOTE}
        >
          <PropertyRankStat
            data={valoradas.data}
            unit="valoraciones"
            emptyMessage={`Todavía no hay propiedades con al menos ${valoradas.minRatings ?? 2} valoraciones.`}
            extra={p => (p.average != null ? `${p.average} ★ de promedio` : null)}
          />
        </ChartCard>

        <ChartCard title="Más comentadas" subtitle={rangoLabel}>
          <PropertyRankStat
            data={comentadas.data}
            unit="comentarios"
            emptyMessage={`No hubo comentarios en ${rangoLabel}.`}
          />
        </ChartCard>

        <ChartCard title="Más visitadas" subtitle={rangoLabel}>
          <PropertyRankStat
            data={visitadas.data}
            unit="visitas"
            emptyMessage={`No hubo visitas a propiedades en ${rangoLabel}.`}
            extra={p => (p.uniqueVisitors != null ? `${fmt(p.uniqueVisitors)} visitantes únicos` : null)}
          />
        </ChartCard>
      </div>

      {/* ══ TRÁFICO ══ */}
      <Titulo>Tráfico del sitio</Titulo>

      <ChartCard
        title="Visitas por día"
        subtitle={`${fmt(trafico.totalVisitas)} visitas de ${fmt(trafico.visitantesUnicos)} visitantes únicos en ${rangoLabel}. No se cuentan las visitas del admin.`}
      >
        <TrafficChart data={trafico.porDia} />
      </ChartCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Páginas más vistas" subtitle={rangoLabel}>
          <BarStat data={trafico.paginasMasVistas} unit="visitas" />
        </ChartCard>

        <ChartCard
          title="Dónde se quedan más tiempo"
          subtitle={`Promedio de permanencia por página · ${rangoLabel}`}
        >
          {tiempo.porPagina.length === 0 ? (
            <NoData message={`No hay mediciones de tiempo en ${rangoLabel}.`} />
          ) : (
            <BarStat
              data={tiempo.porPagina.map(p => ({
                label: p.label,
                count: p.segundos,
                percentage: p.muestras
              }))}
              unit="seg."
              showPercentage={false}
            />
          )}
        </ChartCard>
      </div>

      {/* ══ INVENTARIO POR UBICACIÓN ══ */}
      <Titulo>Inventario propio por ubicación</Titulo>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Por zona" subtitle={`Cargadas en ${rangoLabel}`}>
          <BarStat data={inventario.porZona} unit="props." emptyMessage={`Sin altas en ${rangoLabel}.`} />
        </ChartCard>
        <ChartCard title="Por localidad" subtitle={`Cargadas en ${rangoLabel}`}>
          <BarStat data={inventario.porLocalidad} unit="props." emptyMessage={`Sin altas en ${rangoLabel}.`} />
        </ChartCard>
        <ChartCard title="Por barrio" subtitle={`Cargadas en ${rangoLabel}`}>
          <BarStat data={inventario.porBarrio} unit="props." emptyMessage={`Sin altas en ${rangoLabel}.`} />
        </ChartCard>
      </div>

      <p className="pb-2 text-center text-xs text-gray-400">
        Generado el{' '}
        {new Date(data.generadoEn).toLocaleString('es-AR', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })}
      </p>
    </div>
  );
}

// ── Piezas chicas ─────────────────────────────────────────────────────────────
const pct = (parte: number, total: number) =>
  total > 0 ? Number(((parte / total) * 100).toFixed(1)) : 0;

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-2 flex items-center gap-3 text-xs font-bold tracking-widest text-[#0b7a4b] uppercase">
      {children}
      <span className="h-px flex-1 bg-gray-100" />
    </h2>
  );
}

function Kpi({
  icon: Icon, label, value, hint
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-gray-500 uppercase">
        <Icon size={13} className="text-[#0b7a4b]" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 truncate text-xs text-gray-400">{hint}</p>
    </div>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#0b7a4b]">{value}</p>
    </div>
  );
}

