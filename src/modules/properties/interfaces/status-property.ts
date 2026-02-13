import { OperationType } from "./operation-type";

export enum StatusProperty {
    DISPONIBLE = 'disponible',
    PENDIENTE = 'pendiente',
    VENDIDO = 'vendida',
    ALQUILADA = 'alquilada',
    ELIMINADO = 'eliminado',
    PAUSADO = 'en pausa',
}

export interface IPropertyFilter {
  page?: number;
  limit?: number;
  title?: string;
  zone?: string;
  rooms?: number;
  bathrooms?: number;
  typeOfPropertyId?: number;
  minPrice?: number;
  maxPrice?: number;
  minM2?: number;
  maxM2?: number;
  maxAntiquity?: number;
  // Los booleanos en la URL se manejan mejor como strings "true"/"false" 
  // para que coincidan con @IsBooleanString() del back
  garage?: 'true' | 'false'; 
  patio?: 'true' | 'false';
  hasDeed?: 'true' | 'false';
  status?: StatusProperty;
  provincia?: string;
  localidad?: string;
  operationType?: OperationType;
  barrio?: string;
  search?: string;
}