# FRONTEND_CHANGES.md — Adaptación al backend NestJS post-hardening

Registro de cambios del refactor de alineación con `API_CONTRACT.md` (repo del backend).
Formato: por bloque → archivo / problema / solución / estado.

---

## Bloque A — Cliente de API centralizado

### `src/modules/shared/types/api.ts` (NUEVO)
- **Problema:** no existía ningún tipado del contrato real de la API; cada módulo definía shapes parciales y desactualizados, y la mayoría de las llamadas quedaban en `any` implícito.
- **Solución:** archivo canónico con los tipos de la sección 17 del contrato (enums con valores exactos, entidades, DTOs, shapes de error) + la tabla `VALID_REQUEST_TRANSITIONS` para las transiciones de estado de solicitudes. Decisión: archivo central (no distribuido por módulo) porque `User`, `Property` y los enums cruzan todos los módulos; los `interfaces/` existentes re-exportan desde acá lo que se superpone, así no se rompen los imports actuales.
- **Estado:** ✅

### `src/modules/shared/lib/authEvents.ts` (NUEVO)
- **Problema:** el interceptor de axios necesita limpiar la sesión del `AuthContext` ante un 401, pero `axios.ts` no puede importar el contexto (dependencia circular: AuthContext → auth.service → axios).
- **Solución:** registro de callback mínimo (`setOnUnauthorized`/`emitUnauthorized`). El `AuthProvider` registra el handler al montar (limpia `user`, toast "Tu sesión expiró", redirect a `/login`) y lo desregistra al desmontar.
- **Estado:** ✅

### `src/modules/shared/lib/apiError.ts` (NUEVO)
- **Problema:** ningún `catch` del proyecto leía el error real del backend — todos mostraban strings hardcodeados.
- **Solución:** `getErrorMessage(error)`: message string del backend → tal cual; array de class-validator → une los primeros 3 con " · "; 429 → "Demasiados intentos, esperá un momento e intentá de nuevo."; sin response → "No pudimos conectar con el servidor, intentá de nuevo.". También `getErrorStatus(error)` para lógica condicional por status (ej. 401 en logout, 409 en perfil).
- **Estado:** ✅

### `src/modules/shared/lib/validateImage.ts` (NUEVO)
- **Problema:** ninguna subida de imagen validaba tipo/tamaño client-side; el usuario esperaba el 400/502 del backend.
- **Solución:** `validateImageFile(file)` → error legible si no es `image/*` o pesa > 5MB (límites del backend), `null` si es válido. Se usa en perfil (ambos) y PropertyForm (Bloque E).
- **Estado:** ✅

### `src/modules/shared/lib/axios.ts`
- **Problema:** sin interceptores; un 401 por sesión expirada en medio de la navegación dejaba al usuario en estado inconsistente (UI logueada, backend rechazando).
- **Solución:** interceptor de respuesta: 401 → `emitUnauthorized()` (limpieza + redirect a `/login`), **excepto** para todos los endpoints `/auth/*` (el 401 de `/auth/me` en hidratación es esperado; el de `/auth/login` es "credenciales inválidas"; el de `/auth/logout` es "sesión ya cerrada" = éxito; los futuros 401 de `/auth/google` son errores propios del flujo). 429 y el resto de los status pasan intactos al `catch` del componente.
- **Estado:** ✅

### `src/modules/shared/context/AuthContext.tsx`
- **Problema:** no registraba el handler de 401; `logout()` fallaba visiblemente si el backend devolvía 401 (sesión ya revocada); `console.log` de debug con el rol; sin forma de redirigir a otro destino tras logout (necesario para el flujo de cambio de password del Bloque D).
- **Solución:** registra/desregistra el callback de `authEvents`; `logout(redirectTo = '/')` con parámetro; 401 en logout = éxito silencioso, otros errores se loguean pero igual se limpia el estado local (el usuario nunca queda "atrapado" logueado); eliminado el `console.log` de debug.
- **Estado:** ✅

