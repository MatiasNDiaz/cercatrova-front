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
  minSupTotal?: number;
  maxSupTotal?: number;
  minSupCubierta?: number;
  maxSupCubierta?: number;
  // Expensas mensuales en pesos.
  // ⚠️ Asimetría del backend, documentada en API_CONTRACT.md §5: `maxExpensas`
  // INCLUYE las propiedades sin expensas cargadas (quien pone un tope de gasto
  // quiere ver también las que no pagan), `minExpensas` las excluye.
  minExpensas?: number;
  maxExpensas?: number;
  maxAntiquity?: number;

  // --- FILTROS BOOLEANOS ---
  // Nota: En la interfaz los definimos como boolean.
  // El Hook se encargará de convertirlos a string 'true'/'false' para la URL.
  garage?: boolean;
  patio?: boolean;
  // Documentación legal: independientes entre sí (pueden convivir)
  property_deed?: boolean;
  tractoAbreviado?: boolean;
  boleto?: boolean;

  // --- ENUMS ---
  operationType?: OperationType;

  // --- ORDENAMIENTO ---
  // Coincide con PropertyFilterDto del backend. `date` = fecha de publicación.
  sortBy?: 'price' | 'antiquity' | 'date' | 'rating';
  order?: 'ASC' | 'DESC';
}

