# TestAPI.md — Auditoría pre-despliegue del FRONTEND (`cercatrova-front`)

> Auditoría de **solo lectura** ejecutada sobre el código real (02/08/2026).
> Fuentes cruzadas: `CLAUDE.md` (regenerado en esa sesión), `FRONTEND_CHANGES.md`, y del backend `API_CONTRACT.md`, `SECURITY_FIXES.md`, `SECURITY_FIXES_2.md`, `ERROR_FIXES.md`.
> Commit auditado: `f9317be` (rama `main`, árbol de trabajo limpio).

---

# 🔧 SESIÓN DE CORRECCIÓN — 03/08/2026

Se corrigieron **los 4 🔴 y 7 de los 🟡**, más la adaptación a cuatro cambios de contrato del backend.

**Estado de los checks al cierre:**

| Check | Antes (02/08) | Ahora (03/08) |
|---|---|---|
| `npm run build` | ✅ 33 rutas | ✅ 33 rutas, 0 errores |
| `npx tsc --noEmit` | ✅ 0 errores | ✅ 0 errores |
| `npm run lint` | ⚠️ **36.800 problemas** (36.777 de build output) | ✅ **0 problemas** |
| First Load JS — landing `/` | 401 kB | **266 kB** (−34 %) |
| First Load JS — `/properties` | 371 kB | **238 kB** (−36 %) |
| First Load JS — `/servicios/:id` | 357 kB (`ƒ` dinámica) | **223 kB** (`●` SSG, 6 páginas prerenderizadas) |
| First Load JS — `/publicaciones` | 362 kB | **229 kB** (−37 %) |

## ⚠️ Nota de contrato — `API_CONTRACT.md` quedó desactualizado

Los cuatro cambios del backend se verificaron **leyendo el código fuente**, no el contrato: `API_CONTRACT.md` no fue regenerado (última modificación 02/08 20:06) y todavía documenta el comportamiento viejo. Concretamente sigue diciendo que `GET /properties` devuelve un array plano (§5), que el promedio "no viene en la respuesta" de `/properties/filter` (§5), que `GET /posts/:id/comments` **no** lleva `OptionalJwtAuthGuard` (§17) y no menciona `Notification.type` (§14). **Conviene regenerarlo antes del despliegue** para que deje de contradecir al código.

Verificado contra el fuente del backend:

| Cambio | Dónde se confirmó |
|---|---|
| `GET /properties` → `{ data, meta }` paginado (default `limit: 10`, tope 100) | `properties.service.ts:107-142`, `properties.controller.ts:48-50`, `PropertyPaginationDto` (`@Max(100)`) |
| `ratingAverage` en `GET /properties/filter` | `properties.service.ts:647` (`withRatingAverage(items)` dentro de `filter()`) |
| `OptionalJwtAuthGuard` en `GET /posts/:id/comments` | `posts.controller.ts:98-103` |
| `Notification.type` con 13 valores | `notification.entity.ts` + `enums/notification-type.enum.ts` |

---

## Detalle de lo corregido

### 🔴 Resueltos

- **🔴-1 Landing prerenderizada con "No hay propiedades" congelado — ✅ Resuelto (03/08)**
  `export const revalidate = 300` en [`(public)/page.tsx`](src/app/(public)/page.tsx). Se eligió ISR sobre `force-dynamic` porque la landing es la ruta de más tráfico y su contenido dinámico son 4 destacadas que cambian poco: SSR en cada request la haría tan lenta como el backend. Beneficio extra: un build hecho con la API caída **se corrige solo** en la primera revalidación.
  *Verificado:* el build reporta `Revalidate 5m` para `/`, y `.next/server/app/index.html` ya no contiene el texto del estado vacío.

- **🔴-2 Fallback silencioso de `NEXT_PUBLIC_API_URL` — ✅ Resuelto (03/08)**
  Nuevo [`shared/lib/env.ts`](src/modules/shared/lib/env.ts): variable definida → se usa; sin definir en desarrollo → fallback a localhost **con warning**; sin definir en producción → **throw** que corta el build. `axios.ts`, `tracking.ts` y `GoogleProvider.tsx` pasan por ahí. Creado `.env.example` con las 3 variables documentadas, más la excepción `!.env.example` en `.gitignore` (el patrón `.env*` también lo ignoraba).
  *Verificado:* con `.env` fuera de lugar, el build falla con `Error: [env] Falta la variable de entorno NEXT_PUBLIC_API_URL…`.

- **🔴-3 `/preview-ui` publicada en producción — ✅ Resuelto (03/08)**
  La vitrina pasó a `preview-ui/PreviewUi.tsx` y [`page.tsx`](src/app/preview-ui/page.tsx) quedó como Server Component que hace `notFound()` si `NODE_ENV === 'production'`. En desarrollo funciona igual.
  *Verificado:* `.next/server/app/preview-ui.html` pasó de 65 kB (la vitrina) a 10,7 kB con "This page could not be found".

- **🔴-4 "Ocultar comentario" irreversible — ✅ Resuelto (03/08)**
  La causa raíz era del backend y **ya está corregida** (`OptionalJwtAuthGuard` en `GET /posts/:id/comments`): el admin ahora sí recibe los `isHidden: true`, así que el botón "Mostrar" de `CommentModeration` —que siempre existió— pasó a ser alcanzable. Del lado del front se cerró el hueco que ese arreglo destapó: `PostCard` renderizaba los comentarios ocultos **idénticos a los visibles** en el feed público. Ahora llevan fondo ámbar, badge "Oculto" y una línea que aclara que sólo los ve el admin.

### 🟡 Resueltos

- **🟡-1 `npm run lint` con 36.800 problemas — ✅ Resuelto (03/08)** — `.next*/**` en el `ignores` de `eslint.config.mjs` (cubre `.next-build` y `.next-verify`, que el glob viejo no tomaba). Se aprovechó para limpiar **los 23 warnings reales**: 21 imports muertos y los 2 `exhaustive-deps`. **Lint quedó en 0.**
- **🟡-2 `three` en el bundle público — ✅ Resuelto (03/08)** — La escena se extrajo a [`Escena3D.tsx`](src/modules/landing/components/Escena3D.tsx) y se carga con `next/dynamic({ ssr: false })`, sólo cuando el gate de aparición ya se abrió. **−134 kB en todas las rutas públicas.**
- **🟡-4 axios sin `timeout` — ✅ Resuelto (03/08)** — `timeout: 15_000` en la instancia. `getErrorMessage()` distingue el corte por tiempo (`ECONNABORTED`/`ETIMEDOUT`) del error de red, con mensaje propio.
- **🟡-7 WhatsApp roto con teléfonos reales — ✅ Resuelto (03/08)** — `normalizePhoneForWhatsapp()` y `whatsappLinkTo()` en `contact.ts`, más el componente [`WhatsappLink`](src/modules/shared/ui/WhatsappLink.tsx) que deshabilita el botón (con motivo) si no hay teléfono usable. Los 3 call-sites del panel migrados; no queda ningún `wa.me/${…}` armado a mano. *Verificado* contra 11 formatos: `351 387 2817` → `543513872817`, `0351 15 387 2817` → `543513872817`, `null`/`""`/`abc` → botón deshabilitado.
- **🟡-9 Código muerto — parcialmente resuelto (03/08)** — Se desinstaló `gsap` (0 imports). Los archivos muertos (`HeaderSearch`, `FiltersPanel `, `SearchBar`, `PropertiesList`, `DashboardUser/`, `(user)/`) **siguen ahí**: borrarlos no estaba en el alcance de esta sesión.
- **🟡-10 Fechas con huso del visitante — no abordado**, sigue pendiente (11 lugares).
- **Bonus — `/servicios/:id` pasó de dinámica a SSG**: tiene datos 100 % hardcodeados y se re-renderizaba en el servidor en cada visita. Con `generateStaticParams` + `dynamicParams = false`, las 6 páginas se prerenderizan.
- **Bonus — bug latente en `PropertyForm`**: `handleDrop` estaba en un `useCallback([])` que capturaba una versión obsoleta de `addFiles`, así que **el drag & drop calculaba el tope de 10 imágenes contra el estado del primer render**. Arrastrar imágenes podía pasarse del límite; con el explorador de archivos no fallaba. Corregido memoizando `addFiles` con sus dependencias reales.

### Adaptaciones al contrato nuevo

- **`GET /properties` paginado** — `properties.service.ts` reescrito con `getAll(page, limit)`, `getEveryProperty()` (recorre páginas de a 100, para el panel admin que filtra en cliente) y `getTotalCount()` (pide `limit: 1` y lee `meta.totalItems`). Migrados los 4 consumidores. Sin este cambio el panel de propiedades habría mostrado **sólo las 10 más recientes** y las métricas del dashboard habrían dicho "10 propiedades".
- **`ratingAverage` en `/properties/filter`** — El catálogo ya no descarga el catálogo completo para cruzar valoraciones: las tarjetas lo reciben directo en `items`. Se eliminó ese fetch extra. La landing pasó a `sortBy=rating&order=DESC&limit=4` en vez de traerse todo y ordenar en memoria (**esto cierra también el punto 🔵 del N+1**).
- **`Notification.type`** — Enum `NotificationType` agregado a `shared/types/api.ts`. La clasificación por substrings se reemplazó por mapeo sobre `type` en los 4 lugares que la usaban (sidebar admin, pantalla general, categorías, feed de usuario y toast de pendientes). De paso se eliminó una **segunda heurística divergente** que vivía en `dashboardAdmin/layout.tsx` con reglas distintas a la de las pantallas — los badges del sidebar podían no coincidir con lo que mostraba la pantalla.
  ⚠️ Dos matices honestos: (a) se conserva la heurística de texto como *fallback* sólo para filas anteriores a la migración, marcada como transitoria y con nota de borrado; (b) en el feed de usuario, las 4 variantes de solicitud (recibida/en revisión/aceptada/rechazada) comparten un único `estado_solicitud`, así que **ahí sigue haciendo falta el texto** para el sub-estado. Si el backend expone el estado resultante, se elimina.

### 0.b — Endpoints restringidos a `USER`: qué se encontró

Confirmado en el fuente: `favorites` (todas las rutas), `POST /ratings/:id` y `POST /search-preferences` llevan `@Roles(Role.USER)` con `RolesGuard`, así que **un admin recibe 403**.

- **La zona admin (`dashboardAdmin/*`) está limpia**: su único uso es `GET /search-preferences/user/:id`, que es `@Roles(Role.ADMIN)` — correcto.
- **Pero la zona pública sí exponía esas acciones a un admin logueado**: `FavoriteButton` (en `PropertyCard`, `PropertyRow` y el detalle) y el `StarPicker` de valoraciones. Un admin navegando el catálogo veía el corazón y el formulario de valorar, y al usarlos recibía 403. **Corregido**: `FavoriteButton` no se renderiza para `role === 'admin'`, y el bloque de valoración muestra un texto explicando que desde una cuenta de administrador no se valora.

