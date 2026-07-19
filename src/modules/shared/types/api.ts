// ============================================================
// Tipos del contrato de la API (CercaTrova-Back)
// Fuente de verdad: API_CONTRACT.md del repo del backend.
// Este archivo es el lugar canónico para los shapes que devuelve
// el backend — los interfaces/ por módulo re-exportan desde acá
// lo que se superpone.
// ============================================================

// ============================================================
// ENUMS
// ============================================================

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export enum StatusProperty {
  DISPONIBLE = 'disponible',
  PENDIENTE = 'pendiente',
  VENDIDO = 'vendida',
  ALQUILADA = 'alquilada',
  ELIMINADO = 'eliminado',
  PAUSADO = 'en pausa',
}

export enum OperationType {
  VENTA = 'venta',
  ALQUILER = 'alquiler',
  ALQUILER_TEMPORAL = 'temporal',
}

export enum RequestStatus {
  ENVIADO = 'enviado',
  REVISION = 'en_revision',
  ACEPTADO = 'aceptado',
  RECHAZADO = 'rechazado',
}

/**
 * Transiciones de estado válidas para PATCH /property-requests/:id/status.
 * Cualquier otra combinación devuelve 409.
 * "aceptado" es terminal; "rechazado" solo puede volver a revisión.
 */
export const VALID_REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.ENVIADO]: [RequestStatus.REVISION, RequestStatus.ACEPTADO, RequestStatus.RECHAZADO],
  [RequestStatus.REVISION]: [RequestStatus.ACEPTADO, RequestStatus.RECHAZADO],
  [RequestStatus.ACEPTADO]: [],
  [RequestStatus.RECHAZADO]: [RequestStatus.REVISION],
};

export enum TipoPropiedadRequest {
  CASA = 'Casa',
  DEPARTAMENTO = 'Departamento',
  TERRENO = 'Terreno',
  LOCAL = 'Local',
  OFICINA = 'Oficina',
  QUINTA = 'Quinta',
}

export enum TipoOperacionRequest {
  VENTA = 'Venta',
  ALQUILER = 'Alquiler',
  ALQUILER_TEMPORAL = 'Alquiler temporal',
}

export enum EstadoConservacionRequest {
  EXCELENTE = 'Excelente',
  MUY_BUENO = 'Muy bueno',
  BUENO = 'Bueno',
  REGULAR = 'Regular',
  A_REFACCIONAR = 'A refaccionar',
}

// ============================================================
// ENTIDADES / RESPONSES
// ============================================================

/** Forma "segura" del usuario: la que devuelve la API en el 99% de los casos (sin password) */
export interface User {
  id: number;
  name: string;
  surname: string | null;
  phone: string | null;
  photo: string | null;
  email: string;
  profileIncomplete: boolean;
  role: 'user' | 'admin';
  notifyBroadcast: boolean;
  tokenVersion: number;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  /** Solo presente en la respuesta de PATCH /users/:id o /users/me cuando el body incluía `password` — es el nuevo hash bcrypt. NUNCA guardarlo en el estado del frontend. */
  password?: string;
}

export interface PropertyType {
  id: number;
  name: string;
}

export interface PropertyImage {
  id: number;
  url: string;
  hash: string;
  isCover: boolean;
  publicId: string;
  /** Solo presente en GET /property-images/:id y PATCH .../set-cover */
  property?: Property;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  provincia: string;
  localidad: string;
  barrio: string;
  zone: string;
  rooms: number;
  bathrooms: number;
  property_deed: boolean;
  garage: boolean;
  patio: boolean;
  m2: number | null;
  antiquity: number;
  price: number;
  status: StatusProperty;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
  agent: { id: number } | User; // { id } en la respuesta de POST /properties; User completo en otros GET
  operationType: OperationType;
  typeOfProperty: PropertyType; // SIEMPRE presente (eager en el backend)
  ratings?: Rating[];
  comments?: Comment[];
  favorites?: Favorite[];
  referredBy?: User;
  /** Solo presente en GET /properties y GET /properties/:id */
  ratingAverage?: number;
}

export interface Rating {
  id: number;
  score: number;
  userId: number;
  propertyId: number;
  user: { id: number } | User; // parcial al crear, completo al actualizar
  property: { id: number } | Property;
}

export interface Favorite {
  user_id: number;
  property_id: number;
  user?: User; // solo en el POST
  property: Property;
}

export interface Comment {
  id: number;
  message: string;
  created_at: string;
  userId: number;
  propertyId: number;
  user: User | Pick<User, 'id' | 'name' | 'surname' | 'photo'>;
  property?: Property; // solo en POST
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  propertyId: number | null;
  read: boolean;
  targetRole: 'user' | 'admin';
  relatedUserId: number | null;
  createdAt: string;
}

