# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Contexto de este documento:** regenerado **desde cero** por lectura directa del código actual (`src/` completo, `package.json`, `next.config.ts`, `globals.css`, `middleware.ts`, `eslint.config.mjs`, `tsconfig.json`), y verificado contra `API_CONTRACT.md` del repo del backend (`../CercaTrova-Back/`). La versión anterior había quedado desactualizada: describía un proyecto sin `posts`, sin `statistics`, sin `tracking`, sin `/servicios` modularizado, con `swiper` "sin usar" y con `/dashboardAdmin/estadisticas` como link roto — nada de eso sigue siendo cierto.
>
> Todo lo que sigue describe el estado **real de hoy**, no la intención. Los ítems marcados ⚠️ son deuda o rareza verificada, no propuestas.

## Descripción general

Cerca Trova es el frontend de una inmobiliaria en Córdoba, Argentina. **Next.js 15.5.5 con App Router** (todo vive en `src/app/`, no existe `pages/`), **React 19.1.0**, **TypeScript `strict`**. Frontend puro: toda la data remota viene de una API NestJS externa (`NEXT_PUBLIC_API_URL`); no hay backend en este repo.

Stack confirmado en `package.json`:

| Paquete | Uso real hoy |
|---|---|
| `next` 15.5.5 | `dev`/`build` con **Turbopack** |
| `react` / `react-dom` 19.1.0 | — |
| `tailwindcss` v4 (`@tailwindcss/postcss`) | **No hay `tailwind.config.*`**. Toda la config vive en `src/app/globals.css` (`@theme` + `:root` + `@source`) |
| `axios` 1.13.4 | Cliente HTTP único, con interceptor de respuesta |
| `framer-motion` | Animaciones: landing, catálogo, dashboards, modales, `DashboardShell` |
| `swiper` | **SÍ se usa**: hero de la landing (`Slider.tsx`) y carrusel de reseñas (`Reseñas.tsx`) |
| `three` | **Solo** en `Loadingpage.tsx` (escena 3D del loader) — ver "Performance" |
| `recharts` | Solo en `modules/statistics/components/charts.tsx` (panel de estadísticas) |
| `react-hook-form` + `@hookform/resolvers` + `zod` | Solo `LoginForm`/`RegisterForm` (schemas en `auth/schemas/auth.schemas.ts`) |
| `@react-oauth/google` | Login con Google, montado solo en el grupo `(auth)` |
| `jose` | `decodeJwt` en el middleware (decodifica, **no verifica firma**) |
| `sonner` | Toasts, configurados en `shared/ui/AppToaster.tsx` |
| `lucide-react` | Iconografía principal |
| `react-icons` | **Solo** `bs` (WhatsApp/Instagram/Facebook) y `fa6` (íconos de servicios) |
| ⚠️ `gsap` | **Dependencia muerta** — cero imports en `src/` (se fue con el rediseño del hero) |

Único estado global: `AuthContext` (React Context puro). No hay Redux/Zustand/Jotai. No hay librería de componentes (no shadcn/Radix/MUI), no hay `clsx`/`cn()`/`tailwind-merge`.

**No hay testing configurado**: sin `test` en `package.json`, sin vitest/jest/playwright, sin archivos de test.

## Comandos

```bash
npm run dev      # servidor de desarrollo (Turbopack), http://localhost:3000
npm run build    # build de producción (Turbopack)
npm run start    # levanta el build de producción
npm run lint     # ESLint (flat config: next/core-web-vitals + next/typescript)
npx tsc --noEmit # chequeo de tipos estricto (no hay script propio)
```

**Estado verificado de los checks (última corrida):** `npm run build` ✅ (33 rutas, compila y prerenderiza), `npx tsc --noEmit` ✅ sin errores, `npm run lint` ⚠️ **21 warnings, 0 errores** — casi todos `no-unused-vars` de imports olvidados (`Link`, `Image`, íconos de lucide) más 2 `react-hooks/exhaustive-deps` (`PropertyForm.tsx:157` falta `addFiles`; `PropertyDetail.tsx:289` falta `onRatingsChange`).

⚠️ **Truco de Windows:** `next.config.ts` lee `distDir: process.env.NEXT_DIST_DIR || '.next'`. Sirve para buildear sin pelear con el `.next` que bloquea el dev server: `NEXT_DIST_DIR=.next-build npm run build`. Por eso conviven `.next/`, `.next-build/` y `.next-verify/` en el repo (todos ignorados por git).

## Variables de entorno

Único `.env` (gitignoreado vía `.env*`; no hay `.env.example` ⚠️).

| Variable | Pública | Dónde se usa | Para qué |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Sí | `shared/lib/axios.ts`, `shared/lib/tracking.ts` | `baseURL` de axios y URL absoluta para `navigator.sendBeacon`. **Fallback silencioso a `http://localhost:3000`** en ambos |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Sí | `auth/components/GoogleProvider.tsx` | Client ID de Google Identity Services. Si falta, los hijos se renderizan igual y el botón de Google simplemente no aparece (degradación intencional) |

⚠️ El fallback a `localhost:3000` es silencioso: si la variable no está seteada en el entorno de despliegue, el sitio buildea y arranca, pero **todas** las llamadas van a localhost y fallan en el cliente sin ningún aviso.

## Estructura del proyecto

