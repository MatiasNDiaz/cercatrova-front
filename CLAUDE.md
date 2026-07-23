# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Contexto de este documento:** regenerado después del refactor de adaptación al backend NestJS post-hardening (Bloques A-G: cliente de API centralizado, interceptores, favoritos reparados, `PATCH /users/me`, middleware admin corregido — ver `FRONTEND_CHANGES.md` para el detalle de esos cambios). Esta versión prioriza, además de las secciones técnicas habituales, tres áreas nuevas pensadas para la próxima fase de **rediseño de UI/UX** (paleta, footer, landing, carrusel, separación de vistas por rol): qué ve exactamente cada tipo de usuario hoy, dónde hay componentes duplicados que pueden interferir entre sí, y un inventario real de estilos/colores/carruseles tal como existen en el código — no como "deberían" ser.

## Descripción general

Cerca Trova es el frontend de una inmobiliaria en Córdoba, Argentina. Es un proyecto **Next.js 15 con App Router** (confirmado de nuevo: todo vive en `src/app/`, no existe `pages/`), **React 19**, **TypeScript** en modo `strict`. Frontend puro — toda la data remota viene de una API NestJS externa (`NEXT_PUBLIC_API_URL`), no hay backend en este repo.

Stack confirmado (`package.json`, sin cambios de librerías desde la versión anterior de este documento):
- **Next.js 15.5.5** (`next dev/build --turbopack`), **React 19.1.0**.
- **Tailwind CSS v4** vía `@tailwindcss/postcss` — no hay `tailwind.config.*`; la única config vive en `src/app/globals.css` (`@import "tailwindcss"` + dos `@source` + variables de fuente). Ver sección de estilos para el detalle.
- **No hay librería de componentes de UI**: no shadcn/ui, no Radix, no MUI. No hay `components.json`. No se usa `clsx`/`cn()`/`tailwind-merge` en ningún lado.
- **axios** — cliente HTTP único, ahora con interceptor de respuesta (ver "Cliente de API").
- **react-hook-form + @hookform/resolvers + zod** — solo en `LoginForm`/`RegisterForm`; el resto de formularios son manuales con `useState`.
- **jose** — decodifica (no verifica firma) el JWT en el middleware.
- **sonner** — toasts, montado una vez en el layout raíz.
- **framer-motion, gsap, three, react-icons, lucide-react** — animación/3D/iconos, todos en uso.
- **swiper** está en `package.json` pero **no se usa en ningún archivo de `src/`** (verificado por grep de `from 'swiper'`/`Swiper`) — dependencia muerta. El carrusel real es 100% custom (ver sección de estilos).
- Único estado global: `AuthContext` (React Context puro). No hay Redux/Zustand/Jotai.

## Comandos

```bash
npm run dev      # servidor de desarrollo (Turbopack), http://localhost:3000
npm run build    # build de producción (Turbopack)
npm run start    # levanta el build de producción
npm run lint     # ESLint (flat config: next/core-web-vitals + next/typescript)
```

Sin cambios: no hay ningún script ni framework de testing configurado (no `test` en `package.json`, no `vitest`/`jest`/`playwright` en dependencias, no archivos de test en el repo).

## Variables de entorno

Confirmado de nuevo (único `.env` en el repo, sin `.env.local` ni `.env.example`; grep exhaustivo de `process.env`/`import.meta.env` en `src/`):

| Variable | Pública | Dónde se usa | Para qué |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Sí | `src/modules/shared/lib/axios.ts` (único uso en todo el código) | `baseURL` del cliente axios. Fallback silencioso a `http://localhost:3000` si no está seteada. |

