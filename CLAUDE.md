# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Contexto de este documento:** esta versión fue escrita con foco en preparar un refactor grande de adaptación a un backend NestJS que pasó por un hardening de seguridad. Las secciones de **Cliente de API** y **Autenticación y sesión** están documentadas con el mayor detalle posible, incluyendo explícitamente qué mecanismos **no existen todavía** en el frontend (manejo central de errores, refresh de tokens, etc.), porque eso es exactamente lo que probablemente haya que construir o adaptar.

## Descripción general

Cerca Trova es el frontend de una inmobiliaria en Córdoba, Argentina. Es un proyecto **Next.js 15 con App Router** (confirmado: toda la app vive en `src/app/`, no existe carpeta `pages/`), usando **React 19** y **TypeScript** en modo `strict`. Es un frontend puro: no hay base de datos ni backend en este repo, todo el estado remoto viene de una API HTTP externa (NestJS) referenciada por `NEXT_PUBLIC_API_URL`.

Stack confirmado (por `package.json`):
- **Next.js 15.5.5** (`next dev/build --turbopack`), **React 19.1.0**.
- **Tailwind CSS v4** vía `@tailwindcss/postcss` — no hay archivo `tailwind.config.*`, la config vive inline en CSS (`src/app/globals.css`).
- **No hay librería de componentes de UI** (no shadcn/ui, no Radix, no MUI, no Headless UI). No existe `components.json`. Tampoco se usa `clsx`/`cn()`/`tailwind-merge` en ningún lado — las clases de Tailwind se arman como template strings manuales condicionales.
- **axios** — cliente HTTP único (ver sección "Cliente de API").
- **react-hook-form + @hookform/resolvers + zod** — pero usados solo en 2 componentes (login y registro); el resto de los formularios son manuales con `useState`.
- **jose** — decodifica (no verifica firma) el JWT en el middleware de Next.js.
- **sonner** — toasts, montado una sola vez en el layout raíz.
- **framer-motion, gsap, three, swiper, lucide-react, react-icons** — animación, 3D y UI decorativa.
- No hay ningún cliente de estado global tipo Redux/Zustand/Jotai — el único estado global es `AuthContext` (React Context puro).

## Comandos

```bash
npm run dev      # servidor de desarrollo (Turbopack), http://localhost:3000
npm run build    # build de producción (Turbopack)
npm run start    # levanta el build de producción
npm run lint     # ESLint (flat config: next/core-web-vitals + next/typescript)
```

No hay ningún script de test configurado en `package.json` (no `test`, no `vitest`/`jest`/`playwright` en dependencias) y no se encontró ningún archivo de test en el repo. **No hay testing hoy.**

## Variables de entorno

Se buscó en `.env` (único archivo de entorno presente en el repo — no hay `.env.local` ni `.env.example`) y con grep de `process.env`/`import.meta.env` en todo `src/`.

| Variable | Pública (`NEXT_PUBLIC_*`) | Dónde se usa | Para qué |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Sí | `src/modules/shared/lib/axios.ts` (único uso en todo el código) | `baseURL` del cliente axios. Si no está seteada, cae a `http://localhost:3000` (fallback hardcodeado). |

Esa es la **única** variable de entorno que consume el frontend. No hay ninguna variable server-only (sin `NEXT_PUBLIC_`) en uso — todo lo que se lee de `process.env` es esa misma línea. Esto es relevante para el refactor: si el backend endurecido requiere nuevas configuraciones (por ejemplo, distintos orígenes por ambiente, flags de features, claves públicas), hoy no hay ningún patrón establecido para eso, se estaría empezando de cero.

## Estructura del proyecto