### `src/modules/auth/interface/auth.interfaces.ts`
- **Problema:** `AuthUser` desactualizado (sin `profileIncomplete`, `notifyBroadcast`, etc.); `LoginFormData` tenía un campo extra `user?` que, de haberse enviado, el backend ahora rechazaría con 400 (`forbidNonWhitelisted`).
- **Solución:** `AuthUser = User` (alias del tipo canónico), `LoginResponse`/`RegisterResponse` re-exportados del contrato, `LoginFormData` reducido a `{ email, password }` exactos del `LoginDto`.
- **Estado:** ✅

### `src/modules/properties/interfaces/operation-type.ts` y `status-property.ts`
- **Problema:** enums duplicados respecto del contrato; `status-property.ts` además contenía `IPropertyFilter`, un duplicado viejo de `PropertyFilters` sin ningún uso en el repo.
- **Solución:** ambos archivos pasan a re-exportar los enums canónicos de `api.ts` (mismos valores exactos — sin cambio de comportamiento); `IPropertyFilter` eliminado (0 usos verificados por grep).
- **Estado:** ✅

---

## Bloque B — Auth: bugs de contrato

### `POST /users` con `role`
- **Verificado:** ningún flujo del frontend llama a `POST /users` (solo existe `/auth/register`). Nada que cambiar.
- **Estado:** ✅ (no aplica)

### Login devuelve 401 (antes 400) para credenciales inválidas
- **Verificado:** el catch de `LoginForm` no dependía del status específico; ahora además muestra el mensaje real ("Credenciales inválidas") vía `getErrorMessage` (Bloque E). El interceptor excluye `/auth/*` del redirect por 401, así que este 401 llega al formulario y no dispara redirección.
- **Estado:** ✅

### `POST /auth/logout` requiere sesión válida
- **Solución:** en `AuthContext.logout()`, un 401 se trata como éxito silencioso (la sesión ya estaba cerrada). Cualquier otro error también limpia el estado local igualmente — el usuario nunca queda atrapado logueado.
- **Estado:** ✅

### Invalidación de tokens pre-hardening
- Los tokens viejos dan 401 en la próxima request → lo cubre el interceptor del Bloque A (limpieza + toast "Tu sesión expiró" + redirect a `/login`). Sin código adicional.
- **Estado:** ✅ (cubierto por Bloque A)

---

## Bloque C — Favoritos: rutas rotas reparadas

### `src/modules/shared/ui/Favoritebutton.tsx` y `src/app/(private)/dashboard/favoritos/page.tsx`
- **Problema:** usaban `GET /favorites/:userId` y `DELETE /favorites/:userId/:propertyId`, rutas que ya no existen — favoritos estaba roto en producción.
- **Solución:** `GET /favorites` y `DELETE /favorites/:propertyId` (el userId sale del token en el backend). Catches migrados a `getErrorMessage` (ej. el 409 "La propiedad ya está en favoritos" ahora se ve tal cual).
- **Estado:** ✅

---

## Bloque D — Perfil: migración a PATCH /users/me

### `src/app/(private)/dashboard/perfil/page.tsx` y `src/app/(admin)/dashboardAdmin/perfil/page.tsx`
- **Problema:** usaban `PATCH /users/:id`; además, tras cambiar la contraseña el backend revoca la sesión y la UI seguía como si nada (la siguiente acción daba 401 sorpresivo).
- **Solución:** datos personales y password van a `PATCH /users/me`. Tras cambio de password exitoso: toast "Contraseña actualizada. Iniciá sesión de nuevo..." + `logout('/login')` (el POST /auth/logout dará 401 porque la sesión ya fue revocada — se trata como éxito, ver Bloque B). El quirk del contrato (la respuesta del PATCH con password incluye el hash bcrypt) no afecta: nunca se pasa ese campo a `updateUser()`. La subida de foto sigue en `PATCH /users/:id/photo` (el contrato no tiene variante `/me` para foto). Errores con `getErrorMessage` (ej. 409 "Ese email no está disponible", 502 de Cloudinary).
- **Estado:** ✅
- **Pendiente anotado:** el perfil sigue duplicado entre dashboard y dashboardAdmin — candidato a unificarse en un componente compartido en una sesión futura.