export interface SearchPreference {
  id: number;
  zone: string | null;
  localidad: string | null;
  barrio: string | null;
  operationType: OperationType | null;
  typeOfProperty: PropertyType | null;
  property_deed: boolean | null;
  preferredPrice: number | null;
  minRooms: number | null;
  minBathrooms: number | null;
  m2: number | null;
  garage: boolean | null;
  patio: boolean | null;
  maxAntiquity: number | null;
  notifyNewMatches: boolean;
  notifyPriceDrops: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface PropertyRequest {
  id: number;
  localidad: string;
  barrio: string;
  direccion: string;
  pisoDepto: string | null;
  tipoPropiedad: string; // libre en la entidad; restringido a TipoPropiedadRequest solo al crear
  tipoOperacion: string;
  estadoConservacion: string;
  m2Totales: number;
  m2Cubiertos: number;
  habitaciones: number;
  baños: number;
  patio: boolean;
  garage: boolean;
  antiguedad: number;
  orientacion: string | null;
  escritura: boolean;
  impuestosAlDia: boolean;
  aptoCredito: boolean;
  precioEstimado: number;
  mensajeAgente: string | null;
  status: RequestStatus;
  userId: number;
  createdAt: string;
  user?: User; // ausente solo en GET /property-requests/my-requests/:id
}

// ============================================================
// AUTH — REQUESTS Y RESPONSES
// ============================================================

export interface RegisterDto {
  name: string;
  surname: string;
  phone: string;
  photo?: string;
  email: string;
  password: string; // min 5 chars
}

export interface LoginDto {
  email: string;
  password: string; // min 5 chars
}

export interface GoogleLoginDto {
  idToken: string;
}

export type RegisterResponse = User;

export interface LoginResponse {
  message: string;
  user: User;
}

export type GoogleLoginResponse = LoginResponse;

export type GetMeResponse = User;

export interface LogoutResponse {
  message: string;
}

// ============================================================
// USERS — DTOs
// ============================================================

export interface UpdateUserDto {
  name?: string;
  surname?: string;
  phone?: string;
  photo?: string;
  email?: string;
  password?: string;
  notifyBroadcast?: boolean;
}

// ============================================================
// PROPERTIES — DTOs
// ============================================================

export interface CreatePropertyDto {
  title: string;
  description: string;
  typeOfPropertyId: number;
  operationType: OperationType;
  property_deed: boolean;
  provincia: string;
  localidad: string;
  barrio: string;
  zone: string;
  rooms: number;
  bathrooms: number;
  garage: boolean;
  patio: boolean;
  m2: number;
  antiquity: number;
  price: number;
  status: StatusProperty;
}

export type UpdatePropertyDto = Partial<CreatePropertyDto> & {
  deleteImages?: number[];
  setCoverImageId?: number;
};

export interface PropertyFilterResponse {
  data: Property[];
  meta: { totalItems: number; itemCount: number; totalPages: number; currentPage: number };
}

// ============================================================
// PROPERTY REQUEST — DTOs
// ============================================================

export interface CreateRequestPropertyDto {
  localidad: string;
  barrio: string;
  direccion: string;
  pisoDepto?: string;
  tipoPropiedad: TipoPropiedadRequest;
  tipoOperacion: TipoOperacionRequest;
  estadoConservacion: EstadoConservacionRequest;
  m2Totales: number;
  m2Cubiertos: number;
  habitaciones: number;
  baños: number;
  antiguedad: number;
  orientacion?: string;
  patio: boolean;
  garage: boolean;
  escritura: boolean;
  impuestosAlDia: boolean;
  aptoCredito: boolean;
  precioEstimado: number;
  mensajeAgente?: string;
}

export interface UpdateRequestStatusDto {
  status: RequestStatus;
}

// ============================================================
// OTROS DTOs
// ============================================================

export interface CreateRatingDto {
  score: number; // 1-5
}

export interface CreateCommentDto {
  message: string; // max 500 chars
}
export type UpdateCommentDto = Partial<CreateCommentDto>;

export interface CreateSearchPreferenceDto {
  zone?: string;
  localidad?: string;
  barrio?: string;
  garage?: boolean;
  patio?: boolean;
  operationType?: OperationType;
  property_deed?: boolean;
  typeOfPropertyId?: number;
  preferredPrice?: number;
  minRooms?: number;
  minBathrooms?: number;
  m2?: number;
  maxAntiquity?: number;
  notifyNewMatches?: boolean;
  notifyPriceDrops?: boolean;
}
export type UpdateSearchPreferenceDto = Partial<CreateSearchPreferenceDto>;

// ============================================================
// ERRORES
// ============================================================

/** Shape de las excepciones HTTP estándar de NestJS (message es SIEMPRE string acá) */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string; // "Bad Request" | "Unauthorized" | "Forbidden" | "Not Found" | "Conflict" | "Bad Gateway" | "Internal Server Error"
}

/** Shape cuando falla class-validator (ValidationPipe global o JsonToDtoPipe) — message es array */
export interface ApiValidationErrorResponse {
  statusCode: 400;
  message: string[];
  error: 'Bad Request';
}

/** Shape del 429 por rate limit — sin campo `error` */
export interface ApiThrottleErrorResponse {
  statusCode: 429;
  message: 'ThrottlerException: Too Many Requests';
}