```
src/
  app/                    # App Router — rutas. Los grupos (paréntesis) NO afectan la URL.
    (public)/             # sin auth: landing, /properties, /servicios
    (auth)/                # /login, /register
    (private)/dashboard/  # zona usuario logueado — URL real: /dashboard
    (private)/publicar/   # URL real: /publicar
    (admin)/dashboardAdmin/ # zona admin — URL real: /dashboardAdmin (¡ojo, no es /admin!)
    (user)/                # solo un layout.tsx vacío, sin uso real hoy
    middleware.ts
    layout.tsx             # layout raíz: AuthProvider + NavbarSelector + Toaster
    globals.css
  modules/                # código de features, fuera de app/
    auth/
      components/          # LoginForm.tsx, RegisterForm.tsx
      hooks/useAuth.ts      # re-export de useAuth desde AuthContext
      interface/auth.interfaces.ts
      services/auth.service.ts
    properties/
      components/, hooks/usePropertyFilters.ts, interfaces/, services/properties.service.ts
    DashboardUser/
      components/           # Favoritos, MisSolicitudes, Notificaciones, Perfil, Preferencias
      interfaces/            # carpeta EXISTE pero está VACÍA (sin archivos)
    landing/components/      # secciones de la home
    shared/
      context/AuthContext.tsx
      lib/axios.ts            # instancia única de axios
      ui/                      # NavbarPublic, NavbarPrivate, NavbarSelector, Favoritebutton
```

Convención: las páginas en `src/app/**/page.tsx` son mayormente "gordas" (mucha UI + fetch inline, `'use client'` casi en todo), no delgadas. Las excepciones son `auth` y `properties`, que sí separan `service.ts` (llamadas API), `hooks/` e `interfaces/`. En el resto de los módulos (`DashboardUser`, admin) las llamadas a `api` están hechas directo dentro del componente de página, no en un `service.ts` — no hay una capa de servicio consistente en todo el proyecto.

Alias de import: `@/*` → `./src/*` (`tsconfig.json`).

## Cliente de API — sección crítica

**Archivo exacto:** `src/modules/shared/lib/axios.ts` (9 líneas, es todo el archivo):

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
```

- **URL base:** sale de `NEXT_PUBLIC_API_URL`, con fallback a `http://localhost:3000` si no está definida (fallback silencioso, no hay warning ni error si falta la env var en producción).
- **Credenciales:** `withCredentials: true` — todas las requests mandan cookies automáticamente al backend. El frontend asume que el backend setea una cookie `access_token` (probablemente httpOnly, ya que **el frontend nunca lee `document.cookie` ni usa `js-cookie` en ningún lado** — la única lectura de esa cookie ocurre server-side, en `middleware.ts`, vía `request.cookies.get('access_token')`).
- **Interceptores: NO existen.** Se buscó explícitamente (`api.interceptors`) y no hay ni un solo interceptor de request ni de response configurado. Esto significa:
  - No hay refresco automático de token.
  - No hay manejo centralizado de 401 (no hay un interceptor que redirija a `/login` o dispare `logout()` cuando cualquier llamada devuelve 401).
  - No hay logging ni tracking central de errores de red.
- **Manejo de errores: 100% local y no estructurado.** Se hizo grep de `error.response`, `err.response` y `AxiosError` en todo `src/` y **no hay ni un solo uso**. El patrón repetido en absolutamente todos los `service.ts` y componentes es:
  ```ts
  try {
    await api.post(...);
    toast.success('mensaje genérico de éxito');
  } catch {
    toast.error('mensaje genérico de error, hardcodeado');
  }
  ```
  Es decir: **ningún componente lee el body del error que devuelve el backend** (ni `error.response.data.message`, ni `error.response.status`, ni validaciones detalladas de un 400). El único servicio que re-lanza el error (`properties.service.ts::getFilteredProperties`) igual solo hace `console.error` y `throw error` crudo, sin tipar ni transformar. Esto es una nota importante para el refactor: si el backend endurecido empieza a devolver errores estructurados (ej. `{ statusCode, message, errors: [...] }` de `class-validator`), hoy no hay ningún lugar preparado para consumir eso — habría que construirlo desde cero (interceptor de axios + un tipo de error compartido + componentes que lean `error.response.data`).
