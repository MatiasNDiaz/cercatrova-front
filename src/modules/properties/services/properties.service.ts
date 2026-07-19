import { PropertyFilters } from '../interfaces/property-filters.interface';
import { Property } from '../interfaces/propertyInterface';
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