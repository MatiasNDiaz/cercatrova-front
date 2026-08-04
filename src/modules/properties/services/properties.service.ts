import { PropertyFilters } from '../interfaces/property-filters.interface';
import { Property } from '../interfaces/propertyInterface';
import { Property as ApiProperty } from '../../shared/types/api';
import  api  from "../../shared/lib/axios";

/** Metadatos de paginación — idénticos en `GET /properties` y `GET /properties/filter`. */
export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  totalPages: number;
  currentPage: number;
}

// Shape paginado que devuelve GET /properties/filter (ver API_CONTRACT.md)
export interface FilteredPropertiesResponse {
  data: Property[];
  meta: PaginationMeta;
}

/** Shape paginado que devuelve GET /properties. */
export interface PaginatedPropertiesResponse {
  data: ApiProperty[];
  meta: PaginationMeta;
}

/**
 * Tope de `limit` que acepta el backend (`PropertyPaginationDto`, `@Max(100)`).
 * Pedir más devuelve 400, así que las lecturas "traeme todo" pagina de a 100.
 */
const MAX_PAGE_SIZE = 100;

const EMPTY_META: PaginationMeta = { totalItems: 0, itemCount: 0, totalPages: 0, currentPage: 1 };

export const propertiesService = {

  /**
   * Obtiene propiedades filtradas y paginadas
   */
  getFilteredProperties: async (filters: PropertyFilters): Promise<FilteredPropertiesResponse> => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) =>
            value !== '' &&
            value !== undefined &&
            value !== null
        )
      );

      const response = await api.get('/properties/filter', {
        params: cleanParams,
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  /**
   * Listado completo de propiedades — UNA página.
   *
   * ⚠️ `GET /properties` dejó de devolver un array plano: ahora responde
   * `{ data, meta }` con paginación real (default `limit: 10`, tope 100). Este
   * método devuelve la página tal cual; si necesitás el catálogo entero usá
   * `getEveryProperty()`.
   *
   * A diferencia de `/properties/filter`, este endpoint NO fuerza
   * `status: 'disponible'` — devuelve también pausadas, vendidas y alquiladas.
   * Por eso es el que usa el panel de administración.
   */
  getAll: async (page = 1, limit = MAX_PAGE_SIZE): Promise<PaginatedPropertiesResponse> => {
    const { data } = await api.get('/properties', { params: { page, limit } });
    if (Array.isArray(data?.data)) return data as PaginatedPropertiesResponse;
    return { data: [], meta: { ...EMPTY_META, currentPage: page } };
  },

  /**
   * Todas las propiedades, recorriendo la paginación.
   *
   * Sólo para el panel admin, que filtra y ordena en cliente sobre el catálogo
   * completo (incluidas las que no están disponibles). Se pide de a 100 —el
   * máximo del backend— y se corta por `meta.totalPages`, con un tope duro de
   * seguridad para no quedar en un bucle infinito si `meta` viniera raro.
   */
  getEveryProperty: async (): Promise<ApiProperty[]> => {
    const first = await propertiesService.getAll(1, MAX_PAGE_SIZE);
    const totalPages = Math.min(first.meta?.totalPages ?? 1, 50);
    if (totalPages <= 1) return first.data;

    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        propertiesService.getAll(i + 2, MAX_PAGE_SIZE).then((r) => r.data).catch(() => [])
      )
    );
    return [first.data, ...rest].flat();
  },

  /**
   * Sólo el total del catálogo, sin traerse las filas.
   *
   * Para las tarjetas de métricas del panel: pide `limit: 1` y lee
   * `meta.totalItems`. Antes se descargaba el catálogo entero para hacerle
   * `.length`.
   */
  getTotalCount: async (): Promise<number> => {
    const { meta } = await propertiesService.getAll(1, 1);
    return meta?.totalItems ?? 0;
  },

  /**
   * Las N propiedades mejor valoradas, para la sección de destacadas.
   *
   * Usa `/properties/filter` con `sortBy=rating`: el backend ordena por el
   * promedio y —desde el último cambio de contrato— **también devuelve
   * `ratingAverage` en cada fila**. Antes había que descargar el catálogo
   * completo con `GET /properties` porque era el único listado que traía ese
   * campo.
   *
   * Efecto secundario deseado: `/properties/filter` fuerza
   * `status: 'disponible'`, así que las destacadas nunca muestran una propiedad
   * ya vendida o pausada.
   */
  getFeatured: async (limit = 4): Promise<ApiProperty[]> => {
    const { data } = await api.get('/properties/filter', {
      params: { sortBy: 'rating', order: 'DESC', page: 1, limit },
    });
    return Array.isArray(data?.data) ? data.data : [];
  },

  /**
   * Obtener una propiedad por ID
   */
  getOne: async (id: number) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  /**
   * Obtener Localidades, Zonas y Barrios
   */
  getLocationFilters: async () => {
    const response = await api.get('/properties/filters/locations');
    return response.data;
  },

};