- **Tipado de respuestas:** no hay tipos genéricos para respuestas de API (no hay `ApiResponse<T>` ni wrapper). Cada `service.ts` tipa manualmente lo que espera devolver, y en la mayoría de los `api.get`/`api.post` directos en componentes ni siquiera hay tipado — se usa `const { data } = await api.get(...)` y `data` queda como `any` implícito, salvo casts puntuales (ej. `data.filter((n: { read: boolean }) => ...)`). Los tipos que sí existen viven en `interfaces/` por módulo (`auth.interfaces.ts`, `propertyInterface.ts`, `property-filters.interface.ts`, `operation-type.ts`, `status-property.ts`), pero no están centralizados ni hay una carpeta global `types/`.
- Nota menor de duplicación: `status-property.ts` define tanto `StatusProperty` (usado en todo el código) como una interfaz `IPropertyFilter` que parece un duplicado viejo/no usado de `PropertyFilters` (`property-filters.interface.ts`) — vale la pena limpiar esto durante el refactor.

## Autenticación y sesión — sección crítica

### Cómo sabe el frontend si el usuario está logueado

Fuente de verdad: **`AuthContext`** (React Context, no Zustand/Redux) en `src/modules/shared/context/AuthContext.tsx`. Expone `{ user, isLoading, login, logout, register, updateUser }` vía el hook `useAuth()`. Ese hook está re-exportado en dos lugares (`src/modules/auth/hooks/useAuth.ts` y se importa directo desde el contexto en otros archivos) — hay inconsistencia de import path entre archivos, algunos hacen `from '@/modules/auth/hooks/useAuth'` y otros `from '@/modules/shared/context/AuthContext'`, ambos terminan en el mismo contexto.

`user` es del tipo `AuthUser` (`src/modules/auth/interface/auth.interfaces.ts`):
```ts
interface AuthUser {
  id: number; email: string; role: 'user' | 'admin';
  name: string; surname: string; phone: string; photo?: string;
}
```
No hay más roles que `'user' | 'admin'` en el tipo actual.

### Inicialización/hidratación de sesión

Al montar `AuthProvider` (envuelve toda la app en el layout raíz `src/app/layout.tsx`), un `useEffect` llama `authService.getMe()` → `GET /auth/me`. Si responde OK, `setUser(data)`; si tira excepción (esperablemente un 401 si no hay sesión), se asume "no logueado" (`setUser(null)`) sin distinguir el motivo del error. `isLoading` arranca en `true` y pasa a `false` en el `finally`. Mientras `isLoading === true`, `NavbarSelector` muestra el navbar público como placeholder.

No hay ningún mecanismo de persistencia en `localStorage`/`sessionStorage` — todo depende de la cookie httpOnly + el round-trip a `/auth/me` en cada carga de la app (no hay cache entre navegaciones del lado cliente más allá del propio Context, que se resetea en cada hard reload).

### Dónde está el código de login, registro y logout

- **Login tradicional:** UI en `src/modules/auth/components/LoginForm.tsx` (usa `react-hook-form` + `zod` para validación de forma, pero la llamada real está delegada a `login()` del contexto). Lógica real en `AuthContext.login()` → `authService.login()` → `POST /auth/login` (`src/modules/auth/services/auth.service.ts`). Tras loguear, redirige por rol: `role === 'admin'` → `router.push('/dashboardAdmin/')`, cualquier otro rol → `/dashboard`.
- **Login con Google / OAuth: NO existe.** Se buscó explícitamente cualquier mención de Google/OAuth relacionada a auth y las únicas coincidencias son enlaces a Google Maps y a `mail.google.com` (para contactar usuarios desde el panel admin), nada de autenticación social.
- **Registro:** UI en `src/modules/auth/components/RegisterForm.tsx`, misma mecánica (zod + `react-hook-form`), llama a `AuthContext.register()` → `authService.register()` → `POST /auth/register`. Tras registrarse, redirige a `/login` (no loguea automáticamente).
- **Logout:** `AuthContext.logout()` → `authService.logout()` → `POST /auth/logout`, limpia `user` a `null` y redirige a `/`. La UI de logout está duplicada en dos lugares con el mismo patrón visual (confirmación con `toast.custom`): `src/app/(private)/dashboard/layout.tsx` y `src/app/(admin)/dashboardAdmin/layout.tsx` (cada sidebar tiene su propia copia del modal de confirmación, no hay componente compartido).
- Nota: el `LoginForm` tiene un link "¿Olvidaste tu contraseña?" apuntando a `/forgot-password`, **pero esa ruta no existe** en `src/app` — es un link roto hoy.

