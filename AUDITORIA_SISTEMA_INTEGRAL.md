# AUDITORÍA_SISTEMA_INTEGRAL.md — Trazabilidad Admin ↔ Página ↔ Usuario

> **Metodología:** auditoría 100% estática y de solo lectura sobre el código fuente actual del
> repositorio (`src/app/`, `src/modules/`, tipos compartidos, middleware). No se modificó,
> movió ni eliminó ningún archivo. Todas las afirmaciones llevan cita `archivo:línea`. Cuando
> un comportamiento depende del backend NestJS (fuera de este repo) y no es verificable
> leyendo solo el frontend, se marca explícitamente como **"no verificable desde el
> frontend"**. En un puñado de puntos (marcados como tal) se contrastó contra el backend real
> corriendo en `localhost:3000` con `curl` durante esta misma sesión de trabajo, y esos casos
> se citan como "verificado contra backend real".
>
> Este documento es un complemento de `CLAUDE.md` (arquitectura general, stack, convenciones)
> y `FRONTEND_CHANGES.md` (historial de refactors) — no los reemplaza. Se enfoca exclusivamente
> en la pregunta: **¿qué le pasa al Usuario y a la Página cuando el Admin hace algo?**

---

## 1. Mapa Global de Entidades y Modelos de Datos

Fuente única de verdad en el frontend: `src/modules/shared/types/api.ts`. Es un archivo de
409 líneas que centraliza enums, entidades y DTOs del contrato del backend; los `interfaces/`
de cada módulo (`auth/`, `properties/`) re-exportan desde acá.

### 1.1 Enums (estados que cambian según quién interactúa)

| Enum | Valores | Quién lo cambia | Dónde |
|---|---|---|---|
| `Role` | `user`, `admin` | Solo se lee, nunca se cambia desde el frontend (no hay UI de "ascender a admin") | `api.ts:13-16` |
| `StatusProperty` | `disponible`, `pendiente`, `vendida`, `alquilada`, `eliminado`, `'en pausa'` | Admin, vía el formulario completo de edición de propiedad | `api.ts:18-25` |
| `OperationType` | `venta`, `alquiler`, `temporal` | Admin (al crear/editar propiedad) y Usuario (al elegir tipo de operación en `/publicar`, campo separado — ver 1.3) | `api.ts:27-31` |
| `RequestStatus` | `enviado`, `en_revision`, `aceptado`, `rechazado` | Usuario crea en `enviado`; Admin transiciona | `api.ts:33-38` |

**Matriz de transiciones válidas de `RequestStatus`** (`api.ts:45-50`, enforced client-side y
—según comentario en el propio código— también server-side con 409):

```
enviado      → [en_revision, aceptado, rechazado]
en_revision  → [aceptado, rechazado]
aceptado     → []                    ← TERMINAL, sin vuelta atrás
rechazado    → [en_revision]         ← solo puede reabrirse a revisión, no directo a "aceptado" ni a "enviado"
```

⚠️ **Nota importante:** `eliminado` es un valor válido de `StatusProperty` en el tipo TS, pero
**no existe ningún control en la UI que lo asigne** (ver Sección 4, hallazgo de código muerto en
`PropertyForm.tsx`). El único borrado real de propiedad es un `DELETE` físico, no una transición
a `eliminado`.

### 1.2 Enums exclusivos del formulario de solicitud (`/publicar`)

`TipoPropiedadRequest`, `TipoOperacionRequest`, `EstadoConservacionRequest` (`api.ts:52-73`) —
**tres enums en español, con valores distintos** a `OperationType`/`PropertyType` que usa la
entidad `Property` real. Ejemplo: una solicitud usa `TipoOperacionRequest.VENTA = 'Venta'`
(mayúscula), mientras que una `Property` usa `OperationType.VENTA = 'venta'` (minúscula). Esto
confirma, a nivel de tipos, que **`PropertyRequest` y `Property` son dos modelos de datos
completamente independientes** sin conversión automática entre ellos — hallazgo que se retoma
como el gap más crítico del Flujo B (Sección 2).

### 1.3 Entidades principales