---

## Lo que sigue pendiente

Del informe original quedan sin resolver, por estar fuera del alcance pedido:

- **🟡-3** El dashboard de usuario sigue sin badge de notificaciones (el de admin sí lo tiene).
- **🟡-5** Sin metadata por página en `/`, `/properties`, `/properties/:id`, `/servicios/:id`; la landing sigue sin `<h1>`.
- **🟡-6** Sin `robots.txt` ni `sitemap.xml`.
- **🟡-8** `posts.service.ts` sigue usando `'multipart/form-data'` donde los otros 3 usan `undefined` (funciona, pero es inconsistente).
- **🟡-10** 11 lugares con `toLocaleDateString` en vez de `fecha.ts`.
- **🟡-11** Assets pesados en `public/` (`chicaMudandose.jpg` de 10,7 MB, favicon de 1 MB).
- **🟡-12** `<html lang="en">`.
- **🟡-13** `callbackUrl` se escribe pero no se lee.
- **🟡-9** (resto) Archivos muertos sin borrar.
- Todo el bloque 🔵.

---

---

# 🧪 PASO 4 — Verificación en vivo (03/08/2026)

**Entorno real:** backend NestJS en `localhost:3000` (`npm run start:prod`, build fresco) + frontend Next en `localhost:3001` (`npm run start`, **modo producción**, no dev). Pruebas ejecutadas con `curl` contra la API y **Chrome headless** para lo que depende de JavaScript del cliente.

## ⚠️ Dos bloqueos encontrados ANTES de poder probar

Ninguna prueba de este paso habría sido válida sin resolver esto primero:

### 🔴-P4-1 — El backend estaba sirviendo código viejo

El proceso en ejecución (PID 8296) había arrancado a las **01:18**, mientras que el `dist/` compilado era de las **02:17**. Node carga el código una sola vez al arrancar: el servidor estaba respondiendo con la versión anterior a los arreglos.

**Síntoma concreto:** `GET /properties/filter` devolvía `ratingAverage: undefined` aunque tanto el fuente como el `dist/` sí incluían `withRatingAverage(items)` en `filter()`.

**Resuelto:** se frenó el proceso, se corrió `npm run build` y se levantó con `npm run start:prod`. Después del reinicio, el mismo endpoint devuelve valores reales (`4`, `4`, `3.5`, `5`).

> **Para el despliegue:** confirmar que el pipeline hace `build` **antes** de `start:prod`, y que un deploy reinicia el proceso. Es un error fácil de cometer y difícil de detectar: la app responde 200 en todo, sólo que con lógica vieja.

### 🟡-P4-2 — `ADMIN_PASSWORD` del `.env` no coincide con el admin real

El login con las credenciales del `.env` devuelve **401**. La causa está en `createDefaultAdmin()` (`bootstrap.service.ts:52-56`): si ya existe un usuario con ese email, la función **retorna sin hacer nada**. Cambiar `ADMIN_PASSWORD` en el `.env` no actualiza al admin que ya está en la base.

No es un agujero de seguridad —al contrario, resetear el password del admin en cada arranque sería peor—, pero sí una trampa operativa: cualquiera que lea el `.env` va a asumir que ese es el password vigente. En una base nueva de producción sí lo será; en cualquier base con historia, no.

**Sugerencia:** que `createDefaultAdmin()` loguee explícitamente que el admin ya existe y que el `ADMIN_PASSWORD` del `.env` no se aplica, y documentarlo en el `.env.example` del backend.

---

## Resultados por bloque

### 1. Autenticación completa — ✅ 7/7

| # | Prueba | Resultado |
|---|---|---|
| 1.1 | `POST /auth/register` usuario nuevo | ✅ **201** — devuelve el `User` sin `password`, con `role:"user"`, `authProvider:"local"`, `tokenVersion:0` |
| 1.2 | `POST /auth/login` credenciales correctas | ✅ **201** + cookie `access_token` (`HttpOnly`, `SameSite=Lax`) |
| 1.3 | `GET /auth/me` con la cookie | ✅ **200** — datos coinciden exactamente con el registro |
| 1.4 | Login con password incorrecta | ✅ **401** "Credenciales inválidas" |
| 1.4b | Login con email inexistente | ✅ **401** — **mensaje idéntico** al anterior (anti-enumeración funcionando) |
| 1.5 | Cambio de password → sesión vieja | ✅ `tokenVersion` pasó `0 → 1`; la cookie anterior devuelve **401 "Sesión inválida"**; el login con la password nueva da **201** |
| 1.6 | Logout | ✅ `Set-Cookie: access_token=; Expires=Thu, 01 Jan 1970` (borrado real) y la cookie previa devuelve **401** |

> Confirmada en vivo la rareza ya documentada del contrato: `PATCH /users/me` con `password` **devuelve el hash bcrypt** en la respuesta. El frontend no lo guarda (hace logout inmediato sin volcar la respuesta al estado), así que no hay filtración — pero conviene que el backend lo sanitice.

### 3. Favoritos, comentarios y ratings (usuario común) — ✅ 7/7

| # | Prueba | Resultado |
|---|---|---|
| 3.1 | `POST /favorites/16` | ✅ **201** |
| 3.1b | `GET /favorites` | ✅ La propiedad aparece (`property_id: 16`) |
| 3.2 | `POST /properties/16/comments` | ✅ **201**, `isHidden:false` |
| 3.2b | El comentario aparece en el `GET` público | ✅ |
| 3.3 | `POST /ratings/16` con score 1 | ✅ **201** — el promedio de la propiedad pasó de **4 → 2.5** en `GET /properties/:id` |
| 3.4 | Usuario A intenta **editar** el comentario de usuario B | ✅ **403** "No podés editar un comentario que no es tuyo" |
| 3.4b | Usuario A intenta **borrar** el comentario de usuario B | ✅ **403** "No tenés permiso para eliminar este comentario" |

### 4. Notificaciones — ✅ 6/6 en el lado usuario

| # | Prueba | Resultado |
|---|---|---|
| 4.1 | `POST /search-preferences` | ✅ **201** — preferencia guardada con `notifyNewMatches:true` |
| 4.2 | `GET /notifications/unread-count` inicial | ✅ `{"count":0}` |
| 4.4 | `POST /property-requests` (dispara notificación) | ✅ **201**, `status:"enviado"` |
| 4.5 | **`Notification.type` en vivo** | ✅ La notificación llegó con **`type: "estado_solicitud"`** — el campo nuevo del backend existe y trae el valor del enum. Confirma que la migración del frontend (mapeo sobre `type` en lugar de substrings) opera sobre datos reales |
| 4.6 | `unread-count` tras la notificación | ✅ `{"count":1}` |
| 4.7 | `PATCH /notifications/:id/read` → contador | ✅ **200**, y `unread-count` vuelve a `{"count":0}` |

> **Nota de alcance:** el badge se verificó a nivel de **dato** — el número que consume el componente es correcto y reacciona a marcar como leída. El pintado del círculo rojo depende de un `fetch` del cliente con sesión, que no se pudo ejercitar en Chrome headless sin inyectar la cookie en el perfil del navegador.

### 6. WhatsApp — ✅ 3/3

Sobre el HTML **realmente servido** en producción:

| # | Prueba | Resultado |
|---|---|---|
| 6.1 | Número en formato internacional | ✅ Todos los links salen como `https://wa.me/543513872817` |
| 6.2 | `wa.me/undefined` en la app pública | ✅ **0 ocurrencias** en `/`, `/properties`, `/properties/16`, `/servicios/venta`, `/publicaciones` |
| 6.3 | Codificación del mensaje pre-armado | ✅ Correcta: `¡Hola!` → `%C2%A1Hola!`, `gustaría` → `gustar%C3%ADa`, `¿Podría` → `%C2%BFPodr%C3%ADa`. Sin caracteres rotos |

Ejemplo real capturado del detalle de la propiedad 16:

```
https://wa.me/543513872817?text=Hola!%20Estoy%20interesado%20en%20la%20propiedad%3A%20%22Duplex%20Ubicado%20en%20Nueva%20Cordoba%22%20(ID%3A%2016).%20%C2%BFPodr%C3%ADa%20darme%20m%C3%A1s%20informaci%C3%B3n%3F
```

### 7. Separación admin / usuario — ✅ 11/11 (API + middleware)

**Endpoints admin-only atacados con la cookie de un usuario común:**

| Endpoint | Resultado |
|---|---|
| `GET /users` | ✅ **403** `Forbidden resource` |
| `DELETE /users/1` (otro usuario) | ✅ **403** |
| `GET /property-requests` | ✅ **403** |
| `GET /statistics?range=month` | ✅ **403** |
| `DELETE /properties/16` | ✅ **403** |
| `GET /notifications` sin sesión | ✅ **401** |

**Middleware del frontend (`localhost:3001`), con cookie real:**

| Escenario | Resultado |
|---|---|
| Usuario común → `/dashboardAdmin` | ✅ **307** → `/dashboard` (no se filtra contenido) |
| Usuario común → `/dashboard` | ✅ **200** |
| Anónimo → `/dashboard` | ✅ **307** → `/login?callbackUrl=%2Fdashboard` |
| Anónimo → `/dashboardAdmin` | ✅ **307** → `/login?callbackUrl=%2FdashboardAdmin` |
| Logueado → `/login` | ✅ **307** → `/dashboard` |

### 8. Rendimiento percibido — ✅ medido

Frontend en modo producción, promedio de 5 corridas por ruta:

| Ruta | TTFB | Total | HTML |
|---|---|---|---|
| `/` (ISR, cacheada) | 7 ms | **8 ms** | 309 KB |
| `/servicios/venta` (SSG) | 9 ms | **9 ms** | 110 KB |
| `/login` (estática) | 10 ms | **10 ms** | 22 KB |
| `/properties/16` (SSR + API) | 13 ms | **24 ms** | 134 KB |
| `/properties` (SSR + API) | 12 ms | **37 ms** | 167 KB |
| `/publicaciones` (`force-dynamic` + API) | 27 ms | **42 ms** | 93 KB |

Se ve con claridad el efecto de cada estrategia: las rutas cacheadas o prerenderizadas responden en menos de 10 ms, y las que consultan la API quedan entre 24 y 42 ms.

> **Honestidad sobre estos números:** son de `localhost` contra una base local. Miden el tiempo de render del servidor, **no** la experiencia real de un visitante (falta latencia de red, descarga de los ~250 KB de JS, y la ejecución en el dispositivo). Sirven para comparar rutas entre sí, no como promesa de performance en producción.

### Verificación con navegador real (Chrome headless)