### Rutas protegidas — tres capas, con un desalineamiento importante

1. **`src/middleware.ts`** (server-side, Next.js middleware): decodifica el JWT de la cookie `access_token` con `jose.decodeJwt` — **esto solo decodifica, no verifica la firma**. Lee `payload.role` para autorización por rol.
   - `matcher` (las únicas rutas donde el middleware corre): `/dashboard/:path*`, `/publicar/:path*`, `/admin/:path*`, `/login`, `/register`.
   - **Bug/gap real detectado:** el middleware protege `/admin/:path*`, pero la URL real de la zona admin es `/dashboardAdmin` (por el route group `(admin)/dashboardAdmin`), no `/admin`. Como consecuencia, **el middleware no protege ni autentica ni autoriza por rol las rutas `/dashboardAdmin/*` en absoluto** — ni siquiera exige que haya un token. Toda la protección de esa zona hoy depende exclusivamente de la capa 2 (chequeo client-side).
   - Si hay token válido y el usuario intenta entrar a `isAuthPage` (`/login` o `/register`), lo redirige a `/dashboardAdmin` (admin) o `/dashboard` (resto) — esta redirección de conveniencia sí corre porque `/login`/`/register` están en el matcher.
   - Si el JWT falla al decodificar (inválido/expirado/malformado), borra la cookie y redirige a `/login`.
2. **Layouts client-side por zona** (la protección real hoy):
   - `src/app/(private)/dashboard/layout.tsx`: `'use client'`, usa `useAuth()` + `useEffect` — si `!isLoading && !user`, `router.push('/login')`. Mientras `isLoading`, muestra un spinner; si `!user`, no renderiza nada (`return null`).
   - `src/app/(admin)/dashboardAdmin/layout.tsx`: mismo patrón, pero además valida rol: si `user.role !== 'admin'`, redirige a `/dashboard`.
   - Estas protecciones son **puramente client-side y ocurren después del render inicial** (hay un flash del layout antes de que el `useEffect` redirija), y dependen 100% de que `AuthContext` ya haya resuelto `getMe()`.
3. `NavbarSelector` decide navbar público vs. privado en base a `user` (no es protección de ruta, solo UI).

### Cómo se distingue una vista de admin de una de usuario normal

Puramente por `user.role === 'admin'`, chequeado client-side en varios lugares (no hay un HOC ni un hook reusable tipo `useRequireRole()` — cada layout repite su propio `useEffect` con la misma lógica):
- `src/app/(admin)/dashboardAdmin/layout.tsx` — gate de la zona admin completa.
- `src/modules/shared/ui/NavbarPrivate.tsx` — decide `dashboardHref`/`perfilHref` y qué endpoint de notificaciones pegar (`/notifications/admin` vs `/notifications`).
- `src/app/(admin)/dashboardAdmin/usuarios/page.tsx` — filtra/gestiona usuarios.
- No hay ninguna verificación de rol del lado del middleware (ver punto anterior) ni protección real en las llamadas a la API misma — el frontend confía en que el backend vuelva a validar el rol en cada endpoint (algo que hay que confirmar del lado del backend NestJS endurecido).

### Qué pasa hoy cuando una request devuelve 401

