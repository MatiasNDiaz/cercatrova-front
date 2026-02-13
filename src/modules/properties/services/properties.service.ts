import axios from 'axios';
import { PropertyFilters } from '../interfaces/property-filters.interface';

// Definimos la URL base de tu API (esto debería ir en un .env)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const propertiesService = {
  
  /**
   * Obtiene propiedades filtradas y paginadas
   */
  getFilteredProperties: async (filters: PropertyFilters) => {
  try {
    // 1. Creamos una copia limpia eliminando los strings vacíos o undefined
    const cleanParams = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '' && value !== undefined && value !== null)
    );

    const response = await axios.get(`http://localhost:3000/properties/filter/`, {
      params: cleanParams, // Enviamos solo lo que importa
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
    const response = await axios.get(`${API_URL}/properties/${id}`);
    return response.data;
  }
};