| Entidad | Campos clave | Relaciones |
|---|---|---|
| `User` (`api.ts:80-95`) | `id, name, surname, phone, photo, email, profileIncomplete, role, notifyBroadcast, tokenVersion, createdAt, updatedAt` | Relacionado por FK implícita a `Favorite`, `Comment`, `Rating`, `PropertyRequest`, `SearchPreference` |
| `Property` (`api.ts:112-141`) | `id, title, description, provincia*, localidad, barrio, zone, rooms, bathrooms, property_deed, garage, patio, m2, antiquity, price, status, images[], agent, operationType, typeOfProperty, ratingAverage?` | `agent: {id} \| User`; `ratings?`, `comments?`, `favorites?` opcionalmente embebidos |
| `PropertyImage` (`api.ts:102-110`) | `id, url, hash, isCover, publicId` | `property?` (solo en algunas respuestas) |
| `Rating` (`api.ts:143-150`) | `id, score (1-5), userId, propertyId` | `user`, `property` (parciales o completos según endpoint) |
| `Favorite` (`api.ts:152-157`) | `user_id, property_id` | `property: Property` (embebido completo — ver Sección 4 para el riesgo de esto) |
| `Comment` (`api.ts:159-167`) | `id, message, created_at, userId, propertyId` | `user` |
| `Notification` (`api.ts:169-178`) | `id, title, message, propertyId, read, targetRole ('user'\|'admin'), relatedUserId, createdAt` | Sin FK directa a un usuario destinatario individual salvo `relatedUserId` — el canal se segmenta por **rol**, no por usuario puntual (ver Sección 2, Flujo E) |
| `SearchPreference` (`api.ts:180-200`) | `zone, localidad, barrio, operationType, typeOfProperty, preferredPrice, minRooms, minBathrooms, m2, garage, patio, maxAntiquity, notifyNewMatches, notifyPriceDrops` | `user: User` |
| `PropertyRequest` (`api.ts:202-228`) | `id, localidad, barrio, direccion, pisoDepto, tipoPropiedad, tipoOperacion, estadoConservacion, m2Totales, m2Cubiertos, habitaciones, baños, patio, garage, antiguedad, orientacion, escritura, impuestosAlDia, aptoCredito, precioEstimado, mensajeAgente, status, userId` | `user?` (ausente solo en `GET /property-requests/my-requests`) — **sin campo `propertyId`**, confirmando que no hay vínculo estructural con `Property` |

`* provincia` — hallazgo verificado contra el backend real en esta sesión (`curl` a
`GET /properties/2`): el campo **no contiene solo el nombre de la provincia**, sino la
**dirección completa** (ej. `"Jorge Luis Borges 489, Barrio La Estanzuela, La Calera,
Córdoba."`). Esto es relevante porque el mapa de Google en `/properties/[id]` usa este campo
como query — es una dependencia de nombrado engañoso a tener en cuenta en cualquier refactor
que toque el formulario de propiedades.

### 1.4 Errores del contrato

`ApiErrorResponse` (mensaje string), `ApiValidationErrorResponse` (mensaje array,
`class-validator`), `ApiThrottleErrorResponse` (429, sin campo `error`) — los tres consumidos
uniformemente por `getErrorMessage()` en `src/modules/shared/lib/apiError.ts`.

---

## 2. Trazabilidad Extremo a Extremo (End-to-End Tracing)

### Flujo A — Publicar/Crear Propiedad desde Admin

```
Admin (dashboardAdmin/propiedades/nueva) 
  → PropertyForm.tsx: arma FormData (campo "data" = JSON.stringify(payload) + archivos bajo la key "images")
  → POST /properties (multipart)                                          [PropertyForm.tsx:269-271]
  → [Base de datos — no verificable desde el frontend]
  → Catálogo público (/properties): NO hay revalidación push. La propiedad
    aparece recién en el PRÓXIMO fetch a GET /properties/filter que dispare
    un usuario (carga de página o cambio de filtro) — no hay ISR/webhook,
    revalidateTag, ni WebSocket.
  → Detalle (/properties/:id): visible en cuanto alguien navegue al ID nuevo
    (Server Component, SSR fresco en cada request).
  → Notificaciones a usuarios: SIN evidencia en el frontend de que se dispare
    ningún aviso in-app o email al crear una propiedad. No existe ningún
    POST /notifications ni lógica de matching contra SearchPreference en
    ningún archivo de src/ (confirmado por grep — ver Flujo E).
```

**Selección de portada al crear:** en modo creación, el frontend solo mantiene el flag
`isCover` en el estado local de cada imagen nueva (`NewImage.isCover`); **no se envía ningún
campo explícito indicando cuál es la portada en el payload de `POST /properties`** —
`setCoverImageId` solo se computa en modo edición (`PropertyForm.tsx:249-252`). Cómo decide el
backend la portada de una propiedad recién creada no es verificable desde el frontend.

### Flujo B — Solicitudes de Publicación enviadas por Usuarios ⚠️ (hallazgo crítico)