Sigue siendo la única variable de entorno del frontend. Nada nuevo se agregó en el refactor de hoy (el login con Google, que sí necesitaría `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, quedó pospuesto — ver `FRONTEND_CHANGES.md`).

## Estructura del proyecto

```
src/
  app/                    # App Router — rutas. Los grupos (paréntesis) NO afectan la URL.
    (public)/             # sin auth: landing "/", /properties, /servicios
    (auth)/                # /login, /register
    (private)/dashboard/  # zona usuario logueado — URL real: /dashboard
    (private)/publicar/   # URL real: /publicar
    (admin)/dashboardAdmin/ # zona admin — URL real: /dashboardAdmin
    (user)/                # layout.tsx passthrough sin páginas — sin uso real, candidato a eliminar
    middleware.ts
    layout.tsx             # layout raíz: AuthProvider + NavbarSelector + children + FooterPublic + Toaster
    globals.css
  modules/
    auth/
      components/          # LoginForm.tsx, RegisterForm.tsx
      hooks/useAuth.ts      # re-export de useAuth desde AuthContext
      interface/auth.interfaces.ts   # re-exporta tipos desde shared/types/api.ts
      services/auth.service.ts
    properties/
      components/           # FiltersPanel, HeaderSearch, SearchBar, PropertiesList, PropertyCard
      hooks/usePropertyFilters.ts
      interfaces/            # operation-type.ts y status-property.ts re-exportan desde shared/types/api.ts
      services/properties.service.ts
    DashboardUser/
      components/, hooks/, interfaces/, services/   # ⚠️ MÓDULO MUERTO — ver nota abajo
    landing/components/      # secciones de la home + Slider (carrusel hero) + FooterPublic
    shared/
      context/AuthContext.tsx
      lib/
        axios.ts             # instancia única de axios + interceptor de respuesta
        authEvents.ts         # puente sin dependencia circular axios↔AuthContext
        apiError.ts            # getErrorMessage()/getErrorStatus() — lee el error real del backend
        validateImage.ts        # validación client-side de imágenes (tipo + tamaño)
      types/api.ts             # tipos canónicos del contrato del backend (enums, User, Property, DTOs, errores)
      ui/                      # NavbarPublic, NavbarPrivate, NavbarSelector, Favoritebutton
```

**`src/modules/DashboardUser/` está muerto.** `hooks/`, `services/` e `interfaces/` no contienen ningún archivo. `components/` tiene 5 archivos (`Favoritos.tsx`, `MisSolicitudes.tsx`, `Notificaciones.tsx`, `Perfil.tsx`, `Preferencias.tsx`) que están **vacíos (0 bytes)** y no se importan desde ningún lado (verificado por grep de `DashboardUser/components`). La funcionalidad real de favoritos/solicitudes/notificaciones/perfil/preferencias del usuario vive en `src/app/(private)/dashboard/*/page.tsx`, no acá. Candidato claro a borrar en una limpieza.

Convención de código: las páginas en `src/app/**/page.tsx` son mayormente "gordas" (UI + fetch inline, `'use client'` en casi todo). Solo `auth` y `properties` separan `service.ts`/`hooks/`/`interfaces/` de forma consistente; el resto de los módulos llaman a `api` directo desde el componente de página.

Alias: `@/*` → `./src/*`.

## Cliente de API (post-refactor — Bloque A)

**`src/modules/shared/lib/axios.ts`:**
```ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      const isAuthEndpoint = (error.config?.url ?? '').startsWith('/auth/');
      if (!isAuthEndpoint) emitUnauthorized();
    }
    return Promise.reject(error);
  }
);
```
- **URL base:** `NEXT_PUBLIC_API_URL`, fallback silencioso a `localhost:3000`.
- **Credenciales:** `withCredentials: true`. La cookie `access_token` es httpOnly — el frontend nunca la lee directamente (confirmado: cero usos de `document.cookie`/`js-cookie`); solo el middleware la lee server-side vía `request.cookies.get`.
- **Interceptor de respuesta (nuevo):** un 401 fuera de cualquier endpoint `/auth/*` dispara `emitUnauthorized()` → limpia la sesión del `AuthContext` y redirige a `/login` con un toast. Los 401 de `/auth/me` (hidratación), `/auth/login` (credenciales inválidas) y `/auth/logout` (sesión ya cerrada) quedan excluidos a propósito — cada uno los maneja su propio caller. 429 y el resto de los status (400/403/404/409/502) pasan intactos al `catch` del componente.
- **`src/modules/shared/lib/authEvents.ts`:** el puente entre el interceptor y `AuthContext` (evita el import circular `axios.ts → AuthContext → auth.service → axios.ts`). Expone `setOnUnauthorized(handler)` (llamado por `AuthProvider` al montar/desmontar) y `emitUnauthorized()` (llamado por el interceptor).
- **`src/modules/shared/lib/apiError.ts`:** `getErrorMessage(error)` — la función que **todo** `catch` de formulario debería usar ahora. Si `error.response.data.message` es string, se muestra tal cual; si es array (fallo de `class-validator`), une los primeros 3; 429 → mensaje propio ("Demasiados intentos..."); sin `response` (red caída) → mensaje de conexión. También `getErrorStatus(error)` para lógica condicional por status (ej. tratar 401 como éxito en logout).
- **`src/modules/shared/lib/validateImage.ts`:** `validateImageFile(file)` — valida `image/*` y ≤5MB client-side antes de subir (límites reales del backend), usado en los dos perfiles y en `PropertyForm`.
- **Tipado de respuestas:** `src/modules/shared/types/api.ts` es ahora el archivo canónico con los enums (`Role`, `StatusProperty`, `OperationType`, `RequestStatus` + `VALID_REQUEST_TRANSITIONS`), entidades (`User`, `Property`, `Favorite`, `Comment`, `Notification`, `SearchPreference`, `PropertyRequest`, etc.) y shapes de error (`ApiErrorResponse`, `ApiValidationErrorResponse`, `ApiThrottleErrorResponse`) del contrato del backend. Los `interfaces/` por módulo (`auth/interface/auth.interfaces.ts`, `properties/interfaces/operation-type.ts`, `.../status-property.ts`) ahora re-exportan desde acá en vez de definir sus propios duplicados — si necesitás un tipo de la API, primero mirá si ya está en `shared/types/api.ts`.
- **Nota:** el resto de las llamadas directas a `api.get/post/...` en componentes (fuera de `auth`/`properties`) siguen sin tipar la respuesta (`data` cae en `any` implícito) — no se tocó en este refactor, es trabajo pendiente si se quiere tipado end-to-end.

## Autenticación y sesión (post-refactor — Bloques B/C/D/F)

### Fuente de verdad de sesión
`AuthContext` (`src/modules/shared/context/AuthContext.tsx`), consumido vía `useAuth()`. Expone `{ user, isLoading, login, logout, register, updateUser }`. `logout` ahora acepta un `redirectTo` opcional (default `/`) — se usa `logout('/login')` después de un cambio de contraseña exitoso, porque el backend revoca la sesión al cambiar el password.

### Hidratación
Al montar `AuthProvider` (en el layout raíz), `GET /auth/me` hidrata `user`; 401 = no logueado. Sin persistencia en `localStorage`. `AuthProvider` también registra el handler de `authEvents` (`setOnUnauthorized`) al montar y lo desregistra al desmontar.

### Login / Registro / Logout
- **Login:** `LoginForm.tsx` (zod solo valida forma) → `AuthContext.login()` → `POST /auth/login`. Redirige por rol: admin → `/dashboardAdmin/`, resto → `/dashboard`. Si `user.profileIncomplete === true`, muestra un toast informativo (8s) invitando a completar perfil (pensado originalmente para usuarios de Google).
- **Google OAuth: sigue sin existir.** Pospuesto explícitamente (Bloque H de `FRONTEND_CHANGES.md`) con decisiones ya tomadas: reusar el Client ID del backend + librería `@react-oauth/google`. El backend ya soporta `POST /auth/google`.
- **Registro:** `RegisterForm.tsx` → `POST /auth/register` → redirige a `/login` (no autologuea).
- **Logout:** `AuthContext.logout(redirectTo)` → `POST /auth/logout`. Un 401 en logout se trata como éxito silencioso (la sesión ya estaba revocada); cualquier otro error también limpia el estado local igual — nunca deja al usuario "atrapado" logueado. La UI de confirmación de logout está **triplicada** (ver sección de duplicación).
- **Perfil (`PATCH /users/me`):** tanto `dashboard/perfil/page.tsx` como `dashboardAdmin/perfil/page.tsx` usan `PATCH /users/me` para datos y password (antes usaban `PATCH /users/:id`). Cambio de password exitoso → toast + `logout('/login')`. La foto sigue en `PATCH /users/:id/photo` (el contrato no tiene variante `/me` para foto).
- **Favoritos (rutas reparadas):** `GET /favorites` y `DELETE /favorites/:propertyId`, sin `userId` en la URL (antes eran `GET/DELETE /favorites/:userId/...`, rutas que ya no existían en el backend — favoritos estaba roto antes de hoy).

### Rutas protegidas — estado actual del middleware
`src/middleware.ts`, matcher: `/dashboard/:path*`, `/dashboardAdmin/:path*`, `/publicar/:path*`, `/login`, `/register`.
- `isAdminZone = pathname.startsWith('/dashboardAdmin')`; `isPrivateZone` cubre `/dashboard` (excluyendo admin) y `/publicar`.
- Sin token en zona privada o admin → redirect a `/login?callbackUrl=...` (el `callbackUrl` se setea pero **el login no lo lee** para redirigir de vuelta tras autenticarse — pendiente).
- Con token: si `isAdminZone && role !== 'admin'` → redirect a `/dashboard`. Si está en `/login` o `/register` ya logueado → redirect a `/dashboardAdmin` o `/dashboard` según rol.
- `decodeJwt` (jose) solo decodifica, **no verifica firma** — es UX de redirección, no autorización real; la autorización de verdad la hace el backend en cada request.
- Esto ya corrige el bug documentado en la versión anterior de este archivo (el middleware protegía `/admin` en vez de `/dashboardAdmin` y no bloqueaba nada de la zona admin). **Ya no aplica esa nota vieja** — la zona admin sí está protegida a nivel de servidor ahora.

### Lo que el middleware **no** hace (importante para el rediseño de roles)
El middleware **no impide que un admin navegue a `/dashboard`**: `isPrivateZone` solo exige un token válido, sin chequear que el rol sea `user`. Tampoco lo bloquea `src/app/(private)/dashboard/layout.tsx` — ese layout solo verifica `!user` (ver más abajo, sección "Vistas por tipo de usuario"). Es decir, hoy un admin logueado que escribe `/dashboard` en la URL entra sin fricción y ve el dashboard de usuario común. Documentado en detalle en la sección nueva de abajo porque es justo lo que probablemente haya que decidir/cambiar en el rediseño de roles.

### 401 en medio de la navegación
Ya no es un caso sin manejar: lo cubre el interceptor de `axios.ts` (ver "Cliente de API") — limpia sesión + toast + redirect a `/login`. Antes de hoy, un 401 a mitad de navegación dejaba al usuario en un estado inconsistente (UI logueada, backend rechazando); ese problema está resuelto.

## Vistas por tipo de usuario (sección nueva)

### Visitante NO logueado
- **Navbar:** `NavbarSelector.tsx` (`src/modules/shared/ui/NavbarSelector.tsx`) decide: si `pathname.startsWith('/dashboard')` (esto también matchea `/dashboardAdmin` por ser prefijo) → no renderiza navbar (los layouts de dashboard tienen su propio sidebar). Si `isLoading` → muestra `NavbarPublic` como placeholder. Si `!user` → `NavbarPublic`.
- **`NavbarPublic.tsx`:** logo, links con scroll suave a secciones de la landing (inicio, nosotros, faq), dropdowns de "propiedades" (venta/alquiler/terrenos/ver todas) y "servicios" (5 sub-servicios), dropdown de "contacto" (WhatsApp/Instagram/Facebook externos), y un botón "iniciar sesión" que linkea a `/login`. **No hay ningún link a favoritos, publicar propiedad, ni dashboard** — todo eso solo aparece logueado.
- **Rutas accesibles:** `(public)` completo (`/`, `/properties`, `/properties/:id`, `/servicios/:id`) y `(auth)` (`/login`, `/register`). Cualquier intento de entrar a `/dashboard`, `/dashboardAdmin` o `/publicar` sin token es redirigido a `/login` por el middleware.
- **Acciones disponibles:** ver catálogo y detalle de propiedades, ver comentarios/ratings existentes de una propiedad (de solo lectura — comentar y calificar requieren `POST`, que exige JWT), filtrar/buscar propiedades, ver servicios, contactar por WhatsApp/redes. **Favoritos, comentar, calificar, publicar, y todo el dashboard están fuera de alcance** — no hay UI de favoritos visible para un visitante (el `FavoriteButton` sí se renderiza en algunas vistas públicas, pero su `onClick` redirige a `/login` si `!user`, no intenta la llamada).

### Usuario logueado (`role: 'user'`)
- **Navbar:** `NavbarPrivate.tsx`. Suma respecto al visitante: link "publicar propiedad" (`/publicar`), campanita de notificaciones (`/dashboard/notificaciones`) con badge de no leídas (polling cada 60s vía `GET /notifications`), y un dropdown de avatar con "Mi perfil" (`/dashboard/perfil`), "Panel de control" (`/dashboard`) y "Cerrar sesión". El link "publicar propiedad" y la campanita de usuario están explícitamente condicionados a `!isAdmin`.
- **Dashboard (`/dashboard`, layout en `src/app/(private)/dashboard/layout.tsx`):** sidebar propio (logo, tarjeta de perfil, nav: Inicio/Favoritos/Mis Solicitudes/Notificaciones, luego Editar Perfil/Preferencias, luego Cerrar sesión). La página de inicio del dashboard (`dashboard/page.tsx`) es un listado de 5 tarjetas de acceso rápido (Mi Perfil, Favoritos, Preferencias, Mis Solicitudes, Notificaciones).
- **Rutas exclusivas:** `/dashboard/*` (favoritos, mis-solicitudes, notificaciones, perfil, preferencias) y `/publicar`.
- **Acciones nuevas respecto al visitante:** guardar/quitar favoritos, comentar y calificar propiedades (1-5, un rating por usuario/propiedad), enviar solicitud de publicación de propiedad propia (`/publicar`), ver el estado de sus solicitudes, guardar preferencias de búsqueda, editar perfil (datos, password, foto), toggle de notificaciones por email (`notifyBroadcast`, agregado en el Bloque G de hoy).
- **Guard del layout:** `dashboard/layout.tsx` (`useEffect`) solo verifica `!isLoading && !user → router.push('/login')`. **No verifica rol** — ver nota siguiente.

### Admin (`role: 'admin'`)
- **Navbar:** también `NavbarPrivate.tsx`, pero con `isAdmin` cambiando la lógica interna: sin link "publicar propiedad", campanita apunta a `/dashboardAdmin/notificaciones` en vez de `/dashboard/notificaciones`, badge "Administrador" en el dropdown, y los links del dropdown usan `dashboardHref = isAdmin ? '/dashboardAdmin' : '/dashboard'` / `perfilHref = isAdmin ? '/dashboardAdmin/perfil' : '/dashboard/perfil'` — **el navbar nunca ofrece un link a `/dashboard` para un admin**, ese acceso solo sería manual (ver nota abajo).
- **Dashboard (`/dashboardAdmin`, layout en `src/app/(admin)/dashboardAdmin/layout.tsx`):** sidebar propio y distinto del de usuario (badge "Administrador", nav: Inicio/Propiedades/Solicitudes/Usuarios/Notificaciones con badges de conteo por tipo, luego Mi Perfil/Estadísticas). Notificaciones admin se traen de `GET /notifications/admin`, polling cada 60s + evento custom `notif-updated` para refresco inmediato tras acciones.
- **Guard del layout:** `dashboardAdmin/layout.tsx` sí verifica rol — `useEffect`: si `!user` → `/login`; si `user.role !== 'admin'` → `/dashboard`. Esta es la única protección de rol client-side (además del middleware, que también protege `/dashboardAdmin/:path*` desde hoy).
- **Gestión disponible:** CRUD completo de propiedades (alta/edición con imágenes, portada, borrado, cambio de estado), gestión de usuarios (listar, ver detalle, eliminar), gestión de solicitudes de publicación (aprobar/rechazar/volver a revisión — ahora restringido a transiciones válidas del contrato, ver `FRONTEND_CHANGES.md` Bloque F), notificaciones admin.
- **⚠️ Link roto:** tanto el sidebar admin (`accountNavItems`) como el dashboard admin (`quickLinks` en `dashboardAdmin/page.tsx`) linkean a `/dashboardAdmin/estadisticas`, **ruta que no existe** en `src/app` (verificado: no hay ningún archivo bajo esa carpeta) — da 404 hoy. El backend sí tiene un módulo `stats` completo (`GET /stats/*`, requiere ADMIN) que el frontend nunca consume — es candidato natural para esa página faltante.
- **¿Puede un admin ver `/dashboard` (zona de usuario)?** **Sí, y no hay ninguna advertencia ni bloqueo si lo hace.** Ni el middleware ni `dashboard/layout.tsx` verifican que el rol sea `user`; solo exigen "logueado". Un admin que navega manualmente a `/dashboard` entra sin redirect y ve el sidebar y las páginas de usuario común (favoritos, mis-solicitudes, etc. — funcionalmente andarían, porque esos endpoints solo exigen JWT, no rol específico). Esto es exactamente el tipo de comportamiento que conviene decidir explícitamente en el rediseño: ¿se bloquea, se permite a propósito, o se ofrece como una vista intencional ("ver como usuario")?

## Duplicación y riesgo de interferencia de componentes (sección nueva)

### Footer
`FooterPublic` se importa **una sola vez**, en el layout raíz (`src/app/layout.tsx:4,40`), fuera de cualquier condicional de ruta — se renderiza en **todas** las páginas, incluidas `/dashboard/*` y `/dashboardAdmin/*` (esos layouts no lo excluyen; a diferencia del navbar, que `NavbarSelector` sí oculta en rutas que empiezan con `/dashboard`). No hay ningún otro import de `FooterPublic` en el resto del código — no está duplicado, pero si el rediseño quiere un dashboard "sin footer", hay que agregar esa exclusión explícitamente (siguiendo el mismo patrón que ya usa `NavbarSelector`).

### Modal de confirmación de logout — triplicado
Existen **tres implementaciones independientes**, casi idénticas visualmente pero copiadas a mano, del mismo modal `toast.custom(...)` "¿Ya te vas?":
1. `src/app/(private)/dashboard/layout.tsx` (función `handleLogoutConfirm` dentro de `Sidebar`)
2. `src/app/(admin)/dashboardAdmin/layout.tsx` (misma función, mismo nombre, en su propio `Sidebar`)
3. `src/modules/shared/ui/NavbarPrivate.tsx` (otra copia más, en el dropdown de avatar)

Las tres arman el mismo JSX (ícono con pulso, texto "¿Ya te vas?", dos botones) con clases Tailwind ligeramente distintas entre sí. Cambiar el copy o el estilo del modal de logout hoy requiere editar 3 archivos a mano.

### Modal de confirmación genérico (`toast.custom`) — 8 implementaciones distintas
Además del logout, hay confirmaciones de borrado con el mismo patrón "modal custom vía `toast.custom`" reimplementado por archivo, sin componente compartido:
- `src/app/(admin)/dashboardAdmin/usuarios/[id]/page.tsx` (eliminar solicitud)
- `src/app/(admin)/dashboardAdmin/solicitudes/page.tsx` (eliminar solicitud)
- `src/app/(admin)/dashboardAdmin/usuarios/page.tsx` (eliminar usuario)
- `src/app/(admin)/dashboardAdmin/propiedades/page.tsx` (eliminar propiedad)
- `src/app/(public)/properties/[id]/PropertyDetail.tsx` (eliminar comentario)
- más los 3 de logout ya listados.

No existe un componente `<ConfirmDialog />` reusable — es el mismo patrón de diseño repetido 8 veces con pequeñas variaciones de texto/color. Fuerte candidato a unificar antes o durante el rediseño.

### Inputs/labels de formulario — 3 implementaciones paralelas del mismo helper
`SectionTitle` + `Field` + constantes `inputCls`/`selectCls` (o `inputClass`/`selectClass`) están definidos **de forma independiente** en:
- `src/app/(admin)/dashboardAdmin/propiedades/PropertyForm.tsx`
- `src/app/(private)/publicar/page.tsx`
- `src/app/(private)/dashboard/preferencias/page.tsx`

Mismo patrón visual (label chico bold + input con fondo gris que blanquea al foco), tres copias de las mismas ~5 líneas de className. No hay `src/modules/shared/ui/Input.tsx` ni equivalente.

### Componentes duplicados a nivel de página completa
`dashboard/perfil/page.tsx` y `dashboardAdmin/perfil/page.tsx` son, estructuralmente, la misma página (foto, datos personales, cambiar contraseña) copiada dos veces con clases ligeramente distintas — ya señalado como pendiente de unificar en `FRONTEND_CHANGES.md`. Mismo caso, en menor medida, entre `dashboard/layout.tsx` y `dashboardAdmin/layout.tsx` (estructura de `Sidebar` casi idéntica, con el admin agregando badges de notificaciones y el ícono de Shield).

### Renderizado duplicado en el DOM
No se encontró ningún caso de `Navbar` o `Footer` renderizándose dos veces por anidamiento de layouts (el árbol de layouts es plano: `app/layout.tsx` es el único que monta `NavbarSelector`/`FooterPublic`; los layouts de ruta (`(public)`, `(private)/dashboard`, `(admin)/dashboardAdmin`) no vuelven a importarlos). **Si algo así aparece durante el rediseño, es una regresión nueva, no un problema preexistente.**

### Inventario de color hardcodeado
Grep de hex de 6 dígitos en todo `src/` (case-insensitive), top de ocurrencias:

| Color | Ocurrencias | Uso |
|---|---|---|
| `#0b7a4b` | **581** | Verde de marca principal — texto, fondos, bordes, sombras. Usado en **35 archivos** (prácticamente todos los componentes visuales del proyecto). |
| `#0f8b57` | 73 | Extremo del gradiente de marca (`linear-gradient(135deg, #0f8b57, #14a366)`), hovers |
| `#14a366` | 31 | Otro extremo del mismo gradiente |
| `#14965f` | 16 | Variante de verde en `LoginForm`/`RegisterForm` |
| `#0f8c58` | 15 | Otra variante de verde, hovers de navbar |
| `#25d366` | 8 | Verde oficial de WhatsApp (íconos/links) |
| `#16a34a`, `#15803d`, `#22c55e` | 4/2/2 | Verdes de Tailwind por nombre convertidos a hex en gradientes de servicios |
| resto (`#f0fdf4`, `#e8f5e9`, `#f8fafc`, `#e5e7eb`, `#9ca3af`, `#166534`, etc.) | 1-5 c/u | Fondos claros, grises de texto, variantes por sección de `/servicios/:id` (cada servicio tiene su propio par de colores `g1`/`g2`/`light`/`accent`) |

**No existe ninguna variable CSS ni token de Tailwind para estos colores** — ni en `globals.css` (que solo define `--font-primary`/`--font-heading`) ni como config de Tailwind (no hay `tailwind.config.*` en v4). Cada archivo repite el hex literal en `className` (arbitrary values `text-[#0b7a4b]`) o en `style={{ background: '...' }}`. Antes de centralizar la paleta, tener en cuenta que `#0b7a4b` por sí solo aparece en 35 de los ~70 archivos `.tsx` del proyecto — es un cambio de alto impacto, no cosmético aislado.

Los 35 archivos exactos con `#0b7a4b` (para referencia al momento de centralizar):
```
src/app/(admin)/dashboardAdmin/{layout,page}.tsx
src/app/(admin)/dashboardAdmin/notificaciones/page.tsx
src/app/(admin)/dashboardAdmin/perfil/page.tsx
src/app/(admin)/dashboardAdmin/propiedades/{page,PropertyForm}.tsx
src/app/(admin)/dashboardAdmin/solicitudes/page.tsx
src/app/(admin)/dashboardAdmin/usuarios/{page,[id]/page}.tsx
src/app/(private)/dashboard/{layout,page,perfil/page,preferencias/page,notificaciones/page,mis-solicitudes/page,favoritos/page}.tsx
src/app/(private)/publicar/page.tsx
src/app/(public)/properties/Propertiescatalog.tsx
src/app/(public)/properties/[id]/PropertyDetail.tsx
src/app/(public)/servicios/[id]/page.tsx
src/modules/landing/components/{Featuredproperties,FooterPublic,Loadingpage,Nosotros,RealEstateFAQ,Reseñas,Servicios,Slider}.tsx
src/modules/properties/components/{FiltersPanel ,HeaderSearch,PropertiesList,PropertyCard,SearchBar}.tsx
src/modules/shared/ui/{Favoritebutton,NavbarPrivate,NavbarPublic}.tsx
```

## Inventario de estilos actuales (sección nueva)

### Sistema de filtrado de propiedades — aparece en 2 lugares, con 2 implementaciones de header distintas
- **Componente de filtros real:** `src/modules/properties/components/FiltersPanel .tsx` (⚠️ el nombre de archivo tiene un espacio antes de `.tsx` — `'./FiltersPanel '`, así están los imports en todo el proyecto; no es un typo de este documento). Exporta `FiltersPanel` (named + default).
- **Sí aparece en la landing (confirmado, no debería quedarse ahí según el pedido):** `src/modules/landing/components/Slider.tsx` (el carrusel hero de `/`) importa `HeaderSearch` (`src/modules/properties/components/HeaderSearch.tsx`), que a su vez importa y renderiza `FiltersPanel` + `SearchBar` dentro de un panel colapsable. Cadena completa: `(public)/page.tsx` → `PropertySlider` → `HeaderSearch` → `FiltersPanel`.
- **El lugar donde sí debería quedarse:** `src/app/(public)/properties/Propertiescatalog.tsx` (la página `/properties`) importa `FiltersPanel` **directamente** (no a través de `HeaderSearch`) y arma su propia barra de búsqueda + botón de filtros a mano (JSX casi idéntico al de `HeaderSearch.tsx` pero no es el mismo componente — otra duplicación menor: dos implementaciones de "search bar + botón toggle de filtros").
- Ambos usan el mismo hook de estado compartido `usePropertyFilters()` (lee/escribe query params de la URL), así que filtrar desde la landing y filtrar desde `/properties` técnicamente actualizan el mismo estado de filtros — pero visualmente son dos paneles de filtro distintos montados en dos árboles de componentes distintos.

### Carrusel(es) — no hay un único componente, hay dos patrones distintos y ninguno usa Swiper
1. **Hero de la landing** (`src/modules/landing/components/Slider.tsx`, exporta `PropertySlider`): carrusel 100% custom hecho a mano — `useState` para el índice + `setInterval` (4.5s) para autoplay + animaciones con **GSAP** (`gsap.timeline()` en cada cambio de slide) + botones prev/next manuales. Datos hardcodeados en el archivo (array `slides`, 5 imágenes fijas, algunas locales en `/public`, otras de Unsplash/Alphacoders). Se usa una sola vez, en la landing.
2. **Carrusel de reseñas** (`src/modules/landing/components/Reseñas.tsx`): un carrusel circular **puramente CSS**, sin JS de animación — usa custom properties (`--quantity`, `--index`, `--color-card`) inyectadas vía `style` y clases `wrapper-carousel`/`inner-carousel`/`card-review`. El CSS de esas clases (incluida la animación de rotación 3D) **no vive en `globals.css` ni en ningún `.css` aparte** — está inyectado por el propio componente vía `<style dangerouslySetInnerHTML={{ __html: \`...\` }}>` (línea 65 en adelante), autocontenido en ese único archivo. Datos también hardcodeados (10 testimonios fake con nombre/texto/estrellas, no vienen del backend).
3. **`swiper` (paquete npm) no se usa en absoluto** — dependencia declarada pero sin un solo import en `src/`.

Si el rediseño quiere un carrusel único y reutilizable, hoy no existe ese componente — hay que construirlo o adoptar `swiper` (ya está instalado) para reemplazar ambos casos custom.

### Paleta de colores real (más allá del verde de marca)
Recorriendo `className`/`style` de los componentes principales:
- **Verde de marca:** `#0b7a4b` (principal) con variantes `#0f8b57`/`#14a366`/`#14965f`/`#0f8c58`/`#0d7a4d`/`#085031`/`#084f30`/`#075534`/`#064e3b` — todas variaciones tonales del mismo verde, sin un sistema de escalas consistente (no son una escala 50-900 prolija, son valores elegidos a ojo por archivo).
- **Grises/neutros:** fondos `#f8fafc`, `#f5f7f5`, `#f2f1f1` (body, en `globals.css`), `#e5e7e5`/`#e5e7eb`/`#dde3dd`/`#cbd8cd` (fondos de sección/dashboard), texto gris via clases Tailwind estándar (`text-gray-400/500/600/900`) — estos sí usan la escala de Tailwind por nombre, no hex hardcodeado.
- **Rojo:** `text-red-500`/`bg-red-50`/`bg-red-100` (clases Tailwind estándar) para errores, favoritos, eliminar — consistente, no hardcodeado en hex salvo casos puntuales.
- **Colores de marcas externas (hardcodeados, no tocar sin razón):** `#25d366` (WhatsApp), `#1877f2` (Facebook), `#f09433`/`#e6683c`/`#dc2743`/`#cc2366`/`#bc1888` (gradiente oficial de Instagram, en `FooterPublic`/`NavbarPublic`).
- **Colores por servicio (`/servicios/:id`):** cada uno de los 5 servicios define su propio set `g1`/`g2` (gradiente de fondo del hero), `light`/`lightText` (fondo/texto de sección clara) y `accent` — 5 combinaciones de verde distintas, todas variantes de la marca pero sin reutilizar una paleta común (`src/app/(public)/servicios/[id]/page.tsx`, objeto `serviciosData`).
- **Amarillo/ámbar y azul:** usados consistentemente vía clases Tailwind (`amber-*`, `blue-*`) para estados/badges (ej. "pendiente", info) — no hardcodeados en hex.

No hay modo oscuro implementado (no se encontró `dark:` en ninguna clase Tailwind ni lógica de tema).

## Formularios y validación

Sin cambios estructurales desde la versión anterior, con dos ajustes del refactor de hoy:
- **`LoginForm`/`RegisterForm`** (únicos con `react-hook-form` + `zod`): el `catch` del submit ahora usa `getErrorMessage()` en vez de un string hardcodeado — muestra "Credenciales inválidas" (401), el mensaje real de 400/429, etc. La validación de forma (zod) se sigue mostrando inline por campo, sin cambios.
- **Resto de formularios** (perfil, `PropertyForm`, `publicar`, preferencias): siguen siendo manuales con `useState` y validación a mano (`if (!campo) toast.error(...)`), pero los `catch` de submit migraron a `getErrorMessage()` — ahora si el backend devuelve, por ejemplo, un 409 "Ese email no está disponible" o el detalle de un campo inválido, el usuario lo ve tal cual en vez de un mensaje genérico fijo. `PropertyForm` y los dos perfiles además validan imágenes client-side con `validateImageFile()` antes de subir.
- **`src/app/(private)/publicar/page.tsx`:** los arrays de opciones (`TIPOS_PROPIEDAD`, `ESTADOS`) se corrigieron hoy para matchear exactamente los enums que acepta el backend (antes ofrecían valores como "Cochera"/"Otro" que el backend rechazaba con 400 seguro).

## Endpoints consumidos

Sin cambios de fondo desde la versión anterior salvo lo ya señalado (favoritos y perfil con rutas nuevas). Por módulo, con el archivo donde vive cada llamada:

- **Auth** (`auth.service.ts`): `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/logout`.
- **Properties (público)** (`properties.service.ts`): `GET /properties/filter`, `GET /properties/:id`, `GET /properties/filters/locations`.
- **Properties (comentarios/ratings)** (`PropertyDetail.tsx`): `GET/PATCH/DELETE /properties/:id/comments[/:commentId]`, `GET/POST /ratings/:propertyId`.
- **Favoritos** (`Favoritebutton.tsx`, `dashboard/favoritos/page.tsx`): `GET /favorites`, `POST /favorites/:propertyId`, `DELETE /favorites/:propertyId`.
- **Solicitudes de publicación (usuario)** (`publicar/page.tsx`, `dashboard/mis-solicitudes/page.tsx`): `POST /property-requests`, `GET /property-requests/my-requests`.
- **Solicitudes (admin)** (`dashboardAdmin/solicitudes/page.tsx`, `usuarios/[id]/page.tsx`): `GET /property-requests`, `PATCH /property-requests/:id/status` (ahora limitado a transiciones válidas en la UI), `DELETE /property-requests/:id`, `GET /property-requests/user/:id`.
- **Propiedades (admin CRUD)** (`dashboardAdmin/propiedades/*`): `GET /properties`, `DELETE /properties/:id`, `POST/PATCH /properties[/:id]` (multipart), `GET /property-types`, `PATCH /property-images/:id/set-cover`.
- **Usuarios (admin)** (`dashboardAdmin/usuarios/*`): `GET /users`, `GET /users/:id`, `DELETE /users/:id`.
- **Perfil** (`dashboard/perfil`, `dashboardAdmin/perfil`): `PATCH /users/me` (datos/password), `PATCH /users/:id/photo` (multipart).
- **Preferencias de búsqueda** (`dashboard/preferencias/page.tsx`): `GET /property-types`, `GET/PATCH/POST /search-preferences`; admin también `GET /search-preferences/user/:id`.
- **Notificaciones:** usuario `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`; admin `GET /notifications/admin`, `PATCH /notifications/admin/read-all` (+ evento DOM custom `notif-updated` para refresco fuera del polling de 60s).
- **Dashboard admin (métricas)** (`dashboardAdmin/page.tsx`): `GET /users` + `GET /properties` + `GET /property-requests` en paralelo, agregados client-side. **No usa `GET /stats/*`** pese a que el backend lo expone completo — ver nota del link roto a `/dashboardAdmin/estadisticas` en la sección de vistas por rol.

## Subida de imágenes

Mismo mecanismo de antes (`FormData` + `multipart/form-data`, sin librería de upload), con una capa nueva de validación client-side agregada hoy:

- **Foto de perfil** (ambos perfiles): preview con `FileReader.readAsDataURL`, ahora **valida con `validateImageFile()`** (tipo `image/*` y ≤5MB) antes de armar el `FormData` y llamar `PATCH /users/:id/photo` — antes no había ninguna validación client-side.
- **Imágenes de propiedad** (`PropertyForm.tsx`): drag & drop + click-to-browse, máximo 10 imágenes totales (existentes + nuevas), preview con `URL.createObjectURL` (con `revokeObjectURL` al remover). Ahora cada archivo pasa por `validateImageFile()` antes de contarse contra el límite de 10 — un archivo inválido se rechaza con toast puntual y no ocupa un slot. Selección de portada: estado local para imágenes nuevas, `PATCH /property-images/:id/set-cover` para las ya existentes.
- Los hosts remotos permitidos por `next/image` siguen definidos en `next.config.ts` → `images.remotePatterns`: `res.cloudinary.com`, `images3.alphacoders.com`, `images.unsplash.com`, `www.unc.edu.ar`.

## Convenciones de estilo

- Componentes funcionales con hooks, casi todo `'use client'` (incluso layouts que podrían ser server component, como los de dashboard, son client components porque dependen de `useAuth()`).
- Naming: PascalCase para componentes, `use`-prefix para hooks (incluye hooks locales no exportados como `useHideOnScroll`/`useScrollToSection`, duplicados de forma casi idéntica entre `NavbarPublic.tsx` y `NavbarPrivate.tsx` — otro caso de lógica repetida en vez de un hook compartido en `shared/`).
- Mezcla de español/inglés en nombres — consistente con que el dominio y usuarios son hispanohablantes, sin regla estricta.
- **Tailwind:** clases inline con template literals y ternarios condicionales directo en `className`, sin `clsx`/`cn()`. Ver sección de duplicación para los helpers locales (`inputCls`, `SectionTitle`, `Field`) redefinidos por archivo en vez de compartidos.
- **CSS plano fuera de Tailwind:** vive en dos lugares — `globals.css` (el botón "volver arriba", clases `.button`/`.svgIcon`, con `@keyframes floating`) y un bloque `<style dangerouslySetInnerHTML>` autocontenido dentro de `Reseñas.tsx` (clases del carrusel circular de testimonios). No hay un tercer `.css` en el proyecto fuera de estos dos puntos.
- Sin modo oscuro, sin sistema de tokens de diseño, sin componentes base compartidos (botón/input/card genéricos) — cada página define su propio estilo visual repitiendo patrones similares a mano.

> ⚠️ **Nota sobre las dos secciones de abajo:** las secciones anteriores de este documento (paleta hardcodeada, "no existe `ConfirmDialog`", "swiper no se usa", GSAP en el Hero, etc.) describen el estado **previo al rediseño de la Landing**, que ya ocurrió en sesiones posteriores y no está reflejado arriba. Lo que sigue es exploración fresca y verificada contra el código real hoy. Para el detalle sesión-por-sesión de ese rediseño (Bloques LANDING, UI-1 a UI-7, Bloque H de login con Google), ver `FRONTEND_CHANGES.md`.

## Sistema de diseño de la Landing (ya construido — referencia para reusar)

Todo lo de esta sección vive bajo `src/modules/landing/components/` salvo que se indique lo contrario, y **ya está en producción en la Landing** — es el estándar a imitar, no una propuesta.

### Tokens de color (`src/app/globals.css`, bloque `@theme`)
Tailwind v4: los tokens se definen en `@theme { }` dentro de `globals.css`, no en `tailwind.config.*` (no existe ese archivo). Cada `--color-X` genera automáticamente `bg-X`, `text-X`, `border-X`, `from-X`, `ring-X`, `bg-X/NN`, etc.

| Token | Hex | Uso |
|---|---|---|
| `brand-50` … `brand-950` (11 pasos) | `#eff9f4` → `#032315` | Escala de verde de marca. **`brand-700` = `#0b7a4b`** es el verde histórico del proyecto (581 usos antes de tokenizar); `brand-500`/`600`/`800` son los otros tonos que ya existían en gradientes/hovers. `brand-50` se usa como fondo de sección muy claro (Reseñas, FAQ); `brand-100`/`200` para marcas de agua sutiles. |
| `brand` (alias) | `#0b7a4b` | Mismo valor que `brand-700`, sin pasar por `var()` — para que `bg-brand/10` no dé problemas de opacidad. |
| `ink-50` … `ink-950` (11 pasos) | `#f6f7f6` → `#0a0c0b` | Escala neutra (negros/grises con un dejo verde). Se llama `ink` y **no** `gray` a propósito: nombrarla `gray` pisaría la escala nativa de Tailwind. `ink-900`/`950` para texto oscuro fuerte, `ink-500` para texto secundario, `ink-100`/`200` para bordes sutiles. |
| `surface`, `surface-alt`, `surface-deep` | `#f5f7f5`, `#e5e7e5`, `#cbd8cd` | Fondos de sección/dashboard. Blanco puro **no tiene token**, se usa `bg-white` directo. |
| `--gradient-brand`, `--gradient-brand-hover` (`:root`, no `@theme`) | `linear-gradient(135deg, brand-600, brand-500)` / `(..., brand-700, brand-600)` | Se usan vía `style={{ background: 'var(--gradient-brand)' }}` — no se pueden generar como utilidad de Tailwind porque son gradientes con dos paradas de token, no un solo color. |

Además, dos **clases CSS planas** (no tokens de Tailwind) definidas en `globals.css`, fuera de `@theme`:
- **`.surface-brand-deep`** — verde oscuro con textura (gradiente diagonal apagado + 2 halos radiales + trama de puntos en `::before`). Se usa en la franja de estudiantes del Hero y en la sección "Trayectoria" (`Confianza.tsx`).
- **`.surface-brand-deepest`** — variante aún más oscura, usada solo en el footer (`FooterPublic.tsx`) para "cerrar" la página.

### `CtaButton` (`src/modules/landing/components/CtaButton.tsx`)
Botón de acción único de toda la Landing — reemplazó 3 estilos de botón distintos que había antes (gradiente con brillo permanente en el Hero, gradiente repetido en "Ver todas las propiedades", negro sólido en Servicios).

```ts
interface CtaButtonProps {
  href: string;
  variant?: 'primary' | 'outlineLight' | 'outlineDark'; // default 'primary'
  children: React.ReactNode;
  icon?: React.ReactNode;      // se renderiza a la derecha del texto
  external?: boolean;          // true → <a target="_blank">, false → <Link>
  className?: string;
}
```
- **`primary`** — verde sólido `brand-700` (`brand-800` en hover), texto blanco. Para fondos claros.
- **`outlineLight`** — contorno blanco translúcido, texto blanco, se rellena de blanco en hover con texto `brand-800`. Para fondos oscuros (Hero, secciones `.surface-brand-deep`).
- **`outlineDark`** — contorno verde sobre blanco. Para fondos claros como alternativa al `primary`.
- Geometría común: `rounded-xl`, `px-8 py-4` (más ancho que alto), `font-bold`, hover con elevación (`-translate-y-0.5`) + sombra + barrido de luz que **solo se dispara en hover** (no hay brillo permanente).
- **Detalle de implementación no obvio:** el `border-2` vive en la clase `BASE` compartida (no en cada variante) — `primary` lo sobreescribe a `border-transparent`. Así las 3 variantes ocupan exactamente el mismo espacio en pantalla aunque solo 2 tengan borde visible; fue el fix a un bug real donde "Iniciar sesión" (outline) se veía 4px más grande que "Ver propiedades" (primary, sin borde) en la misma fila del Hero.
- **⚠️ No usado todavía fuera de la Landing** — verificado por grep, cero imports en `src/app/(public)/properties/` ni en ningún otro flujo.

### Patrón de tarjeta premium — `FeaturedPropertyCard` (`src/modules/landing/components/FeaturedPropertyCard.tsx`)
Es la tarjeta de la sección "Propiedades destacadas" de la Landing, y es el estándar a reusar si se rediseña el catálogo. **Es un componente aparte de `PropertyCard`** (el del catálogo real, ver sección de Properties abajo) — no se tocó `PropertyCard` al crearla.

- **Contenedor:** `rounded-xl` (no `rounded-3xl` como el resto de tarjetas del proyecto — deliberadamente "menos redondeado, más serio/empresarial"), `border border-ink-200/70`, sombra sutil en reposo (`shadow-[0_2px_10px_-2px_rgba(10,12,11,0.08)]`) que se intensifica mucho en hover (`shadow-[0_28px_55px_-18px_rgba(6,57,35,0.4)]`) junto con `-translate-y-1.5` y el borde pasando a `brand-700/40`.
- **Imagen:** `h-64`, con gradiente `from-ink-950/80` para legibilidad del texto superpuesto, y `scale-105` en hover (zoom sutil de la imagen, no de la card).
- **Badge de operación:** píldora `bg-brand-700` arriba a la izquierda, texto blanco uppercase.
- **Badge de rating:** solo si `ratingAverage > 0` (viene de `shared/types/api.ts`, campo opcional) — píldora blanca semitransparente arriba a la derecha con ícono `Star` relleno ámbar + valor a 1 decimal.
- **Precio:** superpuesto abajo a la izquierda de la imagen, `$` + `toLocaleString('es-AR')` + "USD" en tamaño menor — **con signo `$` explícito**, a diferencia de `PropertyCard` (catálogo), que no lo tiene.
- **Contenido:** tipo de propiedad en `brand-700` uppercase chico, título `line-clamp-2` que cambia a `brand-700` en hover, ubicación con ícono `MapPin`, y una fila de características (habitaciones/baños/m²) separada por `border-t border-ink-100`, con una flecha `ArrowRight` que aparece en hover al final de la fila.
- **Sin `FavoriteButton`** — decisión deliberada: la Landing es la puerta de entrada, y el corazón empujaba a `/login` a quien no tiene cuenta. `FavoriteButton` sigue existiendo y usándose en `PropertyCard` (catálogo).
- Usa el tipo canónico `Property` de `@/modules/shared/types/api` (con `ratingAverage`), no el tipo local `modules/properties/interfaces/propertyInterface.ts` que usa el catálogo — ver "Gaps" abajo, es relevante para migrar el catálogo a este patrón.

### `Reveal` (`src/modules/landing/components/Reveal.tsx`)
Wrapper de animación de entrada al hacer scroll, usado en **todas** las secciones de la Landing:
```tsx
<Reveal delay={0.1} y={24} className="...">{children}</Reveal>
```
Por dentro es `framer-motion`: `initial={{opacity:0, y}} whileInView={{opacity:1, y:0}} viewport={{once:true, margin:'-60px'}} transition={{duration:0.55, ease:'easeOut', delay}}`. No hay ninguna otra forma de animación de entrada en la Landing — todo pasa por este componente o por `SectionHeading` (que trae su propia animación equivalente inline).

### `SectionHeading` (`src/modules/landing/components/SectionHeading.tsx`)
Encabezado estándar de cada sección de la Landing — eyebrow + `h2` + subtítulo opcional, centrado, con su propia animación de entrada (mismo patrón que `Reveal` pero con `margin: '-80px'`).
```tsx
<SectionHeading eyebrow="Servicios inmobiliarios" title={<>Hacemos que todo sea <span className="text-brand-700">más simple</span></>} subtitle="..." />
```
El eyebrow es una píldora **sólida** `bg-brand-700` con texto blanco (`rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.22em] uppercase` + sombra) — reemplazó un `bg-brand-50` casi invisible que había en una iteración anterior. Este es el patrón de "badge/pill" que se repite en toda la Landing (también aparece suelto, sin `SectionHeading`, en el eyebrow del Hero y en los chips de operación de las tarjetas).

### Estado real de adopción — `ConfirmDialog` / `Field` / `Input` / `Select`
Verificado por grep en toda la sesión, no asumido:

- **`ConfirmDialog`** (`src/modules/shared/ui/ConfirmDialog.tsx`, función `confirmDialog()`) — **sí adoptado, 8/8 usos reales** + su propia definición + `preview-ui`. Reemplaza por completo el patrón viejo de `toast.custom` a mano. Se usa en: `dashboard/layout.tsx` y `dashboardAdmin/layout.tsx` (logout), `NavbarPrivate.tsx` (logout), `dashboardAdmin/usuarios/page.tsx`, `usuarios/[id]/page.tsx`, `solicitudes/page.tsx`, `dashboardAdmin/propiedades/page.tsx` (los 4 de borrado admin), y **`PropertyDetail.tsx`** (borrar comentario — es el único lugar donde el flujo de Properties ya usa una pieza del sistema de diseño nuevo).
- **`Field` / `Input` / `Select`** (`src/modules/shared/ui/{Field,Input,Select}.tsx`) — adoptados en **3 formularios**: `dashboardAdmin/propiedades/PropertyForm.tsx`, `(private)/publicar/page.tsx`, `dashboard/preferencias/page.tsx` (+ `preview-ui`). **No** se usan en `LoginForm`/`RegisterForm`: esos usan un componente hermano propio, `AuthField` (`src/modules/auth/components/AuthField.tsx`), documentado en el propio archivo como decisión deliberada — `Field`/`Input` tienen `px-4` fijo en su clase base y los campos de auth necesitan `pl-10` para el ícono interno; sin `tailwind-merge` en el proyecto, forzarlo por `className` generaría dos paddings compitiendo. **No hay ningún uso de `Field`/`Input`/`Select` en el flujo de Properties** (catálogo, filtros ni detalle) — todos sus inputs son manuales.
- **`ensureExists`** — no existe ningún archivo ni función con ese nombre en el frontend (grep sin resultados). No es un patrón de este proyecto.

### Otros patrones reusables confirmados
- **Contacto centralizado:** `src/modules/shared/lib/contact.ts` exporta `WHATSAPP_NUMBER` y `whatsappLink(mensaje)` — antes el número estaba repetido a mano en 3+ archivos.
- **Fondos alternados por sección:** cada sección de la Landing define su propio `py-24 md:py-28` (padding simétrico) y alterna fondo blanco / `surface` / `.surface-brand-deep` / `brand-50` entre secciones consecutivas, en vez de que la página imponga márgenes — así cada sección es autocontenida y reordenable.
- **Iconografía:** exclusivamente `lucide-react` en toda la Landing (`react-icons/bs` solo para los 3 íconos de marca externa: WhatsApp/Instagram/Facebook, que no existen en lucide con el trazo oficial).
- **Consideración de arquitectura:** `CtaButton`, `FeaturedPropertyCard`, `Reveal` y `SectionHeading` viven en `src/modules/landing/components/`, no en `shared/ui/`. Importarlos desde `src/app/(public)/properties/` (dominio distinto) funciona técnicamente pero cruza el límite de módulo tal como está organizado el proyecto hoy — si se van a reusar ahí de forma permanente, moverlos a `shared/ui/` sería más prolijo que importar cruzado desde `landing/`.

## Flujo completo de Properties — catálogo, detalle, filtros

### `/properties` — `src/app/(public)/properties/Propertiescatalog.tsx` (Client Component)
Recibe `initialItems`/`initialTotal` desde el Server Component `page.tsx` (que ya hace el primer fetch con los filtros de la URL) y desde ahí vive 100% del lado del cliente:
- **Fetch:** en cada cambio de `filters` (vía `usePropertyFilters()`) hace `propertiesService.getFilteredProperties(filters)` → `GET /properties/filter`. El primer render usa los datos que ya vinieron del servidor (`isFirstRender` evita un fetch duplicado).
- **Header propio, no `SectionHeading`:** eyebrow + `h1` con hex hardcodeado (`text-[#0b7a4b]`), no usa el componente compartido de la Landing.
- **Barra de búsqueda + filtros:** `SearchBar` (input de texto libre) + botón "Filtros" que abre/cierra `FiltersPanel` — **implementación propia**, no reusa `HeaderSearch` (ver más abajo).
- **Toggle grilla/lista:** estado local `viewMode`. Grilla usa `PropertyCard`; lista usa `PropertyCardList`, una **segunda tarjeta definida al final de este mismo archivo** (no es un componente compartido), con imagen a la izquierda, datos al medio, precio + botón de WhatsApp a la derecha.
  - **⚠️ Bug encontrado:** `PropertyCardList` tiene un botón de favorito (ícono `Heart`) que es **puramente decorativo** — no tiene `onClick`, no recibe `propertyId`, no llama a ningún endpoint. Da la impresión de que favoritos funciona en la vista de lista y no es así.
- **Paginación:** numérica con elipsis (`...`) cuando hay muchas páginas, calculada a mano (no una librería), sobre `total` / `filters.limit`.
- **Estados:** loading → 6 skeletons `animate-pulse`; vacío → ícono `Search` + mensaje; ambos manuales, sin componente compartido de estado vacío.
- **Sin animaciones de scroll** — no usa `Reveal` ni ningún framer-motion.

### `FiltersPanel` — `src/modules/properties/components/FiltersPanel .tsx`
⚠️ El nombre de archivo tiene un **espacio antes de `.tsx`** (`'FiltersPanel '`) — así están todos los imports en el proyecto, no es un error de este documento.

Campos que expone hoy (todos conectados a `usePropertyFilters()` vía `applyFilter`, que en el catálogo llama directo a `setFilters`):
- **Localidad / Zona / Barrio** — 3 dropdowns custom (no `<select>` nativo) poblados desde `propertiesService.getLocationFilters()` (`GET /properties/filters/locations`).
- **Operación** — toggle Venta/Alquiler (dos botones, no checkbox).
- **Tipo de propiedad** — `<select>` con **valores hardcodeados `1`–`5`** (Casa/Depto/Local/Oficina/Terreno) en vez de traerlos de `GET /property-types` (que sí se usa en otras partes del proyecto, como `PropertyForm` y `preferencias`) — inconsistencia a tener en cuenta si cambian los IDs en el backend.
- **Habitaciones, baños, precio min/max, m² min/max, antigüedad máx.** — inputs numéricos con **estado local propio** (`localNumbers`) y debounce de 700ms antes de aplicarse a la URL — para no disparar un `router.push` en cada tecla.
- **Cochera / Patio / Escritura** — checkboxes (`garage`, `patio`, `property_deed`).
- **Contador de resultados en vivo:** al cambiar cualquier filtro, tras 400ms hace un fetch con `limit: 1` solo para leer `meta.totalItems` y mostrarlo en el botón "Ver N resultados".
- **Limpiar / Ver resultados:** limpiar resetea todo (`clearFilters()` en catálogo); "Ver resultados" solo aparece si hay algún filtro activo.
- **⚠️ Rama de código muerta:** el componente tiene una bifurcación completa `isLanding = pathname === '/'` (con su propio estado `landingFilters` separado de la URL, y un `handleVerResultados` que arma query params a mano y navega a `/properties?...`). Esa rama **ya no se puede alcanzar**: `FiltersPanel` dejó de renderizarse en `/` cuando se sacó `HeaderSearch` del Hero (ver punto siguiente). Si se confirma que no se va a reusar, es candidato a limpieza.
- **Persistencia:** enteramente vía `usePropertyFilters()` → URL. No hay estado de filtros en `localStorage` ni Context.

### `SearchBar` — `src/modules/properties/components/SearchBar.tsx`
Input de texto libre independiente de `FiltersPanel`. Estado local `inputValue` con debounce de 600ms antes de escribir `filters.search` en la URL (para que tipear no dispare un fetch por letra); se resincroniza si `filters.search` cambia desde afuera (ej. al limpiar filtros). Estilo propio (`rounded-4xl`, borde `#0b7a4b`), no comparte clases con `FiltersPanel` ni con ningún input de la Landing.

### `HeaderSearch` — `src/modules/properties/components/HeaderSearch.tsx` — confirmado: sigue sin ningún uso
Grep exhaustivo: el único archivo que menciona `HeaderSearch` es su propia definición. Antes envolvía `SearchBar` + `FiltersPanel` colapsable y se usaba en el Hero de la Landing (`Slider.tsx`); se sacó de ahí en el rediseño de la Landing y **no se volvió a usar en ningún otro lado, ni se borró**. Sigue en el repo, sin importar en ninguna parte, a la espera de una decisión.

### `/properties/:id` — `src/app/(public)/properties/[id]/PropertyDetail.tsx` (Client Component)
`page.tsx` hace `propertiesService.getOne(id)` server-side (`GET /properties/:id`) y pasa la propiedad completa como prop.

- **`ImageSlider`** (función interna del archivo): slider a mano con miniaturas clickeables abajo, sin librería (no usa Swiper, a diferencia de la Landing ya migrada). Estado vacío con ícono `Home` si no hay imágenes.
- **Título + badges:** operación, tipo de propiedad, estado (`disponible` en verde / lo demás en rojo) — todos con hex hardcodeado, no tokens.
- **Descripción, Características (grid de specs), atributos booleanos** (cochera/patio/escritura, con check verde o X gris) — cards blancas `rounded-3xl` con sombra sutil, patrón repetido.
- **`CommentsAndRatings`** (función interna, la pieza más grande del archivo): valoraciones (promedio, lista, `StarPicker` para calificar 1-5) + comentarios (crear/editar/eliminar, con avatar, "Tú" badge si es el propio comentario). Fetch propio a `GET /properties/:id/comments` y `GET /ratings/:propertyId` en un `useEffect`, independiente del fetch inicial del padre. **Usa `confirmDialog` del sistema de diseño nuevo** para confirmar el borrado de un comentario — es la única integración real hoy entre Properties y el sistema de diseño de la Landing.
- **`GoogleMapSection`:** iframe embebido de Google Maps con la dirección (usa `provincia` como query — no la dirección completa, dato a verificar si se quiere mostrar una ubicación más precisa).
- **Sidebar sticky (columna derecha):** tarjeta de precio + botón "Consultar por WhatsApp" (gradiente hardcodeado, no `CtaButton`), tarjeta de agente (si `agent` viene en la respuesta), tarjeta de resumen (lista de specs filtrando los que tienen valor).
- **⚠️ No hay botón de favorito en esta página.** Verificado por grep: cero menciones de `FavoriteButton` o `Favoritebutton` en todo el archivo. El comentario de `FeaturedPropertyCard.tsx` que dice *"Favoritos sigue funcionando igual en `/properties` y en el detalle"* es **impreciso** — funciona en el catálogo (`PropertyCard` lo incluye), pero **no en el detalle de una propiedad individual**, que es probablemente donde más sentido tendría.
- **⚠️ `params` sin `Promise` en la página contenedora:** `[id]/page.tsx` tipa `params: { id: string }` y lo usa sin `await` (`Number(params.id)`). Es el mismo patrón que ya se corrigió para `searchParams` en `(public)/properties/page.tsx` (documentado en `FRONTEND_CHANGES.md`, Bloque UI-6) — acá no se tocó. No se confirmó si hoy tira warning en consola (no se corrió el dev server en esta sesión de solo lectura), pero es el mismo tipo de deuda ya identificada y arreglada en otro lugar.

### `PropertyCard` — `src/modules/properties/components/PropertyCard.tsx` (tarjeta del catálogo)
Distinta de `FeaturedPropertyCard` en código y en estilo — comparación directa:

| | `PropertyCard` (catálogo, hoy) | `FeaturedPropertyCard` (Landing, ya rediseñada) |
|---|---|---|
| Bordes | `rounded-3xl` | `rounded-xl` (más serio) |
| Colores | Hex hardcodeado (`#0b7a4b`, `#179144`) | Tokens (`brand-700`, `ink-*`) |
| Precio | Superpuesto centrado sobre la imagen, sin `$` | Esquina inferior izquierda, con `$` explícito |
| Badge de rating | No tiene | Sí, si `ratingAverage > 0` |
| Favorito | Sí (`FavoriteButton variant="card"`) | No (deliberado) |
| Tipo de dato | `Property` de `properties/interfaces/propertyInterface.ts` (sin `ratingAverage`) | `Property` canónico de `shared/types/api.ts` |
| Animación de imagen | `scale-105` en 1200ms | `scale-105` en 700ms |

Usada en 2 lugares: `Propertiescatalog.tsx` (vista grilla) y `PropertiesList.tsx`.

**⚠️ `PropertiesList.tsx` es código muerto.** Verificado por grep: no lo importa ningún otro archivo del proyecto. Es una versión anterior de la sección de destacados (mismo copy "propiedades elegidas por su ubicación, calidad y potencial" que tenía `Featuredproperties.tsx` antes del rediseño de la Landing), reemplazada y nunca borrada.

### Gaps — inconsistencias visuales/técnicas entre Properties y la Landing ya rediseñada
Lista concreta, cada ítem verificado por lectura directa del código (no estimado):

1. **Cero adopción de tokens de color.** Grep de hex de marca hardcodeado: **22 ocurrencias en `Propertiescatalog.tsx`**, **41 en `PropertyDetail.tsx`**, **8 en `PropertyCard.tsx`** — 71 en total en estos 3 archivos, cero usos de `brand-*`/`ink-*`.
2. **Dos tipos de `Property` incompatibles conviviendo.** El catálogo/detalle usa el tipo local `modules/properties/interfaces/propertyInterface.ts` (sin `ratingAverage`); la Landing usa el canónico de `shared/types/api.ts` (con `ratingAverage`). Migrar el catálogo al patrón de `FeaturedPropertyCard` (que sí muestra rating) requiere primero resolver este desalineamiento de tipos — y confirmar que `GET /properties/filter` realmente devuelve `ratingAverage` (en el rediseño de la Landing se confirmó que **no** lo devuelve; solo `GET /properties` y `GET /properties/:id` sí).
3. **Ningún componente del sistema de diseño nuevo, salvo `confirmDialog`** en `PropertyDetail.tsx` (borrar comentario). Ni `CtaButton`, ni `SectionHeading`, ni `Reveal`, ni `Field`/`Input`/`Select`.
4. **Botón de favorito roto (decorativo) en `PropertyCardList`** (vista de lista del catálogo) — ver arriba.
5. **Favoritos ausente en el detalle de propiedad** — ver arriba.
6. **Dos implementaciones de "search bar + botón de filtros"** con JSX casi idéntico pero sin componente compartido: la de `Propertiescatalog.tsx` (a mano) y la de `HeaderSearch.tsx` (sin uso hoy).
7. **`FiltersPanel` con rama muerta** (`isLanding`) desde que se sacó del Hero.
8. **Tipo de propiedad hardcodeado como IDs `1`–`5`** en `FiltersPanel`, en vez de consumir `GET /property-types` como hacen `PropertyForm`/`preferencias`.
9. **`PropertiesList.tsx` es código muerto** — candidato a borrar (confirmar con el usuario antes, mismo criterio que con `HeaderSearch`).
10. **Sin animaciones de scroll** (`Reveal`) en ninguna parte del flujo de Properties, a diferencia de toda la Landing.