```
src/
  app/
    (public)/              # sin auth
      page.tsx             # "/" — landing (Server Component)
      loading.tsx          # frontera de carga de TODA la zona pública
      layout.tsx           # solo agrega <BackToTopButton />
      properties/          # /properties + /properties/[id]
      publicaciones/       # /publicaciones + /publicaciones/[id]  (feed de posts)
      servicios/[id]/      # /servicios/:slug  (6 servicios, data hardcodeada)
    (auth)/                # /login, /register — layout monta GoogleProvider
    (private)/
      dashboard/           # URL real: /dashboard  (7 subpáginas)
      publicar/            # URL real: /publicar
    (admin)/
      dashboardAdmin/      # URL real: /dashboardAdmin (13 subpáginas)
    (user)/layout.tsx      # ⚠️ route group SIN páginas — passthrough muerto
    preview-ui/            # ⚠️ ruta de preview del sistema de diseño, TEMPORAL
    layout.tsx             # layout raíz
    globals.css
    icon.png               # ⚠️ 1.4 MB de favicon
  middleware.ts
  modules/
    auth/          components/ hooks/ interface/ schemas/ services/
    properties/    components/ hooks/ interfaces/ lib/ services/
    posts/         services/posts.service.ts
    landing/       components/            # secciones de "/" + FooterPublic + CtaButton + Reveal…
    servicios/     components/            # ServiceBlocks, ServiceFaq
    statistics/    components/charts.tsx  types.ts
    shared/        context/ hooks/ lib/ types/ ui/
    DashboardUser/ ⚠️ MÓDULO MUERTO (5 archivos de 0 bytes, cero imports)
  types/swiper-css.d.ts
```

**Layout raíz (`src/app/layout.tsx`)** — Server Component. Monta, en orden: `AuthProvider` → `VisitTracker` (telemetría, no renderiza nada) → `PendingNotificationsToast` (aviso de notificaciones sin leer, no renderiza nada) → `NavbarSelector` → `children` → `FooterSelector`; y fuera del provider, `AppToaster`. Define el `metadata` global (title/description/icon) y las dos fuentes (`Inter` → `--font-inter`, `Playfair_Display` → `--font-playfair`).

⚠️ `<html lang="en">` en un sitio 100% en español.

Alias: `@/*` → `./src/*`.

Convención: las páginas son mayormente "gordas" (UI + fetch inline, `'use client'`). **77 de ~140 archivos llevan `'use client'`.** Solo `auth`, `properties` y `posts` separan `services/`; el resto llama a `api` directo desde el componente.

## Cliente de API

**`src/modules/shared/lib/axios.ts`** — instancia única:
```ts
axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
```
- **Credenciales:** `withCredentials: true` en todas las requests. Es obligatorio incluso en las públicas: además de `access_token` (sesión), el backend setea `ct_vid` (cookie de visitante anónimo para telemetría) en **todas** las rutas. Ambas son `httpOnly` — el frontend nunca las lee (cero usos de `document.cookie`/`js-cookie`); solo el middleware lee `access_token` server-side.
- **Interceptor de respuesta:** un 401 fuera de `/auth/*` dispara `emitUnauthorized()` → limpia el `AuthContext`, muestra un toast y redirige a `/login`. Los 401 de `/auth/me` (hidratación), `/auth/login` (credenciales), `/auth/logout` (sesión ya cerrada) y `/auth/google` quedan excluidos a propósito. El resto de los status (400/403/404/409/429/502) pasan intactos al `catch` del componente.
- **`shared/lib/authEvents.ts`** — puente entre el interceptor y `AuthContext`, para evitar el import circular `axios → AuthContext → auth.service → axios`. `setOnUnauthorized(handler)` / `emitUnauthorized()`.
- **`shared/lib/apiError.ts`** — `getErrorMessage(error)` es la función que **todo** `catch` debe usar: `message` string → tal cual; `message` array (class-validator) → une los primeros 3 con ` · `; 429 → mensaje propio; sin `response` → mensaje de red. También `getErrorStatus(error)`.
- **`shared/lib/validateImage.ts`** — `validateImageFile(file)`: `image/*` y ≤5 MB (los límites reales del backend), client-side antes de subir.
- **`shared/types/api.ts`** — archivo **canónico** del contrato: enums (`Role`, `StatusProperty`, `OperationType`, `RequestStatus` + `VALID_REQUEST_TRANSITIONS`, `TipoPropiedadRequest`, `TipoOperacionRequest`, `EstadoConservacionRequest`), entidades (`User`, `Property`, `PropertyImage`, `Favorite`, `Comment`, `Rating`, `Notification`, `SearchPreference`, `PropertyRequest`, `Post`, `PostComment`, `PostAuthor`) y shapes de error. Los `interfaces/` por módulo re-exportan desde acá — `properties/interfaces/propertyInterface.ts` es hoy **solo un re-export**, ya no duplica el tipo.

⚠️ Muchas llamadas directas `api.get/post/...` fuera de los services siguen sin tipar la respuesta (`data` cae en `any` implícito).

### Subida multipart — la trampa del `Content-Type`

La instancia trae `Content-Type: application/json` por defecto. Con `FormData` eso es **fatal**: el `transformRequest` de axios ve `application/json` y hace `JSON.stringify(formDataToJSON(data))`, perdiendo los archivos → 400 del backend.

Los tres call-sites de multipart usan `{ headers: { 'Content-Type': undefined } }` para borrar el default y dejar que el browser arme el header con su boundary:
- `dashboardAdmin/propiedades/PropertyForm.tsx` → `POST /properties` / `PATCH /properties/:id`
- `dashboard/perfil/page.tsx` y `dashboardAdmin/perfil/page.tsx` → `PATCH /users/:id/photo`