```
Usuario (/publicar) 
  → Completa formulario 100% textual/numérico — SIN CAMPO DE IMÁGENES
    (verificado: no hay <input type="file"> en publicar/page.tsx)
  → POST /property-requests { localidad, barrio, direccion, tipoPropiedad,
    tipoOperacion, estadoConservacion, m2Totales, m2Cubiertos, habitaciones,
    baños, antiguedad, patio, garage, escritura, impuestosAlDia,
    aptoCredito, precioEstimado, mensajeAgente, ... }        [publicar/page.tsx:71]
  → Redirect a /dashboard/mis-solicitudes                     [publicar/page.tsx:84]
  → Admin ve la lista completa: GET /property-requests         [solicitudes/page.tsx:92]
  → Admin cambia estado: PATCH /property-requests/:id/status   [solicitudes/page.tsx:101]
       (UI solo habilita botones según VALID_REQUEST_TRANSITIONS)
  
  🚨 AL APROBAR ("aceptado"): el handler de cambio de estado SOLO hace el
     PATCH de status. No hay ningún POST /properties encadenado, ningún
     redirect al formulario de alta con los datos precargados, ninguna
     prop ni query param que lleve los datos de la solicitud hacia
     PropertyForm.tsx. Un grep de todo el directorio
     dashboardAdmin/propiedades/ contra "property-requests"/"requestId"/
     "solicitud" da CERO resultados.
     
     CONCLUSIÓN (solo verificable a nivel frontend): aprobar una solicitud
     NO publica la propiedad en el catálogo. Si el negocio espera que sí
     lo haga, el admin tiene que RE-TIPEAR A MANO todos los datos en
     /dashboardAdmin/propiedades/nueva, usando la tarjeta expandida de la
     solicitud (solicitudes/page.tsx:374-415) solo como referencia visual
     — y en ese proceso manual tiene que conseguir las imágenes por otra
     vía, porque la solicitud nunca tuvo campo de imágenes.

  → Notificación de respuesta al usuario: SIN evidencia de un POST
    /notifications en el handler de cambio de estado. En su lugar, el
    admin tiene accesos directos de contacto MANUAL: link de WhatsApp
    (wa.me/:phone) y de Gmail (mailto/compose) — lo que sugiere que el
    flujo de "avisar al usuario" está pensado como una acción humana del
    admin, no como un mecanismo automático del sistema.
  → /dashboard/mis-solicitudes: fetch ÚNICO al montar (GET
    /property-requests/my-requests), SIN POLLING. El usuario no se entera
    de un cambio de estado salvo que recargue esa página manualmente.
```

### Flujo C — Edición, Eliminación y Cambio de Estado de Propiedades

```
Admin edita datos/imágenes/portada:
  → PATCH /properties/:id (multipart: data JSON + newImages[] +
    deleteImages[] + setCoverImageId)                     [PropertyForm.tsx:264-266]
  → PATCH /property-images/:id/set-cover (llamada SEPARADA e
    INMEDIATA al click, para imágenes ya existentes)        [PropertyForm.tsx:179]
  → /properties/[id] (detalle): SSR fresco, refleja el cambio en la
    próxima visita/recarga.
  → /properties (catálogo): refleja el cambio en el próximo fetch.
  → Favoritos del usuario (/dashboard/favoritos): la página vuelve a
    pedir GET /favorites completo en cada carga — los datos embebidos
    de la propiedad estarán actualizados. No hay caché stale detectada.

Admin elimina propiedad:
  → DELETE /properties/:id                                   [propiedades/page.tsx:82]
  → Confirmación previa (ConfirmDialog) — el mensaje SOLO menciona que
    se borran las imágenes de Cloudinary y que la acción es
    irreversible; NO menciona que se van a "huerfanar" favoritos,
    comentarios o ratings de otros usuarios.               [propiedades/page.tsx:74-77]
  → /properties/[id]: si alguien navega al ID borrado,
    propertiesService.getOne() lanza (404 u otro error), el try/catch
    del Server Component llama a notFound() — degradación LIMPIA a la
    página 404 de Next.js, sin crash.                       [properties/[id]/page.tsx:11-19]
  → /dashboard/favoritos: NINGÚN guard defensivo sobre `property` siendo
    null/undefined (solo `property.images` usa optional chaining) — ver
    Sección 4 para el riesgo concreto de TypeError.
```

### Flujo D — Gestión de Usuarios y Permisos