Lo que `curl` no puede ver — que el JavaScript del cliente corre sin romperse en el build de producción:

| Ruta | DOM renderizado | Errores de runtime |
|---|---|---|
| `/` | 335 KB | ✅ 0 |
| `/properties` | 186 KB | ✅ 0 |
| `/properties/16` | 149 KB | ✅ 0 |
| `/publicaciones` | 110 KB | ✅ 0 |

Ninguna página mostró "Application error", "client-side exception" ni "Unhandled Runtime Error".

**Confirmaciones funcionales en el navegador:**

- **Catálogo:** renderiza las **10 tarjetas** de propiedad y muestra el **badge de valoración con estrella** — o sea, el `ratingAverage` que ahora viene en `/properties/filter` llega hasta el pixel. Esto valida de punta a punta el cambio de esta sesión.
- **Landing:** muestra **4 propiedades destacadas reales**, sin el mensaje "No hay propiedades disponibles". El ISR de 5 minutos está sirviendo contenido correcto.

### Cambios de contrato verificados en vivo

| Cambio | Confirmación |
|---|---|
| `GET /properties` → `{ data, meta }` | ✅ `meta: {"totalItems":14,"itemCount":2,"totalPages":7,"currentPage":1}` |
| `ratingAverage` en `/properties/filter` | ✅ Valores reales (`4`, `4`, `3.5`, `5`) y badge visible en el catálogo renderizado |
| `Notification.type` | ✅ `"estado_solicitud"` en una notificación real |
| CORS con credenciales | ✅ `Access-Control-Allow-Origin: http://localhost:3001` + `Allow-Credentials: true` |


### 2. Flujo completo de una propiedad (admin) — ✅ 11/11

| # | Prueba | Resultado |
|---|---|---|
| 2.1 | Login como admin | ✅ **201**, `role:"admin"` |
| 2.2 | `POST /properties` multipart con **3 imágenes PNG reales** | ✅ **201** — las 3 subieron a Cloudinary (ids 65, 66, 67) y la primera quedó como portada automáticamente. **El fix de multipart funciona de punta a punta**, no sólo en la foto de perfil |
| 2.3a | Aparece en `GET /properties` | ✅ Total pasó de 14 → 15 |
| 2.3b | Aparece en el catálogo del frontend (SSR) | ✅ |
| 2.3c | Su página de detalle responde | ✅ **200** |
| 2.4 | Editar: precio + borrar 1 imagen + agregar 1 + cambiar portada | ✅ **200** — precio `333333 → 444444`; imagen 67 eliminada, 68 agregada, portada movida a la 66. Las 4 operaciones en una sola request multipart |
| 2.5 | Cambiar estado `disponible → vendida` | ✅ **200** |
| 2.5b | Desaparece del catálogo público | ✅ `/properties/filter` ya no la lista (fuerza `status=disponible`) y el catálogo del frontend tampoco |
| 2.5c | El admin la sigue viendo | ✅ `GET /properties` la devuelve con `status:"vendida"` |
| 2.6 | `DELETE /properties/:id` | ✅ **200** "Propiedad 17 eliminada correctamente" |
| 2.6b | Desapareció de la API | ✅ Total volvió a 14; `GET /properties/17` → **404** |

### 4 (cont.). Notificación por coincidencia de preferencias — ✅ 2/2

Con el usuario QA teniendo guardadas estas preferencias (localidad `Cordoba`, operación `venta`, tipo `casa`, precio `300000`, `minRooms: 2`, `notifyNewMatches: true`), se publicó como admin una propiedad que las cumple:

| # | Prueba | Resultado |
|---|---|---|
| 4.8 | Se genera la notificación | ✅ Llegó **"¡Propiedad que te puede interesar!"** con **`type: "propiedad_match"`** y `propertyId: 17` |
| 4.9 | El contador la refleja | ✅ `unread-count` pasó a `{"count":1}` |

Es el ciclo completo: preferencia guardada → alta de propiedad que matchea → notificación con el `type` correcto → contador actualizado.

### 5. Comentarios de publicaciones — ocultar y mostrar — ✅ 6/6

**Este es el flujo que en la auditoría del 02/08 estaba roto (🔴-4).**

| # | Prueba | Resultado |
|---|---|---|
| 5.1 | `POST /posts` multipart (admin) | ✅ **201** — post 9 con imagen en Cloudinary |
| 5.2 | Un usuario comenta el post | ✅ **201**, `isHidden:false` |
| 5.4 | `PATCH /posts/comments/:id/hide` | ✅ **200** `{"isHidden":true,"message":"Comentario ocultado"}` |
| 5.5a | Visibilidad para **anónimo** | ✅ **0 comentarios** |
| 5.5b | Visibilidad para **usuario común** | ✅ **0 comentarios** |
| 5.5c | Visibilidad para **ADMIN** | ✅ **1 comentario con `isHidden: true`** ← **esto es lo que antes no pasaba**. Confirma que el `OptionalJwtAuthGuard` nuevo funciona y que el botón "Mostrar" es alcanzable |
| 5.7 | Mostrar de nuevo (mismo endpoint, es toggle) | ✅ **200** `{"isHidden":false,"message":"Comentario visible de nuevo"}` |
| 5.8 | El comentario vuelve a ser público | ✅ El anónimo lo ve otra vez |

> **Precisión metodológica:** también se miró el HTML del feed del frontend, pero ahí el resultado es **inconcluyente en ambos sentidos**: `PostCard` carga los comentarios recién cuando el usuario despliega la sección, así que el HTML del servidor trae 0 comentarios tanto si están ocultos como si no. La prueba válida es la de API, que sí es concluyente.

### 7 (cont.). La UI del admin no ofrece acciones que le darían 403 — ✅ 2/2

Verificado con **Chrome headless conectado por CDP**, inyectando la cookie de sesión real y midiendo el DOM **después de hidratar** (que es cuando `useAuth()` ya sabe el rol):

| Sesión | Corazones de favorito | Formulario de valorar | Aviso para admin |
|---|---|---|---|
| **Anónimo** | 1 (lleva a `/login` al clickear) | no | no — ve "Iniciá sesión para valorar" |
| **ADMIN** | ✅ **0** | ✅ no | ✅ **sí** — "…desde una cuenta de administrador no se puede valorar" |

Confirma en un navegador real el arreglo del punto 0.b: al admin ya no se le ofrecen las dos acciones que el backend le rechazaría con 403.

### 8 (cont.). El `revalidate = 300` de la Landing — ✅ funciona

Se publicó una propiedad nueva y se la valoró con 5★ (para que entrara en el top de Destacadas, que ordena por valoración):

| Momento | ¿La landing la muestra? |
|---|---|
| 17:14:50 — snapshot inicial | ❌ no (esperado: la página cacheada es anterior) |
| 17:18:18 — request 1 | ❌ no — **sirve la versión vieja y dispara la regeneración en segundo plano** |
| 17:18:22 — request 2 | ✅ **sí** |
| 17:18:25 — request 3 | ✅ sí (estable) |

La sección Destacadas pasó a incluir `/properties/17`. Es exactamente el comportamiento *stale-while-revalidate* esperado, **y ocurrió sin ningún build nuevo** — que era justo el bloqueante 🔴-1 de la auditoría.

---

## ❌ Falla encontrada

### 🟡-P4-3 — Soft 404: las páginas de detalle devuelven HTTP 200 cuando el recurso no existe

**Qué pasa:** al pedir una propiedad borrada o inexistente, el frontend muestra correctamente la pantalla de "no encontrado", pero el **status HTTP es 200**, no 404.

| Ruta | Status | ¿Muestra la UI de 404? |
|---|---|---|
| `/properties/999999` | ❌ **200** | sí |
| `/publicaciones/999999` | ❌ **200** | sí |
| `/servicios/inexistente` | ✅ 404 | sí |
| `/ruta-inventada` | ✅ 404 | sí |

**Por qué pasa:** existe `src/app/(public)/loading.tsx`, que convierte a todo el segmento público en una frontera de streaming. Next envía el shell de la página —con la cabecera HTTP ya escrita, status 200— *antes* de que la `page.tsx` termine de resolver. Cuando después se ejecuta `notFound()`, el status ya no se puede cambiar: sólo se puede transmitir la UI de error.

Las dos rutas que sí devuelven 404 correcto lo hacen porque se resuelven **antes** del streaming: `/servicios/:id` por el `dynamicParams = false` que se agregó en la sesión anterior, y una ruta inexistente porque no matchea ningún archivo.

**Por qué importa:** es un *soft 404* clásico. Google indexa esas URLs como páginas válidas con contenido "no encontrado", lo que ensucia el índice del sitio; y cualquier monitoreo que mire status codes va a reportar todo sano. Las publicaciones agravan el caso porque **caducan a los 7 días**: cada link compartido de una publicación vencida va a devolver 200.

**No es un bloqueante de despliegue**: el usuario ve la pantalla correcta y nada se rompe funcionalmente. Por eso queda como 🟡 y no 🔴.

**Solución sugerida:** mover la resolución del recurso a `generateMetadata()`, que Next ejecuta **antes** de empezar a transmitir la respuesta. Llamar a `notFound()` desde ahí sí fija el 404. Tiene el beneficio secundario de cerrar también el 🟡-5 pendiente (falta de metadata por página en `/properties/:id`), porque ese mismo `generateMetadata` es donde habría que poner el title/description/OpenGraph.

---

## 🧹 Limpieza de los datos de prueba

Todo lo creado durante estas pruebas fue eliminado y verificado:

| Ítem | Estado final |
|---|---|
| 3 usuarios `@test.local` | ✅ 0 restantes |
| Propiedad `[QA]` (con sus 4 imágenes de Cloudinary) | ✅ 0 restantes — total del catálogo de vuelta en 14 |
| Publicación `[QA]` | ✅ 0 restantes |
| Comentarios `[QA]` | ✅ 0 restantes |
| Solicitud de publicación `[QA]` | ✅ eliminada |
| Favoritos, ratings y preferencias | ✅ limpiados por CASCADE al borrar los usuarios |
| Promedio de la propiedad 16 | ✅ restaurado a **4** (su valor antes de las pruebas) |

---

## 📊 Resumen del Paso 4

**56 comprobaciones ejecutadas contra la aplicación real: 55 ✅ / 1 ❌**

| Bloque | Resultado |
|---|---|
| 1. Autenticación completa | ✅ 7/7 |
| 2. Flujo completo de propiedad (admin) | ✅ 11/11 |
| 3. Favoritos, comentarios, ratings | ✅ 7/7 |
| 4. Notificaciones | ✅ 8/8 |
| 5. Ocultar/mostrar comentarios de publicaciones | ✅ 6/6 |
| 6. WhatsApp | ✅ 3/3 |
| 7. Separación admin/usuario | ✅ 13/13 |
| 8. Rendimiento + revalidate | ✅ 7/7 |
| — | **1 falla: 🟡-P4-3 (soft 404)** |