**No hay ningún manejo central.** Al no existir interceptores de axios (ver sección de Cliente de API), un 401 en cualquier llamada `api.get/post/patch/delete` cae en el `catch {}` local de ese componente, que casi siempre solo hace `toast.error('mensaje genérico')` sin mirar el status code. Casos concretos:
- Si `getMe()` devuelve 401 al hidratar la sesión, `AuthContext` lo interpreta correctamente como "no logueado" (es el único lugar del código que espera un 401 a propósito, vía comentario `// 401 → no logueado`).
- Si una cookie expira **mientras el usuario ya está navegando** dentro de `/dashboard` o `/dashboardAdmin` y hace, por ejemplo, `PATCH /users/:id`, el usuario va a ver un toast de error genérico ("No se pudieron actualizar los datos") sin ser redirigido a `/login` ni tener su sesión limpiada del `AuthContext` — queda en un estado inconsistente (UI dice que está logueado, pero el backend ya rechaza sus requests) hasta el próximo hard reload o navegación a una ruta protegida por el middleware.
- No hay reintento automático, no hay refresh token, no hay ningún flujo de "sesión expirada, volvé a loguearte" con feedback claro al usuario.

Esto es probablemente el gap más importante a resolver en el refactor: conviene agregar un interceptor de respuesta en `axios.ts` que capture 401 (y probablemente 403) de forma centralizada, dispare `logout()`/limpieza de `AuthContext` y redirija a `/login`, en vez de depender de que cada `catch {}` lo maneje bien (hoy ninguno lo hace).

## Formularios y validación

- **`react-hook-form` + `zod` (`@hookform/resolvers/zod`)** se usa **solo** en `LoginForm.tsx` y `RegisterForm.tsx`. Los schemas son locales a cada componente (no compartidos), ej.:
  ```ts
  const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(5, 'Mínimo 5 caracteres'),
  });
  ```
  Los errores de estos dos formularios se muestran inline por campo (`errors.email.message`, etc.), pero son **errores de validación de forma (client-side)**, no errores devueltos por el backend.
- **Todo el resto de los formularios** (perfil, nueva propiedad/`PropertyForm.tsx`, nueva solicitud/`publicar/page.tsx`, preferencias, cambio de contraseña) son manuales: `useState` por campo, sin `react-hook-form` ni `zod`, con validación "a mano" tipo:
  ```ts
  if (!name.trim() || !surname.trim() || !email.trim()) {
    toast.error('Nombre, apellido y email son obligatorios');
    return;
  }
  ```
  o listas de campos requeridos que se chequean con `.filter(k => !form[k])`.
- **Errores de validación del backend (400 con detalle): no se muestran hoy en ningún formulario.** Como se documentó en la sección de Cliente de API, ningún `catch` lee `error.response.data` — todos muestran un string hardcodeado idéntico sin importar si el backend devolvió "email ya registrado", "contraseña débil", errores de `class-validator` con detalle por campo, etc. Este es un gap explícito a resolver en el refactor si el backend NestJS ahora devuelve errores de validación más ricos/estructurados.

## Endpoints consumidos

Relevado por grep exhaustivo de `api.get/post/patch/delete(` en todo `src/`. Agrupado por módulo funcional (no todos están en un `service.ts`; se indica el archivo real donde vive cada llamada):

**Auth** — `src/modules/auth/services/auth.service.ts`
- `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/logout`

**Properties (catálogo público)** — `src/modules/properties/services/properties.service.ts`
- `GET /properties/filter` (con query params de `PropertyFilters`), `GET /properties/:id`, `GET /properties/filters/locations`

**Properties (comentarios y ratings, en detalle de propiedad)** — `src/app/(public)/properties/[id]/PropertyDetail.tsx`
- `GET /properties/:id/comments`, `PATCH /properties/:id/comments/:commentId`, `DELETE /properties/:id/comments/:commentId`
- `GET /ratings/:propertyId`, `POST /ratings/:propertyId`