```
Admin elimina usuario:
  → Confirmación con mensaje explícito: "Se eliminarán todos los datos
    de {name}, incluidos sus favoritos y solicitudes. Esta acción no se
    puede deshacer."                                        [usuarios/page.tsx:234]
  → DELETE /users/:id                                        [usuarios/page.tsx:241]
  → El frontend SOLO actualiza su propio estado local (filtra el user
    de la lista) y muestra un toast — NO hace ningún llamado adicional
    para borrar favoritos/comments/ratings/requests del usuario. Confía
    enteramente en que el backend cascadee (no verificable desde acá).

Sesión activa del usuario eliminado:
  → El interceptor de axios (axios.ts) detecta cualquier 401 fuera de
    /auth/* y dispara emitUnauthorized() → AuthContext limpia `user`,
    muestra toast "Tu sesión expiró..." y hace router.push('/login').
    Esto es el CONTRATO del frontend; que el backend efectivamente
    devuelva 401 para un usuario borrado con cookie aún válida NO es
    verificable leyendo solo este repositorio.
  → tokenVersion existe en el tipo User (api.ts:90) — sugiere que el
    backend tiene un mecanismo de invalidación de tokens por versión,
    pero el frontend nunca lee ni usa ese campo explícitamente.
```

### Flujo E — Sistema de Notificaciones y Broadcast

```
Disparo: SIN NINGÚN endpoint de creación en el frontend. Grep exhaustivo
de POST/PUT/DELETE contra "/notifications" en todo src/ → CERO resultados.
Todas las notificaciones que el frontend muestra se asumen generadas
server-side como efecto colateral de otras acciones (nuevo registro,
nueva solicitud, nuevo comentario, baja de precio, etc.) — inferido solo
por los strings de texto que el frontend parsea para clasificar el tipo
de notificación (getNotifType, por substring del título/mensaje), NUNCA
confirmado contra el backend.

Entrega: exclusivamente POLLING, sin WebSockets/SSE:
  - NavbarPrivate.tsx: GET /notifications (user) o /notifications/admin
    (admin) cada 60s, para el badge de la campanita.          [NavbarPrivate.tsx:71-79]
  - dashboardAdmin/layout.tsx: GET /notifications/admin cada 60s,
    en un loop TOTALMENTE INDEPENDIENTE del anterior, para los badges
    por categoría del sidebar admin.                          [dashboardAdmin/layout.tsx:82-91]
  - Ambas páginas de listado (dashboard/notificaciones,
    dashboardAdmin/notificaciones) hacen fetch único al montar, sin
    polling propio.
  → Para un admin navegando fuera de /dashboardAdmin/notificaciones,
    hay DOS loops de polling corriendo en paralelo contra el mismo
    endpoint (/notifications/admin), sin compartir estado.

Refresco inmediato fuera del polling: evento DOM custom "notif-updated".
  - Disparado SOLO desde dashboardAdmin/notificaciones/page.tsx (4
    puntos: al marcar leída individual, al marcar todas, y al navegar
    desde un ítem hacia usuario/propiedad).
  - Escuchado SOLO por dashboardAdmin/layout.tsx (el sidebar), para
    refrescar sus badges sin esperar hasta 60s.
  - El bell del navbar (NavbarPrivate.tsx) NO escucha este evento en
    ningún rol → su badge puede quedar desincronizado hasta 60s después
    de marcar como leída una notificación.
  - El lado usuario (dashboard/notificaciones/page.tsx) NUNCA dispara
    este evento — asimetría entre ambos roles sin justificación
    funcional aparente encontrada en el código.

"notifyBroadcast": vive en dashboard/perfil/page.tsx (NO en
preferencias, pese a lo que su nombre podría sugerir), como un simple
toggle de email "Novedades de propiedades nuevas", persistido vía
PATCH /users/me.                                        [perfil/page.tsx:40-59, 258-283]
NO existe ninguna UI admin de "redactar y enviar un broadcast" en todo
el frontend — es puramente un opt-in unidireccional del lado usuario.
Distinto de notifyNewMatches/notifyPriceDrops (entidad
SearchPreference), que se guardan vía PATCH/POST /search-preferences
en dashboard/preferencias/page.tsx.
```

---

## 3. Matriz de Conexiones e Interacciones Cruzadas

