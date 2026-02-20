import axios from 'axios';
import { PropertyFilters } from '../interfaces/property-filters.interface';

// Base URL desde variable de entorno
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Creamos una instancia de axios
const api = axios.create({
  baseURL: API_URL,
});

export const propertiesService = {

  /**
   * Obtiene propiedades filtradas y paginadas
   */
  getFilteredProperties: async (filters: PropertyFilters) => {
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