**Favoritos** — `src/modules/shared/ui/Favoritebutton.tsx` y `src/app/(private)/dashboard/favoritos/page.tsx`
- `GET /favorites/:userId`, `POST /favorites/:propertyId`, `DELETE /favorites/:userId/:propertyId`

**Solicitudes de publicación (usuario)** — `src/app/(private)/publicar/page.tsx`, `src/app/(private)/dashboard/mis-solicitudes/page.tsx`
- `POST /property-requests`, `GET /property-requests/my-requests`

**Solicitudes (admin)** — `src/app/(admin)/dashboardAdmin/solicitudes/page.tsx`, `.../usuarios/[id]/page.tsx`
- `GET /property-requests`, `PATCH /property-requests/:id/status`, `DELETE /property-requests/:id`, `GET /property-requests/user/:id`

**Propiedades (admin, CRUD completo)** — `src/app/(admin)/dashboardAdmin/propiedades/*`
- `GET /properties`, `DELETE /properties/:id`, `POST /properties` (multipart), `PATCH /properties/:id` (multipart), `GET /property-types`, `PATCH /property-images/:id/set-cover`

**Usuarios (admin)** — `src/app/(admin)/dashboardAdmin/usuarios/*`
- `GET /users`, `GET /users/:id`, `DELETE /users/:id`

**Perfil (usuario y admin, mismo patrón duplicado en ambos dashboards)** — `.../dashboard/perfil/page.tsx` y `.../dashboardAdmin/perfil/page.tsx`
- `PATCH /users/:id` (datos personales o `{ password }`), `PATCH /users/:id/photo` (multipart)

**Preferencias de búsqueda** — `src/app/(private)/dashboard/preferencias/page.tsx`
- `GET /property-types`, `GET /search-preferences`, `PATCH /search-preferences`, `POST /search-preferences`
- (también consultado en admin: `GET /search-preferences/user/:id` desde `usuarios/[id]/page.tsx`)

**Notificaciones** — usuario en `.../dashboard/notificaciones/page.tsx` y navbar; admin en `.../dashboardAdmin/notificaciones/page.tsx` y `.../dashboardAdmin/layout.tsx`
- Usuario: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- Admin: `GET /notifications/admin`, `PATCH /notifications/:id/read`, `PATCH /notifications/admin/read-all`
- El sidebar admin además dispara/escucha un evento custom del DOM `notif-updated` (`window.dispatchEvent`/`addEventListener`) para refrescar los contadores del sidebar sin esperar al polling de 60s.

**Dashboard admin (resumen/home)** — `src/app/(admin)/dashboardAdmin/page.tsx`
- `GET /users`, `GET /properties`, `GET /property-requests` (en paralelo, para armar métricas)

No hay ningún endpoint versionado (`/v1/...`) ni prefijo de API aparte del que ya incluye `NEXT_PUBLIC_API_URL` como base.

## Subida de imágenes

Dos flujos, ambos con el mismo patrón de fondo (FormData + `multipart/form-data`, sin ninguna librería de upload):

**Foto de perfil** (`.../dashboard/perfil/page.tsx` y `.../dashboardAdmin/perfil/page.tsx`, código duplicado en ambos):
- `<input type="file">` oculto, disparado por click en un botón de cámara.
- Preview inmediato con `FileReader.readAsDataURL` (antes de que termine el upload).
- `FormData` con un solo campo `file`, `PATCH /users/:id/photo`.
- **Sin ninguna validación client-side de tipo o tamaño de archivo** — no hay chequeo de `file.type` ni de `file.size` antes de mandarlo. Si falla la subida, se limpia el preview y se muestra un toast genérico (de nuevo, sin leer el detalle del error).