⚠️ **`modules/posts/services/posts.service.ts:33` es la excepción**: usa `'Content-Type': 'multipart/form-data'`. Funciona igual (con ese valor `hasJSONContentType` es `false`, y el adaptador XHR de axios 1.x hace `headers.setContentType(undefined)` para FormData en el browser), pero **contradice el comentario de los otros tres archivos**, que afirman que forzar ese valor rompe. Es inconsistencia de estilo, no un bug — pero si alguien "corrige" el resto copiando este patrón, y algún día se toca el default de la instancia, vuelve el bug. Unificar en `undefined`.

## Autenticación y sesión

### `AuthContext` (`shared/context/AuthContext.tsx`)
Expone `{ user, isLoading, login, loginWithGoogle, logout, register, updateUser }`.
- **Hidratación:** al montar, `GET /auth/me`; 401 → `user = null`. Sin persistencia en `localStorage`.
- **`handleAuthSuccess`** está extraído a propósito para que `login` (email+password) y `loginWithGoogle` no puedan divergir: setea el usuario, redirige por rol (`admin` → `/dashboardAdmin/`, resto → `/dashboard`) y, si `profileIncomplete`, muestra un toast de 8s invitando a completar teléfono y contraseña.
- **`logout(redirectTo = '/')`:** llama `POST /auth/logout`; un 401 se trata como éxito silencioso; cualquier otro error igual limpia el estado local. Además llama `clearPendingNotifMarks()`. Se usa `logout('/login')` tras un cambio de contraseña (el backend revoca la sesión).
- **Google OAuth: implementado.** `GoogleProvider` se monta **solo** en `(auth)/layout.tsx` (no en el raíz) para no cargar el script de Google en la landing. `GoogleAuthButton` → `POST /auth/google` con el `idToken`.

### Middleware (`src/middleware.ts`)
Matcher: `/dashboard/:path*`, `/dashboardAdmin/:path*`, `/publicar/:path*`, `/login`, `/register`.
1. Sin token en zona privada/admin → redirect a `/login?callbackUrl=...`. ⚠️ **El `callbackUrl` se setea pero el login nunca lo lee** — después de autenticarse siempre se va al dashboard por rol, no de vuelta a donde estaba.
2. Con token: `isAdminZone && role !== 'admin'` → `/dashboard`.
3. Ya logueado en `/login` o `/register` → dashboard por rol.
4. Token malformado → borra la cookie y manda a `/login`.

`decodeJwt` **solo decodifica, no verifica firma**: es UX de redirección, no autorización. La autorización real la hace el backend en cada request.

### Doble capa de protección
| Zona | Middleware | Layout (cliente) |
|---|---|---|
| `/dashboardAdmin/*` | ✅ exige token **y** `role === 'admin'` | ✅ `dashboardAdmin/layout.tsx`: `!user → /login`; `role !== 'admin' → /dashboard`; y `if (!user \|\| user.role !== 'admin') return null` antes de renderizar |
| `/dashboard/*`, `/publicar` | ✅ exige token (sin chequear rol) | ✅ `dashboard/layout.tsx`: `!user → /login` (sin chequear rol, **a propósito**) |

**El context-switcher ahora es de UNA sola dirección** (cambiado el 2026-08-08, por pedido explícito): el sidebar de usuario sigue mostrando "Panel Admin" (🛡 → `/dashboardAdmin`) **solo si `user.role === 'admin'`**, pero el sidebar admin **ya NO tiene "Vista de Usuario"** — el admin no navega la experiencia de usuario común desde su panel de gestión.

⚠️ Esto **revierte** lo que este documento afirmaba antes ("hay context-switcher explícito en los dos sentidos… fue una decisión, no un olvido"). El camino de vuelta se conserva a propósito: un admin que llegue a `/dashboard` por un link directo quedaría sin salida hacia su panel si también se quitara ese.

## Vistas por tipo de usuario

### Visitante no logueado
- **Navbar:** `NavbarSelector` decide. Devuelve `null` en `/login`, `/register` y en todo lo que empiece con `/dashboard`; `NavbarPublic` mientras `isLoading` o si `!user`.
- **Rutas:** `(public)` completo + `(auth)`.
- **Puede:** ver catálogo, detalle, servicios, publicaciones; leer comentarios y valoraciones; filtrar; contactar por WhatsApp; compartir una publicación. `FavoriteButton` se renderiza pero su `onClick` redirige a `/login` sin llamar a la API.

### Usuario logueado (`role: 'user'`)
- **Navbar:** `NavbarPrivate`. Suma campanita con badge de no leídas, panel de cuenta anclado al avatar (desktop **y** mobile, mismo componente `UserPanelItems`), y los links del sitio público.
- **Sidebar de `/dashboard`** (`DashboardShell` + `Sidebar` local): "Volver al inicio", **Inicio**, grupo **Mis propiedades** (Favoritos / Que valoré / Que comenté), grupo **Notificaciones** (6 filtros por `?tipo=`, con badge verde de no leídas por categoría), **Mis solicitudes**, sección Cuenta (Editar Perfil / Preferencias), y logout. ⚠️ El grupo **Preferencias** que estaba encima de Notificaciones **se eliminó** (2026-08-08): duplicaba el acceso de la sección Cuenta, los dos iban a `/dashboard/preferencias`.
- **Rutas:** `/dashboard`, `/dashboard/{favoritos, valoradas, comentadas, mis-solicitudes, notificaciones, perfil, preferencias}` y `/publicar`.

