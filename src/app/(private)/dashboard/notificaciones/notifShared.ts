import { NotificationType } from '@/modules/shared/types/api';

/**
 * Clasificación de las notificaciones del USUARIO.
 *
 * ── Por qué existe este archivo ─────────────────────────────────────────────
 * Esta lógica vivía dentro de `notificaciones/page.tsx`. Se extrajo cuando el
 * sidebar (`dashboard/layout.tsx`) pasó a mostrar un badge por categoría: el
 * sidebar tiene que contar EXACTAMENTE con el mismo criterio con el que la
 * pantalla después filtra, o el badge dice "3" y al entrar aparecen 2.
 *
 * Ese error concreto ya pasó en el panel de admin: el layout tenía su propia
 * copia de la clasificación con reglas levemente distintas ('solicitó' acá vs.
 * 'solicitud para' allá). La solución fue un único `notifShared`, y este
 * archivo es el equivalente del lado del usuario.
 *
 * Es sólo un `.ts` (sin JSX) a propósito: acá va únicamente la clasificación.
 * Los íconos y colores siguen en `page.tsx`, que es su único consumidor.
 */

export interface UserNotification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  propertyId?: number;
  /** Campo real del backend; opcional por las filas previas a la migración. */
  type?: NotificationType;
  createdAt: string;
}

export type NotifType =
  | 'precio'
  | 'coincidencia'
  | 'solicitud_aceptada'
  | 'solicitud_rechazada'
  | 'solicitud_revision'
  | 'solicitud_recibida'
  | 'propiedad_nueva'
  | 'publicacion_nueva'
  | 'respuesta_comentario'
  | 'generica';

/** Mapeo directo backend → categoría de la UI, para los casos 1 a 1. */
const TYPE_TO_UI: Partial<Record<NotificationType, NotifType>> = {
  [NotificationType.CAMBIO_PRECIO]: 'precio',
  [NotificationType.PROPIEDAD_MATCH]: 'coincidencia',
  [NotificationType.NUEVA_PROPIEDAD]: 'propiedad_nueva',
  [NotificationType.NUEVA_PUBLICACION]: 'publicacion_nueva',
  [NotificationType.RESPUESTA_COMENTARIO]: 'respuesta_comentario',
};

/**
 * Sub-estado de una notificación de solicitud.
 *
 * ⚠️ Acá el campo `type` del backend NO alcanza: las cuatro variantes
 * (recibida / en revisión / aceptada / rechazada) comparten un único
 * `estado_solicitud`, porque el backend no expone el estado resultante como
 * dato aparte. Esta pantalla sí las distingue (ícono y color distintos por
 * estado), así que para ESE caso —y sólo para ese— se sigue mirando el texto.
 *
 * Es un matcheo mucho más seguro que el anterior: ya sabemos que la
 * notificación es de una solicitud, así que no hay riesgo de que una respuesta
 * a un comentario que mencione "aceptado" se clasifique mal.
 *
 * Si en el futuro el backend agrega el estado al payload, esto se reemplaza por
 * un mapeo directo.
 */
function solicitudSubtype(title: string, message: string): NotifType {
  const t = (title + ' ' + message).toLowerCase();
  if (t.includes('aceptad')) return 'solicitud_aceptada';
  if (t.includes('rechazad')) return 'solicitud_rechazada';
  if (t.includes('revisión') || t.includes('revision')) return 'solicitud_revision';
  return 'solicitud_recibida';
}

/**
 * Heurística por texto — **sólo para filas anteriores a la migración** que
 * llegan sin `type` o con `generica`. Ver la nota equivalente en
 * `dashboardAdmin/notificaciones/notifShared.tsx`: es transitorio.
 */
function inferFromText(title: string, message: string): NotifType {
  const titulo = title.toLowerCase();
  const t = (title + ' ' + message).toLowerCase();

  if (titulo.includes('respondieron tu comentario'))                            return 'respuesta_comentario';
  if (titulo.includes('nueva publicación') || titulo.includes('nueva publicacion')) return 'publicacion_nueva';
  if (t.includes('precio') || t.includes('bajó'))                              return 'precio';
  if (t.includes('interesa') || t.includes('coincid') || t.includes('cumple')) return 'coincidencia';
  if (t.includes('aceptad'))                                                    return 'solicitud_aceptada';
  if (t.includes('rechazad'))                                                   return 'solicitud_rechazada';
  if (t.includes('revisión') || t.includes('revision'))                        return 'solicitud_revision';
  if (t.includes('solicitud recibida') || t.includes('recibida correctamente')) return 'solicitud_recibida';
  if (t.includes('nueva propiedad') || t.includes('publicad') || t.includes('se publicó')) return 'propiedad_nueva';
  return 'generica';
}

/**
 * Categoría de la notificación, priorizando el campo `type` del backend.
 *
 * Antes esto se infería enteramente del texto en español, con el orden de los
 * `if` como única defensa: una respuesta a un comentario que mencionara
 * "precio" o "publicación" terminaba con el ícono equivocado.
 */
export function getNotifType(n: Pick<UserNotification, 'type' | 'title' | 'message'>): NotifType {
  if (n.type === NotificationType.ESTADO_SOLICITUD) {
    return solicitudSubtype(n.title, n.message);
  }
  const mapped = n.type ? TYPE_TO_UI[n.type] : undefined;
  if (mapped) return mapped;
  return inferFromText(n.title, n.message);
}

/**
 * Conteo de NO LEÍDAS por categoría, para los badges del sidebar y de los tabs.
 *
 * Está acá y no en cada pantalla para que el sidebar y la fila de filtros no
 * puedan divergir. Las claves coinciden con las de `FilterTab` en `page.tsx`.
 */
export function contarSinLeer(notifs: UserNotification[]) {
  const sinLeer = notifs.filter((n) => !n.read);
  const porTipo = (t: NotifType) => sinLeer.filter((n) => getNotifType(n) === t).length;

  return {
    total: sinLeer.length,
    propiedades_nuevas: porTipo('propiedad_nueva'),
    publicaciones: porTipo('publicacion_nueva'),
    coincidencias: porTipo('coincidencia'),
    precios: porTipo('precio'),
    respuestas: porTipo('respuesta_comentario'),
    solicitudes_aceptadas: porTipo('solicitud_aceptada'),
    solicitudes_rechazadas: porTipo('solicitud_rechazada'),
    // "En revisión" agrupa recibida + en revisión, igual que el filtro de la
    // pantalla: para el usuario las dos son "todavía la están mirando".
    solicitudes_revision: porTipo('solicitud_revision') + porTipo('solicitud_recibida'),
  };
}
