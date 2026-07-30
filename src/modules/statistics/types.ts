/**
 * Espejo en TypeScript de lo que devuelve `GET /statistics` del backend
 * (`src/modules/statistics/statistics.service.ts`, método `overview`).
 *
 * Ese endpoint devuelve las 11 secciones en UNA sola respuesta, así que la
 * página de estadísticas hace un único fetch y de ahí saca todo.
 */

export type StatsRange = 'day' | 'week' | 'month';

export const RANGE_LABELS: Record<StatsRange, string> = {
  day: 'Último día',
  week: 'Última semana',
  month: 'Último mes',
};

/** Fila genérica de conteo: la usan casi todas las secciones. */
export interface StatRow {
  label: string;
  count: number;
  /** Porcentaje sobre el total de la sección, ya redondeado por el backend. */
  percentage: number;
}

/** Fila de un ranking de propiedades (favoritos, comentarios, visitas…). */
export interface PropertyRankRow {
  propertyId: number;
  title: string;
  imageUrl: string | null;
  localidad: string;
  count: number;
  /** Solo en "mejor valoradas": promedio de estrellas. */
  average?: number;
  /** Solo en "más visitadas": visitantes distintos. */
  uniqueVisitors?: number;
}

// ── 1. Qué buscan los usuarios ────────────────────────────────────────────────
export interface SearchedFeatures {
  range: StatsRange;
  zonas: StatRow[];
  localidades: StatRow[];
  barrios: StatRow[];
  provincias: StatRow[];
  tiposDePropiedad: StatRow[];
  habitaciones: StatRow[];
  banios: StatRow[];
  rangosDePrecio: StatRow[];
  extras: StatRow[];
  promedios: {
    antiguedadMaxima: number;
    supTotal: number;
    precio: number;
  };
  /** 0 = todavía no hay búsquedas registradas en el rango. */
  totalBusquedas: number;
}

// ── 2-6. Demanda y rankings ───────────────────────────────────────────────────
export interface OperationDemand {
  range: StatsRange;
  data: StatRow[];
}

export interface PropertyRanking {
  range: StatsRange;
  /**
   * `false` cuando la tabla de origen no guarda fecha (Favorite y Rating tienen
   * PK compuesta sin timestamp): el ranking es histórico y el selector de
   * día/semana/mes NO lo afecta. La página lo aclara en pantalla.
   */
  rangeApplies: boolean;
  /** Solo en "mejor valoradas": mínimo de valoraciones exigido para entrar. */
  minRatings?: number;
  data: PropertyRankRow[];
}

// ── 7. Tráfico ────────────────────────────────────────────────────────────────
export interface Traffic {
  range: StatsRange;
  totalVisitas: number;
  visitantesUnicos: number;
  visitantesLogueados: number;
  visitantesAnonimos: number;
  porDia: { dia: string; visitas: number; unicos: number }[];
  paginasMasVistas: StatRow[];
}

// ── 8-9. Registros y solicitudes ──────────────────────────────────────────────
export interface Registrations {
  range: StatsRange;
  total: number;
  porMetodo: StatRow[];
}

export interface RequestsStats {
  range: StatsRange;
  total: number;
  porEstado: StatRow[];
}

// ── 10. Tiempo en página ──────────────────────────────────────────────────────
export interface AverageTime {
  range: StatsRange;
  promedioSegundos: number;
  muestras: number;
  porPagina: { label: string; segundos: number; muestras: number }[];
}

// ── 11. Inventario propio ─────────────────────────────────────────────────────
export interface OwnInventory {
  range: StatsRange;
  /** Propiedades cargadas dentro del rango (filtra por `created_at`). */
  totalEnRango: number;
  /** Total del catálogo, sin filtrar por fecha. */
  totalHistorico: number;
  porTipo: StatRow[];
  porOperacion: StatRow[];
  porZona: StatRow[];
  porLocalidad: StatRow[];
  porBarrio: StatRow[];
}

// ── Respuesta completa ────────────────────────────────────────────────────────
export interface StatisticsOverview {
  range: StatsRange;
  generadoEn: string;
  busquedas: SearchedFeatures;
  operacion: OperationDemand;
  favoritas: PropertyRanking;
  comentadas: PropertyRanking;
  valoradas: PropertyRanking;
  visitadas: PropertyRanking;
  trafico: Traffic;
  registros: Registrations;
  solicitudes: RequestsStats;
  tiempo: AverageTime;
  inventario: OwnInventory;
}