| Funcionalidad Admin | Endpoint / Contrato API | Entidad Afectada | Efecto en la Página / Catálogo | Efecto en la Experiencia / Panel del Usuario |
| :--- | :--- | :--- | :--- | :--- |
| Crear propiedad | `POST /properties` (multipart) | `Property`, `PropertyImage` | Aparece en `/properties` y `/properties/:id` recién en el próximo fetch (sin push/revalidación) | Sin notificación in-app ni email detectados desde el frontend, aunque existan `SearchPreference` coincidentes |
| Editar propiedad (datos/imágenes) | `PATCH /properties/:id` (multipart) | `Property`, `PropertyImage` | Catálogo y detalle reflejan el cambio en el próximo fetch | Si está en Favoritos, se ve actualizado la próxima vez que el usuario abra `/dashboard/favoritos` (fetch completo cada carga) |
| Cambiar imagen de portada (existente) | `PATCH /property-images/:id/set-cover` | `PropertyImage.isCover` | Cambia la imagen mostrada en catálogo/detalle en el próximo fetch | Ninguno directo |
| Eliminar propiedad | `DELETE /properties/:id` | `Property`, `PropertyImage` (Cloudinary), potencialmente `Favorite`/`Comment`/`Rating` huérfanos | `/properties/:id` → `notFound()` limpio; desaparece del catálogo en el próximo fetch | **Riesgo real** en `/dashboard/favoritos` — sin guard sobre `property` nulo (ver Sección 4) |
| Cambiar estado de propiedad (`disponible`/`vendida`/`alquilada`/`pendiente`/`en pausa`) | `PATCH /properties/:id` (vía formulario completo; no hay endpoint dedicado a solo status) | `Property.status` | Badge de estado cambia en catálogo/detalle en el próximo fetch | Sin notificación al usuario; comentarios/ratings/favoritos existentes permanecen intactos |
| Aprobar / Rechazar / Revisar solicitud | `PATCH /property-requests/:id/status` | `PropertyRequest.status` | **Ninguno** — aprobar NO crea una `Property` (ver Flujo B) | `mis-solicitudes` no hace polling; el usuario solo ve el nuevo estado si recarga esa página a mano |
| Eliminar solicitud | `DELETE /property-requests/:id` | `PropertyRequest` | Ninguno | El usuario pierde el registro sin ningún aviso detectado |
| Eliminar usuario | `DELETE /users/:id` | `User` + (declarado en el copy, no verificado con llamadas propias) `Favorite`/`PropertyRequest`/`Comment`/`Rating` | Ninguno directo en el catálogo | Sesión activa → 401 en el próximo request no-`/auth/*` → logout automático + toast + redirect a `/login` (contrato del interceptor, backend no verificable) |
| Ver solicitudes / preferencias de un usuario | `GET /property-requests/user/:id`, `GET /search-preferences/user/:id` | `PropertyRequest`, `SearchPreference` | Ninguno (solo lectura) | Ninguno |
| Listar / marcar leídas notificaciones admin | `GET /notifications/admin`, `PATCH /notifications/:id/read`, `PATCH /notifications/admin/read-all` | `Notification` | Ninguno | Ninguno — canales admin/usuario segregados por `targetRole`, sin cruce |
| *(No-admin, incluido por completitud)* Toggle `notifyBroadcast` | `PATCH /users/me` | `User.notifyBroadcast` | Ninguno | Solo afecta al propio usuario; sin panel admin para leer/forzar este flag por usuario |
| *(No-admin)* Comentar/valorar propiedad | `POST /properties/:id/comments`, `POST /ratings/:id` | `Comment`, `Rating` | `ratingAverage` visible en catálogo (vía `GET /properties`, no en `/properties/filter`) y detalle | — |
| *(Gap)* Moderación de comentarios por admin | **No existe** | `Comment` | — | El único borrado de comentario en todo el código es el del propio autor (`PropertyDetail.tsx`, `isOwner`-gated) — el admin no tiene ninguna vista para moderar/eliminar comentarios ajenos |

---

## 4. Puntos Ciegos, Vulnerabilidades de Flujo y "Gaps" Encontrados

### 4.1 Efectos secundarios peligrosos

1. **🔴 `/dashboard/favoritos` sin guard sobre `property` nulo.** El fetch a `GET /favorites`
   trae objetos `property` completos embebidos. El render destructura
   `const { property, property_id } = ...` y accede directo a `property.images?.find(...)`,
   `property.title`, `property.price.toLocaleString(...)`, `property.operationType` — **sin
   ningún `property?.` ni `.filter(f => f.property)` previo**. Si el backend alguna vez
   devuelve una fila de favorito cuya propiedad fue borrada (hard delete) sin cascadear el
   favorito correspondiente, esto revienta con `TypeError: Cannot read properties of
   undefined` en pleno render, tirando abajo toda la página de favoritos del usuario. No es
   hipotético: el propio mensaje del `ConfirmDialog` de borrado de propiedad **no** menciona
   que los favoritos se limpien, lo que sugiere que ni el equipo que escribió ese mensaje
   tenía certeza de que el backend cascadea.
