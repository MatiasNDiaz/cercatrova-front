import { OperationType } from "./operation-type";
import { StatusProperty } from "./status-property";

export interface PropertyFilters {
  // --- PAGINACIÓN ---
  page?: number;
  limit?: number;

  // --- BÚSQUEDA INTELIGENTE ---
  search?: string; // El campo "estrella" para la barra de navegación

  // --- FILTROS DE TEXTO ---
  title?: string;
  zone?: string;
  provincia?: string;
  localidad?: string;
  barrio?: string;
  status?: StatusProperty;

  // --- FILTROS NUMÉRICOS ---
  rooms?: number;
  bathrooms?: number;
  typeOfPropertyId?: number;
  
  // --- FILTROS DE RANGO ---
  minPrice?: number;
  maxPrice?: number;
  minM2?: number;
  maxM2?: number;
  maxAntiquity?: number;

  // --- FILTROS BOOLEANOS ---
  // Nota: En la interfaz los definimos como boolean. 
  // El Hook se encargará de convertirlos a string 'true'/'false' para la URL.
  garage?: boolean;
  patio?: boolean;
  hasDeed?: boolean;

  // --- ENUMS ---
  operationType?: OperationType; 
}