### Admin (`role: 'admin'`)
- **Sidebar de `/dashboardAdmin`:** **Inicio**, grupo **Propiedades** (publicar / gestionar / ver catálogo público), grupo **Publicaciones** (crear / gestionar), grupo **Notificaciones** con badges verdes por tipo (6 subrutas reales, una página por categoría), grupo **Solicitudes** (`?estado=`), grupo **Usuarios** (`?rol=`), sección Cuenta (Mi Perfil / **Estadísticas**) y logout. ⚠️ Solicitudes y Usuarios **ya no llevan badge**: mostraban el conteo de *notificaciones* sin leer de su tema, no la cantidad de solicitudes o usuarios pendientes.
- **`/dashboardAdmin/estadisticas` EXISTE y funciona** (era el link roto de la versión anterior de este doc). Consume `GET /statistics?range=` en **un solo fetch** que trae las 11 secciones, y las dibuja con `recharts`.
- **Gestión:** CRUD de propiedades con imágenes y portada; CRUD de publicaciones + moderación de comentarios; solicitudes con transiciones válidas; usuarios (listar/detalle/eliminar); notificaciones.

## Sistema de diseño

### Tokens (`src/app/globals.css`, bloque `@theme`)
Tailwind v4: los tokens se definen en `@theme { }`, no en `tailwind.config.*` (no existe). Cada `--color-X` genera `bg-X`, `text-X`, `border-X`, `from-X`, `ring-X`, `bg-X/NN`…

| Token | Valor | Uso |
|---|---|---|
| `brand-50`…`brand-950` (11 pasos) | `#eff9f4` → `#032315` | Verde de marca. **`brand-700` = `#0b7a4b`** es el verde histórico; 500/600/800 son los tonos exactos que ya existían (migración 1:1 sin cambio visual) |
| `brand` (alias) | `#0b7a4b` | Mismo literal que `brand-700`, para que `bg-brand/10` no tenga problemas de opacidad |
| `ink-50`…`ink-950` | `#f6f7f6` → `#0a0c0b` | Escala neutra. Se llama `ink` y **no** `gray` a propósito: `gray` pisaría la escala nativa de Tailwind |
| `surface` / `surface-alt` | `#f5f7f5` / `#e5e7e5` | Fondos de página / sección secundaria |
| `surface-mint` / `surface-mint-deep` | `#dbeee4` / `#c9e5d8` | **El verde de sección que alterna con blanco** en landing, catálogo, `/publicaciones` y `/publicar`. Reemplazó a `brand-50`, que contra blanco tenía ~3 puntos de luminancia de diferencia (no se veía el corte de sección) |
| `surface-deep` | `#cbd8cd` | Fondo de los dashboards (unifica los dos que había) |

En `:root` (no `@theme`, porque son gradientes de dos paradas): `--gradient-brand`, `--gradient-brand-hover`, usados como `style={{ background: 'var(--gradient-brand)' }}`.

**Escala de movimiento** (también en `:root`), pensada para que el sitio no "cambie de velocidad" entre secciones: `--dur-fast: 150ms` (color/foco), `--dur-base: 250ms` (hover de botón/card), `--dur-slow: 400ms` (desplazamientos y sombras grandes); curvas `--ease-out-soft` (default) y `--ease-spring` (microinteracción de click).

**Clases CSS planas** (fuera de `@theme`): `.surface-brand-deep` y `.surface-brand-deepest` (verde oscuro con textura: gradiente diagonal + halos radiales + trama de puntos en `::before`), usadas en la franja de estudiantes del hero, "Trayectoria" y el footer. Más `@keyframes` del loader y el botón `.button` de "ir arriba".

**Accesibilidad:** hay un bloque `@media (prefers-reduced-motion: reduce)` global que apaga animaciones y transiciones en **todo** el sitio. Usa `0.01ms` y no `none` a propósito: con `animation: none` los eventos `animationend`/`transitionend` nunca se disparan y cualquier componente que los espere queda colgado.

⚠️ **No hay modo oscuro** (cero clases `dark:`).

### Componentes compartidos y su adopción real