2. **🟡 Comentarios/ratings de una propiedad eliminada.** Mismo patrón de riesgo potencial:
   no se auditó el backend, pero el frontend tampoco tiene ninguna lógica que limpie
   comentarios/ratings huérfanos si la propiedad padre desaparece — la única superficie
   donde esto sería visible (`PropertyDetail.tsx`) ya no es alcanzable una vez que
   `GET /properties/:id` empieza a 404 y la página cae a `notFound()`, así que el riesgo
   práctico es bajo ahí, pero **si esos comentarios/ratings quedan huérfanos en la base de
   datos, ensucian cualquier reporte o estadística futura** (relevante para la
   `/dashboardAdmin/estadisticas` que hoy ni siquiera existe — ver 4.3).
3. **🟡 Usuario eliminado con sesión activa.** El interceptor de axios maneja el 401 de forma
   elegante (logout + toast + redirect), pero eso depende 100% de que el backend efectivamente
   devuelva 401 para ese usuario. Si el backend solo invalida la fila en la tabla `users` sin
   verificar existencia en cada request autenticado (por ejemplo, si solo valida la firma del
   JWT y no una consulta a DB), el usuario eliminado podría seguir navegando con una sesión
   "fantasma" hasta que el token expire naturalmente — **no verificable desde el frontend**,
   pero el campo `tokenVersion` en el tipo `User` sugiere que el backend sí tiene un mecanismo
   pensado para esto, que el frontend nunca lee ni expone en ningún lado.

### 4.2 Estados inconsistentes

4. **🔴 Solicitudes aprobadas que NO generan una propiedad.** El hallazgo más importante de
   esta auditoría (detallado en el Flujo B). El estado `aceptado` de una `PropertyRequest` es
   **terminal** (`VALID_REQUEST_TRANSITIONS[ACEPTADO] = []`) — una vez aprobada, no hay forma
   de revertirla ni de "reintentar" la conversión a propiedad. Si el admin aprueba y luego se
   olvida de crear la propiedad a mano (proceso 100% manual, sin ningún recordatorio ni
   checklist), la solicitud queda **permanentemente marcada como aceptada sin que exista
   ninguna propiedad correspondiente en el catálogo** — un estado inconsistente sin salida
   dentro de la UI actual.
5. **🟡 Notificaciones que dependen enteramente del backend para existir.** Como el frontend
   nunca crea notificaciones, si el backend falla en generar una (por ejemplo, al aprobar una
   solicitud) no hay ningún fallback ni indicio visual de que "algo debería haber pasado y no
   pasó" — el usuario simplemente nunca se entera, sin error visible en ningún lado.
6. **🟡 Badge del navbar (campanita) desincronizado hasta 60s.** Al marcar notificaciones como
   leídas desde cualquiera de las dos páginas de listado, el badge de `NavbarPrivate.tsx` no
   se actualiza al instante porque no escucha `notif-updated` (solo lo escucha el sidebar
   admin) — puede mostrar un número de no-leídas incorrecto por hasta un minuto.
7. **🟡 Asimetría en el evento `notif-updated`.** Se dispara solo desde el lado admin y se
   escucha solo en el layout admin. El lado usuario nunca lo dispara ni lo escucha — mismo
   patrón, cobertura desigual, sin razón funcional documentada en el código.

### 4.3 Rutas incompletas o endpoints "huérfanos"

8. **🔴 `/dashboardAdmin/estadisticas` — 404 real, confirmado.** Enlazada desde
   `dashboardAdmin/page.tsx` (`quickLinks`) y desde el sidebar admin, pero **no existe ningún
   archivo bajo esa ruta** (confirmado por `Glob` en esta auditoría: cero resultados). El
   backend expone un módulo `GET /stats/*` completo que el frontend **nunca consume en
   absoluto** — confirmado por grep de `/stats` en todo `src/` (el único match es un string de
   copy en un componente de marketing de la landing, no una llamada real). El dashboard admin
   hoy calcula sus 4 métricas agregando client-side `GET /users` + `GET /properties` +
   `GET /property-requests` en paralelo, en vez de usar el módulo de estadísticas real.
9. **🟡 `StatusProperty.eliminado` — valor de enum inalcanzable desde la UI.** Existe en el
   tipo TypeScript y en el `STATUS_LABELS` del listado admin (con estilos propios, badge rojo),
   pero **no aparece como opción en el `<Select>` de estado** del formulario de creación/edición
   (`PropertyForm.tsx`). Es o bien un remanente de un diseño de soft-delete que nunca se
   terminó de conectar, o un valor que el backend asigna en algún flujo que el frontend no
   controla — cualquiera de los dos amerita una decisión explícita antes de tocar el CRUD de
   propiedades.