**Imágenes de propiedad** (`src/app/(admin)/dashboardAdmin/propiedades/PropertyForm.tsx`):
- Drag & drop (`onDrop`/`onDragOver`) + click-to-browse sobre el mismo dropzone, `<input type="file" multiple accept="image/*">`.
- **Sí hay una validación client-side**: al soltar/seleccionar, filtra por `file.type.startsWith('image/')` (descarta no-imágenes) y limita a un máximo de 10 imágenes totales (existentes + nuevas), con `toast.error('Máximo 10 imágenes')` si se excede. No hay validación de tamaño de archivo (`file.size`) ni de dimensiones.
- Preview con `URL.createObjectURL` (con el correspondiente `URL.revokeObjectURL` al remover una imagen nueva, para no leakear memoria).
- Selección de portada ("cover") manejada con estado local para imágenes nuevas, y con una llamada dedicada al backend para imágenes ya existentes: `PATCH /property-images/:id/set-cover`.
- Al guardar, arma un único `FormData`: el campo `data` con el payload JSON completo (`JSON.stringify(payload)`) más un array de archivos bajo la key `images` (creación) o `newImages` (edición), y en edición además manda `deleteImages: number[]` y `setCoverImageId` dentro del mismo JSON de `data`.
- Las imágenes ya subidas se renderizan con `<img>` nativo (no `next/image`), con un comentario `eslint-disable-next-line @next/next/no-img-element` — es decir, están conscientemente evitando la optimización de imágenes de Next para estas previews.

Los hosts remotos permitidos por `next/image` (para lo que sí usa el componente optimizado) están hardcodeados en `next.config.ts` → `images.remotePatterns`: `res.cloudinary.com`, `images3.alphacoders.com`, `images.unsplash.com`, `www.unc.edu.ar`. Esto sugiere que las imágenes de propiedades ya subidas terminan serviéndose desde Cloudinary del lado del backend, aunque el frontend no tiene ninguna integración directa con Cloudinary (no hay SDK ni upload preset en el cliente — todo el upload pasa por el backend vía `multipart/form-data`).

## Convenciones de estilo

- Componentes **funcionales** con hooks, casi todos marcados `'use client'` (hay muy pocos server components reales; incluso layouts que podrían ser server component, como los de dashboard, son client components porque dependen de `useAuth()`).
- Naming: componentes en PascalCase (`FavoriteButton`, `PropertyForm`), hooks custom con prefijo `use` (`usePropertyFilters`, `useAuth`, y hooks inline no exportados como `useHideOnScroll`/`useScrollToSection` dentro de `NavbarPrivate.tsx`).
- Bastantes archivos y variables tienen comentarios y nombres en español mezclados con código en inglés (ej. `handleSaveData`, `mensajeAgente`) — es consistente con que el dominio y los usuarios son hispanohablantes; no hay una convención estricta de idioma.
- **Tailwind:** clases inline directo en JSX, sin `clsx`/`cn()` — las clases condicionales se arman con template literals y ternarios directo en el `className`, ej.:
  ```tsx
  className={`${inputBase} ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
  ```
  Hay algunos helpers locales no reusados entre archivos (`inputCls`, `selectCls`, `inputClass`, `selectClass` — variantes del mismo patrón redefinidas por componente, no compartidas). No existe una capa de "design system" ni componentes de UI base reusables (botón, input, card genéricos) — cada página redefine su propio estilo de input/botón/card.
  - Paleta repetida como literal hexadecimal en decenas de archivos, especialmente `#0b7a4b` (verde marca) — no está centralizada como variable de Tailwind ni token de diseño, se repite el hex a mano en cada `className`/`style`.
- Los ids de sección y estructura de página priorizan composición visual muy detallada (gradientes, sombras, animaciones con Framer Motion) sobre abstracción — es un estilo "todo en el archivo de la página", con subcomponentes definidos in-line en el mismo archivo (`function NavLink(...)`, `function Sidebar(...)`) en vez de en archivos separados, incluso cuando se duplica casi el mismo subcomponente entre `dashboard/layout.tsx` y `dashboardAdmin/layout.tsx`.