| Componente | Ubicación | Adopción verificada |
|---|---|---|
| `confirmDialog()` | `shared/ui/ConfirmDialog.tsx` | Función imperativa sobre `toast.custom`. Variantes `danger \| warning \| info \| logout \| default`. Usada en todos los borrados y los 3 logouts — reemplazó por completo el patrón viejo de 8 modales copiados a mano |
| `Field` / `Input` / `Select` | `shared/ui/` | `PropertyForm`, `publicar/page.tsx`, `preferencias/page.tsx`, `preview-ui`. **No** en `LoginForm`/`RegisterForm`, que usan `AuthField` (decisión deliberada: `Input` tiene `px-4` fijo y los campos de auth necesitan `pl-10` para el ícono; sin `tailwind-merge` habría dos paddings compitiendo) |
| `DashboardShell` | `shared/ui/` | Los **dos** layouts de dashboard. Sidebar fijo ≥`lg`, cajón deslizante + barra superior por debajo. El `sidebar` que recibe es el **mismo nodo** en ambos casos — no hay versión mobile que pueda desincronizarse |
| `DashboardPage` / `DashboardHeader` / `CARD` / `CARD_INTERACTIVE` / `ListReveal` | `shared/ui/DashboardPage.tsx` | El ancho **no** lo decide cada página: `width='list'` (`max-w-7xl`) o `width='form'` (`max-w-4xl`). Antes había 4 anchos distintos en 4 pantallas del mismo panel |
| `ListToolbar` / `ListSearch` / `ListSelect` / `NoMatches` / `ListChips` | `shared/ui/ListToolbar.tsx` | 6 listados |
| `DashboardBackLink` | `shared/ui/` | 12 pantallas |
| `AppToaster` | `shared/ui/` | Config única de sonner para los ~125 avisos: ícono en pastilla + 4 tipos diferenciados por color e ícono |
| `CtaButton`, `Reveal`, `SectionHeading`, `FeaturedPropertyCard` | `modules/landing/components/` | Landing (7, 15, varias y 5 usos). ⚠️ Viven en `landing/` y no en `shared/ui/`: reusarlos desde otro dominio cruza el límite de módulo |
| `iconTokens.ts` / `navStyles.ts` / `badgeStyles.ts` | `shared/ui/` y `properties/lib/` | Tonos semánticos de íconos, clases de navbar y colores de badge por operación/tipo |
| `shared/lib/fecha.ts` | — | **Formateo determinista** (mismo string en server y cliente). Escribe la plantilla a mano y fija `America/Argentina/Buenos_Aires` con `Intl.formatToParts`: existía un bug real de hidratación porque Node y Chrome arman `toLocaleDateString` distinto ("a las" vs. coma) y sobre husos distintos |
| `shared/lib/contact.ts` | — | `WHATSAPP_NUMBER = '543513872817'` + `whatsappLink(mensaje)` con `encodeURIComponent` |

## Flujo de Properties

### `/properties` — `(public)/properties/page.tsx` → `Propertiescatalog.tsx`
`page.tsx` es Server Component: `await searchParams` (Next 15) y hace el primer `GET /properties/filter` con `page`/`limit: 12`. Pasa `initialItems`/`initialTotal` al cliente.

`Propertiescatalog.tsx` (client):
- **Dos secciones full-bleed:** hero + filtros sobre `bg-surface-mint`, resultados sobre `bg-surface-mint-deep` (un paso más oscuro, para que el corte "buscar → explorar" se vea).
- **Fetch:** en cada cambio de `filters` (`usePropertyFilters`, la URL es la fuente de verdad); `isFirstRender` evita el fetch duplicado del primer render.
- **Valoraciones:** ⚠️ `GET /properties/filter` **no** devuelve `ratingAverage`. El catálogo lo resuelve pidiendo **`GET /properties` completo una vez** y cruzando un mapa `id → ratingAverage` con la página visible. Funciona, pero ese endpoint no tiene paginación y hace una query de promedio por propiedad (N+1 del lado del backend).
- **Toggle grilla/lista:** `PropertyCard` vs `PropertyRow`, ambos componentes reales de `modules/properties/components/`. Cambiar de vista es **puro re-layout en el cliente**, sin refetch: por eso las dos vistas comparten `PAGE_LIMIT = 12` (antes 10 vs 12 forzaba un refetch y producía el "cabeceo" de las tarjetas).
- **`AnimatePresence mode="wait"`** para el crossfade entre vistas; `key` incluye un `nonce` que fuerza el re-stagger en cada fetch.
- **Estados:** skeletons `animate-pulse` (8 en grilla, 5 en lista) y vacío con ícono `SearchX`.
- **Paginación** numérica con elipsis, calculada a mano.

### `CatalogFilterBar` — barra de búsqueda + orden + chips
Fila 1: `PropertySearchBar`. Fila 2: toggle Venta/Alquiler, desplegables de precio/antigüedad/valoración, botón "Más filtros" con badge de conteo.
**Chips de filtros activos:** cada chip lleva el *parche* que lo desactiva, no una sola clave — el orden ocupa `sortBy` + `order`, que solo tienen sentido juntos. Incluye el chip de orden (antes elegías "Precio: menor a mayor" y no había ninguna señal visible).

### `FiltersModal` — el panel de filtros real
Modal porteado a `document.body`, con `backdrop-blur`, cierre por Escape/click de fondo y bloqueo de scroll **compensando el ancho de la scrollbar** con `padding-right` (sin eso, el fondo saltaba unos píxeles al abrir).
Trabaja con un **borrador local**: nada toca la URL hasta "Aplicar". Tipos de propiedad desde `GET /property-types` (ya no IDs hardcodeados 1-5). Ubicaciones desde `GET /properties/filters/locations`. Contador de resultados en vivo.

### `usePropertyFilters` (`properties/hooks/`)
Lee la URL → objeto tipado `PropertyFilters`; `setFilters(partial)` escribe con `router.push(..., { scroll: false })`; `clearFilters()` resetea a `?page=1&limit=12`.
Regla clave: solo resetea a `page=1` si el filtro que cambió tiene un valor **real**; los booleanos se serializan como `'true'`/`'false'` (el backend los valida con `@IsBooleanString`).

### `/properties/:id` — `PropertyDetail.tsx` (53 KB, el archivo más grande)
`page.tsx` hace `await params` y `GET /properties/:id` server-side.
Contiene, como funciones internas del mismo archivo: `ImageSlider` (galería con miniaturas, `priority` en la primera imagen), `CommentsAndRatings` (fetch propio a `/comments` y `/ratings/:id`, `StarPicker`, crear/editar/eliminar comentario, y **ocultar/mostrar como admin** vía `PATCH .../hide`), `GoogleMapSection` (iframe con `direccion, barrio, localidad`) y la sidebar sticky con precio + WhatsApp.
Incluye `FavoriteButton` (ya no falta, como decía la versión anterior de este doc).

