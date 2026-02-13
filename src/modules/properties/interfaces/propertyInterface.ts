import { OperationType } from './operation-type';
import { StatusProperty } from './status-property';

export interface Property {
  id: number;

  title: string;
  description: string;

  operationType: OperationType;
  status: StatusProperty;

  provincia: string;
  localidad: string;
  barrio: string;
  zone: string;

  rooms: number;
  bathrooms: number;
  garage: boolean;
  patio: boolean;
  property_deed?: boolean;

  m2: number;
  antiquity: number;
  price: number;

  typeOfPropertyId: number;

  // Relación expandida (cuando viene con join)
  typeOfProperty?: TypeOfProperty;

  images?: PropertyImage[];

  createdAt?: string;
  updatedAt?: string;
}


export interface TypeOfProperty {
  id: number;
  name: string;
}

export interface PropertyImage {
  id: number;
  url: string;
  isCover?: boolean;
}