---

## Bloque E — Errores reales del backend en formularios

### `LoginForm.tsx` / `RegisterForm.tsx`
- Catch del submit migrado a `getErrorMessage`: muestra "Credenciales inválidas" (401), "No se pudo completar el registro..." (400), o "Demasiados intentos..." (429, límite 5/min de `/auth/*`). La validación de forma (zod) sigue mostrando errores inline por campo como antes. Eliminados los `console.assert` de debug.
- **Estado:** ✅

### `PropertyForm.tsx` (alta/edición admin)
- Catch del submit y de set-cover migrados a `getErrorMessage` — el 400 del `JsonToDtoPipe` con detalle de campos (array de class-validator) se muestra unido (primeros 3), igual que el 404 de tipo inexistente y el 502 de Cloudinary. `addFiles` ahora valida cada archivo con `validateImageFile` (image/* y ≤ 5MB) antes de aceptarlo, con toast inmediato por archivo rechazado.
- **Estado:** ✅

### Perfil (ambos)
- Cubierto en Bloque D (409 de email, 502 de foto) + validación client-side de la foto antes de subir.
- **Estado:** ✅

### `src/app/(private)/publicar/page.tsx` (solicitud de publicación)
- Catch migrado a `getErrorMessage` (los enums del DTO tienen mensajes custom en español que listan los valores permitidos).
- **Fix de contrato extra:** el select de tipo de propiedad ofrecía `Cochera` y `Otro`, que NO existen en `TipoPropiedadRequest` → elegirlos daba 400 seguro. Alineado a los 6 valores del enum; agregado `Regular` que faltaba en estados de conservación.
- **Estado:** ✅

---

## Bloque F — Panel admin: seguridad y transiciones

### `src/middleware.ts`
- **Problema (bug pre-existente):** protegía `/admin/:path*`, pero la zona admin real es `/dashboardAdmin` → el middleware no protegía NADA de esa zona (ni autenticación ni rol a nivel servidor). Además `isAdminZone` y el redirect post-login de `/login` apuntaban a `/admin`.
- **Solución:** matcher con `/dashboardAdmin/:path*` (se eliminó `/admin`, no se usa); `isAdminZone = startsWith('/dashboardAdmin')` (y `isPrivateZone` lo excluye para no solaparse); redirect de usuarios logueados en `/login` → `/dashboardAdmin` o `/dashboard` según rol. Nota dejada en comentario: `decodeJwt` NO verifica firma — es solo UX, la autorización real es del backend.
- **Estado:** ✅

### `GET /stats/*` requiere ADMIN
- **Verificado:** el frontend no llama a ningún endpoint `/stats/*` — el dashboard admin calcula métricas client-side desde `GET /users` + `GET /properties` + `GET /property-requests`, que ya se llaman dentro del layout admin (gate por rol). Nada que cambiar.
- **Estado:** ✅ (no aplica)

### Transiciones de estado de solicitudes — `solicitudes/page.tsx` y `usuarios/[id]/page.tsx`
- **Problema:** la UI ofrecía transiciones ilegales (ej. "Aceptar" desde `rechazado`, "Rechazar" desde `aceptado`) que ahora dan 409.
- **Solución:** tabla `VALID_REQUEST_TRANSITIONS` en `types/api.ts` + helper `canTransition()`; los botones rápidos y el picker expandido solo muestran transiciones válidas desde el estado actual; en estados terminales el picker muestra "Estado terminal — no admite más cambios". El catch igualmente muestra el 409 real del backend por si hay carrera (otro admin cambió el estado en paralelo).
- **Estado:** ✅

### `DELETE /property-types` con 409
- **Verificado:** no existe UI de gestión de tipos de propiedad en el frontend (solo `GET /property-types`). Nada que cambiar; si se agrega esa UI a futuro, usar `getErrorMessage` mostrará el 409 correctamente.
- **Estado:** ✅ (no aplica)

---

## Bloque G — Campos nuevos

### `notifyBroadcast` — `src/app/(private)/dashboard/perfil/page.tsx`
- Toggle "Novedades de propiedades por email" en el perfil del usuario: `PATCH /users/me { notifyBroadcast }`, actualización optimista con revert si falla, sincroniza el contexto. Se agregó solo al perfil de usuario (el broadcast apunta a usuarios finales); agregar al perfil admin es trivial si se quiere.
- **Estado:** ✅

### `profileIncomplete` — `src/modules/shared/context/AuthContext.tsx`
- Tras un login exitoso, si `user.profileIncomplete === true` se muestra un toast informativo (8s) invitando a completar teléfono y contraseña desde "Editar Perfil". El mismo aviso servirá para el flujo de Google del Bloque H.
- **Estado:** ✅

---

## Extra — Reparaciones del build (errores pre-existentes, no causados por el refactor)

`npm run build` estaba roto de antes en varios puntos; se reparó todo para poder verificar cada bloque:

| Archivo | Problema | Fix |
|---|---|---|
| `src/app/(user)/layout.tsx` | archivo vacío → "is not a module" | layout passthrough mínimo (carpeta candidata a eliminarse) |
| `src/app/(private)/dashboard/layout.tsx` | `icon: any` (error de lint) | `React.ElementType` |
| `src/app/(public)/servicios/[id]/page.tsx` | `s.ctaEspecial` no existe en todos los miembros de la unión | narrowing con `'ctaEspecial' in s` |
| `src/modules/landing/components/Featuredproperties.tsx` | `page: '1'` string vs number; además el prerender explotaba si el backend estaba caído durante el build | números + try/catch con estado vacío |
| `src/modules/landing/components/RealEstateFAQ.tsx` | `useState(null)` sin genérico | `useState<number \| null>(null)` |
| `src/modules/landing/components/Reseñas.tsx` | CSS custom properties (`--quantity`) sin cast | `as React.CSSProperties` |
| `src/modules/landing/components/Servicios.tsx` | prop `service` sin tipo | `(typeof services)[number]` |
| `src/modules/properties/components/HeaderSearch.tsx` | `SearchBar`/`FiltersPanel` usan `useSearchParams` sin Suspense → fallaba el prerender de `/` | envueltos en `<Suspense>` |
| `src/modules/properties/services/properties.service.ts` | respuesta sin tipar (`any` en cascada) | `FilteredPropertiesResponse` tipado |

---

## Pendientes para sesiones futuras

1. **Bloque H — Login con Google** (ver sección siguiente, decisiones ya tomadas).
2. **Unificar el perfil** duplicado entre `dashboard/perfil` y `dashboardAdmin/perfil` en un componente compartido.
3. **`callbackUrl`:** el middleware setea `?callbackUrl=` al redirigir a `/login`, pero el login no lo lee al redirigir post-login — mejora de UX pendiente.
4. **Eliminar** la carpeta vacía `src/app/(user)/` si se confirma que no se va a usar.
5. **Toggle `notifyBroadcast` en el perfil admin** si se decide que los admins también reciban el broadcast.

---

## Bloque H — Login con Google (POSPUESTO a una sesión futura, decidido con el usuario)

Decisiones ya tomadas para cuando se implemente:
- **Client ID:** se reutiliza el del backend — hay que agregarle `http://localhost:3000` (y el dominio de producción) a los *Authorized JavaScript origins* en Google Cloud Console antes de empezar.
- **Librería:** `@react-oauth/google` (dependencia nueva aprobada).
- **Variable de entorno nueva:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` en `.env`.
- **Flujo:** botón "Continuar con Google" en `LoginForm.tsx` (y evaluar reuso en `RegisterForm.tsx` — el backend maneja login y registro en un solo paso); con el `idToken` → `POST /auth/google` `{ idToken }`; en éxito, mismo redirect por rol que `login()` del AuthContext; errores vía `getErrorMessage()` (el interceptor ya excluye `/auth/*` del redirect por 401, así que los 401 de audience-mismatch/email-no-verificado llegan al formulario); si `profileIncomplete: true`, mostrar el aviso del Bloque G.