### Hallazgos de este paso

| # | Categoría | Estado |
|---|---|---|
| 🔴-P4-1 | El backend corría código viejo (proceso anterior al `dist/`) | ✅ Resuelto reiniciando; queda como **advertencia para el pipeline de deploy** |
| 🟡-P4-2 | `ADMIN_PASSWORD` del `.env` no aplica sobre un admin ya existente | ⏳ Pendiente (documentación / log del backend) |
| 🟡-P4-3 | Soft 404 en `/properties/:id` y `/publicaciones/:id` | ✅ **Resuelto (03/08)** — ver la sesión final |

### Conclusión

**Los tres arreglos críticos de las sesiones anteriores quedaron confirmados funcionando contra la aplicación real, no sólo contra el código:**

1. **Multipart** — se crearon 3 imágenes reales en una propiedad nueva y se editaron (borrar una, agregar otra, cambiar portada) en una sola request. Sin errores.
2. **Ocultar/mostrar comentarios** — el admin ahora **sí** recibe los comentarios ocultos (antes no, y por eso la acción era irreversible). El ciclo ocultar → verificar invisibilidad para todos los demás → mostrar de nuevo funciona completo.
3. **ISR de la landing** — una propiedad publicada apareció en Destacadas dentro de la ventana de 5 minutos, sin rebuild. Era el 🔴 más grave de la auditoría.

Además se verificó en un navegador real que el admin ya no ve el corazón de favoritos ni el formulario de valoración, y que ninguna de las páginas públicas tiene errores de runtime en el build de producción.

**La única falla es un soft 404 que afecta SEO, no funcionalidad.** No bloquea el despliegue: puede corregirse junto con la metadata por página, que ya estaba pendiente y se arregla en el mismo lugar del código.

**Veredicto: la aplicación está lista para el paso de staging.** Lo único que hay que asegurar antes es operativo, no de código — que el pipeline de despliegue **compile antes de arrancar** y **reinicie el proceso**, porque el 🔴-P4-1 demostró que un backend con código viejo responde 200 a todo y no da ninguna señal de que algo esté mal.


---

# 🏁 SESIÓN FINAL — Re-verificación, fix del soft 404 y páginas de error (03/08/2026)

Entorno: backend recompilado y levantado limpio (`npm run build && npm run start:prod`) en `localhost:3000`; frontend en `localhost:3001` con `next start` (producción).

## 1. Re-verificación dirigida — el problema era el proceso viejo, no el código

Con el backend recién compilado, todo lo que el Paso 4 no había podido confirmar quedó confirmado:

| Verificación | Resultado |
|---|---|
| `GET /properties/filter` → `ratingAverage` | ✅ **Poblado**: `4`, `4`, `3.5`, `5`, `0`, `5` sobre 6 filas. **Cero `undefined`** |
| `GET /properties` → `ratingAverage` + `{ data, meta }` | ✅ Poblado, y `meta: {"totalItems":14,"totalPages":3,...}` |
| `GET /properties/:id` → `ratingAverage` | ✅ `4`, `3.5`, `5` en las tres propiedades consultadas |
| `Notification.type` | ✅ **105 notificaciones, 0 sin el campo.** Seis valores del enum en datos reales (`admin_nuevo_favorito` 28, `admin_nueva_valoracion` 24, `admin_nuevo_usuario` 21, `admin_nuevo_comentario` 18, `admin_nueva_solicitud` 6, `admin_comentario_publicacion` 6) **+ 2 `generica`** |
| `OptionalJwtAuthGuard` en `GET /posts/:id/comments` | ✅ Con un comentario oculto: anónimo ve **0**, admin ve **1 con `isHidden: true`**. Restaurado al terminar |
| `unread-count` resuelve por rol | ✅ `{"count":31}` para el admin |

> **Las 2 filas `generica`** son exactamente el caso legacy que motivó conservar la heurística de texto como fallback transitorio (ver la sesión de corrección). Confirma que esa decisión no era teórica: sin el fallback, esas dos notificaciones perderían su ícono y su categoría.

**Conclusión del punto 1:** el `ratingAverage: undefined` del Paso 4 era **100 % consecuencia del proceso desactualizado**. No había ningún bug de código.

## 2. Fix del soft 404 — el enfoque pedido no alcanzaba, y se comprobó

### Lo que se intentó primero (y por qué no funcionó)

Se movió la búsqueda del recurso a `generateMetadata()` en las dos rutas, con `cache()` de React para no duplicar la llamada al backend. **Resultado: seguía devolviendo 200.**

La premisa —"`generateMetadata` corre antes del streaming"— es falsa cuando existe un `loading.tsx` por encima: Next transmite el shell del loading primero, con la cabecera ya escrita, y los metadatos se resuelven después.

### El experimento que lo demostró

Se desactivó `src/app/(public)/loading.tsx`, se rebuildeó y se volvió a medir:

| Ruta | Con `loading.tsx` | Sin `loading.tsx` |
|---|---|---|
| `/properties/999999` | 200 ❌ | **404** ✅ |
| `/publicaciones/999999` | 200 ❌ | **404** ✅ |

Causa confirmada: la frontera de streaming, no la ubicación del fetch.

### La decisión

Un `loading.tsx` cubre su segmento **y todos sus hijos**, y padre e hijo comparten el path (`/properties` y `/properties/:id` tienen que vivir en la misma carpeta). **No se puede excluir sólo la ruta de detalle.** La elección era binaria:

| | Con loader | Sin loader |
|---|---|---|
| 404 real en detalle | ❌ | ✅ |
| TTFB `/properties` | 12 ms | 37 ms |
| TTFB `/properties/16` | 13 ms | 23 ms |
| Loader visible | sí, tras 250 ms | no |

Se priorizó el status correcto: es un requisito de corrección, mientras que el loader —por su propio diseño— sólo aparece pasados 250 ms, y **ninguna ruta pública supera los 45 ms**.

`Loadingpage.tsx` y `Escena3D.tsx` **se conservan íntegros y documentados**: revertir el trade-off es recrear `(public)/loading.tsx` renderizando ese componente. La decisión y su costo quedaron escritos en la cabecera del propio archivo.

### ⚠️ Un bug que introdujo el fix, encontrado al probarlo

Al ejercitar la app **con el backend caído**, `/properties/16` —una propiedad que existe— devolvía **404**. El `catch` de `getProperty` se tragaba cualquier error y lo traducía a "no existe".

Eso era **peor que el bug original**: un soft 404 sólo ensucia el índice; esto le afirma a Google que propiedades reales no existen. Una caída de unos minutos podía desindexar el catálogo entero.

**Corregido en ambas rutas:** sólo un **404 del backend** se traduce a `notFound()`; cualquier otro error se vuelve a lanzar para que lo tome `app/error.tsx` con un 500 honesto.

### Verificación final (`curl -I`, headers reales, backend arriba)

| Ruta | Status | |
|---|---|---|
| `/properties/999999` | **404** | ✅ |
| `/publicaciones/999999` | **404** | ✅ |
| `/servicios/inexistente` | **404** | ✅ (no se rompió) |
| `/ruta-inventada` | **404** | ✅ |
| `/properties/16` | 200 | ✅ |
| `/publicaciones/8` | 200 | ✅ |
| `/servicios/venta` | 200 | ✅ |
| `/properties`, `/` | 200 | ✅ |

### Beneficio secundario: se cerró el 🟡-5 (metadata por página)

`generateMetadata` quedó igual, así que `/properties/:id` —la ruta más compartida del sitio— dejó de heredar el title global. Capturado del HTML servido:

```html
<title>Duplex Ubicado en Nueva Cordoba | Cerca Trova</title>
<meta property="og:title" content="Duplex Ubicado en Nueva Cordoba">
<meta property="og:image" content="https://res.cloudinary.com/.../properties/...">
```

Ahora pegar el link de una propiedad en WhatsApp muestra título, descripción y foto de portada en vez del dominio pelado.

## 3 y 4. Páginas de error — nuevas

Antes no existía ninguna de las dos: Next servía su pantalla por defecto, en inglés y sin estilos ("404 | This page could not be found" / "Application error: a client-side exception has occurred").

### Componente base compartido — `shared/ui/StatusScreen.tsx`

Las dos pantallas comparten una sola base visual, tomada del lenguaje de la Landing: fondo `surface-mint`, número gigante de fondo en `brand-700/8` (decorativo, `aria-hidden`), ícono en círculo blanco con halo, eyebrow en píldora verde sólida (patrón de `SectionHeading`), `h1` en `ink-900` y botonera con `CtaButton`.

### `app/not-found.tsx` — 404

- **"404"** de fondo, ícono de brújula, eyebrow "Página no encontrada".
- Título: *"Esta página **no existe**"* (con "no existe" en verde de marca).
- Mensaje que cubre los tres casos reales: link mal escrito, propiedad despublicada, publicación vencida.
- **`CtaButton` "Volver al inicio"** (primary) + **"Ver propiedades"** (outlineDark).
- Pie: aclara que las publicaciones se borran a los 7 días.
- `robots: { index: false, follow: true }` para que un 404 rastreado no compita en el índice.

Verificado en Chrome headless — texto renderizado: `404 · Página no encontrada · Esta página no existe · Puede que el link esté mal escrito… · Volver al inicio · Ver propiedades`.

### `app/error.tsx` — error de runtime

Client Component (lo exige el `reset()` que le pasa Next).

- **"500"** de fondo, ícono de alerta, eyebrow "Algo salió mal".
- Título: *"Ups, **algo salió mal**"*.
- **Botón "Reintentar"** que llama a `reset()` — el ícono gira 180° en hover. No es `CtaButton` porque dispara una función en vez de navegar, pero replica su geometría exacta para que la fila quede pareja.
- **`CtaButton` "Volver al inicio"**.
- Loguea `error.digest` en consola (el identificador con el que Next correlaciona el error con el stack del servidor) y lo muestra en el pie para que el usuario lo pueda reportar.

**Probado de verdad, con el backend apagado:**

| Ruta | Con backend caído |
|---|---|
| `/properties` | **500** + la pantalla nueva: *"Ups, algo salió mal… Reintentar / Volver al inicio"* ✅ |
| `/` | **200** — el caché de ISR sigue sirviendo la última versión buena ✅ (comportamiento deseable) |

### Manejo de fallos de fetch del cliente — `shared/ui/ErrorState.tsx`

`app/error.tsx` sólo entra cuando una excepción **escapa del render**. Un `await api.get(...)` que falla dentro de un `useEffect` está atrapado por su propio `try/catch`, así que el boundary nunca se entera.