## Publicaciones (`posts`) — feed estilo red social

Feed efímero: el backend borra con un cron las publicaciones de más de **7 días**. El frontend refleja ese TTL en `POST_TTL_DAYS = 7` (`dashboardAdmin/publicaciones/page.tsx`), con un contador de "días restantes" por publicación.

- **`/publicaciones`** (Server Component, `export const dynamic = 'force-dynamic'`): fetch inicial **sin sesión**, así que `likedByMe` llega en `false` y lo corrige el refetch del cliente en `PostsFeed`.
- **`/publicaciones/[id]`**: ruta propia con `generateMetadata` que arma **OpenGraph** (título, descripción e imagen del post) para que el link previsualice bien en WhatsApp/Instagram. Reusa `PostCard`, el mismo componente del feed.
- **`PostCard`**: like, comentarios con respuestas anidadas de un nivel, y **compartir** — `navigator.share` si existe, con fallback a `navigator.clipboard.writeText` y toast "Link copiado".
- **Admin:** `/dashboardAdmin/publicaciones` (listado, orden por recientes/antiguas/vencen/likes/comentarios, borrado con `confirmDialog`, `CommentModeration` embebida) y `/dashboardAdmin/publicaciones/nueva`.

## Telemetría y notificaciones

- **`VisitTracker`** (layout raíz): por cada cambio de `pathname` registra `POST /tracking/visit` y mide el tiempo **real** de lectura — pausa el cronómetro cuando la pestaña deja de estar visible. Manda la duración con `navigator.sendBeacon` en `visibilitychange → hidden` y `pagehide` (un `fetch` en ese momento suele ser cancelado). No filtra al admin: eso lo hace el backend, que es quien conoce el rol de verdad.
- **`PendingNotificationsToast`** (layout raíz): al iniciar sesión, muestra en cola los avisos sin leer. Se dispara **una vez por sesión** usando una marca en `sessionStorage` (`ct_pending_notif_<userId>`), que `logout()` limpia vía `clearPendingNotifMarks()`.
- **Badge de no leídas (`NavbarPrivate`)**: usa `GET /notifications/unread-count`, que devuelve `{ count }` y **resuelve el rol desde el token** — un solo endpoint sirve a usuario y admin. Antes se traía la lista completa cada 60s para contar en JS. Polling de 60s **+** listener del evento DOM custom `notif-updated`, que emiten las acciones de "marcar como leído" para refrescar al instante.
- ⚠️ **Los DOS sidebars traen la lista completa** cada 60s (`GET /notifications/admin` el de admin, `GET /notifications` el de usuario) porque necesitan el desglose por categoría para los badges del menú, y `unread-count` solo devuelve el total. El de usuario usaba `unread-count` hasta el 2026-08-08, cuando cada subítem pasó a tener su propio badge.
- **La clasificación por categoría ya NO adivina por texto.** Sale del campo `type` del backend, mapeado en un único lugar por área: `dashboardAdmin/notificaciones/notifShared.tsx` (admin) y `dashboard/notificaciones/notifShared.ts` (usuario). Cada uno lo usan su sidebar **y** su pantalla, a propósito: cuando el layout tenía su propia copia, el badge decía "3" y al entrar aparecían 2. Queda una heurística de texto como fallback, acotada a las filas anteriores a la migración de `type` (está marcada como transitoria en ambos archivos).
- **Indicadores de la sección Notificaciones** (`shared/ui/notifIndicators.tsx`): `PulseDot` (punto verde titilante en la esquina de una tarjeta sin leer, el mismo `animate-ping` que "conectado como" del navbar) y `NotifCountBadge` (badge numérico **verde**, antes rojo, con `onDark` para cuando el fondo ya es de color). ⚠️ Los dos son **exclusivos de Notificaciones**: no usarlos en otras secciones del panel.

## Endpoints consumidos

Verificado por grep sobre `src/`. Cruzado contra `API_CONTRACT.md`.

- **Auth** (`auth.service.ts`): `POST /auth/login`, `POST /auth/google`, `POST /auth/register`, `GET /auth/me`, `POST /auth/logout`.
- **Properties (público)** (`properties.service.ts`): `GET /properties/filter`, `GET /properties`, `GET /properties/:id`, `GET /properties/filters/locations`.
- **Comentarios y ratings de propiedad** (`PropertyDetail.tsx`): `GET/PATCH/DELETE /properties/:id/comments[/:commentId]`, `PATCH .../:commentId/hide`, `GET/POST /ratings/:propertyId`.
- **Mi actividad** (`myActivity.service.ts`): `GET /ratings/mine`, `GET /my-comments`.
- **Favoritos** (`Favoritebutton.tsx`, `dashboard/favoritos`): `GET /favorites`, `POST /favorites/:propertyId`, `DELETE /favorites/:propertyId`.
- **Solicitudes (usuario)**: `POST /property-requests`, `GET /property-requests/my-requests`.
- **Solicitudes (admin)**: `GET /property-requests`, `GET /property-requests/user/:id`, `PATCH /property-requests/:id/status`, `DELETE /property-requests/:id`.
- **Propiedades (admin)**: `GET /properties`, `GET /properties/:id`, `POST/PATCH /properties[/:id]` (multipart), `DELETE /properties/:id`, `GET /property-types`, `PATCH /property-images/:id/set-cover`.
- **Usuarios (admin)**: `GET /users`, `GET /users/:id`, `DELETE /users/:id`.
- **Perfil**: `PATCH /users/me` (datos, password, `notifyBroadcast`), `PATCH /users/:id/photo` (multipart).
- **Preferencias**: `GET /property-types`, `GET/POST/PATCH /search-preferences`; admin `GET /search-preferences/user/:id`.
- **Notificaciones**: `GET /notifications`, `GET /notifications/unread-count`, `GET /notifications/admin`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `PATCH /notifications/admin/read-all`.
- **Posts** (`posts.service.ts`): `GET /posts`, `GET /posts/:id`, `POST /posts` (multipart), `DELETE /posts/:id`, `POST /posts/:id/like`, `GET/POST /posts/:id/comments`, `POST /posts/comments/:id/reply`, `PATCH /posts/comments/:id/hide`, `DELETE /posts/comments/:id`.
- **Tracking**: `POST /tracking/visit`, `POST /tracking/duration`.
- **Estadísticas**: `GET /statistics?range=`.

