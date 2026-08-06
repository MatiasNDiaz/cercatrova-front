/**
 * Shape que la ficha consume de `GET /properties/:id`.
 *
 * Se declara acá y no se reusa `PropertyFull` del detalle público porque son
 * dos vistas con necesidades distintas: aquélla carga comentarios, ratings y
 * agente; ésta deliberadamente no los usa (ver la cabecera de `FichaContent`).
 * Declarar sólo lo que se muestra deja explícito, en el tipo mismo, cuál es el
 * contrato de esta página.
 */
export interface FichaImage {
  id: number;
  url: string;
  isCover?: boolean;
}

export interface FichaProperty {
  id: number;
  title: string;
  description: string;
  price: number;
  operationType: string;
  status: string;
  typeOfProperty?: { id: number; name: string };

  // Ubicación completa
  provincia: string;
  localidad: string;
  barrio: string;
  direccion: string | null;
  zone: string;

  // Características
  rooms: number;
  bathrooms: number;
  supTotal: number | null;
  supCubierta: number | null;
  antiquity: number;
  garage: boolean;
  patio: boolean;

  // Documentación legal
  property_deed: boolean;
  tractoAbreviado: boolean;
  boleto: boolean;

  images?: FichaImage[];
  created_at: string;
  updated_at?: string;
}