**El caso más grave, encontrado revisando el código:** el `catch` del catálogo sólo hacía `console.error`. Con el backend caído, el visitante veía el estado vacío —*"No encontramos propiedades. Probá ajustando los filtros"*— que es **directamente falso**: no falló ninguna búsqueda, falló la conexión. El usuario podía quedarse ajustando filtros indefinidamente.

Las pantallas que sí mostraban un `toast` estaban mejor, pero el toast se desvanece a los segundos y detrás queda el mismo estado vacío engañoso.

`<ErrorState />` reemplaza al contenido **y** al estado vacío, con la regla de que **"falló" le gana a "está vacío"** (cuando la petición no llegó, no sabemos si hay resultados). Mantiene la geometría de los estados vacíos existentes para que la pantalla no cambie de forma según qué salió mal, e incluye botón **Reintentar**.

Conectado en las tres pantallas principales de cara al usuario:

| Pantalla | Antes | Ahora |
|---|---|---|
| **Catálogo** (`Propertiescatalog`) | `console.error` — silencio total + estado vacío falso | `ErrorState` + Reintentar |
| **Feed de publicaciones** (`PostsFeed`) | toast que se desvanece | toast + `ErrorState` + Reintentar |
| **Favoritos** (dashboard) | toast que se desvanece | toast + `ErrorState` (compacto) + Reintentar |

## Checks finales

| Check | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ **0 errores** |
| `npm run lint` | ✅ **0 problemas** |
| `npm run build` | ✅ **39 rutas** (6 más que antes: las 6 de servicios prerenderizadas + las 2 páginas de error) |
| First Load JS compartido | 246 kB |

---

## 🏁 Veredicto final

**Sí: la aplicación está lista para pasar a staging.**

Los cuatro 🔴 de la auditoría original están cerrados y **verificados contra la aplicación corriendo**, no sólo contra el código. La única falla que había dejado el Paso 4 —el soft 404— está resuelta y comprobada con `curl -I`. Además se cerraron dos 🟡 que venían de arrastre (metadata por página, y el manejo de errores de red del lado cliente) y se agregaron las dos pantallas de error que no existían.

### Lo único a asegurar antes del deploy — y es operativo, no de código

**El pipeline tiene que compilar antes de arrancar, y reiniciar el proceso.** Esta sesión volvió a dejarlo en evidencia: el `ratingAverage: undefined` del Paso 4 no era un bug, era un backend sirviendo código viejo. Un proceso desactualizado **responde 200 a todo y no da ninguna señal de que algo esté mal** — es el fallo más difícil de detectar de todos los que aparecieron en esta auditoría.

### Pendientes que NO bloquean

| # | Qué | Nota |
|---|---|---|
| 🟡-P4-2 | `ADMIN_PASSWORD` del `.env` no aplica sobre un admin ya existente | Documentación / un log en el backend |
| 🟡-3 | El dashboard de usuario no tiene badge de notificaciones (el de admin sí) | UX |
| 🟡-5 (resto) | Falta metadata en `/`, `/properties` y `/servicios/:id`; la landing sigue sin `<h1>` | `/properties/:id` ya quedó resuelta |
| 🟡-6 | Sin `robots.txt` ni `sitemap.xml` | Requiere definir el dominio público |
| 🟡-8 | `posts.service.ts` usa `'multipart/form-data'` donde los otros 3 usan `undefined` | Funciona; es inconsistencia |
| 🟡-10 | 11 lugares con `toLocaleDateString` en vez de `fecha.ts` | Renderiza en el huso del visitante |
| 🟡-11 | Assets pesados en `public/` (`chicaMudandose.jpg` 10,7 MB, favicon 1 MB) | Recomprimir |
| 🟡-12 | `<html lang="en">` en un sitio en español | Un carácter |
| 🟡-13 | `callbackUrl` se escribe pero no se lee | UX de login |
| 🟡-9 (resto) | Archivos muertos sin borrar (`HeaderSearch`, `FiltersPanel `, `SearchBar`, `PropertiesList`, `DashboardUser/`, `(user)/`) | Higiene |
| — | **Decisión abierta:** se sacó el loader de transición para poder devolver 404 reales | Revertible recreando `(public)/loading.tsx`; el costo de cada opción está medido más arriba |


---

# 📋 INFORME ORIGINAL (02/08/2026)

> Lo que sigue es la auditoría tal como se emitió. Los ítems marcados arriba como resueltos se conservan por trazabilidad.

---

## ✅ FUNCIONA CORRECTAMENTE Y ESTÁ LISTO

### Verificación técnica
- **`npm run build` ✅** — compila en 2.5 min con Turbopack, genera **33 rutas**, 0 errores. La zona pública prerenderiza y las rutas con `params`/`searchParams` quedan correctamente marcadas como dinámicas (`ƒ`).
- **`npx tsc --noEmit` ✅** — **cero errores** en modo `strict`. Es notable en un proyecto de ~140 archivos sin tests.
- **ESLint sobre `src/`: 23 warnings, 0 errores.** Son imports olvidados (`Link`, `Image`, íconos de lucide) y 2 `react-hooks/exhaustive-deps`. Ninguno afecta comportamiento. (⚠️ El *script* `npm run lint` sí está roto — ver 🟡.)
- **`npm run dev` arranca** y sirve en el puerto 3000.

### Contrato con el backend
- **Los enums coinciden exactamente.** Verificado uno por uno contra §2 de `API_CONTRACT.md`, incluidos los tres casos trampa: `OperationType.ALQUILER_TEMPORAL = 'temporal'` (no `'alquiler_temporal'`), `StatusProperty.PAUSADO = 'en pausa'` (**con espacio**) y `baños` **con ñ** en `CreateRequestPropertyDto`. Los selects de `/publicar` (`TIPOS_PROPIEDAD`, `TIPOS_OPERACION`, `ESTADOS`) y de `PropertyForm` (`STATUS_OPTIONS`, `OP_OPTIONS`) usan los valores literales del backend. **Cero valores inventados o viejos.**
- **`VALID_REQUEST_TRANSITIONS`** (`shared/types/api.ts:45`) replica exactamente la máquina de estados del backend, y las dos pantallas de solicitudes (`dashboardAdmin/solicitudes/page.tsx`, `usuarios/[id]/page.tsx`) sólo ofrecen botones para transiciones válidas vía `canTransition()`. Un `aceptado` no muestra ninguna acción. Esto evita 409s por diseño.
- **`getErrorMessage()` está adoptado de forma consistente** en todos los `catch` de formularios, borrados y acciones. Maneja los 4 shapes del contrato: `message` string (§1.a), `message` array de class-validator (§1.b, une los primeros 3 con ` · `), 429 con mensaje propio (§1.d, porque el del backend es `"ThrottlerException: Too Many Requests"`, no mostrable) y error de red sin `response`.
- **El interceptor 401** (`shared/lib/axios.ts`) limpia sesión + toast + redirect, y excluye correctamente `/auth/*` (los 401 de `/auth/me`, `/auth/login`, `/auth/logout` y `/auth/google` los maneja cada caller). 403/404/409/502 pasan intactos al componente.
- **`withCredentials: true`** está en la instancia, aplicado a **todas** las requests incluidas las públicas — condición obligatoria según §0 del contrato para que viajen `access_token` **y** `ct_vid` (cookie de visitante para telemetría).
- **`GET /statistics`** consume la respuesta *overview* de las 11 secciones en **un solo fetch**, y `modules/statistics/types.ts` es un espejo exacto de §19 (incluidos `rangeApplies`, `minRatings` y `uniqueVisitors`). La pantalla incluso explica en texto por qué el selector de rango no aplica a Favoritos y Valoraciones (`rangeApplies: false`, porque esas tablas no guardan fecha).
- **`GET /notifications/unread-count`** — el frontend ya migró al endpoint nuevo en `NavbarPrivate`, en vez del patrón viejo de traer la lista completa cada 60s para contar en JS.

### Seguridad
- **`/dashboardAdmin` tiene doble capa real.** Middleware (`src/middleware.ts:33`) exige token **y** `role === 'admin'`; el layout (`dashboardAdmin/layout.tsx:360-376`) vuelve a verificar y además hace `if (!user || user.role !== 'admin') return null` **antes de renderizar**, así que ni siquiera hay un flash del panel.
- **Cero datos sensibles en almacenamiento del cliente.** Grep exhaustivo de `localStorage` → **0 resultados**. `sessionStorage` se usa en un único lugar (`pendingNotifSession.ts`) y sólo guarda una marca booleana `ct_pending_notif_<id> = '1'` de "ya mostré el toast", que además se limpia en `logout()`. `document.cookie` → 0 resultados: las cookies son `httpOnly` y el frontend nunca las lee.
- **El frontend no confía en el cliente para permisos.** Casos concretos verificados:
  - `FavoriteButton` esconde nada: si `!user` **redirige a `/login`** en vez de intentar la llamada; y aunque se forzara, `POST /favorites/:id` exige JWT y el `userId` sale del token, nunca de la URL.
  - `CommentModeration` ofrece "Ocultar/Eliminar", pero `PATCH /posts/comments/:id/hide` y `DELETE` son **ADMIN** en el backend; un usuario común que llame a mano recibe 403.
  - Las transiciones de estado se filtran en la UI **y** el backend valida la máquina de estados con 409.
  - `middleware.ts:27` usa `decodeJwt` de `jose`, que **sólo decodifica, no verifica firma** — y está documentado en el propio código como "UX/redirección". Es la decisión correcta: la autorización real la hace el backend en cada request.
- **El "admin navegando a `/dashboard`" ya no es el bug de UX documentado: ahora es una feature intencional.** Hay context-switcher explícito en los dos sentidos — el sidebar admin tiene "Vista de Usuario" (👁 → `/dashboard`) y el sidebar de usuario muestra "Panel Admin" (🛡 → `/dashboardAdmin`) **condicionado a `user.role === 'admin'`**. Se resolvió por diseño, no quedó pendiente.