**Expuesto por el backend y sin consumir desde el frontend:** `DELETE /favorites/all`; `POST/PATCH/DELETE /property-types` (no hay ABM de tipos de propiedad); `DELETE /property-images/:id` y `DELETE /properties/image/:id` (el borrado de imágenes va por `deleteImages` dentro del PATCH); `GET /property-images/:id`; `GET /property-requests/:id` y `GET /property-requests/my-requests/:id` (no hay vista de detalle de una solicitud); todo el módulo `/feedback/search` (formulario de feedback anónimo); todo el módulo `/stats/*` (métricas del feedback, distinto de `/statistics`); `POST /users` (se usa `/auth/register`); `PATCH /users/:id`.

## Subida de imágenes

- **Foto de perfil** (ambos perfiles): preview con `FileReader.readAsDataURL`, `validateImageFile()`, `PATCH /users/:id/photo` con campo `file`.
- **Imágenes de propiedad** (`PropertyForm.tsx`): drag & drop + click, **máximo 10** (existentes no borradas + nuevas), preview con `URL.createObjectURL` y `revokeObjectURL` al remover. Campo `images` al crear, `newImages` al editar; borrado vía `deleteImages: number[]` dentro del JSON de `data`. Portada: estado local para nuevas, `PATCH /property-images/:id/set-cover` para existentes, más `setCoverImageId` en el payload.
- **Imagen de publicación** (`posts.service.create`): campo `image`, DTO en `data`.
- **Hosts permitidos por `next/image`** (`next.config.ts` → `images.remotePatterns`): `res.cloudinary.com`, `images3.alphacoders.com`, `images.unsplash.com`, `img.magnific.com`, `cordobapropiedades.com.ar`, `blog.tokkobroker.com`, `www.unc.edu.ar`, `lh3.googleusercontent.com` (fotos de perfil de Google — sin esto, `next/image` rompe apenas un usuario de Google entra al dashboard).

## Performance — lo que hay que saber

Resultado del último `npm run build`:

```
First Load JS shared by all: 245 kB
/                     44.5 kB → 401 kB    /properties      15 kB → 371 kB
/servicios/[id]       1.08 kB → 357 kB    /properties/[id] 12.6 kB → 369 kB
/publicaciones        6.23 kB → 362 kB    /dashboard*      ~3-8 kB → ~225 kB
/dashboardAdmin/estadisticas             119 kB → 340 kB
```

Dos cosas explican el salto de ~130 kB entre las rutas públicas (357-401 kB) y las de dashboard (~225 kB):

1. ⚠️ **`three` se carga en TODA la zona pública.** `(public)/loading.tsx` importa `Loadingpage`, que hace `import * as THREE from "three"` de forma **estática**. Como `loading.tsx` es la frontera de Suspense del segmento `(public)`, ese chunk entra en el First Load de `/`, `/properties`, `/properties/[id]`, `/servicios/[id]` y `/publicaciones`. El propio componente ya difiere la inicialización de la escena WebGL 250 ms, pero **el bundle igual viaja**. Un `next/dynamic(..., { ssr: false })` lo sacaría del camino crítico.
2. `swiper` + `framer-motion` en las mismas rutas.

`recharts` sí está bien aislado: solo pesa en `/dashboardAdmin/estadisticas` (119 kB de esa ruta).

⚠️ **Assets en `public/`**: `chicaMudandose.jpg` pesa **10.7 MB**, `imagenLogin.jpg` 4.7 MB, y hay ~20 PNG de ~2 MB cada uno; `favicon.ico` pesa 1 MB y `src/app/icon.png` 1.4 MB. `next/image` los optimiza en la primera request, pero infla el repo y la primera carga en frío del servidor de imágenes.

## Código muerto — verificado por grep de imports

