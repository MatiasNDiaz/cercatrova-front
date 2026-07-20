import { PropertyFilters } from '../interfaces/property-filters.interface';
import { Property } from '../interfaces/propertyInterface';
import { Property as ApiProperty } from '../../shared/types/api';
import  api  from "../../shared/lib/axios";

// Shape paginado que devuelve GET /properties/filter (ver API_CONTRACT.md)
export interface FilteredPropertiesResponse {
  data: Property[];
  meta: { totalItems: number; itemCount: number; totalPages: number; currentPage: number };
}

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
   * Lista completa de propiedades.
   *
   * A diferencia de `getFilteredProperties` (GET /properties/filter), este
   * endpoint SÍ incluye `ratingAverage` en cada propiedad — es el único junto
   * con GET /properties/:id (ver `Property` en shared/types/api.ts). Por eso lo
   * usa la sección de destacadas de la landing, que ordena por valoración.
   *
   * El backend devuelve el array directo, pero se contempla `{ properties: [] }`
   * porque el dashboard admin ya se defendía de esa forma alternativa.
   */
  getAll: async (): Promise<ApiProperty[]> => {
    const response = await api.get('/properties');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.properties)) return data.properties;
    return [];
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