// ============================================================
// Tipos de Property para el módulo de propiedades.
//
// Este archivo definía su propia copia de `Property` (con `m2`, y con
// `createdAt`/`updatedAt` en camelCase, mientras el backend devuelve
// `created_at`/`updated_at`). Esa duplicación se eliminó: la fuente de verdad
// única es `shared/types/api.ts`, que refleja el contrato real del backend.
//
// Se mantienen los nombres `TypeOfProperty` / `PropertyImage` como alias para
// no romper los imports existentes del módulo.
// ============================================================

export type { Property, PropertyImage } from '@/modules/shared/types/api';
export type { PropertyType as TypeOfProperty } from '@/modules/shared/types/api';