| Qué | Estado |
|---|---|
| `modules/properties/components/HeaderSearch.tsx` | **Cero importadores.** Antes envolvía `SearchBar` + `FiltersPanel` en el hero |
| `modules/properties/components/FiltersPanel .tsx` (24 KB) ⚠️ nombre con **espacio antes de `.tsx`** | Solo lo importa `HeaderSearch` → muerto transitivamente. Reemplazado por `FiltersModal` |
| `modules/properties/components/SearchBar.tsx` | Solo lo importa `HeaderSearch` → muerto transitivamente. Reemplazado por `PropertySearchBar` |
| `modules/properties/components/PropertiesList.tsx` | **Cero importadores** |
| `modules/DashboardUser/` | 5 archivos de **0 bytes**, cero importadores. `hooks/`, `services/`, `interfaces/` vacías |
| `app/(user)/layout.tsx` | Route group sin páginas. El propio archivo se documenta como "candidato a eliminarse" |
| `app/preview-ui/page.tsx` | Ruta de preview del sistema de diseño, marcada como TEMPORAL. ⚠️ **Se buildea y se sirve en producción** (`/preview-ui`, 221 kB) |
| `gsap` en `package.json` | Cero imports en `src/` |

## SEO — estado actual

- **`metadata` solo en 3 lugares:** el layout raíz (global), `(public)/publicaciones/page.tsx` y `generateMetadata` en `publicaciones/[id]` (el único con OpenGraph). ⚠️ **No hay metadata propia en `/`, `/properties`, `/properties/:id` ni `/servicios/:id`** — las 4 rutas más indexables heredan el title global "Cerca Trova - Inmobiliaria".
- ⚠️ **No existen `robots.txt` ni `sitemap.xml`**, ni como archivo en `public/` ni como `robots.ts`/`sitemap.ts` de Next.
- ⚠️ **La landing `/` no tiene ningún `<h1>`.** El hero (`Slider.tsx:275`) usa `<h2>`, y `SectionHeading` — el encabezado de todas las secciones — también emite `<h2>`. `/publicaciones` tiene el mismo problema (título de página en `<h2>`). Sí tienen `h1` correcto: `/properties`, `/properties/:id`, `/servicios/:id`, `/publicar` y las páginas de dashboard (vía `DashboardHeader`).
- `<html lang="en">` en un sitio en español.
- **`alt`:** en general descriptivos (`alt={title}`, `alt={\`${title} - foto ${i+1}\`}`). Quedan `alt=""` en las miniaturas de la galería del detalle, la grilla de imágenes del `PropertyForm` y el avatar del navbar — defendible como decorativo, pero el thumbnail de `PropertyDetail.tsx:184` sí merecería texto.
- 4 usos de `<img>` nativo, **todos** con `eslint-disable-next-line @next/next/no-img-element` y justificados (previews de `blob:`/`data:` y URLs de Cloudinary en vistas de admin).

## Convenciones de código

- Componentes funcionales con hooks. `'use client'` en 77 archivos; los layouts de dashboard son client porque dependen de `useAuth()`.
- **Server Components reales:** `app/layout.tsx`, `(public)/page.tsx`, `(public)/layout.tsx`, `(auth)/layout.tsx`, `(public)/loading.tsx`, y las `page.tsx` de `/properties`, `/properties/[id]`, `/publicaciones`, `/publicaciones/[id]`, `/servicios/[id]`.
- **Next 15:** `params` y `searchParams` son `Promise` y se `await`-ean en todas las páginas server. En las client (`dashboardAdmin/propiedades/[id]`) se usa `use(params)`.
- Naming: PascalCase para componentes, `use`-prefix para hooks. Mezcla deliberada de español/inglés.
- **Tailwind:** clases inline con template literals y ternarios, sin `clsx`/`cn()`.
- Comentarios en español, densos y explicando **el porqué** (qué bug se arregló, qué alternativa se descartó). Al editar, mantener ese registro.
- ⚠️ **Hex hardcodeado que sobrevive a la tokenización:** `#0b7a4b` sigue literal en los dos `layout.tsx` de dashboard, `dashboard/page.tsx`, los dos `perfil/page.tsx`, `estadisticas/page.tsx`, `notificaciones/page.tsx`, `usuarios/*`, `solicitudes/page.tsx`, `propiedades/page.tsx`, `PropertyForm.tsx` y `Favoritebutton.tsx:65`. **La zona pública ya está tokenizada** (`brand-*`/`ink-*`); la que falta es la de dashboards.

## Trampas conocidas (leer antes de tocar)

1. **`FiltersPanel .tsx` tiene un espacio en el nombre del archivo.** Los imports son `from './FiltersPanel '`. No es un typo de este documento.
2. **`Content-Type` en multipart** → ver "Cliente de API". Usar `undefined`, nunca `'application/json'`.
3. **Fechas** → usar siempre `shared/lib/fecha.ts`. `toLocaleDateString` rompe la hidratación.
4. **`getNotifType()`** clasifica notificaciones por substrings del copy en español. Cambiar el texto de una notificación en el backend rompe silenciosamente los badges del sidebar admin.
5. **`GET /properties/filter` no devuelve `ratingAverage`** — solo `GET /properties` y `GET /properties/:id`.
6. **`PATCH /users/me` con `password`** devuelve el hash bcrypt en la respuesta y borra la cookie. Nunca guardar ese campo en el estado; hay que hacer `logout('/login')` después.
7. **El backend usa `whitelist: true` + `forbidNonWhitelisted: true`**: cualquier campo extra en un body da 400. No mandar campos que el DTO no declare.
8. **Los booleanos de `GET /properties/filter` viajan como strings** `"true"`/`"false"`.
9. **`OperationType.ALQUILER_TEMPORAL` vale `'temporal'`**, no `'alquiler_temporal'`. Y `StatusProperty.PAUSADO` vale `'en pausa'`, **con espacio**.
10. **`baños` va con ñ** en `CreateRequestPropertyDto`.