### Funcionalidad
- **Publicar propiedad (admin):** crear / editar / borrar / cambiar estado / gestión de imágenes y portada — completo. El bug de multipart está resuelto en los tres call-sites críticos (`PropertyForm` y los dos `perfil`) con `{ headers: { 'Content-Type': undefined } }`, que es la solución correcta: con `application/json` el `transformRequest` de axios hace `JSON.stringify(formDataToJSON(data))` y **pierde los archivos**. Límite de 10 imágenes, validación client-side de tipo y ≤5 MB con `validateImageFile()`, `revokeObjectURL` al remover.
- **Favoritos, comentarios y valoraciones funcionan desde el detalle** tras el rediseño. `PropertyDetail.tsx` incluye `FavoriteButton`, `CommentsAndRatings` con `StarPicker`, y crear/editar/eliminar comentario. También la vista lista del catálogo (`PropertyRow`) tiene favorito **funcional** — el corazón decorativo sin `onClick` que había en `PropertyCardList` desapareció con el rediseño.
- **Enlaces de WhatsApp del sitio público: correctos.** `shared/lib/contact.ts` centraliza `WHATSAPP_NUMBER = '543513872817'` (formato wa.me válido: país + área sin 0 y sin 15) y `whatsappLink()` aplica **`encodeURIComponent`**, así que tildes, ñ, comillas y signos `¿¡` viajan bien. Los mensajes pre-armados existen para: contacto general (footer), por servicio (landing y `/servicios/:id`), por propiedad (detalle y vista lista, con título e ID) y por publicación.
- **Compartir publicación: funciona de punta a punta.** `PostCard` usa `navigator.share` con fallback a `navigator.clipboard` + toast, el link apunta a `/publicaciones/:id` — **una ruta real**, no al feed — y esa ruta tiene `generateMetadata` con **OpenGraph** (título, descripción e imagen), así que la previsualización en WhatsApp/Instagram muestra la publicación y no el dominio pelado.
- **Notificaciones (admin): el badge funciona bien.** El sidebar de `/dashboardAdmin` muestra contador total y por categoría (usuarios/solicitudes/comentarios/valoraciones/favoritos), con polling de 60s **más** un listener del evento DOM `notif-updated` que emiten todas las acciones de "marcar como leído" — por eso no queda desincronizado tras una acción.
- **Estados de carga:** hay skeletons o spinners en prácticamente todas las pantallas que hacen fetch — catálogo (8 skeletons en grilla / 5 en lista), `PropertyForm`, estadísticas, publicaciones, notificaciones, favoritos, comentadas, valoradas, y los dos layouts de dashboard con spinner mientras `isLoading`.
- **Imágenes:** sólo 4 usos de `<img>` nativo, **todos** con `eslint-disable` y justificados (previews `blob:`/`data:` y URLs de Cloudinary en vistas de admin). El resto usa `next/image` con `sizes` apropiados (`PropertyCard`, `PropertyRow`, galería del detalle con `priority` en la primera foto).
- **Accesibilidad de movimiento:** `globals.css` tiene un bloque `@media (prefers-reduced-motion: reduce)` **global**, correctamente implementado con `0.01ms` en vez de `none` — el detalle no obvio es que con `animation: none` los eventos `animationend`/`transitionend` nunca disparan y cualquier componente que los espere queda colgado.
- **Fechas deterministas:** `shared/lib/fecha.ts` resuelve bien un bug real de hidratación (Node y Chrome arman `toLocaleDateString` distinto) fijando `America/Argentina/Buenos_Aires` con `Intl.formatToParts`.
- **Sin imports circulares.** El único riesgo real (`axios → AuthContext → auth.service → axios`) está roto a propósito con `shared/lib/authEvents.ts`, y el mismo patrón se repitió en `pendingNotifSession.ts`. `tsc` y el build lo confirman.

---

## 🔴 RIESGO — URGENTE ANTES DE DESPLEGAR

### 🔴-1. ✅ RESUELTO (03/08) — La landing (`/`) se prerenderiza estática y hoy tiene "No hay propiedades" horneado en el HTML

- **Qué es:** `/` aparece como `○ (Static)` en el build. `FeaturedProperties` es un Server Component `async` que llama a `propertiesService.getAll()` (axios, no `fetch`), y el segmento **no declara `dynamic` ni `revalidate`**. Next lo prerenderiza **en tiempo de build**, y como el `try/catch` devuelve `[]` cuando la API no responde, ese estado vacío queda congelado.
- **Dónde:** `src/app/(public)/page.tsx` (sin `export const dynamic`/`revalidate`) + `src/modules/landing/components/Featuredproperties.tsx:37-45`.
- **Evidencia dura:** el archivo generado `.next/server/app/index.html` (254 KB) **contiene el texto literal `"No hay propiedades disponibles en este momento"`**. Ese es el HTML que se serviría hoy en producción.
- **Por qué importa:** es la página de entrada del sitio. Aunque el backend esté perfecto en producción, la landing va a seguir mostrando "no hay propiedades" **hasta el próximo build** — no hay revalidación que la arregle sola. Y en el mejor caso (API arriba durante el build), las destacadas quedan congeladas en los valores del build y nunca reflejan altas, bajas ni cambios de valoración.
- **Solución sugerida:** agregar en `src/app/(public)/page.tsx` una de estas dos líneas, según el comportamiento deseado:
  - `export const revalidate = 300;` → ISR, la landing se regenera cada 5 min (recomendado: mantiene la velocidad de estático y refresca solo).
  - `export const dynamic = 'force-dynamic';` → SSR en cada request (es lo que ya se hizo en `/publicaciones`, que sí tiene `force-dynamic`; conviene ser consistente y decidir el criterio para las dos).

### 🔴-2. ✅ RESUELTO (03/08) — `NEXT_PUBLIC_API_URL` cae en silencio a `localhost:3000`, y no hay `.env.example`

- **Qué es:** dos archivos hacen `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'` **sin ningún aviso**: `shared/lib/axios.ts:5` y `shared/lib/tracking.ts:11`. El `.env` del repo tiene hoy exactamente ese valor de desarrollo.
- **Dónde:** `src/modules/shared/lib/axios.ts:5`, `src/modules/shared/lib/tracking.ts:11`, `.env`.
- **Por qué importa:** las variables `NEXT_PUBLIC_*` se **hornean en el bundle en tiempo de build**, no se leen en runtime. Si el pipeline de despliegue buildea sin la variable seteada, el sitio compila, arranca y se ve perfecto — pero **todas** las llamadas del cliente van a `localhost:3000` del navegador del visitante y fallan. No hay ningún error de build ni warning que lo delate. Agrava el problema que no existe `.env.example` (`.gitignore` excluye `.env*` completo), así que quien despliegue no tiene una lista de qué setear.
- **Solución sugerida:** (a) crear `.env.example` con `NEXT_PUBLIC_API_URL=` y `NEXT_PUBLIC_GOOGLE_CLIENT_ID=` (nombres sin valores); (b) sacar el fallback o al menos hacerlo ruidoso, p. ej. `if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === 'production') throw new Error('NEXT_PUBLIC_API_URL no está definida')`. Es el mismo criterio que ya aplica el backend, que **aborta el arranque** si le faltan `JWT_SECRET`/`GOOGLE_CLIENT_ID`/`EMAIL_FROM`.

### 🔴-3. ✅ RESUELTO (03/08) — `/preview-ui` se buildea y se sirve en producción

- **Qué es:** la ruta de preview del sistema de diseño, documentada **en su propio archivo** como "TEMPORAL, BORRAR AL CERRAR EL REDISEÑO", figura en el build como ruta estática pública de 221 kB.
- **Dónde:** `src/app/preview-ui/page.tsx`.
- **Por qué importa:** queda accesible en `https://<dominio>/preview-ui` para cualquiera. No expone datos ni endpoints, pero es una página interna de trabajo publicada en el sitio de una inmobiliaria, e indexable por Google (no hay `robots.txt` que lo impida — ver 🟡-6).
- **Solución sugerida:** borrar la carpeta antes del deploy. Si se quiere conservar para desarrollo, envolverla en `if (process.env.NODE_ENV === 'production') notFound();`.

### 🔴-4. ✅ RESUELTO (03/08) — Moderar comentarios de publicaciones es un camino de ida: ocultar uno lo hace desaparecer del panel

- **Qué es:** `CommentModeration` muestra badge "Oculto", fondo ámbar y botón **"Mostrar"** para revertir. Pero según `API_CONTRACT.md` §17, `GET /posts/:id/comments` **es `@Public()` y NO lleva `OptionalJwtAuthGuard`** (a diferencia de `GET /posts`, que sí lo tiene); y por §20, `@Public()` cortocircuita `JwtAuthGuard` **sin ejecutar passport**, así que `req.user` queda vacío **aunque quien llame sea el admin**. El backend filtra los `isHidden: true` para todos, admin incluido.
- **Dónde:** `src/app/(admin)/dashboardAdmin/publicaciones/CommentModeration.tsx:29-45` (fetch) y `:137-141, 191-195` (botón "Mostrar"); `modules/posts/services/posts.service.ts:48`.
- **Por qué importa:** el admin oculta un comentario, la lista se recarga y el comentario **ya no está**. El botón "Mostrar", el badge "Oculto" y la rama `reply.isHidden` del código son **inalcanzables**. En la práctica "ocultar" se comporta como "eliminar sin confirmación", y no hay forma desde la UI de revertirlo.
- **Solución sugerida:** es un **desacople con el backend** — la corrección natural es agregar `OptionalJwtAuthGuard` a `GET /posts/:id/comments` en el backend (dejándolo simétrico con `GET /posts` y con `GET /properties/:id/comments`, que sí lo tiene). Mientras tanto, del lado del front conviene no prometer lo que no se puede cumplir: cambiar el copy de "Ocultar" y avisar en el `confirmDialog` que la acción no se puede revertir desde el panel.

---

## 🟡 MEJORA RECOMENDADA

### 🟡-1. ✅ RESUELTO (03/08) — `npm run lint` es inusable: reporta 36.800 problemas, de los cuales 36.777 son basura

- **Qué es:** el script es `"lint": "eslint"` sin argumento de path. Con flat config de ESLint 9 eso lintea el **directorio actual completo**, y el `ignores` de `eslint.config.mjs` excluye `.next/**` pero **no** `.next-build/**` ni `.next-verify/**`, que son los directorios alternativos que crea el truco de `NEXT_DIST_DIR` de `next.config.ts`.
- **Dónde:** `package.json:9`, `eslint.config.mjs:13-21`.
- **Medición exacta:** `.next-verify` → 20.873 problemas · `.next-build` → 15.904 · **`src` → 23**.
- **Por qué importa:** el linter no sirve como gate de calidad ni de CI: nadie va a leer 36.800 líneas, y los 23 warnings reales quedan sepultados. Además tarda minutos en correr.
- **Solución sugerida:** una línea — cambiar el script a `"lint": "eslint src"`, **o** agregar `".next-*/**"` al array `ignores`. Después, limpiar los 23 warnings reales (son 21 imports sin usar y 2 `exhaustive-deps`).

### 🟡-2. ✅ RESUELTO (03/08) — `three` (motor 3D completo) viaja en el bundle de TODA la zona pública