10. **🟡 `GET /search-preferences/user/:id` marcado como posiblemente inexistente por el propio
    código.** El comentario en `usuarios/[id]/page.tsx` dice literalmente *"no bloquea si el
    endpoint no existe aún"* y envuelve la llamada en un try/catch aislado que traga cualquier
    error — evidencia de que ni quien escribió el código tenía certeza de que ese endpoint
    estuviera terminado en el backend al momento de integrarlo.
11. **🟢 Módulo `DashboardUser`** (`src/modules/DashboardUser/`) — confirmado en `CLAUDE.md`
    como completamente muerto (archivos vacíos, sin imports). No es parte del flujo admin↔usuario
    activo, pero es peso muerto en el árbol de módulos que puede confundir a quien explore el
    proyecto buscando "dónde está la lógica de X".

### 4.4 Lógica suelta o ineficiente

12. **🟡 Polling triplicado y sin coordinación para notificaciones admin.** Mientras un admin
    navega fuera de las páginas de notificaciones, hay simultáneamente: (a) el poll de 60s del
    bell en `NavbarPrivate.tsx`, y (b) el poll de 60s del sidebar en
    `dashboardAdmin/layout.tsx` — **dos timers independientes pegándole al mismo endpoint
    `GET /notifications/admin`** sin compartir resultado ni sincronizar el intervalo. No es un
    bug funcional, pero es tráfico redundante y una superficie mayor para que ambos se
    desincronicen entre sí.
13. **🟢 `ConfirmDialog` — contraejemplo positivo.** A diferencia de lo que la consigna original
    de esta auditoría sugería como riesgo típico ("modales `toast.custom` dispersos"), se
    verificó leyendo el componente completo (`src/modules/shared/ui/ConfirmDialog.tsx`) que el
    proyecto **ya centralizó** este patrón en un único `confirmDialog()` reutilizable (portal a
    `document.body`, soporta `onConfirm` async con estado de carga, variantes `danger`/`default`
    con tokens de diseño). Los cuatro agentes de exploración de esta auditoría lo encontraron en
    uso consistente en `usuarios/page.tsx`, `usuarios/[id]/page.tsx`, `solicitudes/page.tsx` y
    `propiedades/page.tsx` — **no es un punto ciego actual**, aunque si se documentó como tal en
    una versión anterior de `CLAUDE.md`, ese contenido está desactualizado.
14. **🟡 Errores de polling silenciados sin ningún indicio visual.** Tanto el poll del navbar
    como el del sidebar admin envuelven su fetch en `try { } catch { /* silencioso */ }` — si el
    endpoint empieza a fallar de forma sostenida (caída del backend, cambio de contrato), el
    usuario/admin nunca ve ningún error; el badge simplemente deja de actualizarse sin
    explicación.
15. **🟡 Asimetría `images` vs `newImages` + mecanismos de portada distintos entre crear y
    editar** en `PropertyForm.tsx` — no es un bug en sí, pero es una superficie de confusión
    real para cualquiera que edite ese formulario sin conocer la distinción; documentado en
    detalle en el Flujo A/C arriba.
16. **🟢 Imports sin usar** (`Home`, `Tag` en `PropertyForm.tsx`) — cosmético, cero impacto
    funcional, mencionado por completitud.

---

## 5. Recomendaciones de Seguridad y Preparación para Refactor

### 5.1 Checklist previo antes de tocar código del Admin

- [ ] **Antes de tocar `handleDelete` de propiedades:** decidir explícitamente si el mensaje de
  confirmación debe advertir sobre favoritos/comentarios/ratings huérfanos, y si el frontend
  debería defenderse de esa orfandad en `/dashboard/favoritos` (guard `property?.` como mínimo)
  independientemente de lo que haga el backend — es una corrección barata con alto impacto en
  estabilidad.
- [ ] **Antes de tocar el flujo de aprobación de solicitudes:** confirmar con el equipo de
  backend si `PATCH /property-requests/:id/status → aceptado` dispara algo server-side. Si la
  respuesta es "no", este es el momento de decidir si se construye el puente automático
  (crear `Property` a partir de `PropertyRequest`) o si se deja como proceso manual pero se le
  agrega al menos un indicador visual ("Convertida ✅ / Pendiente de publicar ⚠️") para que no
  quede como estado ciego.