- **Qué es:** `(public)/loading.tsx` importa `Loadingpage`, que hace `import * as THREE from "three"` de forma **estática**. Como `loading.tsx` es la frontera de Suspense del segmento `(public)`, ese chunk entra en el First Load JS de `/`, `/properties`, `/properties/:id`, `/servicios/:id` y `/publicaciones`.
- **Dónde:** `src/app/(public)/loading.tsx:1` → `src/modules/landing/components/Loadingpage.tsx:4`.
- **Medición (build):** rutas públicas **357–401 kB** de First Load vs. rutas de dashboard **~225 kB**. El delta de ~130 kB es three.js + swiper.
- **Por qué importa:** es peso crítico en las páginas que el visitante ve primero, para una escena decorativa que además **el propio componente ya difiere 250 ms** y que en navegaciones rápidas no llega a verse nunca. El código difiere la *inicialización* de WebGL, pero el bundle viaja igual.
- **Solución sugerida:** `const Escena3D = dynamic(() => import('./Escena3D'), { ssr: false })` — extraer la parte que usa THREE a su propio archivo y cargarla con `next/dynamic`. El loader sigue funcionando idéntico y la zona pública baja ~130 kB. Nota: `recharts` ya está bien aislado (sólo pesa en `/dashboardAdmin/estadisticas`), así que el patrón ya existe en el proyecto.

### 🟡-3. ⏳ PENDIENTE — El dashboard de USUARIO no tiene badge de notificaciones (el de admin sí)

- **Qué es:** el badge rojo con número blanco vive en `NavbarPrivate` (`NotificationBell`). Pero `NavbarSelector` devuelve `null` para **todo** lo que empiece con `/dashboard`. Dentro de `/dashboard/*` el navbar no se monta, y el sidebar de usuario (`dashboard/layout.tsx`) **no tiene ningún contador**: su `NavGroup` de "Notificaciones" no recibe `badge` y ese `NavGroup` local ni siquiera acepta esa prop (a diferencia del de admin, que sí).
- **Dónde:** `src/app/(private)/dashboard/layout.tsx:59-112` (el `NavGroup` sin badge) y `:180-191`; comparar con `src/app/(admin)/dashboardAdmin/layout.tsx:100-168` y `:286-299`.
- **Consecuencia secundaria:** `dashboard/notificaciones/page.tsx:263,275` emite el evento `notif-updated`, pero **dentro del dashboard de usuario no hay ningún listener** (los dos listeners son `NavbarPrivate`, que no está montado, y el layout admin). El evento se dispara al vacío.
- **Por qué importa:** el usuario ve el contador en el sitio público, entra a su panel y el contador desaparece. Justo en la pantalla donde más lo necesita.
- **Solución sugerida:** replicar en `dashboard/layout.tsx` lo que ya hace el layout admin, pero con el endpoint liviano: `GET /notifications/unread-count` (devuelve `{ count }` y resuelve el rol desde el token), polling de 60s + listener de `notif-updated`, y pasar el número como `badge` al `NavGroup` de Notificaciones.

### 🟡-4. ✅ RESUELTO (03/08) — Sin `timeout` en axios: si el backend cuelga, la landing cuelga

- **Qué es:** `axios.create({ baseURL, withCredentials, headers })` no define `timeout`, así que el default es **0 = sin límite**.
- **Dónde:** `src/modules/shared/lib/axios.ts:4-10`.
- **Por qué importa:** en los Server Components (`Featuredproperties`, `properties/page.tsx`, `properties/[id]/page.tsx`, `publicaciones/page.tsx`) una API lenta o colgada bloquea la respuesta HTTP indefinidamente. **Se observó en esta auditoría:** con el backend caído, una request a `/` no respondió en más de 4 minutos. El `try/catch` no ayuda porque nunca se rechaza.
- **Solución sugerida:** `timeout: 15000` en la instancia. `getErrorMessage()` ya cubre el caso (un timeout llega sin `error.response` → devuelve el mensaje de conexión).

### 🟡-5. ⚠️ PARCIAL (03/08: `/properties/:id` resuelta) — Falta metadata por página en las 4 rutas más indexables, y la landing no tiene `<h1>`

- **Qué es:** hay `metadata` sólo en 3 lugares: el layout raíz (global), `(public)/publicaciones/page.tsx` y `generateMetadata` en `publicaciones/[id]` (el único con OpenGraph). **No hay metadata propia en `/`, `/properties`, `/properties/:id` ni `/servicios/:id`** — las cuatro heredan el title global "Cerca Trova - Inmobiliaria". Además, **la landing no emite ningún `<h1>`**: el hero usa `<h2>` (`Slider.tsx:275`) y `SectionHeading` — el encabezado de todas las secciones — también emite `<h2>` (`SectionHeading.tsx:35`). `/publicaciones` tiene el mismo problema (título de página en `<h2>`).
- **Dónde:** `src/app/(public)/page.tsx`, `properties/page.tsx`, `properties/[id]/page.tsx`, `servicios/[id]/page.tsx`; `modules/landing/components/Slider.tsx:275`, `SectionHeading.tsx:35`.
- **Por qué importa:** `/properties/:id` es la página que más se comparte y la que más tráfico orgánico debería captar; hoy cada propiedad se indexa con el mismo título genérico y sin OpenGraph, así que compartir una propiedad por WhatsApp muestra el dominio pelado. Y una home sin `h1` es de las señales más básicas que revisa cualquier auditoría SEO.
- **Solución sugerida:** (a) `generateMetadata` en `properties/[id]` con título, descripción y `openGraph.images` a partir de la portada — **ya existe el patrón exacto copiable en `publicaciones/[id]/page.tsx:27-47`**; (b) `metadata` estática en `/`, `/properties` y `/servicios/[id]`; (c) convertir el `<h2>` del hero en `<h1>` (o agregar una prop `as` a `SectionHeading`). El resto de la jerarquía está bien: `/properties`, `/properties/:id`, `/servicios/:id`, `/publicar` y las páginas de dashboard sí tienen `h1` único.

### 🟡-6. ⏳ PENDIENTE — No existen `robots.txt` ni `sitemap.xml`

- **Qué es:** verificado — no hay archivos en `public/` ni `robots.ts`/`sitemap.ts` en `src/app/` (que es como Next 15 los genera).
- **Dónde:** ausentes.
- **Por qué importa:** sin `sitemap.xml`, Google descubre las propiedades sólo por crawling de links; sin `robots.txt` no hay forma de excluir `/preview-ui`, `/dashboard*` ni `/login` de la indexación.
- **Solución sugerida:** crear `src/app/robots.ts` (permitir `/`, `/properties*`, `/servicios*`, `/publicaciones*`; bloquear `/dashboard`, `/dashboardAdmin`, `/preview-ui`, `/login`, `/register`) y `src/app/sitemap.ts` que liste las rutas estáticas más las propiedades de `GET /properties`. Requiere una variable nueva con el dominio público (p. ej. `NEXT_PUBLIC_SITE_URL`).

### 🟡-7. ✅ RESUELTO (03/08) — Los links de WhatsApp del panel admin se rompen con teléfonos reales

- **Qué es:** tres lugares arman el link a mano desde el teléfono del usuario, sin normalizar el código de país ni contemplar `null`:
  - `usuarios/page.tsx:346` → `https://wa.me/${phone.replace(/\D/g,'')}`
  - `usuarios/[id]/page.tsx:468` → `https://wa.me/${user.phone?.replace(/\D/g,'')}`
  - `solicitudes/page.tsx:380` → `https://wa.me/${r.user?.phone?.replace(/\D/g,'')}`
- **Por qué importa:** dos fallas concretas. (1) `User.phone` es `string | null` en el contrato, y los usuarios creados por Google llegan con `phone: ''` — el optional chaining devuelve `undefined` y el template literal genera literalmente **`https://wa.me/undefined`**. (2) `wa.me` exige el número en formato internacional; un usuario que se registró escribiendo "351 387 2817" produce `3513872817` sin el `54`, y WhatsApp no lo encuentra. Es la vía principal de contacto del negocio.
- **Solución sugerida:** agregar a `shared/lib/contact.ts` un `waLinkToPhone(phone: string | null)` que normalice (quitar no-dígitos, quitar `0` inicial y `15` de área, anteponer `54` si falta) y devuelva `null` si no hay teléfono válido — y que el botón no se renderice en ese caso. Es un solo helper para los tres call-sites, en el mismo archivo que ya centraliza el número propio.

### 🟡-8. ⏳ PENDIENTE — `posts.service.ts` usa el `Content-Type` que los otros tres archivos documentan como el bug

- **Qué es:** `posts.service.ts:33` manda `{ 'Content-Type': 'multipart/form-data' }`, mientras `PropertyForm.tsx:287` y los dos `perfil/page.tsx` usan `{ 'Content-Type': undefined }` con un comentario que dice explícitamente que forzar `'multipart/form-data'` "manda el header SIN boundary → el backend no puede parsear el archivo → 400. Mismo bug que se corrigió en PropertyForm".
- **Dónde:** `src/modules/posts/services/posts.service.ts:32-34`.
- **Estado real:** **no está roto hoy.** Se verificó contra el código de axios 1.13.4 instalado: con ese valor `hasJSONContentType` es `false`, así que `transformRequest` deja pasar el `FormData`; y el adaptador XHR hace `headers.setContentType(undefined)` para FormData en el browser (`dist/node/axios.cjs:3756-3758`), delegando el boundary al navegador. La subida de publicaciones funciona.
- **Por qué importa igual:** el proyecto tiene dos patrones contradictorios para lo mismo, y tres archivos afirman por escrito que el que usa el cuarto es el bug. Es una trampa para quien venga después: si alguien "unifica" copiando el patrón de `posts.service` a los otros, o si cambia el default de la instancia de axios, el bug vuelve de verdad.
- **Solución sugerida:** unificar en `{ 'Content-Type': undefined }` y dejar un solo comentario explicativo (idealmente, un helper `multipartConfig` exportado desde `shared/lib/axios.ts`).

### 🟡-9. ⚠️ PARCIAL (03/08, sólo `gsap`) — Código muerto confirmado, listo para borrar

Verificado por grep de imports en toda la base (no estimado):

| Archivo / módulo | Estado |
|---|---|
| `modules/properties/components/HeaderSearch.tsx` | **Cero importadores** |
| `modules/properties/components/FiltersPanel .tsx` (24 KB, ⚠️ nombre con espacio antes de `.tsx`) | Sólo lo importa `HeaderSearch` → muerto transitivamente. Reemplazado por `FiltersModal` |
| `modules/properties/components/SearchBar.tsx` | Sólo lo importa `HeaderSearch` → muerto transitivamente. Reemplazado por `PropertySearchBar` |
| `modules/properties/components/PropertiesList.tsx` | **Cero importadores** |
| `modules/DashboardUser/` | 5 archivos de **0 bytes**, cero importadores. **Sigue sin eliminarse**, como estaba documentado |
| `app/(user)/layout.tsx` | Route group **sin páginas**. **Sigue sin eliminarse**. El propio archivo se autodocumenta como candidato a borrar |
| `gsap` en `package.json` | Cero imports en `src/` — se fue con el rediseño del hero y quedó la dependencia |

Son ~30 KB de código y una dependencia. Ninguno afecta el bundle (tree-shaking los descarta), así que es higiene, no performance. **Nota:** `swiper` ya **no** es dependencia muerta — hoy se usa de verdad en `Slider.tsx` y `Reseñas.tsx`.

### 🟡-10. ⏳ PENDIENTE — Fechas con el huso del visitante en 11 lugares, pese a existir `shared/lib/fecha.ts`

- **Qué es:** `fecha.ts` existe justamente para esto y está bien hecho, pero sólo lo importan **2 archivos** (`PropertyDetail.tsx`, `PostCard.tsx`). Otros **11** siguen con `new Date(iso).toLocaleDateString('es-AR', {...})`.
- **Dónde:** `dashboard/mis-solicitudes/page.tsx:345`, `dashboard/comentadas/page.tsx:137`, `dashboard/notificaciones/page.tsx:106`, `dashboardAdmin/usuarios/page.tsx:200`, `usuarios/[id]/page.tsx:456,651`, `notificaciones/notifShared.tsx:114`, `publicaciones/page.tsx:170`, `publicaciones/CommentModeration.tsx:239`, `estadisticas/page.tsx:401`, `statistics/components/charts.tsx:312`.
- **Por qué importa:** no rompe la hidratación (los 11 están en componentes `'use client'` dentro de dashboards que no se prerenderizan con datos), pero sí renderizan en el huso **del visitante**, no en el de Argentina. Un usuario en otro huso ve "Enviado el 29 de julio" para algo enviado el 30 a la noche.
- **Solución sugerida:** reemplazar por `fechaLarga` / `fechaCorta` / `fechaConHora` / `fechaCortaConHora` según el caso. Es un reemplazo mecánico.

### 🟡-11. ⏳ PENDIENTE — Assets desmedidos en `public/`

- **Qué es:** `chicaMudandose.jpg` pesa **10,7 MB**; `imagenLogin.jpg` 4,7 MB; hay ~20 PNG de ~2 MB cada uno; `favicon.ico` pesa **1 MB** y `src/app/icon.png` **1,4 MB**.
- **Por qué importa:** `next/image` optimiza y cachea, así que el usuario final no descarga los 10 MB — pero sí se paga en la **primera** request de cada imagen (el servidor tiene que decodificar un JPG de 10 MB), en el tamaño del repo y en el tiempo de deploy. El favicon sí se sirve tal cual: **1 MB de favicon** se descarga en cada visita.
- **Solución sugerida:** recomprimir los originales a ≤400 KB (son fotos, no diseños con transparencia: los PNG de 2 MB deberían ser JPG/WebP) y regenerar el favicon a un `.ico` de 32×32 (~15 KB).

### 🟡-12. ⏳ PENDIENTE — `<html lang="en">` en un sitio 100% en español

- **Dónde:** `src/app/layout.tsx:36`.
- **Por qué importa:** afecta a lectores de pantalla (pronunciación), a la corrección ortográfica del navegador y es una señal de idioma para buscadores.
- **Solución sugerida:** `<html lang="es-AR">`. Un carácter de esfuerzo.

### 🟡-13. ⏳ PENDIENTE — `callbackUrl` se escribe pero nunca se lee

- **Qué es:** el middleware arma `/login?callbackUrl=<ruta>` (`middleware.ts:19`), pero ni `LoginForm` ni `AuthContext.handleAuthSuccess` lo leen: después de autenticarse siempre se redirige al dashboard según rol.
- **Dónde:** `src/middleware.ts:19`; `src/modules/shared/context/AuthContext.tsx:69-86`.
- **Por qué importa:** un usuario que abre un link directo a `/dashboard/favoritos` sin sesión loguea y aterriza en `/dashboard`, perdiendo su destino. Era un pendiente ya documentado y sigue abierto.
- **Solución sugerida:** en `handleAuthSuccess`, leer `useSearchParams().get('callbackUrl')` y usarlo si es una ruta interna (validar que empiece con `/` y no con `//`, para no habilitar un open redirect).

---

## 🔵 REFORZAR A FUTURO

- **Cero tests.** No hay `test` en `package.json` ni ningún framework instalado. El backend sí tiene suites de guards precisamente para detectar guards decorativos. Un mínimo razonable acá: tests de `getErrorMessage()` (los 4 shapes del contrato), de `VALID_REQUEST_TRANSITIONS`, de `usePropertyFilters` (serialización de booleanos y reset de página) y de `fecha.ts`.
- **Tipado end-to-end.** Muchas llamadas directas `api.get(...)` fuera de los `services/` no tipan la respuesta y `data` cae en `any` implícito. `shared/types/api.ts` ya tiene los tipos: falta aplicarlos (`api.get<Property[]>(...)`).
- **`getNotifType()` clasifica por substrings del copy en español** ("usuario registrado", "solicitó", "valoración", "comentó", "favorito"). Si el backend cambia el texto de una notificación, los badges por categoría del sidebar admin dejan de contar **sin que nada falle visiblemente**. Lo correcto sería un campo `type` en la entidad `Notification` — es una conversación con el backend.
- **El catálogo pide `GET /properties` completo sólo para las valoraciones.** `Propertiescatalog.tsx:78-91` trae **todas** las propiedades sin paginar para armar un mapa `id → ratingAverage`, porque `GET /properties/filter` no devuelve ese campo. Funciona hoy con pocas propiedades; con 500 en el catálogo es una descarga completa por visita, y del lado del backend `GET /properties` hace una query de promedio por propiedad (N+1, documentado en §5 del contrato). Lo natural es pedirle al backend que incluya `ratingAverage` en `/properties/filter`.
- **Hex hardcodeado en la zona de dashboards.** La zona pública ya está tokenizada (`brand-*`/`ink-*`), pero `#0b7a4b` sigue literal en los dos `layout.tsx` de dashboard, `dashboard/page.tsx`, los dos `perfil`, `estadisticas`, `notificaciones`, `usuarios/*`, `solicitudes`, `propiedades`, `PropertyForm` y `Favoritebutton.tsx:65`. Migrar es mecánico (mismo valor exacto) pero toca muchos archivos: mejor en una sesión dedicada, no antes del deploy.
- **Sin modo oscuro** (cero clases `dark:`). No es un bloqueante, es una decisión de producto pendiente.
- **Funciones del backend sin UI.** No urgentes, pero conviene decidir si quedan afuera a propósito: ABM de tipos de propiedad (`POST/PATCH/DELETE /property-types` — hoy los tipos sólo se pueden crear por DB); `DELETE /favorites/all` ("vaciar favoritos"); detalle de una solicitud (`GET /property-requests/:id` y `/my-requests/:id` — hoy sólo hay listado); y **todo el módulo `/feedback/search` + `/stats/*`** (el formulario de feedback anónimo y su dashboard, ~24 endpoints completamente mudos en el frontend).
- **Sin `error.tsx` ni `not-found.tsx` propios.** Un error en un Server Component muestra la pantalla por defecto de Next, fuera del sistema de diseño del sitio.

---

## Resumen ejecutivo

**El frontend NO está listo para producción hoy: hay 4 bloqueantes en 🔴, y uno de ellos rompe la primera impresión del sitio.** El más grave es que **la landing está prerenderizada como estática y el HTML generado dice literalmente "No hay propiedades disponibles en este momento"** — se verificó abriendo `.next/server/app/index.html`; sin un `revalidate` o `force-dynamic` en `(public)/page.tsx` eso no se arregla solo aunque el backend esté impecable. Los otros tres son de bajo esfuerzo: fallback silencioso de `NEXT_PUBLIC_API_URL` sin `.env.example`, la ruta interna `/preview-ui` publicada, y el "ocultar comentario" de publicaciones que en la práctica es irreversible.

**La base técnica, en cambio, es sólida:** build limpio, `tsc --noEmit` sin un solo error en `strict`, enums alineados 1:1 con el contrato (incluidos los tres casos trampa `'temporal'`, `'en pausa'` y `baños`), manejo de errores centralizado y realmente adoptado, doble capa de protección en la zona admin, cero secretos en `localStorage`, y el bug de multipart resuelto donde importa. Las 🔴 son puntuales y de arreglo rápido — se pueden cerrar todas en una sesión corta; ninguna exige refactor.

**Recomendación:** cerrar las 4 🔴 más 🟡-3 (badge del dashboard de usuario) y 🟡-4 (timeout de axios) antes de desplegar. El resto de 🟡 —lint, bundle de `three`, SEO, links de WhatsApp del panel, código muerto— puede ir en la primera iteración post-deploy sin riesgo.

### Coordinación con el Backend

Tres desacoples reales encontrados. Ninguno es culpa de datos mal formados: son diferencias entre lo que el front necesita y lo que el back expone hoy.

1. **`GET /posts/:id/comments` no puebla `req.user` (🔴-4).** Es `@Public()` **sin** `OptionalJwtAuthGuard`, y por §20 del contrato `@Public()` cortocircuita el guard sin ejecutar passport. Resultado: **el admin nunca recibe los comentarios `isHidden: true`**, y toda la UI de "mostrar/ocultar" de `CommentModeration` queda inalcanzable. `GET /posts` y `GET /properties/:propertyId/comments` **sí** llevan `OptionalJwtAuthGuard`: esta ruta quedó asimétrica. **Pedido concreto al backend:** agregar `OptionalJwtAuthGuard` a esa ruta.

2. **`GET /properties/filter` no devuelve `ratingAverage`.** Sólo `GET /properties` y `GET /properties/:id` lo traen. El front lo compensa descargando **el catálogo completo sin paginar** en cada visita a `/properties` para armar un mapa de valoraciones (`Propertiescatalog.tsx:78-91`). Funciona, pero no escala, y el `GET /properties` que consume es el que el propio contrato marca como N+1. **Pedido concreto:** incluir `ratingAverage` en la respuesta de `/properties/filter` (el `sortBy=rating` ya calcula ese promedio internamente como `avgscore` — sólo hay que exponerlo).

3. **`Notification` no tiene campo `type`.** El front clasifica las notificaciones del admin haciendo *matching de substrings del copy en español* (`getNotifType()` en `dashboardAdmin/layout.tsx:27-35`) para pintar los badges por categoría del sidebar. Cualquier cambio de redacción en el backend rompe esos contadores en silencio. **Pedido concreto:** agregar un campo `type` enumerado a la entidad `Notification`.

Todo lo demás cruzó bien: shapes de body, enums, códigos de error, máquina de estados de solicitudes, y el shape completo de `GET /statistics` (las 11 secciones, con `rangeApplies`, `minRatings` y `uniqueVisitors`) coinciden exactamente con `API_CONTRACT.md`.