- [ ] **Antes de tocar `usePropertyFilters` o el catálogo:** recordar que `GET
  /properties/filter` **no** trae `ratingAverage` (solo `GET /properties` y
  `GET /properties/:id` sí) — verificado contra el backend real. Cualquier feature nueva que
  dependa de rating en el catálogo filtrado necesita ese fetch adicional o un cambio de
  contrato backend.
- [ ] **Antes de tocar el sistema de notificaciones:** no asumir que existe una forma de
  "enviar" una notificación desde el frontend — no existe. Si se va a construir un broadcast
  real desde el admin, es una feature nueva de punta a punta (UI + backend), no una conexión
  de piezas ya existentes.
- [ ] **Antes de togglear roles o dar de baja usuarios en lote:** revisar que el interceptor de
  401 (`axios.ts` + `authEvents.ts` + `AuthContext.tsx`) siga registrado correctamente — es la
  única red de seguridad que evita que un usuario eliminado quede en un estado de sesión
  fantasma en el cliente.
- [ ] **Antes de agregar la página `/dashboardAdmin/estadisticas`:** usar el módulo
  `GET /stats/*` del backend (hoy 100% sin consumir) en vez de replicar el patrón actual de
  agregación client-side de `dashboardAdmin/page.tsx` — ya existe la fuente de verdad
  correcta, solo falta conectarla.

### 5.2 Componentes clave a proteger durante el rediseño

| Componente | Por qué es sensible | Qué NO romper |
|---|---|---|
| `src/modules/shared/lib/axios.ts` + `authEvents.ts` + `AuthContext.tsx` | Única red de seguridad ante sesiones inválidas (usuario eliminado, token expirado) | El excludes-list de `/auth/*` en el interceptor — tocarlo mal puede crear loops de redirect o silenciar 401 reales |
| `src/middleware.ts` | Única protección de rutas a nivel servidor | El matcher exacto (`/dashboard/:path*` NO debe volver a matchear `/dashboardAdmin` — ya se corrigió una vez ese bug histórico) |
| `src/modules/shared/ui/Favoritebutton.tsx` | Es el ÚNICO punto de verdad de favoritos, reusado en catálogo, lista y — tras el rediseño reciente — en el detalle de propiedad | No duplicar su lógica de nuevo; cualquier vista nueva que necesite favoritos debe reusarlo, no reimplementar el `GET /favorites` + toggle |
| `src/modules/shared/ui/ConfirmDialog.tsx` | Ya está 100% adoptado (usuarios, solicitudes, propiedades) | No volver a introducir `toast.custom` manual en ningún flujo nuevo del admin |
| `VALID_REQUEST_TRANSITIONS` (`api.ts:45-50`) | Es la única fuente de verdad de qué transiciones de solicitud son legales | Si se agrega una conversión automática a `Property` al aprobar, debe respetar que `aceptado` sigue siendo terminal — no inventar una transición nueva sin actualizar este mapa y el backend en paralelo |
| `dashboard/favoritos/page.tsx` | Ver hallazgo 4.1 #1 | Agregar el guard de `property` nulo ANTES de cualquier otro cambio en esta página, no después |
| Polling de notificaciones (`NavbarPrivate.tsx` + `dashboardAdmin/layout.tsx`) | Dos loops independientes ya frágiles | Si se migra a WebSockets/SSE, hacerlo de una sola vez en ambos puntos — dejar uno migrado y otro en polling sería peor que el estado actual |

---

## Resumen ejecutivo (para quien no lea todo el documento)

1. **El hallazgo más importante:** aprobar una solicitud de publicación (`PropertyRequest`) no
   crea automáticamente una `Property` en el catálogo. Son dos entidades sin relación
   estructural, y el puente entre ambas es 100% manual y humano hoy.
2. **El riesgo técnico más concreto:** `/dashboard/favoritos` puede crashear con un
   `TypeError` si alguna vez llega un favorito cuya propiedad fue borrada — no hay ningún guard
   defensivo, y el propio mensaje de confirmación de borrado de propiedad no garantiza que el
   backend limpie esos favoritos.
3. **El endpoint más desaprovechado:** el backend tiene un módulo `/stats/*` completo que el
   frontend nunca usa, mientras la página `/dashboardAdmin/estadisticas` que debería consumirlo
   ni siquiera existe (404 real).
4. **Las notificaciones son de solo lectura desde el frontend:** nada en el cliente crea o
   dispara notificaciones; todo se asume generado server-side, sin ningún mecanismo de
   broadcast real desde el panel de admin pese a que existe un campo (`notifyBroadcast`) que
   sugiere que debería existir.
